import { Box, Text, Flex, Avatar, Button, HStack, Wrap, WrapItem } from '@chakra-ui/react';
import { ChatMessage as IChatMessage } from '../types/chat';
import { TypingText } from './TypingText';
import { useState, useEffect } from 'react';

interface ChatMessageProps {
  message: IChatMessage;
  isLatestBotMessage?: boolean;
  onSuggestionClick?: (suggestion: string) => void;
}

export const ChatMessage = ({ 
  message, 
  isLatestBotMessage = false,
  onSuggestionClick 
}: ChatMessageProps) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Reset showSuggestions khi message thay đổi
  useEffect(() => {
    setShowSuggestions(false);
  }, [message.id]);

  // Nếu không phải là tin nhắn mới nhất của bot hoặc không có hiệu ứng typing, hiển thị gợi ý ngay
  useEffect(() => {
    if (!isLatestBotMessage || isUser) {
      setShowSuggestions(true);
    } else {
      // Nếu là tin nhắn mới nhất của bot và có hiệu ứng typing, đợi 2 giây để hiển thị gợi ý
      const timer = setTimeout(() => {
        setShowSuggestions(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isLatestBotMessage, isUser, message.id]);

  // Callback khi typing hoàn thành
  const handleTypingComplete = () => {
    setShowSuggestions(true);
  };

  if (isSystem) {
    return (
      <Flex justify="center" mb={4} px={{ base: 2, sm: 4 }}>
        <Box
          maxW={{ base: "95%", sm: "90%" }}
          bg="gray.50"
          p={3}
          borderRadius="lg"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <Text fontSize="sm" color="gray.600">
            {message.content}
          </Text>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex 
      justify={isUser ? 'flex-end' : 'flex-start'} 
      mb={4} 
      align="start"
      w="100%"
      px={{ base: 2, sm: 4 }}
    >
      {!isUser && (
        <Avatar
          src="/zenai-icon.png"
          name="ZenAI"
          size={{ base: "sm", sm: "md" }}
          mr={3}
          bg="white"
          padding="2px"
          borderWidth="1px"
          borderColor="gray.200"
        />
      )}
      <Box
        maxW={{ base: "75%", sm: "70%" }}
        bg={isUser ? 'blue.500' : 'white'}
        color={isUser ? 'white' : 'black'}
        p={{ base: 3, sm: 4 }}
        borderRadius="lg"
        boxShadow="sm"
        borderWidth={!isUser ? "1px" : "0"}
        borderColor="gray.200"
      >
        {isUser || !isLatestBotMessage ? (
          <Text 
            whiteSpace="pre-wrap" 
            mb={2}
            fontSize={{ base: "sm", sm: "md" }}
          >
            {message.content}
          </Text>
        ) : (
          <TypingText
            content={message.content}
            mb={2}
            fontSize={{ base: "sm", sm: "md" }}
            onComplete={handleTypingComplete}
          />
        )}
        
        {/* Hiển thị các gợi ý truy vấn nếu có và chỉ khi showSuggestions = true */}
        {!isUser && showSuggestions && message.suggestionQueries && message.suggestionQueries.length > 0 && (
          <Wrap spacing={2} mt={3}>
            {message.suggestionQueries.map((suggestion, index) => (
              <WrapItem key={index}>
                <Button
                  size="sm"
                  colorScheme="teal"
                  variant="outline"
                  fontSize="xs"
                  onClick={() => onSuggestionClick && onSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Button>
              </WrapItem>
            ))}
          </Wrap>
        )}
        
        <Text 
          fontSize="xs" 
          color={isUser ? 'whiteAlpha.700' : 'gray.500'} 
          mt={1}
          textAlign={isUser ? 'right' : 'left'}
        >
          {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </Box>
      {isUser && (
        <Avatar
          bg="blue.500"
          color="white"
          name="User"
          size={{ base: "sm", sm: "md" }}
          ml={3}
        />
      )}
    </Flex>
  );
}; 