import { useState, Suspense, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import Login from './components/Login';
import UploadPage from './components/UploadPage';
import Dashboard from './components/Dashboard';
import LoadingScreen from './components/LoadingScreen';
import ChatToggleButton from './components/chat/ChatToggleButton';

// Lazy load non-critical components for better performance
const Profile = lazy(() => import('./components/Profile'));
const ChatInterface = lazy(() => import('./components/chat/ChatInterface'));
import { conversationDataManager, generateFileId, generateMessageId } from './services/conversationData';
import type { SpendAnalysis, SummaryMetrics } from './types';
import type { ChatContext, ChatMessage } from './services/conversationData';

type AppState = 'login' | 'upload' | 'dashboard' | 'profile';

function App() {
  const [currentState, setCurrentState] = useState<AppState>('login');
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

  // User state (simplified for demo)
  const [user] = useState({
    name: 'Demo Company',
    industry: 'Technology',
    employeeCount: '100-500',
    annualSpend: '1-5M'
  });

  // Login handler
  const handleLogin = () => {
    setCurrentState('upload');
  };

  // Upload completion handler
  const handleAnalysisComplete = (analysis: SpendAnalysis[], summary: SummaryMetrics) => {
    console.log('[App] Analysis complete with:', { analysis, summary });
    setExcelAnalysis(analysis);
    setExcelSummary(summary);
    
    // Store in conversation data manager
    const fileId = generateFileId(user.name || 'procurement-analysis');
    conversationDataManager.storeAnalysis(
      fileId, 
      'Procurement Analysis',
      [], // rawData - could be populated if needed
      analysis, 
      summary
    );
    setChatContext(conversationDataManager.getChatContext(fileId));
    
    setCurrentState('dashboard');
  };

  // Navigation handlers
  const handleProfileClick = () => setCurrentState('profile');
  const handleBackToDashboard = () => setCurrentState('dashboard');
  const handleLogout = () => {
    setCurrentState('login');
    setExcelAnalysis(null);
    setExcelSummary(null);
    setChatContext({ 
      availableFiles: [], 
      totalVendors: 0, 
      totalSpend: 0, 
      totalSavings: 0, 
      topCategories: [],
      topVendors: []
    });
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
  const showChat = currentState === 'dashboard';

  const renderCurrentView = () => {
    switch (currentState) {
      case 'login':
        return <Login key="login" onLogin={handleLogin} />;
      case 'upload':
        return <UploadPage key="upload" onAnalysisComplete={handleAnalysisComplete} />;
      case 'dashboard':
        return (
          <Dashboard 
            key="dashboard" 
            companyData={user}
            initialAnalysis={excelAnalysis}
            initialSummary={excelSummary}
            onProfileClick={handleProfileClick}
            onLogout={handleLogout}
          />
        );
      case 'profile':
        return (
          <Suspense fallback={<LoadingScreen companyName={user.name} />}>
            <Profile key="profile" onBack={handleBackToDashboard} />
          </Suspense>
        );
      default:
        return <Login key="login" onLogin={handleLogin} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-slate-900 to-primary-900">
      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${isChatOpen && showChat ? 'lg:mr-96' : ''}`}>
        <AnimatePresence mode="wait">
          {renderCurrentView()}
        </AnimatePresence>
      </div>
      
      {/* Chat Interface - Only show on dashboard */}
      {showChat && (
        <>
          <Suspense fallback={<div />}>
            <ChatInterface
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              chatContext={chatContext}
              onSendMessage={handleSendMessage}
            />
          </Suspense>
          
          {/* Chat Toggle Button */}
          <ChatToggleButton
            isOpen={isChatOpen}
            onClick={() => setIsChatOpen(!isChatOpen)}
            hasData={!!hasAnalysisData}
          />
        </>
      )}
    </div>
  );
}

export default App;
