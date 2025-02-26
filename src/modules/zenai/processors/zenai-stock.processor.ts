import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ZenAIStockService } from '../services/zenai-stock.service';
import { ZenAIAuthService } from '../services/zenai-auth.service';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { ChromaService } from '../services/chroma.service';
import { ZENAI_CONSTANTS } from '../constants/zenai.constant';
import { IPost } from '../interfaces/stock.interface';
import { OpenAIService } from '../../openai/openai.service';
import { ChatRole } from '../../openai/dto/chat.dto';

@Injectable()
@Processor('zenai-stock')
export class ZenAIStockProcessor {
  private readonly logger = new Logger(ZenAIStockProcessor.name);

  constructor(
    private readonly zenAIStockService: ZenAIStockService,
    private readonly zenAIAuthService: ZenAIAuthService,
    private readonly chromaService: ChromaService,
    private readonly openAIService: OpenAIService,
  ) {}

  /**
   * Chạy mỗi 10 phút để cập nhật thông tin cổ phiếu
   * Thời gian chạy: 0:00, 0:10, 0:20, 0:30, 0:40, 0:50, ...
   * Hàm này sẽ được tự động chạy khi khởi động ứng dụng
   */
  @Cron('*/10 * * * *', {
    name: 'fetch-stock-info',
    timeZone: 'Asia/Ho_Chi_Minh', // Timezone Việt Nam
  })
  async handleFetchStockInfo() {
    this.logger.log(`⏰ Cronjob sẽ chạy mỗi 10 phút`);
    this.logger.log('Bắt đầu chu kỳ cập nhật thông tin cổ phiếu...');

    try {
      // 1. Lấy tin tức thị trường
      const marketNews = await this.zenAIStockService.getMarketNews(1, 40);
      this.logger.log(`Tin tức thị trường: ${marketNews.Items.length} tin`);

      this.handleUpdateMarketNewsWithAI(1, 5, 10);

      return;

      // 2. Lấy kiến thức chứng khoán
      const stockKnowledge = await this.zenAIStockService.getStockKnowledge();
      this.logger.log(
        `Kiến thức chứng khoán: ${stockKnowledge.TotalRecord} bài`,
      );

      // 3. Lấy sản phẩm và dịch vụ
      const productsServices =
        await this.zenAIStockService.getProductsAndServices();
      this.logger.log(
        `Sản phẩm và dịch vụ: ${productsServices.TotalRecord} mục`,
      );

      // 4. Lấy nhận định chứng khoán
      const stockAnalysis = await this.zenAIStockService.getStockAnalysis();
      this.logger.log(
        `Nhận định chứng khoán: ${stockAnalysis.TotalRecord} bài`,
      );

      // 5. Lấy tín hiệu khuyến nghị
      const suggestStocks = await this.zenAIStockService.getSuggestStocks();
      this.logger.log(`Tín hiệu khuyến nghị: ${suggestStocks.TotalRecord} mã`);

      // 6. Lấy tín hiệu mua bán
      const buySellSignals = await this.zenAIStockService.getBuySellSignals();
      this.logger.log(
        `Tín hiệu mua bán: ${buySellSignals.TotalRecord} tín hiệu`,
      );

      // Lặp qua từng mã cổ phiếu để lấy thông tin chi tiết
      const stockInfoPromises = ZENAI_CONSTANTS.STOCK_CODES.map(
        async (stockCode) => {
          try {
            // 7. Lấy thông tin cơ bản
            const stockInfo =
              await this.zenAIStockService.getStockBasicInfo(stockCode);
            this.logger.debug(`Đã cập nhật thông tin mã ${stockCode}`);

            // 8. Lấy quan điểm CTCK
            const ctckViews =
              await this.zenAIStockService.getCTCKViews(stockCode);
            this.logger.debug(
              `Quan điểm CTCK về mã ${stockCode}: ${ctckViews.TotalRecord} ý kiến`,
            );

            // 9. Lấy chiến lược giao dịch
            const tradingStrategies =
              await this.zenAIStockService.getTradingStrategies(stockCode);
            this.logger.debug(
              `Chiến lược giao dịch mã ${stockCode}: ${tradingStrategies.TotalRecord} chiến lược`,
            );

            return {
              stockCode,
              success: true,
              data: { stockInfo, ctckViews, tradingStrategies },
            };
          } catch (error) {
            this.logger.error(`Lỗi khi cập nhật mã ${stockCode}:`, error);
            return { stockCode, success: false, error };
          }
        },
      );

      // Chờ tất cả các promise hoàn thành
      const results = await Promise.allSettled(stockInfoPromises);

      // Thống kê kết quả
      const successCount = results.filter(
        (result) => result.status === 'fulfilled' && result.value.success,
      ).length;

      this.logger.log(
        `Hoàn thành chu kỳ cập nhật: ${successCount}/${ZENAI_CONSTANTS.STOCK_CODES.length} mã thành công`,
      );

      // Test ChromaDB
      //   await this.handleTestDataChroma();
    } catch (error) {
      // Nếu lỗi xảy ra trong quá trình login
      this.logger.error(
        '❌ Lỗi đăng nhập, dừng chu kỳ cập nhật hiện tại:',
        error,
      );
      return; // Dừng chu kỳ hiện tại nếu login thất bại
    }
  }

  /**
   * Test việc lưu trữ và tìm kiếm thông tin cổ phiếu trong ChromaDB
   */
  async handleTestDataChroma() {
    this.logger.log('Test ChromaDB...');
    try {
      // 1. Lưu thông tin một số mã cổ phiếu mẫu
      const stockCodes = ['VNM', 'VCB', 'VIC', 'HPG'];
      for (const code of stockCodes) {
        this.logger.debug(`Đang lưu thông tin mã ${code}...`);
        await this.zenAIStockService.getStockBasicInfo(code);
      }

      // 2. Test các câu query khác nhau
      const testQueries = [
        // Tìm kiếm theo mã cổ phiếu
        'Cho tôi thông tin về mã VNM',
        'VCB đang giao dịch ở giá bao nhiêu?',

        // Tìm kiếm theo ngành
        'Các công ty ngành thép',
        'Cổ phiếu ngành ngân hàng',

        // Tìm kiếm theo chỉ số tài chính
        'Những cổ phiếu có ROE cao',
        'Cổ phiếu có P/E thấp dưới 10',

        // Tìm kiếm theo khuyến nghị
        'Các cổ phiếu được ZenAI đánh giá tốt',
        'Cổ phiếu có xác suất tăng giá cao',

        // Tìm kiếm theo xu hướng
        'Cổ phiếu có khối lượng giao dịch lớn',
        'Những mã có tăng trưởng tốt',

        // Câu hỏi phân tích
        'Phân tích cơ bản về VIC',
        'So sánh ROE của VNM và VCB',
        'Đánh giá tiềm năng tăng giá của HPG',
      ];

      // 3. Thực hiện tìm kiếm và in kết quả
      for (const query of testQueries) {
        this.logger.debug(`\n=== Test query: "${query}" ===`);

        const results = await this.chromaService.searchStocks(query);

        this.logger.debug('Kết quả tìm kiếm:');
        results.documents?.[0]?.forEach((doc, index) => {
          const metadata = results.metadatas?.[0]?.[index];
          const distance = results.distances?.[0]?.[index];

          this.logger.debug(
            `\nĐộ tương đồng: ${(1 - (distance || 0)).toFixed(4)}`,
          );
          this.logger.debug(`Mã: ${metadata?.code}`);
          this.logger.debug(`Nội dung: ${doc.substring(0, 200)}...`);
        });
      }

      this.logger.debug('\nHoàn thành test tìm kiếm!');
    } catch (error) {
      this.logger.error('Lỗi khi test ChromaDB:', error);
      throw error;
    }
  }

  @Process('update-stock-info')
  async handleUpdateStockInfo(job: Job) {
    try {
      const { stockCode } = job.data;
      await this.zenAIStockService.getStockBasicInfo(stockCode);
      this.logger.debug(`Đã cập nhật thông tin mã ${stockCode}`);
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật thông tin cổ phiếu:`, error);
      throw error;
    }
  }

  async handleUpdateMarketNewsWithAI(fromPage = 1, toPage = 10, pageSize = 10) {
    this.logger.log(
      `Bắt đầu cập nhật tin tức thị trường với AI từ trang ${fromPage} đến trang ${toPage}...`,
    );

    // Validate input parameters
    if (fromPage < 1 || toPage < fromPage) {
      throw new Error(
        'Tham số trang không hợp lệ. fromPage phải >= 1 và toPage phải >= fromPage',
      );
    }

    // Khởi tạo biến theo dõi
    const updates = [];
    let totalProcessed = 0;
    let totalSkipped = 0;
    let totalFailed = 0;
    let totalSuccess = 0;

    try {
      // Lấy tin tức từ nhiều trang
      for (let currentPage = fromPage; currentPage <= toPage; currentPage++) {
        this.logger.log(`Đang xử lý trang ${currentPage}/${toPage}...`);

        try {
          const marketNews = await this.zenAIStockService.justGetMarketNews(
            currentPage,
            pageSize,
          );

          if (!marketNews.Status) {
            this.logger.error(
              `Lỗi khi lấy tin tức trang ${currentPage}: ${marketNews.Message}`,
            );
            continue;
          }

          this.logger.log(
            `Trang ${currentPage}: Tìm thấy ${marketNews.Items.length} tin tức`,
          );

          // Phân tích từng tin tức trong trang
          for (const news of marketNews.Items) {
            totalProcessed++;

            try {
              // Kiểm tra nếu tin đã được phân tích
              if (news.AISumaryContent && news.AISumaryContent.length > 0) {
                this.logger.debug(
                  `[${totalProcessed}] Tin tức ID ${news.Id} đã được phân tích trước đó`,
                );
                totalSkipped++;
                continue;
              }

              // Phân tích tin tức bằng AI
              const result = await this.handleUpdateOneMarketNewsWithAI(news);

              if (result) {
                updates.push({
                  Id: news.Id,
                  AISumaryContent: result.summary,
                  Tags: result.tags,
                });
                totalSuccess++;
                this.logger.debug(
                  `[${totalProcessed}] Phân tích thành công tin tức ID ${news.Id}`,
                );
              }
            } catch (error) {
              totalFailed++;
              this.logger.error(
                `[${totalProcessed}] Lỗi khi phân tích tin tức ID ${news.Id}:`,
                error,
              );
            }
          }

          // Log tiến độ sau mỗi trang
          this.logger.log(`Hoàn thành trang ${currentPage}/${toPage}:
                        - Đã xử lý: ${totalProcessed}
                        - Thành công: ${totalSuccess}
                        - Bỏ qua: ${totalSkipped}
                        - Lỗi: ${totalFailed}`);
        } catch (error) {
          this.logger.error(`Lỗi khi xử lý trang ${currentPage}:`, error);
        }
      }

      // Cập nhật tất cả tin tức đã phân tích thành công
      if (updates.length > 0) {
        try {
          await this.zenAIStockService.updateMarketNewsWithAI(updates);
          this.logger.log(
            `Đã cập nhật thành công ${updates.length} tin tức lên server`,
          );
        } catch (error) {
          this.logger.error('Lỗi khi cập nhật tin tức lên server:', error);
          throw error;
        }
      } else {
        this.logger.warn('Không có tin tức mới nào cần cập nhật');
      }

      // Log tổng kết
      return {
        totalProcessed,
        totalSuccess,
        totalSkipped,
        totalFailed,
        updatedToServer: updates.length,
      };
    } catch (error) {
      this.logger.error('Lỗi nghiêm trọng trong quá trình xử lý:', error);
      throw error;
    }
  }

  async handleUpdateOneMarketNewsWithAI(news: IPost) {
    this.logger.log(`Đang cập nhật tin tức thị trường Title : ${news.Title}`);

    // Tạo prompt cho OpenAI
    const prompt = `Phân tích tin tức thị trường sau:

Tiêu đề: ${news.Title}
Mô tả ngắn: ${news.ShortContent}
Mô tả: ${news.Description}
Nội dung: ${news.Content}

Yêu cầu:
1. Tóm tắt tin tức một cách ngắn gọn, xúc tích trong khoảng 300 từ. Nếu nội dung quá ngắn thì hãy đổi mới 1 chút để tạo khác biệt. 
2. Đánh giá tín hiệu của tin tức trên thang điểm 5, chỉ trả về số, trong đó:
   - 5: Rất tích cực
   - 4: Tích cực
   - 3: Trung lập
   - 2: Tiêu cực
   - 1: Rất tiêu cực
3. Liệt kê các từ khóa (tags) chính của bài viết.

Trả về kết quả theo định dạng JSON với cấu trúc ví dụ:
{
  "summary": "Tóm tắt tin tức...",
  "sentiment": 1,
  "tags": "tag1, tag2, tag3"
}`;

    try {
      // Gọi OpenAI API để phân tích bằng hàm justChat
      const response = await this.openAIService.justChat(prompt);

      // Loại bỏ các ký tự markdown và whitespace thừa
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();

      // Tìm và trích xuất JSON từ response string
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Không tìm thấy JSON trong câu trả lời');
      }

      // Parse JSON string thành object
      const result = JSON.parse(jsonMatch[0]);

      // Kiểm tra tính hợp lệ của dữ liệu
      if (
        !result.summary ||
        typeof result.sentiment !== 'number' ||
        typeof result.tags !== 'string'
      ) {
        throw new Error(
          'Kết quả phân tích thiếu thông tin bắt buộc hoặc sai định dạng',
        );
      }

      // Chuyển đổi tags string thành array
      const tags = result.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      // Log kết quả phân tích
      // this.logger.log('=== KẾT QUẢ PHÂN TÍCH TIN TỨC ===');
      // this.logger.log('1. TÓM TẮT:');
      // this.logger.log(result.summary);
      // this.logger.log('\n2. ĐÁNH GIÁ TÍN HIỆU:');
      // this.logger.log(`${result.sentiment}/5 điểm`);
      // this.logger.log('\n3. TỪ KHÓA:');
      // this.logger.log(result.tags);
      // this.logger.log('================================');

      // Trả về kết quả đã parse và chuẩn hóa
      return {
        summary: result.summary,
        sentiment: result.sentiment,
        tags: result.tags,
      };
    } catch (error) {
      this.logger.error('Lỗi khi phân tích tin tức:', error);
      // Trả về null nếu có lỗi
      return null;
    }
  }

  /**
   * Chạy khi khởi động ứng dụng để lấy dữ liệu ban đầu
   */
  async onApplicationBootstrap() {
    this.logger.log('Khởi tạo dữ liệu ban đầu...');
    /* Thực hiện crawl thông tin tất cả cổ phiếu hay không */
    const isCrawlStockInfo = false;
    /* Thực hiện crawl tất cả tin tức thị trường hay không */
    const isCrawlMarketNews = false;
    /* Thực hiện cronjob hay không */
    const isStartCrawlMarketNews = true;
    /* Thực hiện cập nhật tin tức thị trường với AI hay không */
    const isUpdateMarketNewsWithAI = false;

    if (isCrawlStockInfo) {
      // Lặp qua từng mã cổ phiếu để lấy thông tin chi tiết
      let i = 0;
      ZENAI_CONSTANTS.STOCK_CODES.map(async (stockCode) => {
        try {
          /*  Đợi 1s mới thực hiện tiếp */
          await new Promise((resolve) => setTimeout(resolve, 1000));
          i++;
          // 7. Lấy thông tin cơ bản
          this.logger.debug(`Đã bắt đầu cập nhật thông tin mã ${stockCode}`);
          this.zenAIStockService.getStockBasicInfo(stockCode);
        } catch (error) {
          this.logger.error(`Lỗi khi cập nhật mã ${stockCode}:`, error);
        }
      });
    }

    if (isCrawlMarketNews) {
      this.logger.log('Bắt đầu crawl tin tức thị trường...');
      this.zenAIStockService.getAllMarketNews(40, 5, 160);
    }

    if (isStartCrawlMarketNews) {
      this.handleFetchStockInfo();
    }

    if (isUpdateMarketNewsWithAI) {
      this.handleUpdateMarketNewsWithAI();
    }
  }
}
