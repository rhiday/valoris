import { SpendAnalysis, SummaryMetrics, CompanyData } from '../types';

export const generateMockAnalysis = (companyData: CompanyData) => {
  const baseSpend = getBaseSpend(companyData.annualSpend);
  
  const analysis: SpendAnalysis[] = [
    {
      id: 'microsoft-1',
      vendor: 'Microsoft',
      segment: 'IT',
      category: 'Software',
      type: 'Office productivity suite',
      item: 'MS 365 E3',
      pastSpend: Math.round(baseSpend * 0.15),
      projectedSpend: Math.round(baseSpend * 0.165),
      projectedChange: '+10%',
      savingsRange: '€5,000 to €8,000',
      savingsPercentage: '-5 to -10%',
      confidence: 0.95,
      details: {
        description: 'Remove unused licenses and optimize user assignments based on activity data',
        implementation: 'Review user activity reports, identify inactive accounts, and right-size licenses',
        timeline: '30-45 days',
        riskLevel: 'Low'
      }
    },
    {
      id: 'microsoft-2',
      vendor: 'Microsoft',
      segment: 'IT',
      category: 'Software',
      type: 'Self-service BI tool',
      item: 'PowerBI',
      pastSpend: Math.round(baseSpend * 0.024),
      projectedSpend: Math.round(baseSpend * 0.025),
      projectedChange: '+5%',
      savingsRange: '€5,000 to €8,000',
      savingsPercentage: '-5 to -10%',
      confidence: 0.87,
      details: {
        description: 'Consolidate PowerBI licenses and optimize premium capacity allocation',
        implementation: 'Audit current usage, consolidate workspaces, and negotiate volume discounts',
        timeline: '45-60 days',
        riskLevel: 'Low'
      }
    },
    {
      id: 'microsoft-3',
      vendor: 'Microsoft',
      segment: 'IT',
      category: 'Software',
      type: 'Security suite',
      item: 'MS 365 E5 Security',
      pastSpend: Math.round(baseSpend * 0.065),
      projectedSpend: Math.round(baseSpend * 0.075),
      projectedChange: '+15%',
      savingsRange: '€5,000 to €8,000',
      savingsPercentage: '-5 to -10%',
      confidence: 0.92,
      details: {
        description: 'Right-size security licenses based on actual threat landscape and compliance needs',
        implementation: 'Security audit, feature utilization analysis, and tiered licensing approach',
        timeline: '60-90 days',
        riskLevel: 'Medium'
      }
    },
    {
      id: 'github-1',
      vendor: 'GitHub',
      segment: 'IT',
      category: 'Software',
      type: 'Dev. Productivity tool',
      item: 'GitHub Enterprise',
      pastSpend: Math.round(baseSpend * 0.028),
      projectedSpend: Math.round(baseSpend * 0.031),
      projectedChange: '+10%',
      savingsRange: '€5,000 to €8,000',
      savingsPercentage: '-5 to -10%',
      confidence: 0.89,
      details: {
        description: 'Optimize GitHub seats based on active developer count and usage patterns',
        implementation: 'Review commit history, identify inactive users, and adjust seat allocation',
        timeline: '15-30 days',
        riskLevel: 'Low'
      }
    },
    {
      id: 'visio-1',
      vendor: 'Microsoft',
      segment: 'IT',
      category: 'Software',
      type: 'Diagramming tool',
      item: 'Visio Plan 1',
      pastSpend: Math.round(baseSpend * 0.02),
      projectedSpend: Math.round(baseSpend * 0.021),
      projectedChange: '+5%',
      savingsRange: '€5,000 to €8,000',
      savingsPercentage: '-5 to -10%',
      confidence: 0.83,
      details: {
        description: 'Evaluate Visio usage and consider alternative diagramming tools or shared licenses',
        implementation: 'Usage analysis, alternative tool evaluation, and license consolidation',
        timeline: '30-45 days',
        riskLevel: 'Low'
      }
    }
  ];

  const totalPastSpend = analysis.reduce((sum, item) => sum + item.pastSpend, 0);
  const totalProjectedSpend = analysis.reduce((sum, item) => sum + item.projectedSpend, 0);
  const minSavings = Math.round(totalProjectedSpend * 0.05);
  const maxSavings = Math.round(totalProjectedSpend * 0.15);

  const summary: SummaryMetrics = {
    pastSpend: totalPastSpend,
    projectedSpend: totalProjectedSpend,
    potentialSavings: {
      min: minSavings,
      max: maxSavings
    },
    roi: 67
  };

  return { analysis, summary };
};

const getBaseSpend = (spendRange: string): number => {
  switch (spendRange) {
    case '€1M-€5M': return 3000000;
    case '€5M-€10M': return 7500000;
    case '€10M-€25M': return 17500000;
    case '€25M-€50M': return 37500000;
    case '€50M+': return 75000000;
    default: return 5000000;
  }
};