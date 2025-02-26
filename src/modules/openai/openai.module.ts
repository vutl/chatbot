import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAIService } from './openai.service';
import { OpenAIController } from './openai.controller';
import { ChromaService } from '../vector-store/chroma.service';
import { GoogleSearchModule } from '../google-search/google-search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GoogleSearchModule,
  ],
  controllers: [OpenAIController],
  providers: [OpenAIService, ChromaService],
  exports: [OpenAIService],
})
export class OpenAIModule {}
