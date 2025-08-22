import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import { CompanyData } from './types';

function App() {
  const [currentStep, setCurrentStep] = useState<'onboarding' | 'dashboard'>('onboarding');
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);

  const handleOnboardingComplete = (data: CompanyData) => {
    setCompanyData(data);
    setCurrentStep('dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-slate-900 to-primary-900">
      <AnimatePresence mode="wait">
        {currentStep === 'onboarding' ? (
          <Onboarding key="onboarding" onComplete={handleOnboardingComplete} />
        ) : (
          <Dashboard key="dashboard" companyData={companyData!} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
