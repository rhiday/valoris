import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Calendar, CheckCircle, Clock, AlertCircle, Target } from 'lucide-react';

interface TrackProgressProps {
  onBack: () => void;
}

const TrackProgress = ({ onBack }: TrackProgressProps) => {
  const [timeFrame, setTimeFrame] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const progressData = {
    totalSavings: 234500,
    projectedSavings: 344300,
    completedInitiatives: 3,
    inProgressInitiatives: 2,
    plannedInitiatives: 1,
    roi: 67,
    actualRoi: 45
  };

  const initiatives = [
    {
      id: 1,
      title: 'GitHub Enterprise Seat Reduction',
      status: 'completed',
      startDate: '2024-01-15',
      completedDate: '2024-01-22',
      projectedSavings: 16800,
      actualSavings: 18200,
      progress: 100,
      milestones: [
        { name: 'Audit user accounts', completed: true, date: '2024-01-16' },
        { name: 'Identify inactive users', completed: true, date: '2024-01-17' },
        { name: 'Remove unused seats', completed: true, date: '2024-01-20' },
        { name: 'Validate savings', completed: true, date: '2024-01-22' }
      ]
    },
    {
      id: 2,
      title: 'Cloud Storage Tiering',
      status: 'completed',
      startDate: '2024-01-22',
      completedDate: '2024-02-05',
      projectedSavings: 26000,
      actualSavings: 28500,
      progress: 100,
      milestones: [
        { name: 'Analyze storage usage', completed: true, date: '2024-01-23' },
        { name: 'Create lifecycle policies', completed: true, date: '2024-01-26' },
        { name: 'Migrate cold data', completed: true, date: '2024-02-02' },
        { name: 'Monitor cost reduction', completed: true, date: '2024-02-05' }
      ]
    },
    {
      id: 3,
      title: 'Microsoft 365 License Optimization',
      status: 'completed',
      startDate: '2024-02-05',
      completedDate: '2024-02-26',
      projectedSavings: 67500,
      actualSavings: 65800,
      progress: 100,
      milestones: [
        { name: 'User activity audit', completed: true, date: '2024-02-07' },
        { name: 'License right-sizing', completed: true, date: '2024-02-15' },
        { name: 'User notifications', completed: true, date: '2024-02-20' },
        { name: 'Implementation complete', completed: true, date: '2024-02-26' }
      ]
    },
    {
      id: 4,
      title: 'AWS Reserved Instance Optimization',
      status: 'in-progress',
      startDate: '2024-02-26',
      projectedSavings: 84000,
      actualSavings: 0,
      progress: 65,
      milestones: [
        { name: 'Usage pattern analysis', completed: true, date: '2024-02-28' },
        { name: 'RI purchase plan', completed: true, date: '2024-03-05' },
        { name: 'Execute RI purchases', completed: false, date: null },
        { name: 'Monitor savings', completed: false, date: null }
      ]
    },
    {
      id: 5,
      title: 'Consulting Services Consolidation',
      status: 'in-progress',
      startDate: '2024-03-01',
      projectedSavings: 105000,
      actualSavings: 0,
      progress: 30,
      milestones: [
        { name: 'Vendor assessment', completed: true, date: '2024-03-08' },
        { name: 'Contract negotiations', completed: false, date: null },
        { name: 'Service consolidation', completed: false, date: null },
        { name: 'Cost validation', completed: false, date: null }
      ]
    },
    {
      id: 6,
      title: 'Consolidate BI Tools',
      status: 'planned',
      startDate: '2024-04-01',
      projectedSavings: 45000,
      actualSavings: 0,
      progress: 0,
      milestones: [
        { name: 'Tool inventory', completed: false, date: null },
        { name: 'Migration planning', completed: false, date: null },
        { name: 'User training', completed: false, date: null },
        { name: 'Tool sunset', completed: false, date: null }
      ]
    }
  ];

  const monthlyData = [
    { month: 'Jan', projected: 44800, actual: 46700 },
    { month: 'Feb', projected: 93500, actual: 94300 },
    { month: 'Mar', projected: 161000, actual: 112500 },
    { month: 'Apr', projected: 245000, actual: 0 },
    { month: 'May', projected: 289000, actual: 0 },
    { month: 'Jun', projected: 344300, actual: 0 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/20';
      case 'in-progress': return 'text-yellow-400 bg-yellow-500/20';
      case 'planned': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in-progress': return <Clock className="w-4 h-4" />;
      case 'planned': return <Calendar className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
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
              <h1 className="text-3xl font-bold text-white">Track Progress</h1>
              <p className="text-gray-400">Monitor savings and ROI in real-time</p>
            </div>
          </div>
          
          {/* Time Frame Selector */}
          <div className="flex space-x-2 bg-white/5 rounded-lg p-1">
            {['week', 'month', 'quarter', 'year'].map(frame => (
              <button
                key={frame}
                onClick={() => setTimeFrame(frame as any)}
                className={`px-4 py-2 rounded capitalize ${
                  timeFrame === frame ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {frame}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Actual Savings</h3>
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              €{progressData.totalSavings.toLocaleString()}
            </div>
            <div className="text-green-400 text-sm">
              {Math.round((progressData.totalSavings / progressData.projectedSavings) * 100)}% of target
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-300">ROI Achieved</h3>
              <Target className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">{progressData.actualRoi}x</div>
            <div className="text-gray-400 text-sm">Target: {progressData.roi}x</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-300">Completed</h3>
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {progressData.completedInitiatives}
            </div>
            <div className="text-gray-400 text-sm">of 6 initiatives</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-300">In Progress</h3>
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {progressData.inProgressInitiatives}
            </div>
            <div className="text-gray-400 text-sm">active projects</div>
          </div>
        </div>

        {/* Savings Chart */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Cumulative Savings Progress</h3>
          <div className="h-64">
            <div className="flex items-end justify-between h-full space-x-2">
              {monthlyData.map((data, index) => {
                const maxValue = Math.max(...monthlyData.map(d => d.projected));
                const projectedHeight = (data.projected / maxValue) * 100;
                const actualHeight = (data.actual / maxValue) * 100;
                
                return (
                  <div key={data.month} className="flex-1 flex flex-col items-center">
                    <div className="relative w-full h-48 flex items-end justify-center space-x-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${projectedHeight}%` }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gray-600 w-4 rounded-t"
                      />
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${actualHeight}%` }}
                        transition={{ delay: index * 0.1 + 0.2 }}
                        className="bg-green-500 w-4 rounded-t"
                      />
                    </div>
                    <div className="mt-2 text-xs text-gray-400">{data.month}</div>
                    <div className="text-xs text-white">
                      €{Math.round(data.actual / 1000)}k
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center space-x-6 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-600 rounded"></div>
                <span className="text-xs text-gray-400">Projected</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-xs text-gray-400">Actual</span>
              </div>
            </div>
          </div>
        </div>

        {/* Initiative Status */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Initiative Status</h3>
          <div className="space-y-4">
            {initiatives.map(initiative => (
              <motion.div
                key={initiative.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-white/10 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(initiative.status)}`}>
                      {getStatusIcon(initiative.status)}
                      <span className="capitalize">{initiative.status.replace('-', ' ')}</span>
                    </span>
                    <h4 className="text-white font-medium">{initiative.title}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">
                      €{initiative.actualSavings > 0 ? initiative.actualSavings.toLocaleString() : initiative.projectedSavings.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {initiative.actualSavings > 0 ? 'Actual' : 'Projected'}
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{initiative.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${initiative.progress}%` }}
                      className="bg-gradient-to-r from-purple-500 to-green-500 h-2 rounded-full"
                    />
                  </div>
                </div>

                {/* Milestones */}
                <div className="space-y-2">
                  {initiative.milestones.map((milestone, idx) => (
                    <div key={idx} className="flex items-center space-x-3 text-sm">
                      {milestone.completed ? (
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-gray-500 rounded-full flex-shrink-0" />
                      )}
                      <span className={milestone.completed ? 'text-white' : 'text-gray-400'}>
                        {milestone.name}
                      </span>
                      {milestone.date && (
                        <span className="text-xs text-gray-500 ml-auto">
                          {new Date(milestone.date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Alerts & Recommendations */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertCircle className="w-6 h-6 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Attention Required</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-white text-sm">
                  <strong>AWS Reserved Instance</strong> purchase delayed by 2 weeks
                </p>
                <p className="text-gray-400 text-xs">
                  Risk: Missing Q1 savings target. Recommend expediting budget approval.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-white text-sm">
                  <strong>Consulting consolidation</strong> negotiations taking longer than expected
                </p>
                <p className="text-gray-400 text-xs">
                  Consider phased approach to start realizing savings sooner.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TrackProgress;