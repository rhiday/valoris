import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CompanyData, SpendAnalysis, SummaryMetrics } from '../types';
import SummaryCards from './SummaryCards';
import AnalysisTable from './AnalysisTable';
import LoadingScreen from './LoadingScreen';
import ReviewRecommendations from './ReviewRecommendations';
import PrioritizeImplementation from './PrioritizeImplementation';
import TrackProgress from './TrackProgress';
import { generateMockAnalysis } from '../utils/mockData';
import { ChevronRight } from 'lucide-react';

interface DashboardProps {
  companyData: CompanyData;
}

type ViewState = 'dashboard' | 'review' | 'prioritize' | 'track';

const Dashboard: React.FC<DashboardProps> = ({ companyData }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState<SpendAnalysis[]>([]);
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetrics | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');

  useEffect(() => {
    // Simulate AI processing
    const processData = async () => {
      setIsLoading(true);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockData = generateMockAnalysis(companyData);
      setAnalysisData(mockData.analysis);
      setSummaryMetrics(mockData.summary);
      setIsLoading(false);
    };

    processData();
  }, [companyData]);

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
      className="min-h-screen p-6"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">Procurement Analysis</h1>
          <p className="text-xl text-gray-300">{companyData.name}</p>
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

export default Dashboard;