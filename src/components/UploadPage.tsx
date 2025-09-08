import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, BarChart3, Zap, Shield, HelpCircle } from 'lucide-react';
import FileUpload from './FileUpload';
import type { SpendAnalysis, SummaryMetrics } from '../types';

interface UploadPageProps {
  onAnalysisComplete: (analysis: SpendAnalysis[], summary: SummaryMetrics) => void;
  onBack?: () => void;
}

const UploadPage: React.FC<UploadPageProps> = ({ onAnalysisComplete, onBack }) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleFilesUploaded = (files: File[]) => {
    setUploadedFiles(files);
  };

  const handleAnalysisComplete = (analysis: SpendAnalysis[], summary: SummaryMetrics) => {
    onAnalysisComplete(analysis, summary);
  };

  const howItWorks = [
    {
      icon: Upload,
      title: 'Upload',
      description: 'Drop Excel/CSV files with your procurement data'
    },
    {
      icon: BarChart3,
      title: 'Analyze',
      description: 'AI identifies 5-15% savings opportunities'
    },
    {
      icon: Zap,
      title: 'Results',
      description: 'Get vendor alternatives & action plans instantly'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-primary-900 via-slate-900 to-primary-900"
    >
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <div className="flex items-center gap-3 mx-auto">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Valoris</h1>
                <p className="text-sm text-gray-400">Procurement Intelligence</p>
              </div>
            </div>
            {onBack && <div className="w-16" />}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Simple Title */}
        <div className="text-center mb-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-white mb-3"
          >
            Upload Your Procurement Data
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-300"
          >
            AI-powered spend analysis in minutes
          </motion.p>
        </div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <FileUpload
              onFilesUploaded={handleFilesUploaded}
              uploadedFiles={uploadedFiles}
              onAnalysisComplete={handleAnalysisComplete}
            />
          </div>
        </motion.div>

        {/* Simple 3-Column How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-3 gap-6 mb-16"
        >
          {howItWorks.map((step, index) => (
            <div key={step.title} className="text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <step.icon className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-400 text-sm">{step.description}</p>
            </div>
          ))}
        </motion.div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="border-t border-white/10 pt-8"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Enterprise Security */}
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-white font-medium">Enterprise Security</p>
                <p className="text-gray-400 text-sm">Bank-level encryption & SOC 2 compliant</p>
              </div>
            </div>

            {/* Need Help */}
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-white font-medium">Need Help?</p>
                <p className="text-gray-400 text-sm">support@valoris.ai • (555) 123-4567</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default UploadPage;