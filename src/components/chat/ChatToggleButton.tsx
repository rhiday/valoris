import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';

interface ChatToggleButtonProps {
  isOpen: boolean;
  onClick: () => void;
  hasData: boolean;
  unreadCount?: number;
}

const ChatToggleButton: React.FC<ChatToggleButtonProps> = ({ 
  isOpen, 
  onClick, 
  hasData, 
  unreadCount = 0 
}) => {
  const showPulse = hasData && !isOpen;
  const showNotification = unreadCount > 0 && !isOpen;

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20,
        delay: 0.5 
      }}
    >
      {/* Pulse Animation Ring */}
      <AnimatePresence>
        {showPulse && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [0.8, 1.2, 0.8], 
              opacity: [0.5, 0.2, 0.5] 
            }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full bg-purple-500 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Main Button */}
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative w-14 h-14 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center ${
          isOpen
            ? 'bg-gray-700 hover:bg-gray-600'
            : hasData
            ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
            : 'bg-gray-600 hover:bg-gray-500'
        }`}
        disabled={!hasData && !isOpen}
        title={
          !hasData 
            ? "Upload procurement data to start chatting"
            : isOpen 
            ? "Close chat"
            : "Open chat - AI ready to analyze your data"
        }
      >
        {/* Icon with smooth transition */}
        <motion.div
          initial={false}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <MessageCircle className="w-6 h-6 text-white" />
          )}
        </motion.div>

        {/* Data Ready Indicator */}
        <AnimatePresence>
          {hasData && !isOpen && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center shadow-lg"
            >
              <div className="w-2 h-2 bg-white rounded-full" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unread Messages Notification */}
        <AnimatePresence>
          {showNotification && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-2 -right-2 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center px-1"
            >
              <span className="text-white text-xs font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Status Tooltip */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ 
              opacity: showPulse ? 1 : 0, 
              x: showPulse ? -10 : 10, 
              scale: showPulse ? 1 : 0.9 
            }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            className="absolute right-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg whitespace-nowrap text-sm shadow-xl pointer-events-none"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              AI ready to chat about your data
            </div>
            {/* Tooltip Arrow */}
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disabled State Overlay */}
      {!hasData && !isOpen && (
        <div className="absolute inset-0 rounded-full bg-gray-800/50 flex items-center justify-center pointer-events-none">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-xs text-gray-400 font-medium text-center leading-tight"
          >
            Upload
            <br />
            Data
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default ChatToggleButton;