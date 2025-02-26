import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
  IStockBasicInfo,
  IPostResponse,
  ISuggestStockResponse,
  IBuySellSignalResponse,
  ICTCKViewResponse,
  ITradingStrategyResponse,
  IMarketNewsAIUpdate,
} from '../interfaces/stock.interface';
import { firstValueFrom } from 'rxjs';
import { ZENAI_CONSTANTS } from '../constants/zenai.constant';
import { ZenAIAuthService } from './zenai-auth.service';
import { ChromaService } from './chroma.service';

@Injectable()
export class ZenAIStockService {
  private readonly logger = new Logger(ZenAIStockService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly authService: ZenAIAuthService,
    private readonly chromaService: ChromaService,
  ) {
    this.baseUrl = ZENAI_CONSTANTS.DEFAULT_API_URL;
  }

  /**
   * Lấy thông tin cơ bản của một mã chứng khoán và lưu vào ChromaDB
   * @param stockCode Mã chứng khoán cần lấy thông tin
   * @returns Thông tin cơ bản của mã chứng khoán
   * @throws {Error} Khi không thể lấy được thông tin cổ phiếu
   */
  async getStockBasicInfo(stockCode: string): Promise<IStockBasicInfo> {
    try {
      const accessToken = await this.authService.getAccessToken();

      const { data } = await firstValueFrom(
        this.httpService.get<IStockBasicInfo>(
          `${this.baseUrl}${ZENAI_CONSTANTS.ENDPOINTS.STOCK_BASIC_INFO}`,
          {
            params: {
              code: stockCode,
            },
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      );

      // Lưu thông tin vào ChromaDB
      await this.chromaService.upsertStockInfo(data);

      return data;
    } catch (error: any) {
      // Kiểm tra nếu là HTTP error từ Axios
      if (error?.response) {
        const errorMessage =
          error?.response?.data?.Error ||
          error?.message ||
          'Lỗi không xác định';
        this.logger.error(`Lỗi khi lấy thông tin cơ bản của mã ${stockCode}:`, {
          error: errorMessage,
          status: error.response?.status,
          statusText: error.response?.statusText,
        });
        throw new Error(
          ZENAI_CONSTANTS.ERROR_MESSAGES.FETCH_STOCK_INFO_ERROR(stockCode) +
            `: ${errorMessage}`,
        );
      }

      this.logger.error(
        `Lỗi không xác định khi lấy thông tin mã ${stockCode}:`,
        error,
      );
      throw error;
    }
  }
  async justGetMarketNews(
    pageIndex = 1,
    pageSize = 40,
  ): Promise<IPostResponse> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<IPostResponse>(
          `${this.baseUrl}${ZENAI_CONSTANTS.ENDPOINTS.MARKET_NEWS}`,
          {
            params: {
              PostTypeId: ZENAI_CONSTANTS.POST_TYPES.MARKET_NEWS,
              PageIndex: pageIndex,
              PageSize: pageSize,
            },
          },
        ),
      );
      return data;
    } catch (error) {
      this.logger.error('Lỗi khi lấy tin tức thị trường:', error);
      return {
        Items: [],
        TotalRecord: 0,
        Status: false,
        Message: 'Lỗi khi lấy tin tức thị trường',
      };
    }
  }
  /**
   * Lấy tin tức thị trường và lưu vào ChromaDB
   * @param pageIndex Trang số
   * @param pageSize Số lượng tin mỗi trang
   */
  async getMarketNews(pageIndex = 1, pageSize = 40): Promise<IPostResponse> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<IPostResponse>(
          `${this.baseUrl}${ZENAI_CONSTANTS.ENDPOINTS.MARKET_NEWS}`,
          {
            params: {
              PostTypeId: ZENAI_CONSTANTS.POST_TYPES.MARKET_NEWS,
              PageIndex: pageIndex,
              PageSize: pageSize,
            },
          },
        ),
      );

      // Lưu từng tin tức vào ChromaDB
      if (data.Items && data.Items.length > 0) {
        this.logger.debug(
          `Bắt đầu lưu ${data.Items.length} tin tức vào ChromaDB...`,
        );

        const savePromises = data.Items.map(async (news) => {
          try {
            await this.chromaService.upsertMarketNews(news);
            return { newsId: news.Id, success: true };
          } catch (error) {
            this.logger.error(`Lỗi khi lưu tin tức ID ${news.Id}:`, error);
            return { newsId: news.Id, success: false, error };
          }
        });

        const results = await Promise.allSettled(savePromises);
        const successCount = results.filter(
          (result) => result.status === 'fulfilled' && result.value.success,
        ).length;

        this.logger.debug(
          `Đã lưu ${successCount}/${data.Items.length} tin tức vào ChromaDB`,
        );
      }

      return data;
    } catch (error: any) {
      this.logger.error(
        'Lỗi khi lấy tin tức thị trường:',
        error?.response?.data || error,
      );
      throw error;
    }
  }

  /**
   * Lấy kiến thức chứng khoán
   */
  async getStockKnowledge(
    pageIndex = 1,
    pageSize = 40,
  ): Promise<IPostResponse> {
    try {
      const accessToken = await this.authService.getAccessToken();

      const { data } = await firstValueFrom(
        this.httpService.get<IPostResponse>(
          `${this.baseUrl}${ZENAI_CONSTANTS.ENDPOINTS.STOCK_KNOWLEDGE}`,
          {
            params: {
              PostTypeId: ZENAI_CONSTANTS.POST_TYPES.STOCK_KNOWLEDGE,
              PageIndex: pageIndex,
              PageSize: pageSize,
            },
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      );

      //   this.logger.debug('Kiến thức chứng khoán:', data);
      return data;
    } catch (error: any) {
      this.logger.error(
        'Lỗi khi lấy kiến thức chứng khoán:',
        error?.response?.data || error,
      );
      throw error;
    }
  }

  /**
   * Lấy thông tin sản phẩm và dịch vụ
   */
  async getProductsAndServices(
    pageIndex = 1,
    pageSize = 40,
  ): Promise<IPostResponse> {
    try {
      const accessToken = await this.authService.getAccessToken();

      const { data } = await firstValueFrom(
        this.httpService.get<IPostResponse>(
          `${this.baseUrl}${ZENAI_CONSTANTS.ENDPOINTS.PRODUCTS_SERVICES}`,
          {
            params: {
              PostTypeId: ZENAI_CONSTANTS.POST_TYPES.PRODUCTS_SERVICES,
              PageIndex: pageIndex,
              PageSize: pageSize,
            },
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      );

      //   this.logger.debug('Sản phẩm và dịch vụ:', data);
      return data;
    } catch (error: any) {
      this.logger.error(
        'Lỗi khi lấy thông tin sản phẩm và dịch vụ:',
        error?.response?.data || error,
      );
      throw error;
    }
  }

  /**
   * Lấy nhận định chứng khoán
   */
  async getStockAnalysis(pageIndex = 1, pageSize = 40): Promise<IPostResponse> {
    try {
      const accessToken = await this.authService.getAccessToken();

      const { data } = await firstValueFrom(
        this.httpService.get<IPostResponse>(
          `${this.baseUrl}${ZENAI_CONSTANTS.ENDPOINTS.STOCK_ANALYSIS}`,
          {
            params: {
              PostTypeId: ZENAI_CONSTANTS.POST_TYPES.STOCK_ANALYSIS,
              PageIndex: pageIndex,
              PageSize: pageSize,
            },
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      );

      //   this.logger.debug('Nhận định chứng khoán:', data);
      return data;
    } catch (error: any) {
      this.logger.error(
        'Lỗi khi lấy nhận định chứng khoán:',
        error?.response?.data || error,
      );
      throw error;
    }
  }

  /**
   * Lấy tín hiệu khuyến nghị
   */
  async getSuggestStocks(
    pageIndex = 1,
    pageSize = 20,
  ): Promise<ISuggestStockResponse> {
    try {
      const accessToken = await this.authService.getAccessToken();

      const { data } = await firstValueFrom(
        this.httpService.get<ISuggestStockResponse>(
          `${this.baseUrl}${ZENAI_CONSTANTS.ENDPOINTS.SUGGEST_STOCKS}`,
          {
            params: {
              PageIndex: pageIndex,
              PageSize: pageSize,
            },
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      );

      //   this.logger.debug('Tín hiệu khuyến nghị:', data);
      return data;
    } catch (error: any) {
      this.logger.error(
        'Lỗi khi lấy tín hiệu khuyến nghị:',
        error?.response?.data || error,
      );
      throw error;
    }
  }

  /**
   * Lấy tín hiệu mua bán
   */
  async getBuySellSignals(
    pageIndex = 1,
    pageSize = 20,
  ): Promise<IBuySellSignalResponse> {
    try {
      const accessToken = await this.authService.getAccessToken();

      const { data } = await firstValueFrom(
        this.httpService.get<IBuySellSignalResponse>(
          `${this.baseUrl}${ZENAI_CONSTANTS.ENDPOINTS.BUY_SELL_SIGNALS}`,
          {
            params: {
              PageIndex: pageIndex,
              PageSize: pageSize,
            },
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      );

      //   this.logger.debug('Tín hiệu mua bán:', data);
      return data;
    } catch (error: any) {
      this.logger.error(
        'Lỗi khi lấy tín hiệu mua bán:',
        error?.response?.data || error,
      );
      throw error;
    }
  }

  /**
   * Lấy quan điểm các CTCK về một mã chứng khoán
   * @param stockCode Mã chứng khoán cần lấy thông tin
   */
  async getCTCKViews(
    stockCode: string,
    pageIndex = 1,
    pageSize = 5,
  ): Promise<ICTCKViewResponse> {
    try {
      const accessToken = await this.authService.getAccessToken();

      const { data } = await firstValueFrom(
        this.httpService.get<ICTCKViewResponse>(
          `${this.baseUrl}${ZENAI_CONSTANTS.ENDPOINTS.CTCK_VIEWS}`,
          {
            params: {
              CodeStock: stockCode,
              PageIndex: pageIndex,
              PageSize: pageSize,
            },
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      );

      //   this.logger.debug(`Quan điểm CTCK về mã ${stockCode}:`, data);
      return data;
    } catch (error: any) {
      this.logger.error(
        `Lỗi khi lấy quan điểm CTCK về mã ${stockCode}:`,
        error?.response?.data || error,
      );
      throw error;
    }
  }

  /**
   * Lấy chiến lược giao dịch của một mã chứng khoán
   * @param stockCode Mã chứng khoán cần lấy thông tin
   */
  async getTradingStrategies(
    stockCode: string,
    pageIndex = 1,
    pageSize = 20,
  ): Promise<ITradingStrategyResponse> {
    try {
      const accessToken = await this.authService.getAccessToken();

      const { data } = await firstValueFrom(
        this.httpService.get<ITradingStrategyResponse>(
          `${this.baseUrl}${ZENAI_CONSTANTS.ENDPOINTS.TRADING_STRATEGIES}`,
          {
            params: {
              CodeStock: stockCode,
              PageIndex: pageIndex,
              PageSize: pageSize,
            },
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      );

      //   this.logger.debug(`Chiến lược giao dịch của mã ${stockCode}:`, data);
      return data;
    } catch (error: any) {
      this.logger.error(
        `Lỗi khi lấy chiến lược giao dịch của mã ${stockCode}:`,
        error?.response?.data || error,
      );
      throw error;
    }
  }

  /**
   * Lấy toàn bộ tin tức thị trường
   * @param batchSize Số lượng tin mỗi lần call API (mặc định 40)
   * @param maxConcurrent Số lượng call API đồng thời tối đa (mặc định 5)
   * @returns Tổng hợp kết quả các lần call API
   */
  async getAllMarketNews(
    batchSize = 40,
    maxConcurrent = 5,
    fromPage = 1,
  ): Promise<{
    totalNews: number;
    successCount: number;
    failedCount: number;
    errors: Array<{ page: number; error: any }>;
  }> {
    try {
      // 1. Lấy thông tin tổng số tin tức
      const initialResponse = await this.getMarketNews(fromPage, batchSize);
      const totalRecords = initialResponse.TotalRecord;
      const totalPages = Math.ceil(totalRecords / batchSize);

      this.logger.log(
        `Bắt đầu lấy toàn bộ tin tức: ${totalRecords} tin, ${totalPages} trang`,
      );

      // 2. Tạo mảng các trang cần lấy (bỏ qua trang {fromPage} vì đã lấy)
      const pages = Array.from(
        { length: totalPages - fromPage },
        (_, i) => i + fromPage + 1,
      );
      const results = {
        totalNews: totalRecords,
        successCount: initialResponse.Items?.length || 0,
        failedCount: 0,
        errors: [] as Array<{ page: number; error: any }>,
      };

      // 3. Xử lý theo batch để không overload server
      for (let i = 0; i < pages.length; i += maxConcurrent) {
        const batch = pages.slice(i, i + maxConcurrent);
        const batchPromises = batch.map(async (pageIndex) => {
          try {
            this.logger.debug(
              `Đang lấy tin tức trang ${pageIndex}/${totalPages}`,
            );
            const response = await this.getMarketNews(pageIndex, batchSize);

            if (response.Items?.length) {
              results.successCount += response.Items.length;
            }

            return { success: true, page: pageIndex };
          } catch (error) {
            results.failedCount++;
            results.errors.push({ page: pageIndex, error });
            this.logger.error(`Lỗi khi lấy tin tức trang ${pageIndex}:`, error);
            return { success: false, page: pageIndex, error };
          }
        });

        // Chờ batch hiện tại hoàn thành
        await Promise.all(batchPromises);

        // Log tiến độ
        const progress = (((i + batch.length) / pages.length) * 100).toFixed(2);
        this.logger.log(
          `Tiến độ: ${progress}% (${results.successCount}/${totalRecords} tin)`,
        );
      }

      // 4. Tổng kết kết quả
      this.logger.log('Hoàn thành lấy toàn bộ tin tức:', {
        totalNews: results.totalNews,
        successCount: results.successCount,
        failedCount: results.failedCount,
        errorPages: results.errors.map((e) => e.page),
      });

      return results;
    } catch (error) {
      this.logger.error('Lỗi khi lấy toàn bộ tin tức:', error);
      throw new Error('Không thể lấy toàn bộ tin tức: ' + error.message);
    }
  }

  /**
   * Cập nhật nội dung tin tức thị trường với phân tích AI
   * @param updates Mảng các tin tức cần cập nhật với phân tích AI
   * @returns Kết quả cập nhật từ API
   */
  async updateMarketNewsWithAI(updates: IMarketNewsAIUpdate[]): Promise<any> {
    try {
      this.logger.log(
        `Đang cập nhật ${updates.length} tin tức với phân tích AI...`,
      );

      // Gọi API cập nhật
      const { data } = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}${ZENAI_CONSTANTS.ENDPOINTS.UPDATE_MARKET_NEWS_AI}`,
          updates,
          {
            headers: {
              Authorization: `Bearer `,
            },
          },
        ),
      );

      this.logger.log(
        `Cập nhật thành công ${updates.length} tin tức với phân tích AI`,
      );
      return data;
    } catch (error) {
      this.logger.error(
        'Lỗi khi cập nhật tin tức với phân tích AI:',
        error?.response?.data || error,
      );
      throw error;
    }
  }

  /**
   * Helper function để cập nhật một tin tức với phân tích AI
   * @param id ID của tin tức
   * @param summary Tóm tắt AI
   * @param tags Tags phân tích được
   * @returns Kết quả cập nhật từ API
   */
  async updateOneMarketNewsWithAI(
    id: number,
    summary: string,
    tags: string,
  ): Promise<any> {
    const update: IMarketNewsAIUpdate = {
      Id: id,
      AISumaryContent: summary,
      Tags: tags,
    };
    return this.updateMarketNewsWithAI([update]);
  }
}
