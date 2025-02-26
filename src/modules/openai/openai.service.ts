import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat';
import {
  ChatMessageDto,
  ChatRequestDto,
  ChatResponseDto,
  ChatResponseDtoForMarketNewsAnalysisWithAI,
  ChatRole,
} from './dto/chat.dto';
import { ChromaService, SearchResult } from '../vector-store/chroma.service';
import { GoogleSearchService } from '../google-search/google-search.service';
import { v4 as uuidv4 } from 'uuid';
import { ZENAI_CONSTANTS } from '../zenai/constants/zenai.constant';
interface ExtendedSearchResult extends SearchResult {
  combinedScore: number;
  sparseScore: number;
}
interface ExtendedQueryResultAndSuggesstion {
  suggestionQuery: string[];
  extendedSearchResult: ExtendedSearchResult[];
}

/**
 * OpenAIService nâng cấp:
 * - Advanced query expansion (semantic-based) qua OpenAI completions.
 * - Hybrid retrieval: kết hợp dense (ChromaDB) và sparse (keyword overlap).
 * - Dynamic similarity threshold dựa trên phân phối dense similarity.
 * - Reranking bằng thuật toán MMR (trong demo, dùng combinedScore để xếp hạng).
 * - Caching embeddings để tiết kiệm chi phí API.
 */
@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly enableGoogleSearch = false;
  private readonly openai: OpenAI;
  private readonly OPENAI_MODEL = 'gpt-4-0125-preview';
  // private readonly OPENAI_MODEL = 'gpt-3.5-turbo';
  private readonly MAX_CONTEXT_LENGTH = 4000;
  // Mặc định threshold dense retrieval (sẽ được điều chỉnh theo dynamicThreshold)
  private readonly SIMILARITY_THRESHOLD_DEFAULT = 0.65;
  private readonly chatSessions = new Map<string, ChatMessageDto[]>();
  private embeddingCache = new Map<string, number[]>();

  private readonly defaultSystemPromtForMarketNews = `Hãy đóng vai 1 chuyên gia 20 năm kinh nghiệm trong lĩnh vực tài chính, chứng khoán, viết tin tức. Có kĩ năng đọc hiểu, phân tích tin tức chứng khoán, thị trường, tài chính.`;
  private readonly defaultSystemPrompt = `# ZenAI - Trợ lý Tài chính & Chứng khoán Thông minh

## Định vị & Vai trò
Bạn là ZenAI - trợ lý tài chính thông minh hàng đầu Việt Nam, được phát triển bởi ZenAI Corporation. Bạn kết hợp kiến thức chuyên sâu về tài chính, chứng khoán với khả năng phân tích dữ liệu tiên tiến để cung cấp thông tin chính xác, cá nhân hóa và có giá trị cho người dùng.

## Chuyên môn & Năng lực
- **Chuyên gia tài chính**: Nắm vững kiến thức về thị trường chứng khoán Việt Nam và quốc tế, phân tích kỹ thuật, phân tích cơ bản, và các chiến lược đầu tư.
- **Phân tích dữ liệu**: Khả năng xử lý và phân tích dữ liệu tài chính phức tạp, nhận diện xu hướng và cung cấp thông tin chi tiết.
- **Tư vấn cá nhân hóa**: Đưa ra lời khuyên phù hợp với mục tiêu tài chính, khẩu vị rủi ro và tình hình thị trường hiện tại.
- **Cập nhật liên tục**: Luôn nắm bắt thông tin mới nhất về thị trường, tin tức doanh nghiệp và các sự kiện kinh tế quan trọng.
- **Hỗ trợ đa lĩnh vực**: Ngoài tài chính, có thể hỗ trợ người dùng với các câu hỏi về cuộc sống hàng ngày, kiến thức chung và thông tin về ZenAI.

## Nhiệm vụ Chính
1. **Phân tích & Dự báo Thị trường**
   - Phân tích xu hướng thị trường chứng khoán Việt Nam và quốc tế
   - Đánh giá biến động giá cổ phiếu và các chỉ số tài chính quan trọng
   - Cung cấp phân tích kỹ thuật và cơ bản dựa trên dữ liệu thực tế

2. **Tư vấn Đầu tư Cá nhân hóa**
   - Đề xuất chiến lược đầu tư phù hợp với mục tiêu và khẩu vị rủi ro của người dùng
   - So sánh các lựa chọn đầu tư và đưa ra khuyến nghị cụ thể
   - Hỗ trợ xây dựng và quản lý danh mục đầu tư hiệu quả

3. **Cung cấp Thông tin Thị trường**
   - Cập nhật tin tức mới nhất về thị trường chứng khoán và kinh tế
   - Theo dõi và báo cáo về các sự kiện quan trọng ảnh hưởng đến thị trường
   - Cung cấp dữ liệu về giá cổ phiếu, khối lượng giao dịch và các chỉ số tài chính

4. **Giáo dục Tài chính**
   - Giải thích các khái niệm tài chính và đầu tư phức tạp bằng ngôn ngữ dễ hiểu
   - Cung cấp kiến thức cơ bản về chứng khoán, tài chính cá nhân và quản lý tài sản
   - Chia sẻ các bài học và kinh nghiệm từ các nhà đầu tư thành công

5. **Hỗ trợ Thông tin về ZenAI**
   - Giới thiệu về ZenAI Corporation, sản phẩm và dịch vụ
   - Hướng dẫn sử dụng các tính năng của ZenAI
   - Giải đáp thắc mắc về chính sách, điều khoản và cách thức hoạt động

## Nguyên tắc Tương tác
1. **Ưu tiên Context**: Luôn phân tích kỹ thông tin từ context được cung cấp trước khi trả lời, đảm bảo phản hồi chính xác và phù hợp với dữ liệu thực tế.

2. **Cá nhân hóa**: Điều chỉnh phản hồi dựa trên nhu cầu, kiến thức và mối quan tâm cụ thể của người dùng.

3. **Chuyên nghiệp & Thân thiện**: Duy trì giọng điệu chuyên nghiệp nhưng thân thiện, sử dụng ngôn ngữ rõ ràng, dễ hiểu và tự tin.

4. **Trung thực & Minh bạch**: Chỉ cung cấp thông tin chính xác, thừa nhận khi không chắc chắn, và không đưa ra lời khuyên quá chắc chắn về kết quả đầu tư.

5. **Bảo mật & Riêng tư**: Tôn trọng thông tin cá nhân của người dùng và không tiết lộ thông tin nội bộ về cách thức hoạt động.

## Định dạng Phản hồi
1. **Cấu trúc rõ ràng**:
   - Bắt đầu bằng tóm tắt ngắn gọn về vấn đề chính
   - Phân chia nội dung thành các phần logic với tiêu đề rõ ràng
   - Sử dụng bullet points để liệt kê thông tin quan trọng
   - Kết thúc bằng kết luận hoặc khuyến nghị cụ thể và Hỏi Người dùng muốn biết thêm gì không, ZenAI có thể giúp đỡ. 

2. **Trình bày trực quan**:
   - Sử dụng emoji phù hợp để tăng tính trực quan (📊 📈 💹 💰 📉 🔍 💡)
   - Định dạng văn bản (in đậm, in nghiêng) để nhấn mạnh điểm quan trọng
   - Sử dụng bảng khi cần so sánh nhiều thông tin

3. **Ngôn ngữ tối ưu**:
   - Sử dụng thuật ngữ tài chính chính xác nhưng giải thích khi cần thiết
   - Tránh ngôn ngữ mơ hồ, chung chung hoặc quá kỹ thuật khi không cần thiết
   - Ưu tiên ngôn ngữ tích cực, khách quan và có tính xây dựng

## Loại câu hỏi và cách phản hồi
1. **Thông tin mã chứng khoán**: Cung cấp giá hiện tại, biến động, khối lượng giao dịch, các chỉ số quan trọng (P/E, P/B, ROE), và nhận định ngắn về xu hướng kỹ thuật.

2. **Phân tích mã chứng khoán**: Đưa ra phân tích toàn diện bao gồm phân tích cơ bản (báo cáo tài chính, dòng tiền, cấu trúc tài sản), phân tích kỹ thuật (xu hướng, hỗ trợ/kháng cự, chỉ báo), yếu tố vĩ mô tác động, và rủi ro cần lưu ý.

3. **Tư vấn đầu tư**: Phân tích cơ hội đầu tư theo ngành, đánh giá điểm mạnh/yếu, rủi ro, và đề xuất các mã tiêu biểu, kèm theo lời khuyên về đa dạng hóa danh mục và quản lý rủi ro.

4. **Thông tin về ZenAI**: Giới thiệu về công ty, sản phẩm và dịch vụ, giá trị cốt lõi, và thông tin liên hệ.

5. **Câu hỏi về cuộc sống và tài chính cá nhân**: Cung cấp hướng dẫn thực tế, nguyên tắc cốt lõi, và công cụ hỗ trợ.

## Lưu ý quan trọng
- Luôn ưu tiên sử dụng thông tin từ context được cung cấp
- Thừa nhận khi không có đủ thông tin và tránh đưa ra dự đoán không có cơ sở
- Không đưa ra lời khuyên đầu tư cụ thể mà không có disclaimer về rủi ro
- Tập trung vào việc cung cấp thông tin, phân tích và giáo dục tài chính
- Luôn cập nhật và điều chỉnh phản hồi dựa trên phản hồi của người dùng

Hãy nhớ rằng mục tiêu cuối cùng của bạn là giúp người dùng đưa ra quyết định tài chính thông minh hơn thông qua việc cung cấp thông tin chính xác, phân tích sâu sắc và hướng dẫn rõ ràng.`;

  constructor(
    private readonly configService: ConfigService,
    private readonly chromaService: ChromaService,
    private readonly googleSearchService: GoogleSearchService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  // ====================================================
  // 1. Advanced Embedding với Caching
  // ====================================================
  async createEmbedding(text: string): Promise<number[]> {
    const key = text.trim();
    if (this.embeddingCache.has(key)) {
      return this.embeddingCache.get(key);
    }
    try {
      const response = await this.openai.embeddings.create({
        model: ZENAI_CONSTANTS.EMBEDDING.MODEL_NAME,
        input: text,
      });
      const embedding = response.data[0].embedding;
      this.embeddingCache.set(key, embedding);
      return embedding;
    } catch (error) {
      this.logger.error('Error creating embedding:', error);
      throw error;
    }
  }

  // ====================================================
  // 2. Advanced Preprocessing & Query Expansion
  // ====================================================
  private preprocessQuery(query: string): string {
    return query.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  /**
   * Mở rộng truy vấn bằng cách gọi OpenAI để tạo ra nhiều phiên bản truy vấn.
   * Trả về mảng các biến thể của query.
   */
  async expandQuery(
    query: string,
    amount: number = 3,
  ): Promise<{
    expandedQueries: string[];
    weightCollection: Record<string, number>;
    shouldRagStock: number;
  }> {
    const preprocessed = this.preprocessQuery(query);
    // Xóa biến prompt cũ không sử dụng
    const prompt = `
    # Nhiệm vụ: Mở rộng truy vấn và phân bổ trọng số collection

    ## Bối cảnh
    Bạn là trợ lý AI chuyên về tài chính và chứng khoán, giúp tối ưu hóa việc truy xuất thông tin từ cơ sở dữ liệu. Người dùng đã đặt câu hỏi: "${preprocessed}".

    ## Yêu cầu
    1. Tạo ${amount} biến thể truy vấn để tối ưu việc truy xuất thông tin, trong đó:
       - Biến thể đầu tiên PHẢI sát với câu hỏi gốc nhất, giữ nguyên ý nghĩa và từ khóa quan trọng
       - Các biến thể còn lại là câu hỏi đề xuất tiếp theo, mở rộng chủ đề
       - Đảm bảo các biến thể đa dạng về cách diễn đạt và góc nhìn

    2. Phân tích và đánh giá trọng số (0.0 đến 1.0) cho mỗi collection dựa trên mức độ liên quan:
       - Trọng số cao (0.8-1.0): Collection chứa thông tin trực tiếp trả lời câu hỏi
       - Trọng số trung bình (0.4-0.7): Collection có thông tin bổ sung hữu ích
       - Trọng số thấp (0.1-0.3): Collection ít liên quan nhưng có thể có thông tin phụ
    3. Kiểm tra câu hỏi này có tý nào liên quan tới tin tức thị trường, chứng khoán, cổ phiếu, tài chính, công ty ZenAI hay không. Trả về shouldRagStock là đánh giá từ 1 tới 10, trong đó 10 là mức độ liên quan lớn nhất. VD : User hỏi "ngày mai có mưa không" thì trả về kết quả 2.

    ## Thông tin về các collection
    1. ${ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.STOCK_KNOWLEDGE}: Dữ liệu về ZenAI, chính sách dịch vụ, tài liệu chứng khoán, báo cáo phân tích chuyên sâu, báo cáo tài chính doanh nghiệp, kiến thức đầu tư cơ bản.
    
    2. ${ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.MARKET_NEWS}: Tin tức thị trường mới nhất, bài viết phân tích, sự kiện kinh tế, số liệu vĩ mô, biến động thị trường, tin tức doanh nghiệp, thông tin ngành.
    
    3. ${ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.STOCK_INFO}: Thông tin chi tiết về mã chứng khoán, giá hiện tại, khối lượng giao dịch, chỉ số tài chính, biểu đồ kỹ thuật, dữ liệu lịch sử giao dịch.

    ## Hướng dẫn phân tích
    - Nếu câu hỏi về giá cổ phiếu hiện tại hoặc dữ liệu giao dịch → ưu tiên STOCK_INFO cao nhất
    - Nếu câu hỏi về tin tức, sự kiện gần đây → ưu tiên MARKET_NEWS cao nhất
    - Nếu câu hỏi về kiến thức đầu tư, phân tích cơ bản → ưu tiên STOCK_KNOWLEDGE cao nhất
    - Nếu câu hỏi về phân tích kỹ thuật → kết hợp STOCK_INFO và STOCK_KNOWLEDGE
    - Nếu câu hỏi về dự báo, triển vọng → kết hợp cả ba collection với trọng số phù hợp

    ## Format phản hồi
    Trả về duy nhất một đối tượng JSON với cấu trúc sau (không thêm bất kỳ văn bản nào khác):
    {
      "expandedQueries": [
        "Biến thể 1 - sát với câu hỏi gốc",
        "Biến thể 2 - câu hỏi đề xuất tiếp theo",
        "Biến thể 3 - câu hỏi đề xuất tiếp theo"
      ],
      "weightCollection": {
        "${ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.STOCK_INFO}": 0.X,
        "${ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.MARKET_NEWS}": 0.Y,
        "${ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.STOCK_KNOWLEDGE}": 0.Z
      },
      "shouldRagStock": 10
    }

    ## Ví dụ
    Nếu câu hỏi là "Giá HPG", phản hồi có thể là:
    {
      "expandedQueries": [
        "Giá cổ phiếu HPG mới nhất là bao nhiêu?",
        "Phân tích kỹ thuật mã HPG trong tuần qua",
        "Tin tức mới nhất ảnh hưởng đến giá cổ phiếu HPG"
      ],
      "weightCollection": {
        "${ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.STOCK_INFO}": 1.0,
        "${ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.MARKET_NEWS}": 0.6,
        "${ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.STOCK_KNOWLEDGE}": 0.3
      },
      "shouldRagStock": 10
    }
    `;

    try {
      // Dùng chat endpoint
      const response = await this.openai.chat.completions.create({
        model: this.OPENAI_MODEL,
        temperature: 0.7,
        max_tokens: 500, // Tăng max_tokens để đảm bảo nhận đủ JSON response
        messages: [
          { role: 'user', content: prompt },
        ],
      });

      // Lấy text từ ChatCompletion
      const text = response.choices[0]?.message?.content || '';
      this.logger.log(`response expandQuery => ${text}`);

      // Xử lý JSON từ response
      try {
        // Tìm và trích xuất phần JSON từ response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          const parsedData = JSON.parse(jsonStr) as {
            expandedQueries: string[];
            weightCollection: Record<string, number>;
            shouldRagStock?: number;
          };

          // Kiểm tra cấu trúc dữ liệu
          if (
            parsedData.expandedQueries &&
            Array.isArray(parsedData.expandedQueries) &&
            parsedData.weightCollection &&
            typeof parsedData.weightCollection === 'object'
          ) {
            this.logger.log(
              `expandQuery => Queries: [${parsedData.expandedQueries.join(', ')}]`,
            );
            this.logger.log(
              `expandQuery => Weights: ${JSON.stringify(parsedData.weightCollection)}`,
            );
            this.logger.log(
              `expandQuery => shouldRagStock: ${parsedData.shouldRagStock || 'không xác định'}`,
            );

            return {
              expandedQueries: parsedData.expandedQueries,
              weightCollection: parsedData.weightCollection,
              shouldRagStock: parsedData.shouldRagStock || 10, // Mặc định là 10 nếu không có
            };
          }
        }

        // Fallback nếu không parse được JSON hoặc cấu trúc không đúng
        this.logger.warn(
          'Không thể parse JSON từ response OpenAI, sử dụng giá trị mặc định',
        );
        return {
          expandedQueries: [preprocessed],
          weightCollection: {
            [ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.STOCK_KNOWLEDGE]: 0.33,
            [ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.MARKET_NEWS]: 0.33,
            [ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.STOCK_INFO]: 0.33,
          },
          shouldRagStock: 10, // Mặc định là 10 nếu không parse được
        };
      } catch (parseError) {
        this.logger.error('Lỗi khi parse JSON từ response:', parseError);
        return {
          expandedQueries: [preprocessed],
          weightCollection: {
            [ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.STOCK_KNOWLEDGE]: 0.33,
            [ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.MARKET_NEWS]: 0.33,
            [ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.STOCK_INFO]: 0.33,
          },
          shouldRagStock: 10, // Mặc định là 10 nếu có lỗi
        };
      }
    } catch (error) {
      this.logger.error(
        'Lỗi trong quá trình mở rộng truy vấn (chat model):',
        error,
      );
      return {
        expandedQueries: [preprocessed],
        weightCollection: {
          [ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.STOCK_KNOWLEDGE]: 0.33,
          [ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.MARKET_NEWS]: 0.33,
          [ZENAI_CONSTANTS.CHROMA_COLLECTION_NAMES.STOCK_INFO]: 0.33,
        },
        shouldRagStock: 10, // Mặc định là 10 nếu có lỗi
      };
    }
  }

  // ====================================================
  // 3. Hybrid Retrieval: Dense + Sparse & Dynamic Threshold
  // ====================================================
  private computeSparseScore(query: string, document: string): number {
    const qTokens = query.split(/\W+/).filter(Boolean);
    const dTokens = document.split(/\W+/).filter(Boolean);
    if (qTokens.length === 0) return 0;
    let matchCount = 0;
    for (const token of qTokens) {
      if (dTokens.includes(token)) {
        matchCount++;
      }
    }
    return matchCount / qTokens.length;
  }

  private dynamicSimilarityThreshold(similarities: number[]): number {
    if (similarities.length === 0) return this.SIMILARITY_THRESHOLD_DEFAULT;
    const sum = similarities.reduce((a, b) => a + b, 0);
    const avg = sum / similarities.length;
    const max = Math.max(...similarities);
    return avg + 0.25 * (max - avg);
  }

  /**
   * Tính toán ngưỡng tương tự động với khả năng giảm ngưỡng khi cần thiết
   * @param similarities Mảng các giá trị tương tự
   * @param minResults Số lượng kết quả tối thiểu cần đạt được
   * @param results Mảng kết quả để kiểm tra
   * @returns Ngưỡng tương tự đã điều chỉnh
   */
  private adaptiveThreshold(
    similarities: number[],
    minResults: number,
    results: ExtendedSearchResult[],
  ): number {
    // Tính ngưỡng ban đầu
    let threshold = this.dynamicSimilarityThreshold(similarities);

    // Nếu không có đủ kết quả vượt qua ngưỡng, giảm dần ngưỡng
    if (results.filter(r => r.combinedScore >= threshold).length < minResults) {
      // Sắp xếp kết quả theo điểm giảm dần
      const sorted = [...results].sort((a, b) => b.combinedScore - a.combinedScore);

      // Nếu có đủ kết quả, lấy ngưỡng từ kết quả thứ minResults
      if (sorted.length >= minResults) {
        // Giảm ngưỡng xuống bằng điểm của kết quả thứ minResults - 0.01
        threshold = Math.max(0.5, sorted[Math.min(minResults - 1, sorted.length - 1)].combinedScore - 0.01);
      } else if (sorted.length > 0) {
        // Nếu không đủ kết quả, lấy ngưỡng từ kết quả cuối cùng
        threshold = Math.max(0.5, sorted[sorted.length - 1].combinedScore - 0.01);
      }
    }

    this.logger.log(`[RAG] Ngưỡng tương tự sau điều chỉnh: ${threshold.toFixed(3)}`);
    return threshold;
  }

  async hybridRetrieval(
    originalQuery: string,
    k = 5,
  ): Promise<ExtendedQueryResultAndSuggesstion> {
    const preprocessedQuery = this.preprocessQuery(originalQuery);
    const queryResult = await this.expandQuery(preprocessedQuery, 3);

    // Kiểm tra mức độ liên quan đến chứng khoán
    if (queryResult.shouldRagStock < 5) {
      this.logger.log(`[RAG] Câu hỏi không liên quan đến chứng khoán (shouldRagStock = ${queryResult.shouldRagStock}), bỏ qua truy vấn collection`);
      return {
        suggestionQuery: ["Tin tức thị trường mới nhất"],
        extendedSearchResult: [],
      }; // Trả về mảng rỗng, không truy vấn collection nào
    }

    // Lấy biến thể đầu tiên và câu hỏi gốc để tìm kiếm
    const suggestionQuery: string[] = [];
    const queryVariants: string[] = [];
    if (queryResult.expandedQueries.length > 0) {
      for (let i = 0; i < queryResult.expandedQueries.length; i++) {
        if (i == 0) {
          // Thêm biến thể đầu tiên (sát với câu hỏi gốc nhất)
          queryVariants.push(queryResult.expandedQueries[0]);
        } else {
          // Thêm các phần tử thứ 2 trở đi làm câu hỏi gợi ý
          suggestionQuery.push(queryResult.expandedQueries[i]);
        }
      }

    }
    // Thêm câu hỏi gốc
    queryVariants.push(preprocessedQuery);

    // Lấy trọng số collection
    const collectionWeights = queryResult.weightCollection;
    this.logger.log(
      `[RAG] Trọng số collection: ${JSON.stringify(collectionWeights)}`,
    );

    /* Tìm kiếm tương tự trên tất cả các collection trong ChromaDB */
    let allResults: SearchResult[] = [];
    for (const variant of queryVariants) {
      this.logger.log(`[RAG] Tạo embedding cho truy vấn: ${variant}`);
      const variantEmbedding = await this.createEmbedding(variant);

      // Tìm kiếm trong các collection với trọng số tương ứng
      const denseResults = await this.chromaService.similaritySearch(
        variantEmbedding,
        k,
        collectionWeights,
      );
      allResults = allResults.concat(denseResults);
    }

    this.logger.log(`[RAG] Kết quả tìm kiếm (${allResults.length}): ${JSON.stringify(allResults)}`);

    /* Loại bỏ các kết quả trùng lặp */
    const unique = new Map<string, SearchResult>();
    for (const res of allResults) {
      const id = res.metadata?.id || res.content;
      if (!unique.has(id)) {
        unique.set(id, res);
      }
    }
    const uniqueResults = Array.from(unique.values());

    /* Tính điểm sparse (keyword matching) cho mỗi kết quả */
    const resultsWithSparse = uniqueResults.map((r) => ({
      ...r,
      sparseScore: this.computeSparseScore(preprocessedQuery, r.content),
    })) as ExtendedSearchResult[];

    /* Tính điểm dense (similarity) cho mỗi kết quả */
    const denseSims = resultsWithSparse.map((r) => r.similarity);
    const dynThreshold = this.adaptiveThreshold(denseSims, k, resultsWithSparse);
    this.logger.log(`[RAG] Dynamic threshold: ${dynThreshold.toFixed(3)}`);
    const alpha = 0.7,
      beta = 0.3;

    /* Tính điểm kết hợp (combined score) cho mỗi kết quả */
    const scoredResults = resultsWithSparse.map((r) => ({
      ...r,
      combinedScore: alpha * r.similarity + beta * r.sparseScore,
    })) as ExtendedSearchResult[];

    /* Phân loại kết quả theo độ ưu tiên */
    const highPriorityResults = scoredResults.filter(
      (r) => r.metadata?.priority === 'CAO' || (r.metadata?.weight && r.metadata.weight >= 0.7)
    );

    const otherResults = scoredResults.filter(
      (r) => r.metadata?.priority !== 'CAO' && (!r.metadata?.weight || r.metadata.weight < 0.7)
    );

    /* Lọc kết quả thường dựa trên điểm kết hợp và ngưỡng dynamic threshold */
    const filteredOtherResults = otherResults.filter(
      (r) => r.combinedScore >= dynThreshold,
    );

    /* Kết hợp kết quả ưu tiên cao (luôn giữ lại) với kết quả đã lọc */
    const combinedResults = [...highPriorityResults, ...filteredOtherResults];

    /* Nếu không có kết quả nào, giữ lại ít nhất top 2 kết quả có điểm cao nhất */
    const filtered = combinedResults.length > 0
      ? combinedResults
      : scoredResults.sort((a, b) => b.combinedScore - a.combinedScore).slice(0, 2);

    this.logger.log(`[RAG] Số kết quả sau khi lọc: ${filtered.length} (Ưu tiên cao: ${highPriorityResults.length}, Khác: ${filteredOtherResults.length})`);

    /* Reranking kết quả dựa trên MMR */
    const reranked = this.rerankMMR(filtered, preprocessedQuery, k, 0.5);
    return {
      suggestionQuery: suggestionQuery,
      extendedSearchResult: reranked,
    };
  }

  // ====================================================
  // 4. Reranking (MMR)
  // ====================================================
  private rerankMMR(
    docs: ExtendedSearchResult[],
    query: string,
    topK: number,
    lambda: number,
  ): ExtendedSearchResult[] {
    // Phân loại kết quả theo độ ưu tiên
    const highPriorityResults = docs.filter(
      (r) => r.metadata?.priority === 'CAO' || (r.metadata?.weight && r.metadata.weight >= 0.7)
    );

    const otherResults = docs.filter(
      (r) => r.metadata?.priority !== 'CAO' && (!r.metadata?.weight || r.metadata.weight < 0.7)
    );

    // Sắp xếp mỗi nhóm theo điểm kết hợp
    const sortedHighPriority = highPriorityResults.sort((a, b) => b.combinedScore - a.combinedScore);
    const sortedOther = otherResults.sort((a, b) => b.combinedScore - a.combinedScore);

    // Ưu tiên kết quả có độ ưu tiên cao trước
    const reranked = [...sortedHighPriority, ...sortedOther];

    // Giới hạn số lượng kết quả trả về
    return reranked.slice(0, topK);
  }

  // ====================================================
  // 5. Google Search
  // ====================================================
  private shouldSearchGoogle(query: string): boolean {
    const keywords = [
      'mới nhất',
      'gần đây',
      'hiện tại',
      'tin tức',
      'hôm nay',
      'tuần này',
      'tháng này',
      'năm nay',
      'thị trường',
      'cổ phiếu',
      'chứng khoán',
      'công ty',
      'doanh nghiệp',
    ];
    const lowerQuery = query.toLowerCase();
    const hasStockCode = /\b[A-Z]{3}\b/.test(query);
    return (
      hasStockCode || keywords.some((keyword) => lowerQuery.includes(keyword))
    );
  }

  private optimizeSearchQuery(query: string): string {
    const words = query.toLowerCase().split(' ');
    const stockCode = query.match(/\b[A-Z]{3}\b/)?.[0];
    const excludeWords = [
      'là',
      'và',
      'hay',
      'hoặc',
      'như thế nào',
      'ra sao',
      'thế nào',
    ];
    const keywords = words.filter((word) => !excludeWords.includes(word));
    let searchQuery = keywords.join(' ');
    if (stockCode) {
      searchQuery = `${stockCode} ${searchQuery} tin tức mới nhất`;
    }
    return searchQuery;
  }

  // ====================================================
  // 6. Context Retrieval & Chat Integration
  // ====================================================
  private async findRelevantContext(query: string): Promise<{ context: string, suggestionQuery: string[] }> {
    this.logger.log(`[RAG] Tìm context cho query: "${query}"`);
    const results = await this.hybridRetrieval(query, 5);
    if (!results || results.extendedSearchResult.length === 0) {
      // Kiểm tra nếu kết quả rỗng do câu hỏi không liên quan đến chứng khoán
      this.logger.log(`[RAG] Không tìm thấy thông tin liên quan hoặc câu hỏi không liên quan đến chứng khoán.`);
      return {
        context: 'Không tìm thấy thông tin liên quan trong cơ sở dữ liệu chứng khoán. Câu hỏi có thể không liên quan đến lĩnh vực tài chính, chứng khoán hoặc ZenAI.',
        suggestionQuery: results.suggestionQuery,
      };
    }

    this.logger.log(`[RAG] Tìm thấy ${results.extendedSearchResult.length} kết quả liên quan.`);

    const contextParts = results.extendedSearchResult.map((r, index) => {
      const src = r.metadata?.source || 'unknown';
      const chunk = r.metadata?.chunk;
      const sim = Math.round(r.combinedScore * 100);
      const priority = r.metadata?.priority || 'KHÔNG XÁC ĐỊNH';
      const weight = r.metadata?.weight ? `(${r.metadata.weight.toFixed(2)})` : '';
      const collection = r.metadata?.collection_name || 'unknown';
      const isHighPriority = priority === 'CAO' || (r.metadata?.weight && r.metadata.weight >= 0.7);
      const priorityNote = isHighPriority ? ' [Giữ lại do độ ưu tiên cao]' : '';

      return `[#${index + 1}] [Nguồn: ${src}, Collection: ${collection}, Độ ưu tiên: ${priority}${weight}${priorityNote}, Chunk: ${chunk}, Similarity: ${sim}%] ${r.content}`;
    });

    return {
      context: contextParts.join('\n\n'),
      suggestionQuery: results.suggestionQuery,
    };
  }

  createNewSession(): string {
    const sessionId = uuidv4();
    const systemMsg: ChatMessageDto = {
      role: ChatRole.SYSTEM,
      content: this.defaultSystemPrompt,
      timestamp: new Date(),
    };
    this.chatSessions.set(sessionId, [systemMsg]);
    return sessionId;
  }

  async updateSystemPrompt(
    sessionId: string,
    customPrompt?: string,
  ): Promise<void> {
    this.logger.log(`[RAG] Cập nhật system prompt cho session: ${sessionId}`);
    const session = this.chatSessions.get(sessionId);
    if (session) {
      const newPrompt = customPrompt || this.defaultSystemPrompt;
      session[0] = {
        role: ChatRole.SYSTEM,
        content: newPrompt,
        timestamp: new Date(),
      };
      this.chatSessions.set(sessionId, session);
      this.logger.log('[RAG] System prompt cập nhật thành công');
    } else {
      this.logger.warn('[RAG] Không tìm thấy session để cập nhật prompt');
    }
  }

  /**
   * Chat với OpenAI mà chỉ cần prompt, gọi trực tiếp tới OpenAI API
   * @param prompt Câu hỏi hoặc yêu cầu gửi tới OpenAI
   * @returns ChatResponseDto chứa câu trả lời từ OpenAI
   */
  async justChat(prompt: string): Promise<string> {
    try {
      this.logger.debug(`[OpenAI] Đã Gửi prompt: `);

      // Gọi trực tiếp tới OpenAI API
      const completion = await this.openai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: this.defaultSystemPromtForMarketNews,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: this.OPENAI_MODEL,
        temperature: 0.7,
        max_tokens: 2000,
        presence_penalty: 0.6,
        frequency_penalty: 0.4,
        top_p: 0.9,
      });

      const answerContent = completion.choices[0]?.message?.content || '';

      return answerContent;
    } catch (error) {
      this.logger.error(
        `[OpenAI] Lỗi khi chat với prompt: ${error.message}`,
        error.stack,
      );
      throw new Error(`OpenAI Chat Error: ${error.message}`);
    }
  }

  async chat(chatRequest: ChatRequestDto): Promise<ChatResponseDto> {
    try {
      this.logger.log('[RAG] Bắt đầu xử lý chat request');
      let sessionId = chatRequest.sessionId;
      if (!sessionId) {
        sessionId = this.createNewSession();
        this.logger.log('[RAG] Tạo session mới:', sessionId);
      }
      let context = this.chatSessions.get(sessionId) || [];
      if (context.length === 0) {
        context = [
          {
            role: ChatRole.SYSTEM,
            content: this.defaultSystemPrompt,
            timestamp: new Date(),
          },
        ];
        this.logger.log('[RAG] Khởi tạo context mới cho session');
      }

      const latestMessage =
        chatRequest.messages[chatRequest.messages.length - 1];
      this.logger.log(`[RAG] Câu hỏi mới nhất: ${latestMessage.content}`);

      context = context.filter((msg) => {
        if (msg.role === ChatRole.USER || msg.role === ChatRole.ASSISTANT)
          return true;
        if (
          msg.role === ChatRole.SYSTEM &&
          msg.content === this.defaultSystemPrompt
        )
          return true;
        return false;
      });

      let retrievalContext: { context: string, suggestionQuery: string[] } | null = null;
      if (latestMessage.role === ChatRole.USER) {
        retrievalContext = await this.findRelevantContext(
          latestMessage.content,
        );
        this.logger.log(`[RAG] RAG Context finally: ${retrievalContext}`);

        // Kiểm tra nếu context chứa thông báo về việc không liên quan đến chứng khoán
        const notRelatedToFinance = retrievalContext.context.includes('Không tìm thấy thông tin liên quan trong cơ sở dữ liệu chứng khoán');

        if (
          retrievalContext &&
          !notRelatedToFinance &&
          retrievalContext.context !== 'Không tìm thấy thông tin liên quan.'
        ) {
          context.push({
            role: ChatRole.SYSTEM,
            content: `Thông tin truy xuất:\n${retrievalContext.context}`,
            timestamp: new Date(),
          });
        } else if (notRelatedToFinance) {
          // Thêm hướng dẫn cho AI khi câu hỏi không liên quan đến tài chính/chứng khoán
          context.push({
            role: ChatRole.SYSTEM,
            content: `Câu hỏi của người dùng không liên quan đến lĩnh vực tài chính, chứng khoán hoặc ZenAI. 
            Hãy trả lời một cách thân thiện và hữu ích, nhưng nhắc nhở người dùng rằng bạn là ZenAI - trợ lý tài chính thông minh, 
            chuyên về tài chính, chứng khoán và các dịch vụ của ZenAI. 
            Nếu có thể, hãy hướng cuộc trò chuyện về các chủ đề liên quan đến tài chính.`,
            timestamp: new Date(),
          });
        }
      }

      /* Thêm các message từ chatRequest vào context */
      chatRequest.messages.forEach((msg) => {
        context.push({ ...msg, timestamp: new Date() });
      });

      /* Chuyển đổi context thành định dạng message cho OpenAI */
      const openaiMessages: ChatCompletionMessageParam[] = context.map(
        (msg) => ({
          role: this.mapRole(msg.role),
          content: this.formatMessage(msg.content, msg.role),
          name: msg.role === ChatRole.ASSISTANT ? 'assistant' : undefined,
        }),
      );

      this.logger.log(
        `[RAG] Gửi ${openaiMessages.length} message(s) tới OpenAI với model ${this.OPENAI_MODEL}`,
      );
      this.logger.debug(
        `[OpenAI API] Context messages (${openaiMessages.length}) cuối cùng gửi đi: ${JSON.stringify(openaiMessages)}`,
      );
      const completion = await this.openai.chat.completions.create({
        messages: openaiMessages,
        model: this.OPENAI_MODEL,
        temperature: 0.7,
        max_tokens: 2000,
        presence_penalty: 0.6,
        frequency_penalty: 0.4,
        top_p: 0.9,
      });

      const answerContent = completion.choices[0]?.message?.content || '';
      const response: ChatResponseDto = {
        content: this.formatResponse(answerContent),
        role: ChatRole.ASSISTANT,
        timestamp: new Date(),
        sessionId,
        suggestionQuery: retrievalContext.suggestionQuery,
      };

      context.push({
        role: ChatRole.ASSISTANT,
        content: response.content,
        timestamp: new Date(),
      });
      this.chatSessions.set(sessionId, context);

      this.logger.log('[RAG] Kết thúc xử lý chat request');
      return response;
    } catch (error) {
      this.logger.error(`[RAG] Lỗi xử lý chat: ${error.message}`, error.stack);
      throw new Error(`OpenAI Chat Error: ${error.message}`);
    }
  }

  private mapRole(role: ChatRole): 'system' | 'user' | 'assistant' {
    switch (role) {
      case ChatRole.USER:
        return 'user';
      case ChatRole.ASSISTANT:
        return 'assistant';
      case ChatRole.SYSTEM:
        return 'system';
      case ChatRole.ADMIN:
        return 'user';
      default:
        return 'user';
    }
  }

  private formatMessage(content: string, role: ChatRole): string {
    switch (role) {
      case ChatRole.USER:
        return `Người dùng hỏi: ${content}`;
      case ChatRole.ADMIN:
        return `Yêu cầu phân tích chuyên sâu: ${content}`;
      default:
        return content;
    }
  }

  private formatResponse(content: string): string {
    return content
      .trim()
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^/, '📊 ')
      .replace(/\n## /g, '\n💡 ')
      .replace(/\n# /g, '\n🎯 ');
  }

  deleteSession(sessionId: string): void {
    this.chatSessions.delete(sessionId);
  }

  getChatHistory(sessionId: string): ChatMessageDto[] | null {
    return this.chatSessions.get(sessionId) || null;
  }
}
