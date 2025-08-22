import React from 'react';
import { motion } from 'framer-motion';
import { Brain, FileText, BarChart3, CheckCircle } from 'lucide-react';

interface LoadingScreenProps {
  companyName: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ companyName }) => {
  const steps = [
    { icon: FileText, text: 'Processing uploaded documents', duration: 1000 },
    { icon: Brain, text: 'Analyzing procurement data with AI', duration: 1500 },
    { icon: BarChart3, text: 'Identifying cost optimization opportunities', duration: 1000 },
    { icon: CheckCircle, text: 'Generating savings recommendations', duration: 500 }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto bg-purple-500 rounded-full flex items-center justify-center mb-4">
            <Brain className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Analyzing {companyName}</h2>
          <p className="text-gray-300">Our AI is processing your procurement data...</p>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.5 }}
              className="flex items-center space-x-3 bg-white/5 border border-white/10 rounded-lg p-4"
            >
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <step.icon className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-white">{step.text}</span>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.5 + 0.8 }}
                className="ml-auto"
              >
                <CheckCircle className="w-5 h-5 text-green-400" />
              </motion.div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8">
          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
            <motion.div
              className="bg-purple-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 3, ease: 'easeInOut' }}
            />
          </div>
          <p className="text-gray-400 text-sm">This usually takes 30-60 seconds</p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;