export interface CompanyData {
  name: string;
  industry: string;
  employeeCount: string;
  annualSpend: string;
}

export interface SpendAnalysis {
  id: string;
  vendor: string;
  segment: string;
  category: string;
  type: string;
  item: string;
  pastSpend: number;
  projectedSpend: number;
  projectedChange: string;
  savingsRange: string;
  savingsPercentage: string;
  confidence: number;
  details: {
    description: string;
    implementation: string;
    timeline: string;
    riskLevel: 'Low' | 'Medium' | 'High';
  };
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  extractedData?: any;
}

export interface SummaryMetrics {
  pastSpend: number;
  projectedSpend: number;
  potentialSavings: {
    min: number;
    max: number;
  };
  roi: number;
}