import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/chat/ChatInterface';
import ChatToggleButton from './components/chat/ChatToggleButton';
import { conversationDataManager, generateFileId, generateMessageId } from './services/conversationData';
import type { CompanyData, SpendAnalysis, SummaryMetrics } from './types';
import type { ChatContext, ChatMessage } from './services/conversationData';

function App() {
  const [currentStep, setCurrentStep] = useState<'onboarding' | 'dashboard'>('onboarding');
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [excelAnalysis, setExcelAnalysis] = useState<SpendAnalysis[] | null>(null);
  const [excelSummary, setExcelSummary] = useState<SummaryMetrics | null>(null);
  
  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState<ChatContext>({ 
    availableFiles: [], 
    totalVendors: 0, 
    totalSpend: 0, 
    totalSavings: 0, 
    topCategories: [],
    topVendors: []
  });

  const handleOnboardingComplete = (data: CompanyData, analysis?: SpendAnalysis[], summary?: SummaryMetrics) => {
    console.log('[App] Onboarding complete with:', { data, analysis, summary });
    setCompanyData(data);
    
    if (analysis && summary) {
      setExcelAnalysis(analysis);
      setExcelSummary(summary);
      
      // Store in conversation data manager
      const fileId = generateFileId(data.name || 'procurement-analysis');
      conversationDataManager.storeAnalysis(
        fileId, 
        data.name || 'Procurement Analysis',
        [], // rawData - could be populated if needed
        analysis, 
        summary
      );
      setChatContext(conversationDataManager.getChatContext(fileId));
    }
    
    setCurrentStep('dashboard');
  };

  // Chat message handler
  const handleSendMessage = async (message: string) => {
    console.log('[App] Sending chat message:', message);
    
    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          chatContext,
          conversationHistory: chatContext.currentFile?.conversationHistory || []
        })
      });
      
      const data = await response.json();
      console.log('[App] Chat response:', data);
      
      if (data.success) {
        // Add messages to conversation history
        const userMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'user',
          content: message,
          timestamp: new Date(),
          context: {
            fileId: chatContext.currentFile?.fileId
          }
        };
        
        const aiMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          context: {
            fileId: chatContext.currentFile?.fileId
          }
        };
        
        if (chatContext.currentFile) {
          conversationDataManager.addChatMessage(chatContext.currentFile.fileId, userMessage);
          conversationDataManager.addChatMessage(chatContext.currentFile.fileId, aiMessage);
          setChatContext(conversationDataManager.getChatContext(chatContext.currentFile.fileId));
        }
      } else {
        console.error('[App] Chat error:', data);
        throw new Error(data.error || 'Chat request failed');
      }
    } catch (error) {
      console.error('[App] Chat request failed:', error);
      
      // Add error message to conversation
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
        context: {
          fileId: chatContext.currentFile?.fileId
        }
      };
      
      if (chatContext.currentFile) {
        const userMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'user',
          content: message,
          timestamp: new Date()
        };
        
        conversationDataManager.addChatMessage(chatContext.currentFile.fileId, userMessage);
        conversationDataManager.addChatMessage(chatContext.currentFile.fileId, errorMessage);
        setChatContext(conversationDataManager.getChatContext(chatContext.currentFile.fileId));
      }
    }
  };

  const hasAnalysisData = excelAnalysis && excelAnalysis.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-slate-900 to-primary-900">
      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${isChatOpen ? 'lg:mr-96' : ''}`}>
        <AnimatePresence mode="wait">
          {currentStep === 'onboarding' ? (
            <Onboarding key="onboarding" onComplete={handleOnboardingComplete} />
          ) : (
            <Dashboard 
              key="dashboard" 
              companyData={companyData!}
              initialAnalysis={excelAnalysis}
              initialSummary={excelSummary}
            />
          )}
        </AnimatePresence>
      </div>
      
      {/* Chat Interface */}
      <ChatInterface
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        chatContext={chatContext}
        onSendMessage={handleSendMessage}
      />
      
      {/* Chat Toggle Button */}
      <ChatToggleButton
        isOpen={isChatOpen}
        onClick={() => setIsChatOpen(!isChatOpen)}
        hasData={hasAnalysisData}
      />
    </div>
  );
}

export default App;
