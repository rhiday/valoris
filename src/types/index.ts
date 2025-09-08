export interface CompanyData {
  name: string;
  industry: string;
  employeeCount: string;
  annualSpend: string;
}

export interface SpendAnalysis {
  id: string;
  vendor: string;
  segment: string; // 'IT' | 'Sales' | 'Marketing' | 'HR' | 'Finance' | 'Operations' | string
  category: string; // 'Software' | 'Hardware' | 'Services' | 'Cloud' | 'CRM' | 'Marketing' | 'HR' | 'Other' | string
  type: string;
  item: string;
  pastSpend: number;
  projectedSpend: number;
  projectedChange: string;
  savingsRange: string;
  savingsPercentage: string;
  confidence: number;
  alternatives?: VendorAlternative[];
  details: AnalysisDetails;
}

export interface AnalysisDetails {
  description: string;
  implementation: string;
  timeline: string;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface VendorAlternative {
  vendor: string;
  estimatedPrice: string;
  feasibility: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  extractedData?: ExcelRow[];
}

export interface ExcelRow {
  [key: string]: string | number | undefined;
}

export interface ProcessingStatus {
  [fileName: string]: 'processing' | 'completed' | 'error';
}

export interface ErrorMessages {
  [fileName: string]: string;
}

export interface CachedAnalysis {
  analysis: SpendAnalysis[];
  summary: SummaryMetrics;
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