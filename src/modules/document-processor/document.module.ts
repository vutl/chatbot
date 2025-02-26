import { Module } from '@nestjs/common';
import { DocumentProcessorController } from './document.controller';
import { DocumentProcessorService } from './document.service';
import { ChromaService } from '../vector-store/chroma.service';
import { OpenAIModule } from '../openai/openai.module';

@Module({
  imports: [OpenAIModule],
  controllers: [DocumentProcessorController],
  providers: [DocumentProcessorService, ChromaService],
  exports: [DocumentProcessorService],
})
export class DocumentProcessorModule {}
