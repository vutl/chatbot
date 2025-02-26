import { Injectable } from '@nestjs/common';
import { OpenAIService } from '../openai/openai.service';
import { ChatRole } from '../openai/dto/chat.dto';
import {
  StockDataDto,
  HistoricalDataDto,
  MarketDataDto,
} from './dto/stock-analysis.dto';

@Injectable()
export class StockAnalysisService {
  constructor(private readonly openaiService: OpenAIService) {}

  /**
   * Phân tích cổ phiếu dựa trên dữ liệu đầu vào
   * @param symbol - Mã cổ phiếu cần phân tích
   * @param data - Dữ liệu về cổ phiếu (giá, khối lượng, chỉ số tài chính, etc.)
   * @returns Kết quả phân tích từ AI
   */
  async analyzeStock(symbol: string, data: StockDataDto) {
    const response = await this.openaiService.chat({
      messages: [
        {
          role: ChatRole.SYSTEM,
          content: `Bạn là một chuyên gia phân tích chứng khoán với kinh nghiệm phong phú về thị trường Việt Nam. 
          Hãy phân tích chi tiết cổ phiếu ${symbol} dựa trên các dữ liệu được cung cấp.
          Đưa ra nhận định về xu hướng giá, các chỉ số kỹ thuật quan trọng, và đề xuất chiến lược giao dịch.`,
        },
        {
          role: ChatRole.USER,
          content: `Phân tích cổ phiếu ${symbol} với dữ liệu sau:\n${JSON.stringify(data, null, 2)}`,
        },
      ],
    });

    return response;
  }

  /**
   * Dự đoán xu hướng giá cổ phiếu
   * @param symbol - Mã cổ phiếu
   * @param historicalData - Dữ liệu lịch sử giá
   * @returns Dự đoán xu hướng giá
   */
  async predictTrend(symbol: string, historicalData: HistoricalDataDto) {
    const response = await this.openaiService.chat({
      messages: [
        {
          role: ChatRole.SYSTEM,
          content: `Bạn là một chuyên gia dự đoán xu hướng thị trường chứng khoán Việt Nam.
          Hãy phân tích và dự đoán xu hướng giá của cổ phiếu ${symbol} trong ngắn hạn, trung hạn và dài hạn.`,
        },
        {
          role: ChatRole.USER,
          content: `Dự đoán xu hướng cổ phiếu ${symbol} dựa trên dữ liệu:\n${JSON.stringify(
            historicalData,
            null,
            2,
          )}`,
        },
      ],
    });

    return response;
  }

  /**
   * Đề xuất danh mục đầu tư
   * @param riskProfile - Mức độ chấp nhận rủi ro của nhà đầu tư
   * @param investmentAmount - Số tiền đầu tư
   * @param marketData - Dữ liệu thị trường hiện tại
   * @returns Đề xuất danh mục đầu tư
   */
  async recommendPortfolio(
    riskProfile: 'low' | 'medium' | 'high',
    investmentAmount: number,
    marketData: MarketDataDto,
  ) {
    const response = await this.openaiService.chat({
      messages: [
        {
          role: ChatRole.SYSTEM,
          content: `Bạn là một chuyên gia tư vấn đầu tư chứng khoán tại Việt Nam.
          Hãy đề xuất danh mục đầu tư phù hợp với mức độ rủi ro ${riskProfile} và số tiền đầu tư ${investmentAmount.toLocaleString()} VND.`,
        },
        {
          role: ChatRole.USER,
          content: `Đề xuất danh mục đầu tư dựa trên dữ liệu thị trường:\n${JSON.stringify(
            marketData,
            null,
            2,
          )}`,
        },
      ],
    });

    return response;
  }
}
