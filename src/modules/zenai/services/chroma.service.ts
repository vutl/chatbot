import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ChromaClient, Collection } from 'chromadb';
import { ConfigService } from '@nestjs/config';
import {
  IStockBasicInfo,
  IStockChromaFormat,
  IPost,
} from '../interfaces/stock.interface';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { ZENAI_CONSTANTS } from '../constants/zenai.constant';
type IncludeEnum = 'embeddings' | 'documents' | 'metadatas' | 'distances';

@Injectable()
export class ChromaService implements OnModuleInit {
  private readonly logger = new Logger(ChromaService.name);
  private client: ChromaClient;
  private stockCollection: Collection;
  private newsCollection: Collection;
  private embeddings: OpenAIEmbeddings;
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor(private readonly configService: ConfigService) {
    const chromaUrl = this.configService.get<string>('CHROMA_URL');
    const openAIKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!chromaUrl) {
      throw new Error('CHROMA_URL environment variable is not set');
    }
    if (!openAIKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    this.logger.log(`Initializing ChromaDB client with URL: ${chromaUrl}`);
    this.client = new ChromaClient({
      path: chromaUrl,
    });

    // Khởi tạo OpenAI embeddings
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: openAIKey,
      modelName: ZENAI_CONSTANTS.EMBEDDING.MODEL_NAME,
      stripNewLines: true,
    });

    // Khởi tạo text splitter với cấu hình riêng cho tin tức
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000, // Chunk size lớn hơn cho tin tức
      chunkOverlap: 100, // Overlap lớn hơn để duy trì ngữ cảnh
      separators: ['\n\n', '\n', '.', ' ', ''], // Thêm dấu chấm để tách câu
    });
  }

  async onModuleInit() {
    try {
      // Khởi tạo collection cho stock data
      this.stockCollection = await this.client.getOrCreateCollection({
        name: ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.STOCK_INFO,
        metadata: {
          description: 'Thông tin cơ bản về các mã chứng khoán',
          hnsw_space: 'cosine',
        },
      });

      // Khởi tạo collection cho market news
      this.newsCollection = await this.client.getOrCreateCollection({
        name: ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.MARKET_NEWS,
        metadata: {
          description: 'Tin tức thị trường chứng khoán',
          hnsw_space: 'cosine',
        },
      });

      this.logger.log('ChromaDB service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize ChromaDB:', error);
      throw error;
    }
  }

  /**
   * Tạo chunks từ nội dung văn bản
   * @param content Nội dung cần chia nhỏ
   */
  private async createChunks(content: string): Promise<string[]> {
    try {
      return await this.textSplitter.splitText(content);
    } catch (error) {
      this.logger.error('Lỗi khi tạo chunks từ nội dung:', error);
      throw error;
    }
  }

  /**
   * Tạo embeddings cho các chunks
   * @param chunks Danh sách các chunks cần tạo embedding
   */
  private async createEmbeddings(chunks: string[]): Promise<number[][]> {
    try {
      return await this.embeddings.embedDocuments(chunks);
    } catch (error) {
      this.logger.error('Lỗi khi tạo embeddings:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra xem một mã chứng khoán đã tồn tại trong ChromaDB chưa
   * @param stockCode Mã chứng khoán cần kiểm tra
   * @returns boolean - true nếu đã tồn tại, false nếu chưa
   */
  private async checkStockExists(stockCode: string): Promise<boolean> {
    try {
      const documentId = `stock_${stockCode}`;
      const result = await this.stockCollection.get({
        ids: [documentId],
      });

      return result.ids.length > 0;
    } catch (error) {
      this.logger.error(
        `Lỗi khi kiểm tra sự tồn tại của mã ${stockCode}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Chuyển đổi dữ liệu từ API sang format phù hợp với ChromaDB
   * @param stockInfo Thông tin cơ bản của mã chứng khoán từ API
   */
  private convertToChromaFormat(
    stockInfo: IStockBasicInfo,
  ): IStockChromaFormat {
    return {
      code: stockInfo.CodeStock,
      companyName: stockInfo.NameStock,
      exchange: stockInfo.Exchange,
      industry: stockInfo.Industry || stockInfo.IndustryGroup?.Name || '',
      marketCap: parseFloat(stockInfo.Capitalization) || 0,
      price: stockInfo.ClosePrice || 0,
      volume: parseFloat(stockInfo.CurrentVolume) || 0,
      pe: parseFloat(stockInfo.PE) || 0,
      eps: parseFloat(stockInfo.EPS) || 0,
      roe: parseFloat(stockInfo.ROE) || 0,
      roa: parseFloat(stockInfo.ROA) || 0,
      growth: stockInfo.Growth || 0,
      stockRatingGeneral: parseFloat(stockInfo.StockRatingGeneral) || 0,
      stockBasicPoint: parseFloat(stockInfo.StockBasicPoint) || 0,
      stockPriceRating: parseFloat(stockInfo.StockPriceRating) || 0,
      gtgd: parseFloat(stockInfo.GTGD) || 0,
      ProbabilityT: stockInfo.ProbabilityT || 0,
      ProbabilityShortTerm: stockInfo.ProbabilityShortTerm || 0,
      ProbabilityRisk: stockInfo.ProbabilityRisk || 0,
    };
  }

  /**
   * Lưu thông tin cơ bản của mã chứng khoán vào ChromaDB
   * @param stockInfo Thông tin cơ bản của mã chứng khoán
   */
  async upsertStockInfo(stockInfo: IStockBasicInfo): Promise<void> {
    try {
      const chromaFormat = this.convertToChromaFormat(stockInfo);
      const documentContent = this.prepareStockContent(chromaFormat);

      // Tạo chunks từ nội dung
      const chunks = await this.createChunks(documentContent);

      // Tạo embeddings cho từng chunk
      const embeddings = await this.createEmbeddings(chunks);

      // Tạo IDs cho từng chunk
      const ids = chunks.map(
        (_, index) => `stock_${chromaFormat.code}_chunk_${index}`,
      );

      // Tạo metadata cho từng chunk
      const metadatas = chunks.map((chunk, index) => ({
        code: chromaFormat.code,
        chunkIndex: index,
        totalChunks: chunks.length,
        updatedAt: new Date().toISOString(),
        type: 'stock_basic_info',
        price: chromaFormat.price,
        marketCap: chromaFormat.marketCap,
        industry: chromaFormat.industry,
        exchange: chromaFormat.exchange,
      }));

      let exists = false;
      try {
        exists = await this.checkStockExists(chromaFormat.code);
      } catch (checkError) {
        this.logger.warn(
          `Không thể kiểm tra sự tồn tại của mã ${chromaFormat.code}, sẽ thực hiện thêm mới:`,
          checkError,
        );
      }

      if (exists) {
        // Nếu đã tồn tại, xóa dữ liệu cũ và thêm mới
        await this.deleteStockData(chromaFormat.code);
      }

      // Thêm dữ liệu mới với embeddings
      await this.stockCollection.add({
        ids,
        embeddings,
        documents: chunks,
        metadatas,
      });

      this.logger.debug(
        `Đã ${exists ? 'cập nhật' : 'thêm mới'} thông tin mã ${chromaFormat.code} vào ChromaDB với ${chunks.length} chunks`,
      );
    } catch (error) {
      this.logger.error(
        `Lỗi khi lưu thông tin mã ${stockInfo.CodeStock} vào ChromaDB:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Xóa toàn bộ dữ liệu của một mã chứng khoán
   * @param stockCode Mã chứng khoán cần xóa
   */
  private async deleteStockData(stockCode: string): Promise<void> {
    try {
      const where = { code: stockCode };
      await this.stockCollection.delete({
        where,
      });
    } catch (error) {
      this.logger.error(`Lỗi khi xóa dữ liệu của mã ${stockCode}:`, error);
      throw error;
    }
  }

  /**
   * Chuẩn bị nội dung từ thông tin cổ phiếu để lưu vào ChromaDB
   * @param stockInfo Thông tin cơ bản của mã chứng khoán đã được chuẩn hóa
   */
  private prepareStockContent(stockInfo: IStockChromaFormat): string {
    return `
Thông tin chi tiết về mã chứng khoán ${stockInfo.code} (${stockInfo.companyName}):

THÔNG TIN CÔNG TY
- Tên công ty: ${stockInfo.companyName}
- Mã chứng khoán: ${stockInfo.code}
- Sàn giao dịch: ${stockInfo.exchange}
- Ngành nghề: ${stockInfo.industry}

THÔNG TIN GIAO DỊCH
- Giá hiện tại tính tới ngày giao dịch gần nhất: ${stockInfo.price} VND
- Khối lượng giao dịch: ${stockInfo.volume}
- Vốn hóa thị trường: ${stockInfo.marketCap} tỷ VND
- Phần trăm tăng trưởng tính tới ngày giao dịch gần nhất : ${stockInfo.growth}%
- Giá trị giao dịch : ${stockInfo.gtgd}

CHỈ SỐ TÀI CHÍNH
- P/E (Price/Earnings): ${stockInfo.pe}
- EPS (Earnings Per Share): ${stockInfo.eps} VND
- ROE (Return on Equity): ${stockInfo.roe}%
- ROA (Return on Assets): ${stockInfo.roa}%

KHUYẾN NGHỊ CỦA ZENAI : 
- Chỉ số đánh giá chung ZenAI Rating : ${stockInfo.stockRatingGeneral}
- Điểm cơ bản ZenAI Score: ${stockInfo.stockBasicPoint}
- Điểm giá ZenAI Signal : ${stockInfo.stockPriceRating}
- Xác xuất tăng giá T+1 : ${stockInfo.ProbabilityT}%
- Xác xuất tăng giá trong ngắn hạn : ${stockInfo.ProbabilityShortTerm}%
- Xác xuất Rủi ro : ${stockInfo.ProbabilityRisk}%


ĐÁNH GIÁ CHUNG
Mã ${stockInfo.code} là một công ty ${stockInfo.industry.toLowerCase()}, được giao dịch trên sàn ${stockInfo.exchange}. 
Với mức giá hiện tại là ${stockInfo.price} VND và P/E ${stockInfo.pe}, 
cổ phiếu này có vốn hóa thị trường ${stockInfo.marketCap} tỷ VND.
Các chỉ số tài chính cho thấy công ty có ROE ${stockInfo.roe}% và ROA ${stockInfo.roa}%.
    `.trim();
  }

  /**
   * Tìm kiếm thông tin cổ phiếu dựa trên query
   * @param query Câu truy vấn
   * @param limit Số lượng kết quả tối đa
   */
  async searchStocks(query: string, limit: number = 5) {
    try {
      // Tạo embedding cho câu query
      const queryEmbedding = await this.embeddings.embedQuery(query);

      // Thực hiện tìm kiếm vector với embedding của query
      const results = await this.stockCollection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
        include: ['embeddings', 'documents', 'metadatas', 'distances'] as any,
      });

      return results;
    } catch (error) {
      this.logger.error('Lỗi khi tìm kiếm thông tin cổ phiếu:', error);
      throw error;
    }
  }

  /**
   * Chuẩn bị nội dung tin tức để lưu vào ChromaDB
   * @param news Thông tin tin tức
   */
  private prepareNewsContent(news: IPost): string {
    return `
TIN TỨC THỊ TRƯỜNG CHỨNG KHOÁN

TIÊU ĐỀ: ${news.Title}
${news.SubTitle ? `PHỤ ĐỀ: ${news.SubTitle}\n` : ''}

NỘI DUNG TÓM TẮT:
${news.Description || news.ShortContent}

NỘI DUNG CHI TIẾT:
${news.Content}

THÔNG TIN THÊM:
- Nguồn: ${news.Source}
- Tác giả: ${news.Author}
- Thời gian: ${news.CreateTime}
- Loại tin: ${news.PostType?.Name || 'Tin tức thị trường'}
${news.Evaluate ? `- Đánh giá: ${news.Evaluate}\n` : ''}
    `.trim();
  }

  /**
   * Kiểm tra xem một tin tức đã tồn tại trong ChromaDB chưa
   */
  private async checkNewsExists(newsId: number): Promise<boolean> {
    try {
      // Thay vì tìm kiếm theo ID, tìm kiếm theo trường newsId trong metadata
      const result = await this.newsCollection.get({
        where: { newsId: newsId.toString() },
      });

      return result.ids.length > 0;
    } catch (error) {
      this.logger.error(
        `Lỗi khi kiểm tra sự tồn tại của tin tức ID ${newsId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Xóa tin tức cũ trong ChromaDB
   */
  private async deleteNewsData(newsId: number): Promise<void> {
    try {
      const where = { newsId: newsId.toString() };
      await this.newsCollection.delete({
        where,
      });
    } catch (error) {
      this.logger.error(`Lỗi khi xóa tin tức ID ${newsId}:`, error);
      throw error;
    }
  }

  /**
   * Lưu tin tức thị trường vào ChromaDB (chỉ lưu mới, không cập nhật tin đã tồn tại)
   * @param news Thông tin tin tức cần lưu
   */
  async upsertMarketNews(news: IPost): Promise<void> {
    try {
      // Kiểm tra sự tồn tại của tin tức trước tiên để tối ưu hiệu suất
      let exists = false;
      try {
        exists = await this.checkNewsExists(news.Id);
        // Nếu tin tức đã tồn tại, không thực hiện update nữa
        if (exists) {
          this.logger.debug(
            `Tin tức ID ${news.Id} đã tồn tại trong ChromaDB, bỏ qua quá trình cập nhật.`,
          );
          return;
        }
      } catch (checkError) {
        this.logger.warn(
          `Không thể kiểm tra sự tồn tại của tin tức ID ${news.Id}:`,
          checkError,
        );
      }

      // Chỉ xử lý thêm mới nếu tin tức chưa tồn tại
      const documentContent = this.prepareNewsContent(news);

      // Tạo chunks từ nội dung
      const chunks = await this.createChunks(documentContent);

      // Tạo embeddings cho từng chunk
      const embeddings = await this.createEmbeddings(chunks);

      // Tạo IDs cho từng chunk
      const ids = chunks.map((_, index) => `news_${news.Id}_chunk_${index}`);

      // Tạo metadata cho từng chunk
      const metadatas = chunks.map((chunk, index) => ({
        newsId: news.Id.toString(),
        title: news.Title,
        source: news.Source,
        author: news.Author,
        createTime: news.CreateTime,
        postType: news.PostType?.Name,
        chunkIndex: index,
        totalChunks: chunks.length,
        updatedAt: new Date().toISOString(),
        type: 'market_news',
        url: news.Url,
        evaluate: news.Evaluate,
      }));

      // Thêm mới tin tức vào ChromaDB
      await this.newsCollection.add({
        ids,
        embeddings,
        documents: chunks,
        metadatas,
      });

      this.logger.debug(
        `Đã thêm mới tin tức ID ${news.Id} vào ChromaDB với ${chunks.length} chunks`,
      );
    } catch (error) {
      this.logger.error(
        `Lỗi khi lưu tin tức ID ${news.Id} vào ChromaDB:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Tìm kiếm tin tức thị trường
   * @param query Câu truy vấn
   * @param limit Số lượng kết quả tối đa
   */
  async searchMarketNews(query: string, limit: number = 5) {
    try {
      const queryEmbedding = await this.embeddings.embedQuery(query);

      const results = await this.newsCollection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
        include: ['embeddings', 'documents', 'metadatas', 'distances'] as any,
      });

      return results;
    } catch (error) {
      this.logger.error('Lỗi khi tìm kiếm tin tức:', error);
      throw error;
    }
  }
}
