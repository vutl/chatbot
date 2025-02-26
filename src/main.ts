import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cấu hình ValidationPipe
  app.useGlobalPipes(new ValidationPipe());

  // Cấu hình CORS
  app.enableCors();

  // Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('Stock AI Agent API')
    .setDescription(
      'API documentation cho hệ thống trợ lý AI phân tích chứng khoán',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Chờ NestJS init xong (các onModuleInit)
  await app.init();

  // Khởi động server
  const port = process.env.PORT || 4301;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(
    `Swagger documentation is available at: http://localhost:${port}/docs`,
  );
}

bootstrap();
