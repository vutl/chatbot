import { useState, useEffect } from 'react';
import { Text, TextProps } from '@chakra-ui/react';

interface TypingTextProps extends TextProps {
  content: string;
  typingSpeed?: number;
  onComplete?: () => void;
}

export const TypingText = ({ 
  content, 
  typingSpeed = 15,
  onComplete,
  ...props 
}: TypingTextProps) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setDisplayedContent('');
    setCurrentIndex(0);
  }, [content]);

  useEffect(() => {
    if (currentIndex < content.length) {
      const timer = setTimeout(() => {
        const nextChars = content.slice(currentIndex, currentIndex + 2);
        setDisplayedContent(prev => prev + nextChars);
        setCurrentIndex(prev => Math.min(prev + 2, content.length));
      }, typingSpeed);

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [content, currentIndex, typingSpeed, onComplete]);

  return (
    <Text whiteSpace="pre-wrap" {...props}>
      {displayedContent}
    </Text>
  );
}; 