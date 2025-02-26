import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OpenAIModule } from './modules/openai/openai.module';
import { DocumentProcessorModule } from './modules/document-processor/document.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    OpenAIModule,
    DocumentProcessorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
