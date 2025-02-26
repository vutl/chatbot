import { Body, Controller, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { StockAnalysisService } from './stock-analysis.service';
import {
  StockDataDto,
  HistoricalDataDto,
  MarketDataDto,
  RiskProfile,
} from './dto/stock-analysis.dto';

@ApiTags('Stock Analysis')
@Controller('stock-analysis')
export class StockAnalysisController {
  constructor(private readonly stockAnalysisService: StockAnalysisService) {}

  /**
   * Endpoint phân tích cổ phiếu
   * @param symbol - Mã cổ phiếu
   * @param data - Dữ liệu về cổ phiếu
   */
  @Post('analyze')
  @ApiOperation({ summary: 'Phân tích cổ phiếu dựa trên dữ liệu' })
  @ApiQuery({ name: 'symbol', description: 'Mã cổ phiếu cần phân tích' })
  @ApiResponse({ status: 200, description: 'Phân tích thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  async analyzeStock(
    @Query('symbol') symbol: string,
    @Body() data: StockDataDto,
  ) {
    return this.stockAnalysisService.analyzeStock(symbol, data);
  }

  /**
   * Endpoint dự đoán xu hướng giá
   * @param symbol - Mã cổ phiếu
   * @param historicalData - Dữ liệu lịch sử giá
   */
  @Post('predict-trend')
  @ApiOperation({ summary: 'Dự đoán xu hướng giá cổ phiếu' })
  @ApiQuery({ name: 'symbol', description: 'Mã cổ phiếu cần dự đoán' })
  @ApiResponse({ status: 200, description: 'Dự đoán thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  async predictTrend(
    @Query('symbol') symbol: string,
    @Body() historicalData: HistoricalDataDto,
  ) {
    return this.stockAnalysisService.predictTrend(symbol, historicalData);
  }

  /**
   * Endpoint đề xuất danh mục đầu tư
   * @param riskProfile - Mức độ chấp nhận rủi ro
   * @param investmentAmount - Số tiền đầu tư
   * @param marketData - Dữ liệu thị trường
   */
  @Post('recommend-portfolio')
  @ApiOperation({ summary: 'Đề xuất danh mục đầu tư' })
  @ApiQuery({
    name: 'riskProfile',
    enum: RiskProfile,
    description: 'Mức độ chấp nhận rủi ro',
  })
  @ApiQuery({
    name: 'investmentAmount',
    type: Number,
    description: 'Số tiền đầu tư (VND)',
  })
  @ApiResponse({ status: 200, description: 'Đề xuất thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  async recommendPortfolio(
    @Query('riskProfile') riskProfile: RiskProfile,
    @Query('investmentAmount') investmentAmount: number,
    @Body() marketData: MarketDataDto,
  ) {
    return this.stockAnalysisService.recommendPortfolio(
      riskProfile,
      investmentAmount,
      marketData,
    );
  }
}
