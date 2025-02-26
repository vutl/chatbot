import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ZenAIStockService } from './services/zenai-stock.service';
import { ZenAIStockProcessor } from './processors/zenai-stock.processor';
import { ZenAIAuthService } from './services/zenai-auth.service';
import { ChromaService } from './services/chroma.service';
import { OpenAIModule } from '../openai/openai.module';

@Module({
  imports: [HttpModule, ConfigModule, ScheduleModule.forRoot(), OpenAIModule],
  providers: [
    ZenAIAuthService,
    ZenAIStockService,
    ZenAIStockProcessor,
    ChromaService,
  ],
  exports: [ZenAIStockService, ZenAIAuthService, ChromaService],
})
export class ZenAIModule {}
