import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Info, ExternalLink } from 'lucide-react';
import { SpendAnalysis } from '../types';

interface AnalysisTableProps {
  data: SpendAnalysis[];
}

const AnalysisTable: React.FC<AnalysisTableProps> = ({ data }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getChangeColor = (change: string) => {
    if (change.startsWith('+')) return 'text-red-400';
    if (change.startsWith('-')) return 'text-green-400';
    return 'text-gray-400';
  };

  const toggleExpanded = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-4 px-4 text-gray-300 font-semibold">General Information</th>
            <th className="text-right py-4 px-4 text-gray-300 font-semibold">Spend (run-rate), €</th>
            <th className="text-right py-4 px-4 text-gray-300 font-semibold">Past</th>
            <th className="text-right py-4 px-4 text-gray-300 font-semibold">Projected</th>
            <th className="text-right py-4 px-4 text-gray-300 font-semibold">Savings</th>
            <th className="w-8"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <React.Fragment key={item.id}>
              <motion.tr
                className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => toggleExpanded(item.id)}
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              >
                <td className="py-4 px-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                        {item.vendor.charAt(0)}
                      </div>
                      <div>
                        <div className="text-white font-semibold">{item.vendor}</div>
                        <div className="text-gray-400 text-sm">{item.segment}</div>
                      </div>
                      <div
                        className="relative"
                        onMouseEnter={() => setHoveredCell(`vendor-${item.id}`)}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <Info className="w-4 h-4 text-gray-400 hover:text-purple-400 cursor-help" />
                        {hoveredCell === `vendor-${item.id}` && (
                          <div className="absolute z-10 bottom-full left-0 mb-2 w-64 bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm">
                            <p className="text-white font-medium mb-1">Hover for vendor information</p>
                            <p className="text-gray-300">
                              {item.vendor} is a leading provider in the {item.category.toLowerCase()} category.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-11">
                      <div className="text-gray-300">{item.category}</div>
                      <div className="text-gray-400 text-sm">{item.type}</div>
                      <div className="text-white font-medium">{item.item}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="text-white font-mono text-lg">
                    {formatCurrency(item.pastSpend)}
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="text-white font-mono">
                    {formatCurrency(item.projectedSpend)}
                  </div>
                  <div className={`text-sm font-medium ${getChangeColor(item.projectedChange)}`}>
                    ({item.projectedChange})
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="text-green-400 font-medium">
                    {item.savingsRange}
                  </div>
                  <div className="text-green-400 text-sm">
                    ({item.savingsPercentage})
                  </div>
                </td>
                <td className="py-4 px-4">
                  <ChevronDown 
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      expandedRow === item.id ? 'rotate-180' : ''
                    }`}
                  />
                </td>
              </motion.tr>
              
              <AnimatePresence>
                {expandedRow === item.id && (
                  <motion.tr
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <td colSpan={6} className="px-4 pb-4">
                      <div className="bg-white/5 rounded-lg p-4 ml-11">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-white font-semibold mb-2">Optimization Details</h4>
                            <p className="text-gray-300 text-sm mb-2">{item.details.description}</p>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400 text-sm">Confidence:</span>
                              <div className="flex-1 bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-green-400 h-2 rounded-full"
                                  style={{ width: `${item.confidence * 100}%` }}
                                />
                              </div>
                              <span className="text-green-400 text-sm font-medium">
                                {Math.round(item.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-white font-semibold mb-2">Implementation</h4>
                            <p className="text-gray-300 text-sm mb-2">{item.details.implementation}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-sm">Timeline: {item.details.timeline}</span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                item.details.riskLevel === 'Low' ? 'bg-green-500/20 text-green-400' :
                                item.details.riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {item.details.riskLevel} Risk
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                )}
              </AnimatePresence>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AnalysisTable;