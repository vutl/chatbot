import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ZenAIModule } from './modules/zenai/zenai.module';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';

// Load env file
dotenv.config({ path: '.env.zenai' }); // Ưu tiên load .env.zenai
dotenv.config(); // Fallback về .env nếu không có .env.zenai

async function bootstrap() {
  const logger = new Logger('ZenAIStockProcessor');
  const app = await NestFactory.create(ZenAIModule);

  // Lấy ConfigService để check env đã được load
  const configService = app.get(ConfigService);
  const username = configService.get<string>('ZENAI_USERNAME');
  const password = configService.get<string>('ZENAI_PASSWORD');

  if (!username || !password) {
    logger.error(
      'ZENAI_USERNAME và ZENAI_PASSWORD không được cung cấp trong file .env',
    );
    process.exit(1);
  }

  // Cấu hình port
  const port = process.env.ZENAI_PORT || 4303;

  await app.listen(port);
  logger.log(`🚀 ZenAI Stock Processor đang chạy trên port ${port}`);
}

bootstrap();
