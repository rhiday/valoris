import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, DollarSign, Users, AlertTriangle, TrendingUp, Clock, Target } from 'lucide-react';

interface PrioritizeImplementationProps {
  onBack: () => void;
}

interface Initiative {
  id: string;
  title: string;
  vendor: string;
  savings: number;
  effort: 'Low' | 'Medium' | 'High';
  timeWeeks: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  dependencies: string[];
  team: string[];
  status: 'not-started' | 'in-progress' | 'completed';
  priority: number;
}

const PrioritizeImplementation: React.FC<PrioritizeImplementationProps> = ({ onBack }) => {
  const [view, setView] = useState<'matrix' | 'timeline' | 'list'>('matrix');
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);

  const initiatives: Initiative[] = [
    {
      id: 'init-1',
      title: 'GitHub Enterprise Seat Reduction',
      vendor: 'GitHub',
      savings: 16800,
      effort: 'Low',
      timeWeeks: 1,
      riskLevel: 'Low',
      dependencies: [],
      team: ['IT Admin', 'DevOps Lead'],
      status: 'not-started',
      priority: 1
    },
    {
      id: 'init-2',
      title: 'Cloud Storage Tiering',
      vendor: 'AWS/Azure',
      savings: 26000,
      effort: 'Low',
      timeWeeks: 2,
      riskLevel: 'Low',
      dependencies: [],
      team: ['Cloud Architect', 'IT Admin'],
      status: 'not-started',
      priority: 2
    },
    {
      id: 'init-3',
      title: 'Microsoft 365 License Optimization',
      vendor: 'Microsoft',
      savings: 67500,
      effort: 'Low',
      timeWeeks: 3,
      riskLevel: 'Low',
      dependencies: ['User audit complete'],
      team: ['IT Admin', 'HR', 'Department Heads'],
      status: 'not-started',
      priority: 3
    },
    {
      id: 'init-4',
      title: 'AWS Reserved Instance Optimization',
      vendor: 'AWS',
      savings: 84000,
      effort: 'Medium',
      timeWeeks: 4,
      riskLevel: 'Medium',
      dependencies: ['Usage analysis', 'Budget approval'],
      team: ['Cloud Architect', 'Finance', 'DevOps'],
      status: 'not-started',
      priority: 4
    },
    {
      id: 'init-5',
      title: 'Consulting Services Consolidation',
      vendor: 'Various',
      savings: 105000,
      effort: 'Medium',
      timeWeeks: 12,
      riskLevel: 'Medium',
      dependencies: ['Vendor evaluation', 'Contract reviews'],
      team: ['Procurement', 'Legal', 'Department Heads'],
      status: 'not-started',
      priority: 5
    },
    {
      id: 'init-6',
      title: 'Consolidate BI Tools',
      vendor: 'Multiple',
      savings: 45000,
      effort: 'High',
      timeWeeks: 24,
      riskLevel: 'High',
      dependencies: ['User training', 'Data migration', 'Report conversion'],
      team: ['Data Team', 'IT', 'All Departments'],
      status: 'not-started',
      priority: 6
    }
  ];

  const getEffortScore = (effort: string) => {
    switch (effort) {
      case 'Low': return 1;
      case 'Medium': return 2;
      case 'High': return 3;
      default: return 2;
    }
  };

  const getImpactScore = (savings: number) => {
    if (savings > 80000) return 3;
    if (savings > 40000) return 2;
    return 1;
  };

  const MatrixView = () => (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Impact vs Effort Matrix</h3>
      <div className="relative h-96">
        {/* Grid */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
          {/* Quick Wins (High Impact, Low Effort) */}
          <div className="border-r border-b border-white/10 p-2">
            <span className="text-xs text-gray-500">Low Priority</span>
          </div>
          <div className="border-r border-b border-white/10 p-2">
            <span className="text-xs text-gray-500">Fill Ins</span>
          </div>
          <div className="border-b border-white/10 p-2">
            <span className="text-xs text-gray-500">Fill Ins</span>
          </div>
          
          <div className="border-r border-b border-white/10 p-2">
            <span className="text-xs text-gray-500">Fill Ins</span>
          </div>
          <div className="border-r border-b border-white/10 p-2 bg-yellow-500/10">
            <span className="text-xs text-yellow-400">Major Projects</span>
          </div>
          <div className="border-b border-white/10 p-2 bg-purple-500/10">
            <span className="text-xs text-purple-400">Strategic</span>
          </div>
          
          <div className="border-r border-white/10 p-2 bg-green-500/10">
            <span className="text-xs text-green-400">Quick Wins</span>
          </div>
          <div className="border-r border-white/10 p-2 bg-green-500/10">
            <span className="text-xs text-green-400">Quick Wins</span>
          </div>
          <div className="p-2 bg-purple-500/10">
            <span className="text-xs text-purple-400">Strategic</span>
          </div>
        </div>
        
        {/* Plot initiatives */}
        {initiatives.map(init => {
          const x = getEffortScore(init.effort);
          const y = 4 - getImpactScore(init.savings);
          const left = `${(x - 1) * 33.33 + 16.66}%`;
          const top = `${(y - 1) * 33.33 + 16.66}%`;
          
          return (
            <motion.div
              key={init.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left, top }}
              onClick={() => setSelectedInitiative(init)}
            >
              <div className="bg-purple-500 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold hover:bg-purple-600 transition-colors">
                {init.priority}
              </div>
              <div className="absolute top-full mt-1 text-xs text-white whitespace-nowrap">
                {init.title.split(' ').slice(0, 2).join(' ')}
              </div>
            </motion.div>
          );
        })}
        
        {/* Axes labels */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-gray-400 text-sm">
          Effort →
        </div>
        <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 -rotate-90 text-gray-400 text-sm">
          Impact →
        </div>
      </div>
    </div>
  );

  const TimelineView = () => {
    const weeks = 24;
    const currentWeek = 0;
    
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Implementation Timeline</h3>
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* Timeline header */}
            <div className="flex mb-4 text-xs text-gray-400">
              {Array.from({ length: weeks / 4 }, (_, i) => (
                <div key={i} className="flex-1 text-center">
                  Month {i + 1}
                </div>
              ))}
            </div>
            
            {/* Timeline bars */}
            <div className="space-y-3">
              {initiatives.map(init => {
                const startWeek = initiatives
                  .slice(0, initiatives.indexOf(init))
                  .reduce((sum, i) => sum + i.timeWeeks, 0);
                const width = (init.timeWeeks / weeks) * 100;
                const left = (startWeek / weeks) * 100;
                
                return (
                  <div key={init.id} className="relative h-12">
                    <div className="absolute inset-y-0 left-0 w-32 flex items-center">
                      <span className="text-sm text-white truncate">
                        {init.title.split(' ').slice(0, 2).join(' ')}
                      </span>
                    </div>
                    <div className="ml-36 relative h-full">
                      <div className="absolute inset-0 bg-white/5 rounded"></div>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${width}%` }}
                        className="absolute inset-y-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded"
                        style={{ left: `${left}%` }}
                      >
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-white">
                          €{(init.savings / 1000).toFixed(0)}k
                        </div>
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Cumulative savings */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Cumulative Savings</span>
                <span className="text-2xl font-bold text-green-400">
                  €{initiatives.reduce((sum, init) => sum + init.savings, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ListView = () => (
    <div className="space-y-4">
      {initiatives.map(init => (
        <motion.div
          key={init.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors cursor-pointer"
          onClick={() => setSelectedInitiative(init)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {init.priority}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{init.title}</h3>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-sm text-gray-400">{init.vendor}</span>
                  <span className="text-sm text-gray-400">•</span>
                  <span className="text-sm text-gray-400">{init.timeWeeks} weeks</span>
                  <span className="text-sm text-gray-400">•</span>
                  <span className={`text-sm ${
                    init.effort === 'Low' ? 'text-green-400' :
                    init.effort === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {init.effort} effort
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">
                €{init.savings.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">annual savings</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

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
              <h1 className="text-3xl font-bold text-white">Prioritize Implementation</h1>
              <p className="text-gray-400">Start with high-impact, low-effort optimizations</p>
            </div>
          </div>
          
          {/* View Switcher */}
          <div className="flex space-x-2 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setView('matrix')}
              className={`px-4 py-2 rounded ${view === 'matrix' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Matrix
            </button>
            <button
              onClick={() => setView('timeline')}
              className={`px-4 py-2 rounded ${view === 'timeline' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Timeline
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded ${view === 'list' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              List
            </button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Savings</span>
              <DollarSign className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">€344k</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Quick Wins</span>
              <Target className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">3</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Avg Time</span>
              <Clock className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-white">8 weeks</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Teams Involved</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">7</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Risk Level</span>
              <AlertTriangle className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-white">Low</div>
          </div>
        </div>

        {/* Main Content */}
        {view === 'matrix' && <MatrixView />}
        {view === 'timeline' && <TimelineView />}
        {view === 'list' && <ListView />}

        {/* Selected Initiative Detail */}
        {selectedInitiative && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Initiative Details: {selectedInitiative.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-sm text-gray-400 mb-2">Key Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Annual Savings</span>
                    <span className="text-green-400 font-medium">€{selectedInitiative.savings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Implementation Time</span>
                    <span className="text-white font-medium">{selectedInitiative.timeWeeks} weeks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Effort Level</span>
                    <span className="text-white font-medium">{selectedInitiative.effort}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm text-gray-400 mb-2">Dependencies</h4>
                {selectedInitiative.dependencies.length > 0 ? (
                  <ul className="space-y-1">
                    {selectedInitiative.dependencies.map((dep, idx) => (
                      <li key={idx} className="text-gray-300 text-sm">• {dep}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-300 text-sm">No dependencies</p>
                )}
              </div>
              
              <div>
                <h4 className="text-sm text-gray-400 mb-2">Teams Required</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedInitiative.team.map((member, idx) => (
                    <span key={idx} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-sm">
                      {member}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default PrioritizeImplementation;