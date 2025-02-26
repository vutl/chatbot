// Các types cho chat session
export interface ChatSession {
  id: string;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  suggestionQueries?: string[];
}

// Types cho API requests
export interface ChatRequestDto {
  sessionId?: string;
  messages: {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }[];
}

// Types cho API responses
export interface ChatResponseDto {
  content: string;
  role: 'assistant';
  timestamp: string;
  sessionId: string;
  suggestionQuery?: string[];
}

export interface ChatState {
  sessionId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

// Types cho system prompt
export interface SystemPromptRequest {
  prompt: string;
} 