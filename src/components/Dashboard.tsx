import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import type { CompanyData, SpendAnalysis, SummaryMetrics } from '../types';
import SummaryCards from './SummaryCards';
import AnalysisTable from './AnalysisTable';
import LoadingScreen from './LoadingScreen';
import ReviewRecommendations from './ReviewRecommendations';
import PrioritizeImplementation from './PrioritizeImplementation';
import TrackProgress from './TrackProgress';
import { generateMockAnalysis } from '../utils/mockData';
import { ChevronRight, User, BarChart3, LogOut } from 'lucide-react';

interface DashboardProps {
  companyData: CompanyData;
  initialAnalysis?: SpendAnalysis[] | null;
  initialSummary?: SummaryMetrics | null;
  onProfileClick?: () => void;
  onLogout?: () => void;
}

type ViewState = 'dashboard' | 'review' | 'prioritize' | 'track';

const Dashboard = ({ companyData, initialAnalysis, initialSummary, onProfileClick, onLogout }: DashboardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState<SpendAnalysis[]>([]);
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetrics | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');

  useEffect(() => {
    const processData = async () => {
      // If we have analysis from Excel upload, use it
      if (initialAnalysis && initialSummary) {
        console.log('[Dashboard] Using Excel analysis data');
        setAnalysisData(initialAnalysis);
        setSummaryMetrics(initialSummary);
        setIsLoading(false);
        return;
      }
      
      // Otherwise use mock data
      console.log('[Dashboard] No Excel analysis, using mock data');
      setIsLoading(true);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockData = generateMockAnalysis(companyData);
      setAnalysisData(mockData.analysis);
      setSummaryMetrics(mockData.summary);
      setIsLoading(false);
    };

    processData();
  }, [companyData, initialAnalysis, initialSummary]);

  if (isLoading) {
    return <LoadingScreen companyName={companyData.name} />;
  }

  // Handle different views
  if (currentView === 'review') {
    return <ReviewRecommendations onBack={() => setCurrentView('dashboard')} />;
  }
  
  if (currentView === 'prioritize') {
    return <PrioritizeImplementation onBack={() => setCurrentView('dashboard')} />;
  }
  
  if (currentView === 'track') {
    return <TrackProgress onBack={() => setCurrentView('dashboard')} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen"
    >
      {/* Navigation Bar */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Valoris</h1>
                  <p className="text-sm text-gray-400">Procurement Analysis</p>
                </div>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-white font-medium">John Smith</p>
                <p className="text-sm text-gray-400">{companyData.name}</p>
              </div>
              
              {/* Profile Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-2 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                    JS
                  </div>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-2">
                    <button
                      onClick={onProfileClick}
                      className="w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all text-left"
                    >
                      <User className="w-4 h-4" />
                      Profile & Settings
                    </button>
                    <div className="border-t border-white/10 my-2" />
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8 p-6">
        {/* Page Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-white">Procurement Dashboard</h2>
          <p className="text-gray-300">AI-powered insights and optimization opportunities</p>
          <div className="w-24 h-1 bg-purple-500 mx-auto rounded-full" />
        </div>

        {/* Summary Cards */}
        {summaryMetrics && <SummaryCards metrics={summaryMetrics} />}

        {/* Analysis Table */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Detailed Analysis</h2>
            <p className="text-gray-300">
              Hover over items for additional information. Click for detailed breakdowns.
            </p>
          </div>
          <AnalysisTable data={analysisData} />
        </div>

        {/* Action Items */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Next Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.button
              onClick={() => setCurrentView('review')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 hover:bg-purple-500/20 transition-colors group text-left"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white mb-2">1. Review Recommendations</h3>
                <ChevronRight className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
              </div>
              <p className="text-gray-300 text-sm">Validate AI-identified opportunities with your team</p>
            </motion.button>
            
            <motion.button
              onClick={() => setCurrentView('prioritize')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 hover:bg-blue-500/20 transition-colors group text-left"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white mb-2">2. Prioritize Implementation</h3>
                <ChevronRight className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
              </div>
              <p className="text-gray-300 text-sm">Start with high-impact, low-effort optimizations</p>
            </motion.button>
            
            <motion.button
              onClick={() => setCurrentView('track')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 hover:bg-green-500/20 transition-colors group text-left"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white mb-2">3. Track Progress</h3>
                <ChevronRight className="w-5 h-5 text-green-400 group-hover:text-green-300 transition-colors" />
              </div>
              <p className="text-gray-300 text-sm">Monitor savings and ROI in real-time</p>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default memo(Dashboard);