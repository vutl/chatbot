import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ChromaClient, Collection, IncludeEnum } from 'chromadb';
import { ConfigService } from '@nestjs/config';
import { ZENAI_CONSTANTS } from '../zenai/constants/zenai.constant';

export interface SearchResult {
  content: string;
  metadata: any;
  similarity: number;
}

interface ChromaCollection {
  name: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class ChromaService implements OnModuleInit {
  private readonly logger = new Logger(ChromaService.name);
  private client: ChromaClient;
  private collectionStockKnowledge: Collection;
  private collectionMarketNews: Collection;
  private collectionStockInfo: Collection;

  constructor(private configService: ConfigService) {
    const chromaUrl = this.configService.get<string>('CHROMA_URL');
    if (!chromaUrl) {
      throw new Error('CHROMA_URL environment variable is not set');
    }

    this.logger.log(`Initializing ChromaDB client with URL: ${chromaUrl}`);
    this.client = new ChromaClient({
      path: chromaUrl,
    });
  }

  async onModuleInit() {
    try {
      // Kiểm tra kết nối tới ChromaDB
      await this.testConnection();

      // Kiểm tra collections hiện có
      const collections = await this.client.listCollections();
      this.logger.log(`Available collections: ${collections}`);

      // Khởi tạo collection cho kiến thức chứng khoán
      this.collectionStockKnowledge = await this.client.getOrCreateCollection({
        name: ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.STOCK_KNOWLEDGE,
        metadata: {
          description: 'Kho kiến thức về chứng khoán Việt Nam',
          hnsw_space: 'cosine',
        },
      });

      // Khởi tạo collection cho thông tin cổ phiếu
      this.collectionStockInfo = await this.client.getOrCreateCollection({
        name: ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.STOCK_INFO,
        metadata: {
          description: 'Thông tin cơ bản về các mã chứng khoán',
          hnsw_space: 'cosine',
        },
      });

      // Khởi tạo collection cho tin tức thị trường
      this.collectionMarketNews = await this.client.getOrCreateCollection({
        name: ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.MARKET_NEWS,
        metadata: {
          description: 'Tin tức thị trường chứng khoán',
          hnsw_space: 'cosine',
        },
      });

      // Kiểm tra và log số lượng documents trong các collection
      const stockKnowledgeCount = await this.collectionStockKnowledge.count();
      const stockInfoCount = await this.collectionStockInfo.count();
      const marketNewsCount = await this.collectionMarketNews.count();

      this.logger.log(`Number of documents in collections:
        - Stock Knowledge: ${stockKnowledgeCount}
        - Stock Info: ${stockInfoCount}
        - Market News: ${marketNewsCount}
      `);

      this.logger.log('ChromaDB initialized successfully with all collections');
    } catch (error) {
      this.logger.error('Failed to initialize ChromaDB:', error);
      throw new Error(`ChromaDB initialization failed: ${error.message}`);
    }
  }

  /**
   * Test kết nối tới ChromaDB server
   */
  private async testConnection() {
    try {
      const heartbeat = await this.client.heartbeat();
      this.logger.log('ChromaDB heartbeat:', heartbeat);

      const version = await this.client.version();
      this.logger.log('ChromaDB version:', version);

      this.logger.log('Successfully connected to ChromaDB');
    } catch (error) {
      this.logger.error('Failed to connect to ChromaDB:', error);
      throw new Error(
        `Could not connect to ChromaDB at ${this.configService.get('CHROMA_URL')}`,
      );
    }
  }

  /**
   * Lấy tất cả documents từ collection
   */
  async getAllDocuments(): Promise<SearchResult[]> {
    try {
      if (!this.collectionStockKnowledge) {
        throw new Error('ChromaDB collection is not initialized');
      }

      const result = await this.collectionStockKnowledge.get();
      return result.documents.map((doc, index) => ({
        content: doc,
        metadata: result.metadatas[index],
        similarity: 1, // Default similarity for direct retrieval
      }));
    } catch (error) {
      this.logger.error('Failed to get all documents:', error);
      throw new Error(`Failed to get all documents: ${error.message}`);
    }
  }

  /**
   * Thêm documents vào vector store
   */
  async addDocuments(
    texts: string[],
    embeddings: number[][],
    metadata: Record<string, any>[],
  ) {
    try {
      if (!this.collectionStockKnowledge) {
        throw new Error('ChromaDB collection is not initialized');
      }

      // Đảm bảo rằng tất cả các arrays có cùng độ dài
      if (
        texts.length !== embeddings.length ||
        texts.length !== metadata.length
      ) {
        throw new Error(
          'Texts, embeddings, and metadata arrays must have the same length',
        );
      }

      // Tạo unique IDs cho mỗi document
      const ids = metadata.map(
        (m) =>
          m.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      );

      await this.collectionStockKnowledge.add({
        ids: ids,
        embeddings: embeddings,
        metadatas: metadata,
        documents: texts,
      });

      this.logger.log(
        `Successfully added ${texts.length} documents to ChromaDB`,
      );
    } catch (error) {
      this.logger.error('Failed to add documents to ChromaDB:', error);
      throw new Error(`Failed to add documents: ${error.message}`);
    }
  }

  /**
   * Tìm kiếm tương tự dựa trên embedding vector
   * @param queryEmbedding Vector embedding của câu truy vấn
   * @param limit Số lượng kết quả tối đa trả về
   * @param collectionWeights Trọng số cho mỗi collection (tùy chọn)
   * @returns Danh sách kết quả tìm kiếm
   */
  async similaritySearch(
    queryEmbedding: number[],
    limit: number = 5,
    collectionWeights?: Record<string, number>,
  ): Promise<SearchResult[]> {
    try {
      // Kiểm tra các collection đã được khởi tạo
      if (
        !this.collectionStockKnowledge ||
        !this.collectionMarketNews ||
        !this.collectionStockInfo
      ) {
        throw new Error('One or more ChromaDB collections are not initialized');
      }

      // Kiểm tra tính hợp lệ của queryEmbedding
      if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
        throw new Error('Invalid query embedding format');
      }

      // Validate embedding dimensions
      if (
        queryEmbedding.length !== ZENAI_CONSTANTS.EMBEDDING.VECTOR_DIMENSIONS
      ) {
        throw new Error(
          `Invalid embedding dimensions. Expected ${ZENAI_CONSTANTS.EMBEDDING.VECTOR_DIMENSIONS}, got ${queryEmbedding.length}`,
        );
      }

      // Trọng số mặc định nếu không được cung cấp
      const weights = collectionWeights || {
        [ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.STOCK_KNOWLEDGE]: 0.33,
        [ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.MARKET_NEWS]: 0.33,
        [ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.STOCK_INFO]: 0.33,
      };

      this.logger.log(
        `[ChromaDB] Tìm kiếm với trọng số: ${JSON.stringify(weights)}`,
      );

      // Xác định ngưỡng trọng số để quyết định collection nào là quan trọng
      const WEIGHT_THRESHOLD = 0.5; // Ngưỡng để xác định collection quan trọng
      
      // Lọc ra các collection có trọng số cao (quan trọng)
      const importantCollections: { name: string; weight: number }[] = [];
      const secondaryCollections: { name: string; weight: number }[] = [];
      
      Object.entries(weights).forEach(([name, weight]) => {
        if (weight >= WEIGHT_THRESHOLD) {
          importantCollections.push({ name, weight });
        } else {
          secondaryCollections.push({ name, weight });
        }
      });
      
      // Sắp xếp các collection theo trọng số giảm dần
      importantCollections.sort((a, b) => b.weight - a.weight);
      secondaryCollections.sort((a, b) => b.weight - a.weight);
      
      this.logger.log(
        `[ChromaDB] Collection quan trọng: ${JSON.stringify(importantCollections)}`,
      );
      this.logger.log(
        `[ChromaDB] Collection phụ: ${JSON.stringify(secondaryCollections)}`,
      );

      // Tính toán số lượng kết quả cho mỗi collection dựa trên trọng số
      // Ưu tiên phân bổ kết quả cho các collection quan trọng trước
      let remainingLimit = limit;
      const collectionLimits: Record<string, number> = {};
      
      // Tính tổng trọng số của các collection quan trọng
      const totalImportantWeight = importantCollections.reduce(
        (sum, col) => sum + col.weight, 
        0
      );
      
      // Phân bổ kết quả cho các collection quan trọng
      if (importantCollections.length > 0) {
        // Dành 80% limit cho các collection quan trọng
        const importantLimit = Math.ceil(limit * 0.8);
        remainingLimit -= importantLimit;
        
        importantCollections.forEach(col => {
          const colLimit = Math.max(
            1,
            Math.round((col.weight / totalImportantWeight) * importantLimit)
          );
          collectionLimits[col.name] = colLimit;
        });
      }
      
      // Nếu còn dư limit, phân bổ cho các collection phụ
      if (remainingLimit > 0 && secondaryCollections.length > 0) {
        const totalSecondaryWeight = secondaryCollections.reduce(
          (sum, col) => sum + col.weight, 
          0
        );
        
        secondaryCollections.forEach(col => {
          const colLimit = Math.max(
            1,
            Math.round((col.weight / totalSecondaryWeight) * remainingLimit)
          );
          collectionLimits[col.name] = colLimit;
        });
      }
      
      // Đảm bảo tất cả collection đều có giá trị
      const stockKnowledgeLimit = collectionLimits[ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.STOCK_KNOWLEDGE] || 0;
      const marketNewsLimit = collectionLimits[ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.MARKET_NEWS] || 0;
      const stockInfoLimit = collectionLimits[ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.STOCK_INFO] || 0;
      
      this.logger.log(
        `[ChromaDB] Phân bổ kết quả: STOCK_KNOWLEDGE=${stockKnowledgeLimit}, MARKET_NEWS=${marketNewsLimit}, STOCK_INFO=${stockInfoLimit}`
      );

      // Mảng chứa các promise tìm kiếm
      const searchPromises = [];
      
      // Chỉ tìm kiếm trong các collection có limit > 0
      if (stockKnowledgeLimit > 0) {
        searchPromises.push(
          this.searchInCollection(
            this.collectionStockKnowledge,
            queryEmbedding,
            stockKnowledgeLimit,
            'stock_knowledge',
          )
        );
      } else {
        searchPromises.push(Promise.resolve([]));
      }
      
      if (marketNewsLimit > 0) {
        searchPromises.push(
          this.searchInCollection(
            this.collectionMarketNews,
            queryEmbedding,
            marketNewsLimit,
            'market_news',
          )
        );
      } else {
        searchPromises.push(Promise.resolve([]));
      }
      
      if (stockInfoLimit > 0) {
        searchPromises.push(
          this.searchInCollection(
            this.collectionStockInfo,
            queryEmbedding,
            stockInfoLimit,
            'stock_info',
          )
        );
      } else {
        searchPromises.push(Promise.resolve([]));
      }

      // Tìm kiếm song song trong các collection đã chọn
      const [stockKnowledgeResults, marketNewsResults, stockInfoResults] =
        await Promise.all(searchPromises);

      // Gộp kết quả và sắp xếp theo độ tương tự
      const allResults = [
        ...stockKnowledgeResults,
        ...marketNewsResults,
        ...stockInfoResults,
      ].sort((a, b) => b.similarity - a.similarity);

      // Thêm thông tin về mức độ ưu tiên vào metadata
      const resultsWithPriority = allResults.map(result => {
        const collectionName = result.metadata?.collection_name;
        const isImportant = importantCollections.some(col => col.name === collectionName);
        
        return {
          ...result,
          metadata: {
            ...result.metadata,
            priority: isImportant ? 'CAO' : 'THẤP',
            weight: weights[collectionName] || 0,
          }
        };
      });

      // Giới hạn số lượng kết quả trả về
      return resultsWithPriority.slice(0, limit);
    } catch (error) {
      this.logger.error(
        `[ChromaDB] Lỗi khi tìm kiếm tương tự: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Hàm helper để thực hiện tìm kiếm trên một collection cụ thể
   */
  private async searchInCollection(
    collection: Collection,
    queryEmbedding: number[],
    limit: number,
    sourceType: 'stock_knowledge' | 'stock_info' | 'market_news',
  ): Promise<SearchResult[]> {
    try {
      // Kiểm tra collection có dữ liệu không
      const count = await collection.count();
      if (count === 0) {
        this.logger.debug(`Collection ${collection.name} is empty`);
        return [];
      }

      this.logger.debug(`Searching in collection ${collection.name}`);

      // Thực hiện query
      const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
        include: ['documents', 'metadatas', 'distances'] as any[],
      });

      if (!results.documents?.[0]?.length) {
        return [];
      }

      const documents = results.documents[0];
      const metadatas = results.metadatas?.[0] || [];
      const distances = results.distances?.[0] || [];

      // Tính toán similarity scores
      const maxDistance = distances.length > 0 ? Math.max(...distances) : 1;
      const similarities = distances.map((d) =>
        maxDistance === 0 ? 1 : 1 - d / (maxDistance * 2),
      );

      // Thêm thông tin nguồn vào metadata
      return documents.map((doc, i) => ({
        content: doc,
        metadata: {
          ...(metadatas[i] || {}),
          source_type: sourceType,
          collection_name: collection.name,
        },
        similarity: similarities[i] || 0,
      }));
    } catch (error) {
      this.logger.error(
        `Error searching in collection ${collection.name}:`,
        error,
      );
      return []; // Return empty array instead of throwing to allow other collections to continue
    }
  }

  /**
   * Xóa toàn bộ dữ liệu trong collection
   * @param collectionName - Tên collection cần xóa. Nếu là 'all' sẽ xóa tất cả collections
   */
  async clearCollection(collectionName?: string) {
    try {
      if (collectionName === 'all') {
        // Lấy danh sách tất cả collections
        const collections = await this.client.listCollections();

        // Xóa từng collection
        for (const collectionName of collections) {
          await this.client.deleteCollection({
            name: collectionName,
          });
          this.logger.log(`Deleted collection: ${collectionName}`);
        }

        // Khởi tạo lại collection mặc định
        this.collectionStockKnowledge = await this.client.createCollection({
          name: ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.STOCK_KNOWLEDGE,
          metadata: {
            description: 'Kho kiến thức về chứng khoán Việt Nam',
          },
        });

        this.logger.log(
          'All collections cleared and default collection recreated successfully',
        );
        return;
      }

      // Xóa collection cụ thể
      const targetCollection = collectionName;

      // Kiểm tra collection có tồn tại không
      const collections = await this.client.listCollections();
      const collectionExists = collections.includes(targetCollection);

      if (!collectionExists) {
        throw new Error(`Collection ${targetCollection} does not exist`);
      }

      // Xóa collection
      await this.client.deleteCollection({
        name: targetCollection,
      });

      // Nếu là collection mặc định, tạo lại
      if (
        targetCollection ===
        ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.STOCK_KNOWLEDGE
      ) {
        this.collectionStockKnowledge = await this.client.createCollection({
          name: ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.STOCK_KNOWLEDGE,
          metadata: {
            description: 'Kho kiến thức về chứng khoán Việt Nam',
          },
        });
      }

      this.logger.log(`Collection ${targetCollection} cleared successfully`);
    } catch (error) {
      this.logger.error('Failed to clear collection:', error);
      throw new Error(`Failed to clear collection: ${error.message}`);
    }
  }

  /**
   * Lấy tất cả documents từ một collection cụ thể và sắp xếp theo thời gian
   * @param collectionName Tên collection cần lấy dữ liệu
   * @returns Danh sách documents đã được sắp xếp theo thời gian mới nhất
   */
  async getDocumentsByCollectionName(
    collectionName: string,
  ): Promise<SearchResult[]> {
    try {
      // Kiểm tra collection có tồn tại không
      const collections = await this.client.listCollections();
      if (!collections.includes(collectionName)) {
        throw new Error(`Collection ${collectionName} does not exist`);
      }

      // Lấy collection theo tên
      const targetCollection = await this.client.getCollection({
        name: collectionName,
        embeddingFunction: {
          generate: async (texts: string[]): Promise<number[][]> => {
            // Return empty embeddings since we don't need them for getting documents
            return texts.map(() => []);
          },
        },
      });

      // Lấy tất cả documents từ collection
      const result = await targetCollection.get();

      // Map kết quả và thêm thông tin timestamp từ metadata
      const documents = result.documents.map((doc, index) => {
        const timestamp = result.metadatas[index]?.timestamp;
        return {
          content: doc,
          metadata: result.metadatas[index],
          similarity: 1,
          timestamp: typeof timestamp === 'number' ? timestamp : 0,
        };
      });

      // Sắp xếp theo timestamp giảm dần (mới nhất lên đầu)
      documents.sort((a, b) => b.timestamp - a.timestamp);

      // Trả về kết quả đã sắp xếp
      return documents;
    } catch (error) {
      this.logger.error(
        `Failed to get documents from collection ${collectionName}:`,
        error,
      );
      throw new Error(
        `Failed to get documents from collection ${collectionName}: ${error.message}`,
      );
    }
  }
}
