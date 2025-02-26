import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Flex,
  Input,
  IconButton,
  VStack,
  useToast,
  Container,
  Button,
  Text,
  Image,
  Spinner,
} from '@chakra-ui/react';
import { ChatMessage } from './ChatMessage';
import { chatService } from '../services/chatService';
import { ChatMessage as IChatMessage, ChatState } from '../types/chat';
import { v4 as uuidv4 } from 'uuid';

// Tin nhắn chào mừng khi người dùng vào trang
const WELCOME_MESSAGE = "👋 Chào bạn, tôi là ZenAI - Trợ lý chứng khoán tài chính thông minh. Tôi có thể giúp gì cho bạn nào, đừng ngại đặt câu hỏi cho tôi nhé 🥰";

// Danh sách các tin nhắn chờ đợi khi phản hồi quá lâu
const WAITING_MESSAGES = [
  "Dữ liệu để tôi phân tích hơi nhiều, bạn đợi chút nhé tôi đang phân tích sắp xong rồi",
  "Tôi đang rà soát lại thông tin, tin tức thị trường liên quan, bạn chờ xíu nhé...",
  "Đang tổng hợp dữ liệu từ nhiều nguồn khác nhau, vui lòng đợi trong giây lát...",
  "Tôi đang phân tích kỹ lưỡng thông tin để đưa ra câu trả lời chính xác nhất, sẽ xong ngay thôi!",
  "Đang tìm kiếm thông tin mới nhất về chủ đề này, bạn đợi một chút nhé...",
  "Câu hỏi của bạn khá phức tạp, tôi đang tổng hợp thông tin để trả lời đầy đủ nhất...",
  "...",
];

// Mở rộng interface IChatMessage để thêm thuộc tính isWaitingMessage
declare module '../types/chat' {
  interface ChatMessage {
    isWaitingMessage?: boolean;
  }
}

export const ChatInterface = () => {
  const [state, setState] = useState<ChatState>({
    sessionId: null,
    messages: [],
    isLoading: false,
    error: null,
  });
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const welcomeMessageShownRef = useRef<boolean>(false);
  const waitingMessageTimerRef = useRef<NodeJS.Timeout | null>(null);
  const waitingMessageShownRef = useRef<boolean>(false);
  const isLoadingRef = useRef<boolean>(false); // Thêm ref để theo dõi trạng thái loading
  const toast = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Cập nhật isLoadingRef khi state.isLoading thay đổi
  useEffect(() => {
    isLoadingRef.current = state.isLoading;
    console.log('Loading state changed:', state.isLoading);
  }, [state.isLoading]);

  useEffect(() => {
    // Tạo session mới khi component được mount
    initializeSession();
    
    // Cleanup function để reset ref khi component unmount
    return () => {
      welcomeMessageShownRef.current = false;
      if (waitingMessageTimerRef.current) {
        clearTimeout(waitingMessageTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  // Thêm tin nhắn chào mừng từ bot
  const addWelcomeMessage = () => {
    // Kiểm tra xem welcome message đã được hiển thị chưa
    if (welcomeMessageShownRef.current) {
      console.log('Welcome message already shown, skipping...');
      return;
    }
    
    console.log('Adding welcome message...');
    const botMessage: IChatMessage = {
      id: uuidv4(),
      content: WELCOME_MESSAGE,
      role: 'assistant',
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, botMessage],
    }));
    
    // Đánh dấu là đã hiển thị welcome message
    welcomeMessageShownRef.current = true;
  };

  // Thêm tin nhắn chờ đợi khi phản hồi quá lâu
  const addWaitingMessage = () => {
    if (waitingMessageShownRef.current) {
      console.log('Waiting message already shown, skipping...');
      return;
    }
    
    console.log('Adding waiting message...');
    
    // Cách 1: Có xác suất không hiển thị waiting message
    const shouldShowMessage = Math.random() < 0.7; // 70% xác suất hiển thị message
    
    if (!shouldShowMessage) {
      console.log('Randomly decided not to show waiting message');
      return;
    }
    
    // Chọn ngẫu nhiên một tin nhắn từ danh sách
    const randomIndex = Math.floor(Math.random() * WAITING_MESSAGES.length);
    console.log('Selected waiting message index:', randomIndex, 'from total:', WAITING_MESSAGES.length);
    
    const waitingMessage = WAITING_MESSAGES[randomIndex];
    console.log('Selected waiting message:', waitingMessage);
    
    const botMessage: IChatMessage = {
      id: uuidv4(),
      content: waitingMessage,
      role: 'assistant',
      timestamp: new Date(),
      isWaitingMessage: true, // Đánh dấu đây là tin nhắn chờ đợi
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, botMessage],
    }));
    
    waitingMessageShownRef.current = true;
    console.log('Waiting message shown flag set to true');
  };

  const initializeSession = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const sessionId = await chatService.createSession();
      /* Truyền context là null hoặc rỗng lên thì sẽ sử dụng system promt default trên server là trợ lý chứng khoán */
      await chatService.updateSystemPrompt(sessionId, "");
      setState(prev => ({
        ...prev,
        sessionId,
        isLoading: false
      }));

      // Hiển thị tin nhắn chào mừng sau khi khởi tạo session thành công
      // Chỉ gọi nếu chưa hiển thị welcome message
      if (!welcomeMessageShownRef.current) {
        setTimeout(() => {
          addWelcomeMessage();
        }, 500); // Thêm độ trễ nhỏ để tạo cảm giác tự nhiên
      }

    } catch (error) {
      handleError(error);
    }
  };

  // Tách logic gửi tin nhắn thành một hàm riêng để tái sử dụng
  const sendMessage = async (message: string) => {
    if (!message.trim() || !state.sessionId) return;

    const userMessage: IChatMessage = {
      id: uuidv4(),
      content: message,
      role: 'user',
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));
    setInputMessage('');
    
    // Reset trạng thái tin nhắn chờ đợi
    waitingMessageShownRef.current = false;
    console.log('Reset waiting message shown flag to false');
    
    // Thiết lập timer để hiển thị tin nhắn chờ đợi sau 5 giây
    if (waitingMessageTimerRef.current) {
      clearTimeout(waitingMessageTimerRef.current);
      waitingMessageTimerRef.current = null;
    }
    /* Tạo biến random giá trị từ 5000 tới 10000 */
    let rdTime = Math.floor(Math.random() * 5000) + 5000;

    waitingMessageTimerRef.current = setTimeout(() => {
      console.log('Checking if waiting message should be shown...');
      console.log('Current loading state (ref):', isLoadingRef.current);
      
      // Sử dụng ref để kiểm tra trạng thái loading hiện tại
      if (isLoadingRef.current) {
        console.log('Showing waiting message...');
        addWaitingMessage();
      } else {
        console.log('Not showing waiting message because not loading anymore');
      }
    }, rdTime);

    try {
      /* Định dạng response trả về : 
      {
    "content": "📊 Giá hiện tại của cổ phiếu HPG là 26.45 VND. 📈\n\nBạn có cần thông tin thêm về mã HPG không? ZenAI có thể cung cấp phân tích chi tiết hoặc thông tin mới nhất về công ty và thị trường.",
    "role": "assistant",
    "timestamp": "2025-02-25T14:45:25.531Z",
    "sessionId": "ee1caeb2-26d7-458f-9a9c-30d86101f946",
    "suggestionQuery": [
        "Phân tích kỹ thuật mã HPG trong tuần qua",
        "Tin tức mới nhất ảnh hưởng đến giá cổ phiếu HPG"
    ]
} */
      const response = await chatService.sendMessage({
        sessionId: state.sessionId,
        message: message,
      });
      
      console.log('API Response:', response);
      
      // Xóa timer khi đã nhận được phản hồi
      if (waitingMessageTimerRef.current) {
        clearTimeout(waitingMessageTimerRef.current);
        waitingMessageTimerRef.current = null;
      }

      // Kiểm tra response có đúng cấu trúc không
      if (response && response.content && response.role === 'assistant') {
        const botMessage: IChatMessage = {
          id: uuidv4(),
          content: response.content,
          role: response.role,
          timestamp: new Date(response.timestamp),
          suggestionQueries: response.suggestionQuery || [],
        };

        // Lọc bỏ tin nhắn chờ đợi (nếu có) trước khi thêm tin nhắn mới
        setState(prev => {
          const filteredMessages = prev.messages.filter(msg => !msg.isWaitingMessage);
          return {
            ...prev,
            messages: [...filteredMessages, botMessage],
            isLoading: false,
          };
        });
        
        // Reset trạng thái tin nhắn chờ đợi
        waitingMessageShownRef.current = false;
        console.log('Reset waiting message shown flag to false after response');
      } else {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response structure from server');
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
      
      // Xóa timer khi có lỗi
      if (waitingMessageTimerRef.current) {
        clearTimeout(waitingMessageTimerRef.current);
        waitingMessageTimerRef.current = null;
      }
      
      // Lọc bỏ tin nhắn chờ đợi khi có lỗi
      setState(prev => {
        const filteredMessages = prev.messages.filter(msg => !msg.isWaitingMessage);
        return {
          ...prev,
          messages: filteredMessages,
          isLoading: false,
        };
      });
      
      // Reset trạng thái tin nhắn chờ đợi
      waitingMessageShownRef.current = false;
      console.log('Reset waiting message shown flag to false after error');
      
      handleError(error);
    }
  };
  
  // Xử lý khi người dùng nhấn nút gửi hoặc Enter
  const handleSendMessage = () => {
    sendMessage(inputMessage);
  };

  // Xử lý khi người dùng click vào gợi ý
  const handleSuggestionClick = (suggestion: string) => {
    // Đặt nội dung gợi ý vào input (để hiển thị cho người dùng thấy)
    setInputMessage(suggestion);
    
    // Gửi tin nhắn ngay lập tức với nội dung suggestion
    // Sử dụng setTimeout để đảm bảo UI được cập nhật trước khi gửi
    setTimeout(() => {
      sendMessage(suggestion);
    }, 100);
  };

  const handleNewSession = async () => {
    // Reset welcome message flag khi tạo session mới
    welcomeMessageShownRef.current = false;
    waitingMessageShownRef.current = false;
    
    if (waitingMessageTimerRef.current) {
      clearTimeout(waitingMessageTimerRef.current);
      waitingMessageTimerRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      messages: [],
      isLoading: true,
      error: null,
    }));
    await initializeSession();
  };

  const handleError = (error: any) => {
    setState(prev => ({ ...prev, isLoading: false }));
    let errorMessage = 'Có lỗi xảy ra';

    if (error && error.response && error.response.data) {
      // Lấy thông tin lỗi chi tiết từ response
      const responseData = error.response.data;
      if (responseData) {
        if (Array.isArray(responseData.message)) {
          errorMessage = responseData.message.join(', ');
        } else if (typeof responseData.message === 'string') {
          errorMessage = responseData.message;
        } else {
          errorMessage = JSON.stringify(responseData);
        }
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    toast({
      title: 'Lỗi',
      description: errorMessage,
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getLastBotMessageIndex = () => {
    for (let i = state.messages.length - 1; i >= 0; i--) {
      if (state.messages[i].role === 'assistant' && !state.messages[i].isWaitingMessage) {
        return i;
      }
    }
    return -1;
  };

  return (
    <Box minH="100vh" bg="gray.50" w="100%">
      <Container
        maxW={{ base: "100%", md: "container.lg" }}
        h="100vh"
        p={0}
        display="flex"
        flexDirection="column"
        bg="white"
      >
        {/* Header */}
        <Box
          p={4}
          borderBottom="1px"
          borderColor="gray.200"
          bg="white"
          position="sticky"
          top={0}
          zIndex={1}
        >
          <Flex align="center" justify="center">
            {/* <Image 
              src="/zenai-icon.png" 
              alt="ZenAI Logo" 
              boxSize={{ base: "30px", sm: "40px" }}
              mr={3}
            /> */}
            <Text
              fontSize={{ base: "lg", sm: "xl" }}
              fontWeight="bold"
              bgGradient="linear(to-r, teal.500, green.500)"
              bgClip="text"
            >
              ZenAI Agent
            </Text>
          </Flex>
        </Box>

        {/* Messages */}
        <VStack
          flex={1}
          overflowY="auto"
          spacing={4}
          p={{ base: 3, sm: 6 }}
          w="100%"
          maxW="100%"
          alignItems="stretch"
          sx={{
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              width: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'gray.200',
              borderRadius: '24px',
            },
          }}
        >
          {state.messages.map((msg, index) => (
            <ChatMessage 
              key={msg.id} 
              message={msg} 
              isLatestBotMessage={!state.isLoading && index === getLastBotMessageIndex()}
              onSuggestionClick={handleSuggestionClick}
            />
          ))}
          <div ref={messagesEndRef} />

          {state.isLoading && (
            <Box
              p={4}
              bg="gray.50"
              borderRadius="lg"
              display="flex"
              alignItems="center"
              gap={3}
              alignSelf="flex-start"
              maxW="70%"
              data-testid="loading-indicator"
            >
              <Spinner size="sm" color="green.500" />
              <Text fontSize="sm" color="gray.600">
                ZenAI đang suy nghĩ...
              </Text>
            </Box>
          )}
        </VStack>

        {/* Input */}
        <Box
          p={{ base: 3, sm: 6 }}
          borderTop="1px"
          borderColor="gray.200"
          bg="white"
          position="sticky"
          bottom={0}
        >
          <Flex gap={3} maxW="100%">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn của bạn..."
              size={{ base: "md", sm: "lg" }}
              bg="gray.50"
            />
            <Button
              onClick={handleSendMessage}
              colorScheme="teal"
              size={{ base: "md", sm: "lg" }}
              px={6}
              isLoading={state.isLoading}
            >
              Gửi 💬
            </Button>
          </Flex>
        </Box>
      </Container>
    </Box>
  );
}; 