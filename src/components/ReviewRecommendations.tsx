import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, AlertCircle, TrendingDown, Clock, FileText, ChevronRight } from 'lucide-react';

interface ReviewRecommendationsProps {
  onBack: () => void;
}

const ReviewRecommendations = ({ onBack }: ReviewRecommendationsProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('software');
  const [approvedItems, setApprovedItems] = useState<Set<string>>(new Set());

  const recommendations = {
    software: [
      {
        id: 'rec-1',
        title: 'Microsoft 365 License Optimization',
        vendor: 'Microsoft',
        currentSpend: '€450,000',
        potentialSavings: '€67,500',
        savingsPercent: '15%',
        effort: 'Low',
        impact: 'High',
        timeToImplement: '2-3 weeks',
        description: 'Consolidate E3 and E5 licenses based on actual usage patterns. Remove 127 unused licenses identified.',
        actions: [
          'Export current license assignment report',
          'Identify users with no login in 90+ days',
          'Review E5 features usage per user',
          'Downgrade underutilized E5 licenses to E3'
        ],
        risks: ['User pushback on downgrades', 'Potential feature gaps'],
        status: 'ready'
      },
      {
        id: 'rec-2',
        title: 'GitHub Enterprise Seat Reduction',
        vendor: 'GitHub',
        currentSpend: '€84,000',
        potentialSavings: '€16,800',
        savingsPercent: '20%',
        effort: 'Low',
        impact: 'Medium',
        timeToImplement: '1 week',
        description: 'Remove inactive developer accounts and implement just-in-time provisioning.',
        actions: [
          'Audit commit activity per user',
          'Identify contractors vs full-time developers',
          'Implement quarterly access reviews',
          'Set up automated deprovisioning'
        ],
        risks: ['Temporary productivity impact', 'Re-provisioning delays'],
        status: 'ready'
      },
      {
        id: 'rec-3',
        title: 'Consolidate BI Tools',
        vendor: 'Multiple',
        currentSpend: '€125,000',
        potentialSavings: '€45,000',
        savingsPercent: '36%',
        effort: 'High',
        impact: 'High',
        timeToImplement: '3-6 months',
        description: 'Standardize on PowerBI and sunset Tableau and Looker instances.',
        actions: [
          'Map current dashboard usage across tools',
          'Create migration plan for critical reports',
          'Train users on PowerBI',
          'Gradual sunset of redundant tools'
        ],
        risks: ['User training required', 'Report migration complexity', 'Temporary dual running costs'],
        status: 'planning'
      }
    ],
    infrastructure: [
      {
        id: 'rec-4',
        title: 'AWS Reserved Instance Optimization',
        vendor: 'Amazon Web Services',
        currentSpend: '€280,000',
        potentialSavings: '€84,000',
        savingsPercent: '30%',
        effort: 'Medium',
        impact: 'High',
        timeToImplement: '2-4 weeks',
        description: 'Convert on-demand instances to 1-year reserved instances for stable workloads.',
        actions: [
          'Analyze 6-month usage patterns',
          'Identify stable workloads',
          'Calculate optimal RI coverage',
          'Purchase reserved instances'
        ],
        risks: ['Commitment lock-in', 'Potential overprovisioning'],
        status: 'ready'
      },
      {
        id: 'rec-5',
        title: 'Cloud Storage Tiering',
        vendor: 'Multiple',
        currentSpend: '€65,000',
        potentialSavings: '€26,000',
        savingsPercent: '40%',
        effort: 'Low',
        impact: 'Medium',
        timeToImplement: '1-2 weeks',
        description: 'Move infrequently accessed data to cheaper storage tiers.',
        actions: [
          'Analyze data access patterns',
          'Implement lifecycle policies',
          'Move cold data to archive tiers',
          'Set up automated tiering rules'
        ],
        risks: ['Retrieval latency for archived data'],
        status: 'ready'
      }
    ],
    services: [
      {
        id: 'rec-6',
        title: 'Consulting Services Consolidation',
        vendor: 'Various',
        currentSpend: '€420,000',
        potentialSavings: '€105,000',
        savingsPercent: '25%',
        effort: 'Medium',
        impact: 'High',
        timeToImplement: '2-3 months',
        description: 'Consolidate consulting vendors and negotiate master service agreements.',
        actions: [
          'Map all consulting engagements',
          'Identify overlapping services',
          'Select preferred vendors',
          'Negotiate volume discounts'
        ],
        risks: ['Vendor relationship management', 'Knowledge transfer'],
        status: 'planning'
      }
    ]
  };

  const categories = [
    { id: 'software', label: 'Software', count: 3, savings: '€129,300' },
    { id: 'infrastructure', label: 'Infrastructure', count: 2, savings: '€110,000' },
    { id: 'services', label: 'Services', count: 1, savings: '€105,000' }
  ];

  const handleApprove = (id: string) => {
    setApprovedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'Low': return 'bg-green-500/20 text-green-400';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'High': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'bg-purple-500/20 text-purple-400';
      case 'Medium': return 'bg-blue-500/20 text-blue-400';
      case 'Low': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-6"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Review Recommendations</h1>
              <p className="text-gray-400">Validate and approve AI-identified optimization opportunities</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">€344,300</div>
            <div className="text-sm text-gray-400">Total Potential Savings</div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Recommendations</span>
              <FileText className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-white">6</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Approved</span>
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">{approvedItems.size}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Quick Wins</span>
              <Clock className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-white">4</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Avg. Savings</span>
              <TrendingDown className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">24%</div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex space-x-2 bg-white/5 rounded-xl p-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-1 px-4 py-3 rounded-lg transition-all ${
                selectedCategory === cat.id
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="font-medium">{cat.label}</div>
              <div className="text-sm opacity-80">{cat.count} items • {cat.savings}</div>
            </button>
          ))}
        </div>

        {/* Recommendations List */}
        <div className="space-y-4">
          {recommendations[selectedCategory as keyof typeof recommendations].map(rec => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">{rec.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getEffortColor(rec.effort)}`}>
                      {rec.effort} Effort
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(rec.impact)}`}>
                      {rec.impact} Impact
                    </span>
                  </div>
                  <p className="text-gray-400 mb-4">{rec.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-gray-500 text-sm">Current Spend</span>
                      <div className="text-white font-semibold">{rec.currentSpend}</div>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">Potential Savings</span>
                      <div className="text-green-400 font-semibold">{rec.potentialSavings} ({rec.savingsPercent})</div>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">Time to Implement</span>
                      <div className="text-white font-semibold">{rec.timeToImplement}</div>
                    </div>
                  </div>

                  <details className="cursor-pointer">
                    <summary className="text-purple-400 hover:text-purple-300 text-sm font-medium mb-2">
                      View implementation details
                    </summary>
                    <div className="mt-4 space-y-4 pl-4 border-l-2 border-purple-500/30">
                      <div>
                        <h4 className="text-white font-medium mb-2">Action Items:</h4>
                        <ul className="space-y-1">
                          {rec.actions.map((action, idx) => (
                            <li key={idx} className="text-gray-400 text-sm flex items-start">
                              <ChevronRight className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0 mt-0.5" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {rec.risks.length > 0 && (
                        <div>
                          <h4 className="text-white font-medium mb-2 flex items-center">
                            <AlertCircle className="w-4 h-4 text-yellow-400 mr-2" />
                            Risks to Consider:
                          </h4>
                          <ul className="space-y-1">
                            {rec.risks.map((risk, idx) => (
                              <li key={idx} className="text-gray-400 text-sm flex items-start">
                                <ChevronRight className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0 mt-0.5" />
                                {risk}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
                
                <button
                  onClick={() => handleApprove(rec.id)}
                  className={`ml-4 px-4 py-2 rounded-lg font-medium transition-all ${
                    approvedItems.has(rec.id)
                      ? 'bg-green-500 text-white'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {approvedItems.has(rec.id) ? (
                    <span className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approved
                    </span>
                  ) : (
                    'Approve'
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action Bar */}
        <div className="sticky bottom-6 bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-white font-medium">
              {approvedItems.size} recommendations approved
            </div>
            <div className="text-gray-400 text-sm">
              Estimated savings: €{Math.round(approvedItems.size * 57383)} per year
            </div>
          </div>
          <button
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors"
            disabled={approvedItems.size === 0}
          >
            Generate Implementation Plan
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ReviewRecommendations;