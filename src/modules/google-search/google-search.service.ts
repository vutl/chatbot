import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
  publishedTime?: string;
}

interface GoogleSearchResponse {
  items?: Array<{
    title: string;
    link: string;
    snippet: string;
    pagemap?: {
      metatags?: Array<{
        source?: string;
        'article:published_time'?: string;
      }>;
    };
  }>;
}

@Injectable()
export class GoogleSearchService {
  private readonly logger = new Logger(GoogleSearchService.name);
  private readonly GOOGLE_API_KEY: string;
  private readonly GOOGLE_CSE_ID: string;
  private readonly GOOGLE_API_URL =
    'https://www.googleapis.com/customsearch/v1';

  constructor(private readonly configService: ConfigService) {
    this.GOOGLE_API_KEY = this.configService.get<string>('GOOGLE_API_KEY');
    this.GOOGLE_CSE_ID = this.configService.get<string>('GOOGLE_CSE_ID');

    if (!this.GOOGLE_API_KEY || !this.GOOGLE_CSE_ID) {
      this.logger.warn('Google Search API key hoặc CSE ID chưa được cấu hình!');
    }
  }

  /**
   * Tìm kiếm thông tin từ Google Custom Search API
   * @param query Từ khóa tìm kiếm
   * @param options Tùy chọn tìm kiếm bổ sung
   * @returns Danh sách kết quả tìm kiếm
   */
  async search(
    query: string,
    options: {
      numResults?: number;
      dateRestrict?: string; // Ví dụ: 'd1' cho 1 ngày, 'w1' cho 1 tuần, 'm1' cho 1 tháng
      language?: string;
    } = {},
  ): Promise<GoogleSearchResult[]> {
    try {
      const { numResults = 5, dateRestrict, language = 'vi' } = options;

      this.logger.log(`[Google Search] Tìm kiếm: "${query}"`);

      const response = await axios.get<GoogleSearchResponse>(
        this.GOOGLE_API_URL,
        {
          params: {
            key: this.GOOGLE_API_KEY,
            cx: this.GOOGLE_CSE_ID,
            q: query,
            num: numResults,
            dateRestrict,
            lr: language ? `lang_${language}` : undefined,
            fields:
              'items(title,link,snippet,pagemap/metatags/source,pagemap/metatags/article:published_time)',
          },
        },
      );

      if (!response.data.items) {
        this.logger.warn('[Google Search] Không tìm thấy kết quả');
        return [];
      }

      const results: GoogleSearchResult[] = response.data.items.map((item) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        source:
          item.pagemap?.metatags?.[0]?.source || new URL(item.link).hostname,
        publishedTime: item.pagemap?.metatags?.[0]?.['article:published_time'],
      }));

      this.logger.log(`[Google Search] Tìm thấy ${results.length} kết quả`);
      return results;
    } catch (error) {
      this.logger.error('[Google Search] Lỗi tìm kiếm:', error);
      throw new Error(`Google Search Error: ${error.message}`);
    }
  }

  /**
   * Tìm kiếm và định dạng kết quả thành văn bản có cấu trúc
   * @param query Từ khóa tìm kiếm
   * @param options Tùy chọn tìm kiếm
   * @returns Văn bản có cấu trúc từ kết quả tìm kiếm
   */
  async searchAndFormat(
    query: string,
    options?: {
      numResults?: number;
      dateRestrict?: string;
      language?: string;
    },
  ): Promise<string> {
    const results = await this.search(query, options);

    if (results.length === 0) {
      return 'Không tìm thấy thông tin liên quan từ tìm kiếm Google.';
    }

    const formattedResults = results
      .map((result) => {
        const publishedDate = result.publishedTime
          ? new Date(result.publishedTime).toLocaleDateString('vi-VN')
          : 'Không xác định';

        return `
[Nguồn: ${result.source}, Ngày: ${publishedDate}]
${result.title}
${result.snippet}
Link: ${result.link}
`;
      })
      .join('\n---\n');

    return `
Thông tin từ Google Search:
${formattedResults}

Lưu ý: Thông tin trên được tổng hợp tự động từ các nguồn trên internet, vui lòng kiểm tra độ tin cậy của nguồn thông tin trước khi sử dụng.
`;
  }
}
