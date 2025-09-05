import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Building2, Upload, FileText, BarChart3 } from 'lucide-react';
import type { CompanyData, SpendAnalysis, SummaryMetrics } from '../types';
import FileUpload from './FileUpload';

interface OnboardingProps {
  onComplete: (data: CompanyData, analysis?: SpendAnalysis[], summary?: SummaryMetrics) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: '',
    industry: '',
    employeeCount: '',
    annualSpend: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [analysisData, setAnalysisData] = useState<SpendAnalysis[] | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryMetrics | null>(null);

  const steps = [
    {
      title: 'Welcome to Valoris',
      subtitle: 'AI-powered procurement optimization for PE firms',
      content: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-purple-500 rounded-full flex items-center justify-center">
            <BarChart3 className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white">Reduce costs by 5-15% with guaranteed ROI</h3>
            <p className="text-gray-300 max-w-md mx-auto">
              Our AI analyzes your procurement data and identifies optimization opportunities 
              with 67x ROI guarantee in under 90 days.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-purple-500/20 rounded-lg flex items-center justify-center mb-2">
                <FileText className="w-6 h-6 text-purple-400" />
              </div>
              <p className="text-sm text-gray-400">Upload Data</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-purple-500/20 rounded-lg flex items-center justify-center mb-2">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <p className="text-sm text-gray-400">AI Analysis</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-purple-500/20 rounded-lg flex items-center justify-center mb-2">
                <Building2 className="w-6 h-6 text-purple-400" />
              </div>
              <p className="text-sm text-gray-400">Save Money</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Company Information',
      subtitle: 'Tell us about your portfolio company',
      content: (
        <div className="space-y-6 max-w-md mx-auto">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
            <input
              type="text"
              value={companyData.name}
              onChange={(e) => setCompanyData({...companyData, name: e.target.value})}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter company name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Industry</label>
            <select
              value={companyData.industry}
              onChange={(e) => setCompanyData({...companyData, industry: e.target.value})}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select industry</option>
              <option value="Technology">Technology</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Financial Services">Financial Services</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Retail">Retail</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Employee Count</label>
            <select
              value={companyData.employeeCount}
              onChange={(e) => setCompanyData({...companyData, employeeCount: e.target.value})}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select size</option>
              <option value="50-100">50-100 employees</option>
              <option value="100-250">100-250 employees</option>
              <option value="250-500">250-500 employees</option>
              <option value="500-1000">500-1000 employees</option>
              <option value="1000+">1000+ employees</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Annual Procurement Spend</label>
            <select
              value={companyData.annualSpend}
              onChange={(e) => setCompanyData({...companyData, annualSpend: e.target.value})}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select range</option>
              <option value="€1M-€5M">€1M - €5M</option>
              <option value="€5M-€10M">€5M - €10M</option>
              <option value="€10M-€25M">€10M - €25M</option>
              <option value="€25M-€50M">€25M - €50M</option>
              <option value="€50M+">€50M+</option>
            </select>
          </div>
        </div>
      )
    },
    {
      title: 'Data Sources',
      subtitle: 'What data will you provide for analysis?',
      content: (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <FileText className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Contracts</h3>
              <p className="text-gray-400 text-sm">Vendor agreements, terms, and pricing structures</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <Upload className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Invoices / Receipts</h3>
              <p className="text-gray-400 text-sm">Financial records and payment documentation</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <BarChart3 className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Usage Data</h3>
              <p className="text-gray-400 text-sm">Microsoft reports, app activity, and utilization metrics</p>
            </div>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <p className="text-purple-200 text-sm">
              <strong>Note:</strong> All data is processed securely and encrypted. We never store sensitive information permanently.
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Upload Files',
      subtitle: 'Drag and drop your procurement data',
      content: (
        <div className="max-w-2xl mx-auto">
          <FileUpload 
            onFilesUploaded={setUploadedFiles}
            uploadedFiles={uploadedFiles}
            onAnalysisComplete={(analysis, summary) => {
              console.log('[Onboarding] Analysis received from FileUpload:', { analysis, summary });
              setAnalysisData(analysis);
              setSummaryData(summary);
            }}
          />
        </div>
      )
    }
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return companyData.name && companyData.industry && companyData.employeeCount && companyData.annualSpend;
      case 3:
        return uploadedFiles.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Pass analysis data if available from Excel upload
      onComplete(companyData, analysisData || undefined, summaryData || undefined);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index <= currentStep ? 'bg-purple-500' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">{steps[currentStep].title}</h1>
          <p className="text-xl text-gray-300">{steps[currentStep].subtitle}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-8">
          {steps[currentStep].content}
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-6 py-3 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="px-8 py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg flex items-center space-x-2 transition-colors"
          >
            <span>{currentStep === steps.length - 1 ? 'Start Analysis' : 'Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;