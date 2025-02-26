import { Module } from '@nestjs/common';
import { StockAnalysisService } from './stock-analysis.service';
import { StockAnalysisController } from './stock-analysis.controller';
import { OpenAIModule } from '../openai/openai.module';

@Module({
  imports: [OpenAIModule],
  controllers: [StockAnalysisController],
  providers: [StockAnalysisService],
  exports: [StockAnalysisService],
})
export class StockAnalysisModule {}
