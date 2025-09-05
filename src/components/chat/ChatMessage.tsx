import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Clock, FileText, DollarSign } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../../services/conversationData';

interface ChatMessageProps {
  message: ChatMessageType;
  isLatest: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLatest }) => {
  const [copied, setCopied] = useState(false);
  const [showTimestamp, setShowTimestamp] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-[80%] ${
          isUser
            ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl'
            : 'bg-white/10 border border-white/10 text-white rounded-tl-2xl rounded-tr-2xl rounded-br-2xl'
        } p-4 relative group`}
        onMouseEnter={() => setShowTimestamp(true)}
        onMouseLeave={() => setShowTimestamp(false)}
      >
        {/* Message Content */}
        <div className={`${isUser ? 'text-white' : 'text-gray-100'} whitespace-pre-wrap break-words`}>
          {message.content}
        </div>

        {/* Context Indicators */}
        {message.context && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs opacity-80">
              {message.context.fileId && (
                <div className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  <span>Analysis data</span>
                </div>
              )}
              {message.context.savingsCalculated && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  <span>€{message.context.savingsCalculated.toLocaleString()} savings</span>
                </div>
              )}
              {message.context.vendorMentioned && message.context.vendorMentioned.length > 0 && (
                <div className="flex items-center gap-1">
                  <span>Vendors:</span>
                  <span className="bg-white/20 px-1 py-0.5 rounded text-xs">
                    {message.context.vendorMentioned.join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timestamp Tooltip */}
        {showTimestamp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`absolute ${
              isUser ? '-left-16' : '-right-16'
            } top-2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg z-10`}
          >
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(message.timestamp)}
            </div>
          </motion.div>
        )}

        {/* Copy Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: showTimestamp ? 1 : 0, scale: showTimestamp ? 1 : 0.8 }}
          onClick={handleCopy}
          className={`absolute ${
            isUser ? '-left-8' : '-right-8'
          } top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors`}
          title="Copy message"
        >
          {copied ? (
            <Check className="w-3 h-3 text-green-400" />
          ) : (
            <Copy className="w-3 h-3 text-gray-400" />
          )}
        </motion.button>

        {/* Message Status for Latest Assistant Message */}
        {isLatest && isAssistant && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute -bottom-6 left-0 text-xs text-gray-500"
          >
            Just now
          </motion.div>
        )}

        {/* AI Badge for Assistant Messages */}
        {isAssistant && (
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">AI</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessage;