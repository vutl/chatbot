import { Injectable, Logger } from '@nestjs/common';
import { ChromaService } from '../vector-store/chroma.service';
import { OpenAIService } from '../openai/openai.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { HtmlToTextOptions, convert } from 'html-to-text';
import * as rtfParser from 'rtf-parser';
import * as MarkdownIt from 'markdown-it';
import * as xml2js from 'xml2js';
import { promisify } from 'util';
import * as crypto from 'crypto';
import { ZENAI_CONSTANTS } from '../zenai/constants/zenai.constant';

@Injectable()
export class DocumentProcessorService {
  private readonly logger = new Logger(DocumentProcessorService.name);
  private readonly md = new MarkdownIt();

  constructor(
    private chromaService: ChromaService,
    private openaiService: OpenAIService,
  ) {}

  /**
   * Tạo MD5 hash cho nội dung file
   */
  private getFileHash(buffer: Buffer): string {
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  /**
   * Hàm cắt text theo độ dài + overlap ký tự
   * - chunkSize: Số ký tự mỗi chunk (vd 1000)
   * - overlap: Số ký tự lùi lại để nối ngữ cảnh giữa các chunk (vd 200)
   */
  private splitTextByLengthWithOverlap(
    text: string,
    chunkSize: number,
    overlap: number,
  ): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end).trim();
      chunks.push(chunk);

      if (end >= text.length) {
        break;
      }
      // Lùi con trỏ để tạo overlap
      start = end - overlap;
      if (start < 0) start = 0;
    }
    return chunks;
  }

  /**
   * Hàm xử lý toàn bộ file trong thư mục src/data
   * 1. Đọc thư mục src/data
   * 2. Với mỗi file có đuôi .txt, .pdf, .docx..., parse ra text
   * 3. Chia chunk + tạo embedding
   * 4. Lưu vào ChromaDB
   */
  async processAllFiles() {
    try {
      const dataDir = path.join(
        process.cwd(),
        ZENAI_CONSTANTS.FOLDER_DATA_TO_TRAIN,
      );
      const files = await fs.readdir(dataDir);

      // 1) Lấy docs đã có trong ChromaDB
      const storedDocs = await this.chromaService.getAllDocuments();
      const processedHashSet = new Set<string>();
      for (const doc of storedDocs) {
        const fileHash = doc.metadata?.fileHash;
        if (fileHash) {
          processedHashSet.add(fileHash);
        }
      }

      const results = [];
      for (const file of files) {
        const filePath = path.join(dataDir, file);
        const buffer = await fs.readFile(filePath);

        // 2) Tính hash
        const hash = this.getFileHash(buffer);

        // 3) Kiểm tra hash => skip nếu đã có
        if (processedHashSet.has(hash)) {
          this.logger.log(`Skip file (already processed): ${file}`);
          continue;
        }

        // 4) Xử lý file
        const ext = path.extname(file).toLowerCase();
        const mimeType = this.getMimeType(ext);
        const result = await this.processUploadedFile(
          buffer,
          file,
          mimeType,
          hash,
        );
        results.push(result);
      }

      return {
        success: true,
        processedFiles: results,
      };
    } catch (error) {
      this.logger.error('Error processing files:', error.stack);
      throw error;
    }
  }

  /**
   * Hàm reprocessAllFiles
   */
  async reprocessAllFiles(collectionName?: string) {
    try {
      this.logger.log(
        `Bắt đầu xóa và xử lý lại dữ liệu của collection ${collectionName}`,
      );
      await this.chromaService.clearCollection(collectionName);
      this.logger.log(`Đã xóa hết dữ liệu cũ của collection ${collectionName}`);
      // this.logger.log('Đã xóa dữ liệu cũ, giờ nạp lại...');
      // return await this.processAllFiles();
    } catch (error) {
      this.logger.error('Lỗi reprocessAllFiles:', error);
      throw error;
    }
  }

  /**
   * Lấy MIME type từ extension
   */
  private getMimeType(extension: string): string {
    const mimeMap: Record<string, string> = {
      '.txt': 'text/plain',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.rtf': 'application/rtf',
      '.md': 'text/markdown',
      '.html': 'text/html',
      '.xml': 'application/xml',
      '.json': 'application/json',
    };
    return mimeMap[extension] || 'application/octet-stream';
  }

  /**
   * Hàm xử lý 1 file (đọc từ buffer)
   * 1. Parse nội dung (PDF, Word, v.v.)
   * 2. Chia chunk (chunkSize=1000, overlap=200)
   * 3. Tạo embedding
   * 4. Lưu ChromaDB
   */

  async processUploadedFile(
    file: Buffer,
    originalname: string,
    mimetype: string,
    fileHash?: string,
  ): Promise<any> {
    try {
      // Bước 1: Tính hash ngay
      const fileHash = this.getFileHash(file);

      // Bước 2: Kiểm tra xem hash này đã có trong DB chưa
      const storedDocs = await this.chromaService.getAllDocuments();
      const existed = storedDocs.some(
        (doc) => doc.metadata?.fileHash === fileHash,
      );

      if (existed) {
        // File này đã được xử lý trước đó => skip
        this.logger.log(`Skip (hash existed): ${fileHash}`);
        return {
          success: false,
          message: `File đã được xử lý trước đây (hash=${fileHash}). Không cần re-embedding.`,
        };
      }

      // Bước 3: Nếu chưa có => proceed
      // - Tạo filename với timestamp (nếu vẫn muốn lưu file)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.length > MAX_FILE_SIZE) {
        throw new Error('File size exceeds limit (10MB)');
      }

      const timestamp = Date.now();
      const sanitizedFilename = originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filename = `${timestamp}-${sanitizedFilename}`;
      const filePath = path.join(
        process.cwd(),
        ZENAI_CONSTANTS.FOLDER_DATA_TRAINED,
        filename,
      );

      // Ghi file xuống disk
      await fs.writeFile(filePath, file);

      // Parse nội dung file -> text
      let content = '';
      switch (mimetype) {
        case 'application/pdf':
          const pdfData = await pdfParse(file);
          content = pdfData.text;
          break;
        case 'text/plain':
          content = file.toString('utf-8');
          break;
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          content = await this.processWordDocument(file);
          break;
        case 'application/rtf':
          content = await this.processRtfDocument(file);
          break;
        case 'text/markdown':
        case 'text/x-markdown':
          content = this.processMarkdownDocument(file);
          break;
        case 'text/html':
          content = this.processHtmlDocument(file);
          break;
        case 'application/xml':
        case 'text/xml':
          content = await this.processXmlDocument(file);
          break;
        case 'application/json':
          content = this.processJsonDocument(file);
          break;
        default:
          throw new Error('Unsupported file type: ' + mimetype);
      }

      // Chunk (ví dụ chunkSize=1000, overlap=200)
      const chunks = this.splitTextByLengthWithOverlap(content, 1000, 200);

      // Tạo metadata
      const metadataList = chunks.map((chunk, index) => ({
        id: `${filename}-${index}`,
        source: filename,
        chunk: index,
        timestamp: new Date().toISOString(),
        fileType: mimetype,
        fileHash, // Lưu hash
      }));

      // Tạo embedding
      const embeddings = [];
      for (const chunk of chunks) {
        const emb = await this.openaiService.createEmbedding(chunk);
        embeddings.push(emb);
      }

      // Lưu vào Chroma
      await this.chromaService.addDocuments(chunks, embeddings, metadataList);

      this.logger.log(`Processed file: ${filename} => ${chunks.length} chunks`);
      return {
        success: true,
        fileName: filename,
        chunks: chunks.length,
        filePath,
        fileType: mimetype,
        message: 'File processed successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error processing uploaded file: ${originalname}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Hàm xử lý file Word (.doc, .docx)
   */
  private async processWordDocument(buffer: Buffer): Promise<string> {
    try {
      // Dùng mammoth để trích xuất text
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      this.logger.error('Error processing Word document:', error);
      throw new Error('Failed to process Word document');
    }
  }

  /**
   * Hàm xử lý file RTF
   */
  private async processRtfDocument(buffer: Buffer): Promise<string> {
    try {
      const parseRtf = promisify(rtfParser.string);
      const result = await parseRtf(buffer.toString());
      return result.text;
    } catch (error) {
      this.logger.error('Error processing RTF document:', error);
      throw new Error('Failed to process RTF document');
    }
  }

  /**
   * Hàm xử lý file Markdown
   */
  private processMarkdownDocument(buffer: Buffer): string {
    try {
      const content = buffer.toString('utf-8');
      const html = this.md.render(content);
      return convert(html, {
        wordwrap: false,
        preserveNewlines: true,
      });
    } catch (error) {
      this.logger.error('Error processing Markdown document:', error);
      throw new Error('Failed to process Markdown document');
    }
  }

  /**
   * Hàm xử lý file HTML
   */
  private processHtmlDocument(buffer: Buffer): string {
    try {
      const html = buffer.toString('utf-8');
      const options: HtmlToTextOptions = {
        wordwrap: false,
        preserveNewlines: true,
        selectors: [
          { selector: 'img', format: 'skip' },
          { selector: 'script', format: 'skip' },
          { selector: 'style', format: 'skip' },
        ],
      };
      return convert(html, options);
    } catch (error) {
      this.logger.error('Error processing HTML document:', error);
      throw new Error('Failed to process HTML document');
    }
  }

  /**
   * Hàm xử lý file XML
   */
  private async processXmlDocument(buffer: Buffer): Promise<string> {
    try {
      const xml = buffer.toString('utf-8');
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(xml);
      return JSON.stringify(result, null, 2);
    } catch (error) {
      this.logger.error('Error processing XML document:', error);
      throw new Error('Failed to process XML document');
    }
  }

  /**
   * Hàm xử lý file JSON
   */
  private processJsonDocument(buffer: Buffer): string {
    try {
      const content = buffer.toString('utf-8');
      const json = JSON.parse(content);
      return JSON.stringify(json, null, 2);
    } catch (error) {
      this.logger.error('Error processing JSON document:', error);
      throw new Error('Failed to process JSON document');
    }
  }
}
