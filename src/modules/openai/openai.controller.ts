import {
  Body,
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Put,
} from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import {
  ChatRequestDto,
  ChatResponseDto,
  ChatMessageDto,
} from './dto/chat.dto';

@ApiTags('OpenAI')
@Controller('openai')
export class OpenAIController {
  constructor(private readonly openaiService: OpenAIService) {}

  /**
   * Tạo phiên chat mới
   */
  @Post('sessions')
  @ApiOperation({ summary: 'Tạo phiên chat mới' })
  @ApiResponse({ status: 201, description: 'Phiên chat được tạo thành công' })
  createSession(): string {
    return this.openaiService.createNewSession();
  }

  /**
   * Cập nhật system prompt cho phiên chat
   */
  @Put('sessions/:sessionId/system-prompt')
  @ApiOperation({ summary: 'Cập nhật system prompt cho phiên chat' })
  @ApiParam({ name: 'sessionId', description: 'ID của phiên chat' })
  @ApiBody({
    schema: { type: 'object', properties: { prompt: { type: 'string' } } },
  })
  @ApiResponse({
    status: 200,
    description: 'System prompt được cập nhật thành công',
  })
  updateSystemPrompt(
    @Param('sessionId') sessionId: string,
    @Body('prompt') prompt: string,
  ): void {
    this.openaiService.updateSystemPrompt(sessionId, prompt);
  }

  /**
   * Endpoint xử lý chat với OpenAI
   */
  @Post('chat')
  @ApiOperation({ summary: 'Chat với AI Assistant' })
  @ApiBody({ type: ChatRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Phản hồi từ AI thành công',
    type: ChatResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  async chat(@Body() chatRequest: ChatRequestDto): Promise<ChatResponseDto> {
    return this.openaiService.chat(chatRequest);
  }

  /**
   * Lấy lịch sử chat của một phiên
   */
  @Get('sessions/:sessionId/history')
  @ApiOperation({ summary: 'Lấy lịch sử chat của một phiên' })
  @ApiParam({ name: 'sessionId', description: 'ID của phiên chat' })
  @ApiResponse({
    status: 200,
    description: 'Lấy lịch sử chat thành công',
    type: [ChatMessageDto],
  })
  getChatHistory(
    @Param('sessionId') sessionId: string,
  ): ChatMessageDto[] | null {
    return this.openaiService.getChatHistory(sessionId);
  }

  /**
   * Xóa một phiên chat
   */
  @Delete('sessions/:sessionId')
  @ApiOperation({ summary: 'Xóa một phiên chat' })
  @ApiParam({ name: 'sessionId', description: 'ID của phiên chat' })
  @ApiResponse({ status: 200, description: 'Phiên chat được xóa thành công' })
  deleteSession(@Param('sessionId') sessionId: string): void {
    this.openaiService.deleteSession(sessionId);
  }

  /**
   * Endpoint tạo embedding vector cho văn bản
   * @param text - Văn bản cần tạo embedding
   * @returns Vector embedding
   */
  @Post('embedding')
  @ApiOperation({ summary: 'Tạo embedding vector cho văn bản' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Tạo embedding thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  async createEmbedding(@Body('text') text: string) {
    return this.openaiService.createEmbedding(text);
  }
}
