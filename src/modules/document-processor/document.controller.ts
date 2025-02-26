import {
  Controller,
  Post,
  Get,
  Query,
  Logger,
  UseInterceptors,
  UploadedFile,
  Param,
  Body,
} from '@nestjs/common';
import { DocumentProcessorService } from './document.service';
import { ChromaService } from '../vector-store/chroma.service';
import { OpenAIService } from '../openai/openai.service';
import {
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
  ApiConsumes,
  ApiProperty,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { IsString, IsOptional } from 'class-validator';

export class ReprocessDocumentsDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description:
      'Tên collection cần xóa và xử lý lại. Nếu là "all" sẽ xóa tất cả collections. Nếu không truyền sẽ xử lý collection mặc định (stock_knowledge)',
    required: false,
    example: 'stock_knowledge',
  })
  collectionName?: string;
}

@Controller('documents')
export class DocumentProcessorController {
  private readonly logger = new Logger(DocumentProcessorController.name);

  constructor(
    private readonly documentProcessorService: DocumentProcessorService,
    private readonly chromaService: ChromaService,
    private readonly openaiService: OpenAIService,
  ) {}

  /**
   * API endpoint để xử lý tất cả các file trong thư mục data
   */
  @Post('process')
  @ApiOperation({
    summary: 'Xử lý file trong thư mục src/data và lưu vào ChromaDB',
  })
  async processDocuments() {
    try {
      const result = await this.documentProcessorService.processAllFiles();
      return {
        success: true,
        message: 'Documents processed successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error('Failed to process documents:', error);
      return {
        success: false,
        message: 'Failed to process documents',
        error: error.message,
      };
    }
  }

  /**
   * API endpoint để xóa và xử lý lại toàn bộ dữ liệu
   */
  @Post('reprocess')
  @ApiOperation({
    summary: 'Xóa dữ liệu trong ChromaDB theo collection name',
    description:
      'Xóa dữ liệu của một collection cụ thể hoặc tất cả collections (nếu collectionName=all)',
  })
  @ApiBody({
    type: ReprocessDocumentsDto,
    description: 'Thông tin collection cần xử lý lại',
  })
  @ApiResponse({
    status: 200,
    description: 'Xử lý lại dữ liệu thành công',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        message: {
          type: 'string',
          example:
            'Collection stock_knowledge cleared and reprocessed successfully',
        },
        data: {
          type: 'object',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Lỗi khi xử lý',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: false,
        },
        message: {
          type: 'string',
          example: 'Failed to reprocess documents',
        },
        error: {
          type: 'string',
          example: 'Collection not found',
        },
      },
    },
  })
  async reprocessDocuments(@Body() dto: ReprocessDocumentsDto) {
    try {
      // Nếu không có collectionName, sử dụng collection mặc định
      const targetCollection = dto.collectionName || 'stock_knowledge';

      this.logger.log(
        `Bắt đầu xóa và xử lý lại dữ liệu của collection ${targetCollection}`,
      );
      const result =
        await this.documentProcessorService.reprocessAllFiles(targetCollection);

      return {
        success: true,
        message:
          targetCollection === 'all'
            ? 'All collections cleared and reprocessed successfully'
            : `Collection ${targetCollection} cleared and reprocessed successfully`,
        data: result,
      };
    } catch (error) {
      this.logger.error('Failed to reprocess documents:', error);
      return {
        success: false,
        message: 'Failed to reprocess documents',
        error: error.message,
      };
    }
  }

  /**
   * API endpoint để lấy tất cả dữ liệu từ ChromaDB
   */
  @Get('stored-data')
  async getStoredData() {
    try {
      const data = await this.chromaService.getAllDocuments();
      return {
        success: true,
        message: 'Retrieved stored documents successfully',
        data: {
          totalDocuments: data.length,
          documents: data,
        },
      };
    } catch (error) {
      this.logger.error('Failed to retrieve stored documents:', error);
      return {
        success: false,
        message: 'Failed to retrieve stored documents',
        error: error.message,
      };
    }
  }

  /**
   * API endpoint để lấy tất cả dữ liệu từ ChromaDB từ 1 collection name cụ thể
   */
  @Get('stored-data/:collectionName')
  @ApiOperation({
    summary: 'Lấy tất cả dữ liệu từ một collection cụ thể trong ChromaDB',
    description:
      'API trả về toàn bộ documents trong collection được chỉ định, sắp xếp theo thời gian mới nhất',
  })
  @ApiParam({
    name: 'collectionName',
    type: 'string',
    required: true,
    description: 'Tên collection cần lấy dữ liệu (ví dụ: stock_knowledge)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy dữ liệu thành công',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        message: {
          type: 'string',
          example: 'Retrieved stored documents successfully',
        },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description: 'Nội dung của document',
                example: 'Thông tin về cổ phiếu ABC...',
              },
              metadata: {
                type: 'object',
                description: 'Metadata của document',
                example: {
                  source: 'stock_report.pdf',
                  timestamp: 1678901234567,
                  chunk: 1,
                },
              },
              similarity: {
                type: 'number',
                description: 'Độ tương đồng (mặc định: 1)',
                example: 1,
              },
              timestamp: {
                type: 'number',
                description: 'Thời gian tạo document (Unix timestamp)',
                example: 1678901234567,
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Lỗi khi lấy dữ liệu',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: false,
        },
        message: {
          type: 'string',
          example: 'Failed to retrieve stored documents',
        },
        error: {
          type: 'string',
          example: 'Collection not found',
        },
      },
    },
  })
  async getStoredDataByCollectionName(
    @Param('collectionName') collectionName: string,
  ) {
    try {
      const data =
        await this.chromaService.getDocumentsByCollectionName(collectionName);
      return {
        success: true,
        message: 'Retrieved stored documents successfully',
        data: data,
      };
    } catch (error) {
      this.logger.error('Failed to retrieve stored documents:', error);
      return {
        success: false,
        message: 'Failed to retrieve stored documents',
        error: error.message,
      };
    }
  }

  /**
   * API endpoint để tìm kiếm documents tương tự
   */
  @Get('search')
  async searchSimilarDocuments(@Query('query') query: string) {
    try {
      if (!query) {
        throw new Error('Query parameter is required');
      }

      // Tạo embedding cho query
      const queryEmbedding = await this.openaiService.createEmbedding(query);

      // Tìm documents tương tự
      const results = await this.chromaService.similaritySearch(
        queryEmbedding,
        5,
      );

      return {
        success: true,
        message: 'Search completed successfully',
        data: {
          query,
          results: results.map((result) => ({
            content: result.content,
            metadata: result.metadata,
            // Có thể thêm score nếu ChromaDB trả về
          })),
        },
      };
    } catch (error) {
      this.logger.error('Failed to search documents:', error);
      return {
        success: false,
        message: 'Failed to search documents',
        error: error.message,
      };
    }
  }

  /**
   * API endpoint để upload và xử lý file
   * @param file File được upload (PDF, Word, Text, RTF, Markdown, HTML, XML, JSON)
   */
  @Post('upload')
  @ApiOperation({
    summary: 'Upload và xử lý file để lưu vào ChromaDB',
    description: `API cho phép upload và xử lý các định dạng file sau:
    - PDF (.pdf) - application/pdf
    - Word (.doc, .docx) - application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document
    - Text (.txt) - text/plain
    - RTF (.rtf) - application/rtf
    - Markdown (.md) - text/markdown, text/x-markdown
    - HTML (.html) - text/html
    - XML (.xml) - application/xml, text/xml
    - JSON (.json) - application/json

Quá trình xử lý:
1. File được upload sẽ được lưu vào thư mục src/data_trained
2. Nội dung file được extract thành text tùy theo định dạng
3. Text được chia thành các chunks (1000 ký tự/chunk)
4. Mỗi chunk được tạo embedding vector
5. Dữ liệu được lưu vào ChromaDB với metadata
    - id: unique id của chunk
    - source: tên file
    - chunk: index của đoạn văn
    - timestamp: thời điểm xử lý
    - fileType: loại file gốc`,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'File cần xử lý (Hỗ trợ: PDF, Word, Text, RTF, Markdown, HTML, XML, JSON)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'File được xử lý thành công',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        message: {
          type: 'string',
          example: 'File processed successfully',
        },
        data: {
          type: 'object',
          properties: {
            fileName: {
              type: 'string',
              example: '1234567890-document.pdf',
            },
            chunks: {
              type: 'number',
              description: 'Số lượng chunks được tạo',
              example: 10,
            },
            filePath: {
              type: 'string',
              description: 'Đường dẫn file đã lưu',
              example: '/path/to/src/data_trained/1234567890-document.pdf',
            },
            fileType: {
              type: 'string',
              description: 'MIME type của file',
              example: 'application/pdf',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Lỗi xử lý file',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: false,
        },
        message: {
          type: 'string',
          example: 'Failed to process uploaded file',
        },
        error: {
          type: 'string',
          example: 'Unsupported file type: image/jpeg',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    try {
      if (!file) {
        throw new Error('No file uploaded');
      }

      // Kiểm tra loại file
      if (!['application/pdf', 'text/plain'].includes(file.mimetype)) {
        throw new Error('Only PDF and text files are supported');
      }

      const result = await this.documentProcessorService.processUploadedFile(
        file.buffer,
        file.originalname,
        file.mimetype,
      );

      return {
        success: true,
        message: 'File processed successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error('Failed to process uploaded file:', error);
      return {
        success: false,
        message: 'Failed to process uploaded file',
        error: error.message,
      };
    }
  }
}
