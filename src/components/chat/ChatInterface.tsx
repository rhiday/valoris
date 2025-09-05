import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, FileText, TrendingUp, DollarSign, Users } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import type { ChatContext, ChatMessage as ChatMessageType } from '../../services/conversationData';

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  chatContext: ChatContext;
  onSendMessage: (message: string) => Promise<void>;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  isOpen,
  onClose,
  chatContext,
  onSendMessage
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>(
    chatContext.currentFile?.fileId
  );
  const [showContextPanel, setShowContextPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, chatContext.currentFile?.conversationHistory.length]);

  // Update selected file when context changes
  useEffect(() => {
    if (chatContext.currentFile && !selectedFileId) {
      setSelectedFileId(chatContext.currentFile.fileId);
    }
  }, [chatContext.currentFile, selectedFileId]);

  const handleSendMessage = async (message: string) => {
    setIsLoading(true);
    try {
      await onSendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentFile = chatContext.availableFiles.find(file => file.fileId === selectedFileId);
  const messages = currentFile?.conversationHistory || [];
  const hasData = chatContext.availableFiles.length > 0;

  const formatCurrency = (amount: number) => {
    return `€${(amount / 1000).toFixed(0)}K`;
  };

  const formatLargeCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `€${(amount / 1000000).toFixed(1)}M`;
    }
    return `€${(amount / 1000).toFixed(0)}K`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />

          {/* Chat Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30 
            }}
            className="fixed top-0 right-0 h-full w-full lg:w-96 bg-gradient-to-b from-slate-900/95 via-slate-900/98 to-slate-900/95 backdrop-blur-xl border-l border-white/10 z-[60] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex-none p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">AI</span>
                  </div>
                  <div>
                    <h2 className="text-white font-semibold">Valoris AI</h2>
                    <p className="text-gray-400 text-xs">Procurement Assistant</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* File Selector */}
              {chatContext.availableFiles.length > 0 && (
                <div className="mb-3">
                  <label className="block text-xs text-gray-400 mb-1">Analysis File:</label>
                  <div className="relative">
                    <select
                      value={selectedFileId || ''}
                      onChange={(e) => setSelectedFileId(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm appearance-none cursor-pointer hover:bg-white/20 transition-colors"
                    >
                      {chatContext.availableFiles.map((file) => (
                        <option key={file.fileId} value={file.fileId} className="bg-slate-800">
                          {file.fileName} ({file.analysisResults.length} vendors)
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Context Summary */}
              {hasData && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="bg-white/5 rounded-lg p-3"
                >
                  <button
                    onClick={() => setShowContextPanel(!showContextPanel)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <span className="text-white text-sm font-medium">Analysis Summary</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showContextPanel ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {showContextPanel && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-3 pt-3 border-t border-white/10"
                      >
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            <Users className="w-3 h-3 text-blue-400" />
                            <div>
                              <div className="text-blue-400 font-medium">{chatContext.totalVendors}</div>
                              <div className="text-gray-400">Vendors</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-3 h-3 text-green-400" />
                            <div>
                              <div className="text-green-400 font-medium">{formatLargeCurrency(chatContext.totalSpend)}</div>
                              <div className="text-gray-400">Total Spend</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-3 h-3 text-purple-400" />
                            <div>
                              <div className="text-purple-400 font-medium">{formatLargeCurrency(chatContext.totalSavings)}</div>
                              <div className="text-gray-400">Potential Savings</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-3 h-3 text-orange-400" />
                            <div>
                              <div className="text-orange-400 font-medium">{chatContext.topCategories.length}</div>
                              <div className="text-gray-400">Categories</div>
                            </div>
                          </div>
                        </div>
                        
                        {chatContext.topCategories.length > 0 && (
                          <div className="mt-3">
                            <div className="text-gray-400 text-xs mb-1">Top Categories:</div>
                            <div className="flex flex-wrap gap-1">
                              {chatContext.topCategories.slice(0, 3).map((category) => (
                                <span
                                  key={category}
                                  className="bg-white/10 text-white text-xs px-2 py-1 rounded"
                                >
                                  {category}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-1"
                style={{ scrollBehavior: 'smooth' }}
              >
                {!hasData ? (
                  <div className="flex-1 flex items-center justify-center text-center">
                    <div className="max-w-xs">
                      <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-purple-400" />
                      </div>
                      <h3 className="text-white font-semibold mb-2">No Data Available</h3>
                      <p className="text-gray-400 text-sm">
                        Upload your procurement data to start chatting with Valoris AI about your vendors and optimization opportunities.
                      </p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-center">
                    <div className="max-w-xs">
                      <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-purple-400 font-bold text-xl">AI</span>
                      </div>
                      <h3 className="text-white font-semibold mb-2">Ready to Analyze</h3>
                      <p className="text-gray-400 text-sm mb-4">
                        I've analyzed your procurement data. Ask me about vendors, savings opportunities, or optimization strategies.
                      </p>
                      <div className="text-xs text-gray-500">
                        Try: "What are my biggest expenses?" or "Show me savings opportunities"
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <ChatMessage
                        key={message.id}
                        message={message}
                        isLatest={index === messages.length - 1}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className="flex-none p-4 border-t border-white/10">
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                disabled={!hasData}
                placeholder={
                  !hasData 
                    ? "Upload procurement data to start chatting..." 
                    : "Ask about your vendors, savings, or optimization strategies..."
                }
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatInterface;