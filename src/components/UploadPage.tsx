import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, BarChart3, Zap, Shield, CheckCircle } from 'lucide-react';
import FileUpload from './FileUpload';
import type { SpendAnalysis, SummaryMetrics } from '../types';

interface UploadPageProps {
  onAnalysisComplete: (analysis: SpendAnalysis[], summary: SummaryMetrics) => void;
  onBack?: () => void;
}

const UploadPage: React.FC<UploadPageProps> = ({ onAnalysisComplete, onBack }) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [, setIsAnalyzing] = useState(false);

  const handleFilesUploaded = (files: File[]) => {
    setUploadedFiles(files);
    setIsAnalyzing(true);
  };

  const handleAnalysisComplete = (analysis: SpendAnalysis[], summary: SummaryMetrics) => {
    setIsAnalyzing(false);
    onAnalysisComplete(analysis, summary);
  };

  const features = [
    {
      icon: Upload,
      title: 'Upload Your Data',
      description: 'Supports Excel, CSV, and PDF files with automatic format detection'
    },
    {
      icon: BarChart3,
      title: 'AI Analysis',
      description: 'Our advanced AI processes your data to identify optimization opportunities'
    },
    {
      icon: Zap,
      title: 'Instant Results',
      description: 'Get actionable insights and savings recommendations in minutes'
    }
  ];

  const benefits = [
    'Identify 5-15% cost reduction opportunities',
    'Vendor consolidation and negotiation strategies', 
    'Contract optimization recommendations',
    'Risk assessment and mitigation plans',
    'ROI projections with implementation timelines'
  ];

  const stats = [
    { value: '$2.3M+', label: 'Total Savings Generated' },
    { value: '150+', label: 'PE Firms Served' },
    { value: '67x', label: 'Average ROI' },
    { value: '90', label: 'Days to Results' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-slate-900 to-primary-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">Valoris</h1>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              Step 1 of 2: Upload Your Data
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Drag and drop your procurement data
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Upload your files to start AI-powered analysis and unlock hidden savings opportunities.
          </p>
        </motion.div>

        {/* Highlighted Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 rounded-3xl blur-lg opacity-20"></div>
            
            {/* Upload Container */}
            <div className="relative bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 lg:p-12">
              <FileUpload
                onFilesUploaded={handleFilesUploaded}
                uploadedFiles={uploadedFiles}
                onAnalysisComplete={handleAnalysisComplete}
              />
            </div>
          </div>
        </motion.div>

        {/* Information Sections */}
        <div className="grid lg:grid-cols-2 gap-12">
          
          {/* Process Steps */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-white">How it works:</h3>
            <div className="grid gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  className="flex items-start gap-4 p-6 bg-white/5 rounded-xl border border-white/10"
                >
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-2">{feature.title}</h4>
                    <p className="text-gray-400">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Benefits & Stats */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-8"
          >
            {/* What you'll get */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">What you'll discover:</h3>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-300">{benefit}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Proven Results</h3>
              <div className="grid grid-cols-2 gap-6">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-2xl lg:text-3xl font-bold text-purple-400 mb-2">
                      {stat.value}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Security Note */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6"
            >
              <div className="flex items-start gap-4">
                <Shield className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-purple-300 font-semibold mb-2">Enterprise Security</h4>
                  <p className="text-purple-200/80 text-sm">
                    Your data is encrypted with bank-grade security and processed in compliance with 
                    SOC 2 and GDPR standards. We never share or store sensitive information.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Support */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="text-center p-6 bg-white/5 border border-white/10 rounded-xl"
            >
              <h4 className="text-white font-semibold mb-2">Need Help?</h4>
              <p className="text-gray-400 text-sm mb-4">
                Our team is here to assist you with the upload and analysis process.
              </p>
              <a
                href="#"
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors text-sm"
              >
                Contact Support
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;