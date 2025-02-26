import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ChatRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
  ADMIN = 'admin',
}

export class ChatMessageDto {
  @ApiProperty({
    enum: ChatRole,
    description: 'Vai trò của người gửi tin nhắn',
    example: ChatRole.USER,
  })
  @IsEnum(ChatRole)
  role: ChatRole;

  @ApiProperty({
    description: 'Nội dung tin nhắn',
    example: 'Phân tích cổ phiếu VNM giúp tôi',
  })
  @IsString()
  content: string;

  @ApiProperty({
    description: 'Thời gian gửi tin nhắn',
    required: false,
    example: new Date().toISOString(),
  })
  @IsOptional()
  timestamp?: Date;
}

export class ChatRequestDto {
  @ApiProperty({
    type: [ChatMessageDto],
    description: 'Lịch sử tin nhắn trong cuộc hội thoại',
    example: [
      {
        role: ChatRole.USER,
        content: 'Phân tích cổ phiếu VNM giúp tôi',
        timestamp: new Date().toISOString(),
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];

  @ApiProperty({
    description: 'ID của phiên chat',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class ChatResponseDto {
  @ApiProperty({
    description: 'Nội dung phản hồi từ AI',
    example: 'Dựa trên phân tích của tôi về cổ phiếu VNM...',
  })
  content: string;

  @ApiProperty({
    enum: ChatRole,
    description: 'Vai trò của AI',
    example: ChatRole.ASSISTANT,
  })
  role: ChatRole;

  @ApiProperty({
    description: 'Thời gian phản hồi',
    example: new Date().toISOString(),
  })
  timestamp: Date;

  @ApiProperty({
    description: 'ID của phiên chat',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Câu hỏi gợi ý',
    example: ['Cổ phiếu VNM là gì?', 'Cổ phiếu VNM có tốt không?', 'Cổ phiếu VNM có tốt không?'],
  })
  suggestionQuery: string[];
}

export class ChatResponseDtoForMarketNewsAnalysisWithAI {
  summary: string;
  sentiment: number;
  tags: string[];
}
