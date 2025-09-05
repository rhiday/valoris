import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const SUGGESTED_QUESTIONS = [
  "What are my top 3 savings opportunities?",
  "Which vendors have the highest spend?",
  "Show me alternatives for my software vendors",
  "How much can I save by consolidating vendors?",
  "Which contracts are expiring soon?",
  "Compare my cloud spending with alternatives"
];

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isLoading, 
  disabled = false, 
  placeholder = "Ask about your vendors, savings opportunities, or optimization strategies..." 
}) => {
  const [message, setMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxHeight = 120;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [message]);

  // Focus textarea when not loading
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading || disabled) return;

    const messageToSend = message.trim();
    setMessage('');
    setShowSuggestions(false);
    
    try {
      await onSendMessage(messageToSend);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Could add error handling UI here
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const canSend = message.trim() && !isLoading && !disabled;

  return (
    <div className="relative">
      {/* Suggested Questions */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-white/10 border border-white/10 rounded-lg p-3 backdrop-blur-sm"
          >
            <div className="text-sm text-gray-300 mb-2 font-medium">Suggested questions:</div>
            <div className="space-y-2">
              {SUGGESTED_QUESTIONS.map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="block w-full text-left text-sm text-gray-300 hover:text-white hover:bg-white/10 p-2 rounded transition-colors"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end space-x-3 bg-white/10 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => !message && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              className="w-full bg-transparent text-white placeholder-gray-400 resize-none border-none outline-none text-sm leading-relaxed"
              style={{ 
                minHeight: '20px',
                maxHeight: `${maxHeight}px`
              }}
              rows={1}
            />
            
            {/* Character Counter for Long Messages */}
            {message.length > 200 && (
              <div className="absolute bottom-0 right-0 text-xs text-gray-500">
                {message.length}/2000
              </div>
            )}
          </div>

          {/* Send Button */}
          <motion.button
            type="submit"
            disabled={!canSend}
            whileHover={canSend ? { scale: 1.05 } : {}}
            whileTap={canSend ? { scale: 0.95 } : {}}
            className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
              canSend
                ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>
        </div>

        {/* Keyboard Shortcut Hint */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>
            {disabled ? 'Upload procurement data to start chatting' : 'Enter to send, Shift+Enter for new line'}
          </span>
          {message.length > 1800 && (
            <span className="text-yellow-400">
              Message getting long - consider breaking it up
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

export default ChatInput;