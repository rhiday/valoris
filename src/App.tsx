import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import type { CompanyData, SpendAnalysis, SummaryMetrics } from './types';

function App() {
  const [currentStep, setCurrentStep] = useState<'onboarding' | 'dashboard'>('onboarding');
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [excelAnalysis, setExcelAnalysis] = useState<SpendAnalysis[] | null>(null);
  const [excelSummary, setExcelSummary] = useState<SummaryMetrics | null>(null);

  const handleOnboardingComplete = (data: CompanyData, analysis?: SpendAnalysis[], summary?: SummaryMetrics) => {
    console.log('[App] Onboarding complete with:', { data, analysis, summary });
    setCompanyData(data);
    if (analysis && summary) {
      setExcelAnalysis(analysis);
      setExcelSummary(summary);
    }
    setCurrentStep('dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-slate-900 to-primary-900">
      <AnimatePresence mode="wait">
        {currentStep === 'onboarding' ? (
          <Onboarding key="onboarding" onComplete={handleOnboardingComplete} />
        ) : (
          <Dashboard 
            key="dashboard" 
            companyData={companyData!}
            initialAnalysis={excelAnalysis}
            initialSummary={excelSummary}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
