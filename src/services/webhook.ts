import type { SpendAnalysis, SummaryMetrics } from '../types';

const ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/14544374/uddydcd/';

interface WebhookResponse {
  analysis: SpendAnalysis[];
  summary: SummaryMetrics;
}

// Function to fetch real data from local backend (which gets data from webhook)
export async function fetchWebhookData(): Promise<WebhookResponse> {
  console.log('[Webhook] Fetching data from local backend...');
  
  try {
    // First try to get data from our local backend server
    const response = await fetch('http://localhost:3001/api/webhook-data', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('No data available yet. Your colleague needs to send data first.');
      }
      throw new Error(`Backend request failed: ${response.status}`);
    }

    const rawData = await response.json();
    console.log('[Webhook] Raw backend response:', rawData);

    // Transform the webhook data to match our interface
    const transformedData = transformWebhookData(rawData);
    console.log('[Webhook] Transformed data:', transformedData);

    return transformedData;
  } catch (error) {
    console.error('[Webhook] Error fetching data:', error);
    throw error;
  }
}

// Function to send test data to the webhook (for Postman-like testing)
export async function sendTestDataToWebhook(testData: any): Promise<void> {
  console.log('[Webhook] Sending test data to webhook:', testData);
  
  try {
    const response = await fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('[Webhook] Test data sent, response:', response.status);
  } catch (error) {
    console.error('[Webhook] Error sending test data:', error);
    throw error;
  }
}

// Transform raw webhook data to our expected format
function transformWebhookData(rawData: any): WebhookResponse {
  console.log('[Webhook] Transforming raw data:', rawData);

  // Handle different possible webhook formats
  let vendors: any[] = [];
  
  if (Array.isArray(rawData)) {
    // Direct array of vendors
    vendors = rawData;
  } else if (rawData.vendors && Array.isArray(rawData.vendors)) {
    // Object with vendors array
    vendors = rawData.vendors;
  } else if (rawData.data && Array.isArray(rawData.data)) {
    // Object with data array
    vendors = rawData.data;
  } else {
    // Try to extract any array from the response
    const arrays = Object.values(rawData).filter(Array.isArray);
    if (arrays.length > 0) {
      vendors = arrays[0] as any[];
    }
  }

  console.log('[Webhook] Extracted vendors:', vendors);

  // Transform each vendor to our SpendAnalysis format
  const analysis: SpendAnalysis[] = vendors.map((vendor, index) => {
    // Handle different possible field names
    const vendorName = vendor.vendor || vendor.name || vendor.supplier || vendor.company || `Vendor ${index + 1}`;
    const currentSpend = parseFloat(vendor.spend || vendor.amount || vendor.cost || vendor.current_spend || 0);
    const category = vendor.category || vendor.type || vendor.segment || 'Other';
    
    // Calculate projected spend (10% growth)
    const projectedSpend = Math.round(currentSpend * 1.1);
    
    // Estimate savings (5-15% of projected)
    const minSavings = Math.round(projectedSpend * 0.05);
    const maxSavings = Math.round(projectedSpend * 0.15);
    
    return {
      id: vendor.id || `vendor-${index + 1}`,
      vendor: vendorName,
      segment: categorizeSegment(category),
      category: categorizeType(category),
      type: vendor.type || category,
      item: vendor.item || vendor.product || vendor.service || vendorName,
      pastSpend: currentSpend,
      projectedSpend: projectedSpend,
      projectedChange: '+10%',
      savingsRange: `€${minSavings.toLocaleString()} to €${maxSavings.toLocaleString()}`,
      savingsPercentage: '-5 to -15%',
      confidence: vendor.confidence || (currentSpend > 100000 ? 0.9 : 0.7),
      details: {
        description: vendor.description || `Optimize ${vendorName} spending through negotiation`,
        implementation: vendor.implementation || 'Review contract terms and usage patterns',
        timeline: vendor.timeline || '30-60 days',
        riskLevel: vendor.risk || (currentSpend > 200000 ? 'Medium' : 'Low') as 'Low' | 'Medium' | 'High'
      }
    };
  });

  // Calculate summary metrics
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
    roi: Math.round((maxSavings / (totalProjectedSpend * 0.02)) * 100) // Assume 2% implementation cost
  };

  return { analysis, summary };
}

// Helper function to categorize segment
function categorizeSegment(category: string): string {
  const cat = category.toLowerCase();
  if (cat.includes('software') || cat.includes('it') || cat.includes('tech')) return 'IT';
  if (cat.includes('marketing') || cat.includes('advertising')) return 'Marketing';
  if (cat.includes('sales') || cat.includes('crm')) return 'Sales';
  if (cat.includes('hr') || cat.includes('human')) return 'HR';
  if (cat.includes('finance') || cat.includes('accounting')) return 'Finance';
  return 'Operations';
}

// Helper function to categorize type
function categorizeType(category: string): string {
  const cat = category.toLowerCase();
  if (cat.includes('software') || cat.includes('app') || cat.includes('platform')) return 'Software';
  if (cat.includes('cloud') || cat.includes('saas') || cat.includes('hosting')) return 'Cloud';
  if (cat.includes('service') || cat.includes('consulting')) return 'Services';
  if (cat.includes('hardware') || cat.includes('equipment')) return 'Hardware';
  return 'Software'; // Default
}

// Create sample test data that your colleague can send
export const SAMPLE_WEBHOOK_DATA = {
  vendors: [
    {
      vendor: "Microsoft",
      category: "Software",
      spend: 450000,
      contract_end: "2025-12-31",
      licenses: 500
    },
    {
      vendor: "Salesforce",
      category: "CRM",
      spend: 185000,
      contract_end: "2025-03-31",
      users: 300
    },
    {
      vendor: "AWS",
      category: "Cloud",
      spend: 320000,
      contract_end: "2024-06-30"
    }
  ]
};

console.log('Sample data your colleague can send to webhook:', SAMPLE_WEBHOOK_DATA);