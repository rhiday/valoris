import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { SummaryMetrics } from '../types';

interface SummaryCardsProps {
  metrics: SummaryMetrics;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ metrics }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-300">Past Run-Rate Spend</h3>
          <TrendingUp className="w-6 h-6 text-gray-400" />
        </div>
        <div className="text-4xl font-bold text-white mb-2">
          {formatCurrency(metrics.pastSpend)}
        </div>
        <p className="text-gray-400 text-sm">Annual procurement spend</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-300">Projected Run-Rate Spend</h3>
          <TrendingUp className="w-6 h-6 text-blue-400" />
        </div>
        <div className="text-4xl font-bold text-white mb-2">
          {formatCurrency(metrics.projectedSpend)}
        </div>
        <p className="text-blue-400 text-sm">
          +{Math.round(((metrics.projectedSpend - metrics.pastSpend) / metrics.pastSpend) * 100)}% projected growth
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-purple-500/20 to-green-500/20 border border-purple-500/30 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Potential Savings</h3>
          <TrendingDown className="w-6 h-6 text-green-400" />
        </div>
        <div className="text-4xl font-bold text-white mb-2">
          {formatCurrency(metrics.potentialSavings.min)} - {formatCurrency(metrics.potentialSavings.max)}
        </div>
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-green-400" />
          <p className="text-green-400 text-sm font-semibold">
            {metrics.roi}x ROI guaranteed
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SummaryCards;