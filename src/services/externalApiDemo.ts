import type { SpendAnalysis, SummaryMetrics, ExcelRow } from '../types';
import { handleApiError, logError, getErrorMessage } from '../utils/errorHandling';

// N8n API endpoints from environment variables
const STEP1_API_URL = import.meta.env.VITE_N8N_STEP1_URL || 'https://kenriippa.app.n8n.cloud/webhook/0bbb216c-d8e9-4e6d-961b-1241ec5c7bcb';
const STEP2_API_URL = import.meta.env.VITE_N8N_STEP2_URL || 'https://kenriippa.app.n8n.cloud/webhook/cdbfeea8-e5d0-4ce8-81ec-e4f532c5dd1b';
const API_KEY = import.meta.env.VITE_N8N_API_KEY || 'Y2mqY#lfHL2Yi$&W9RZWlO11tGmTEV*u';

interface ExternalApiResponse {
  analysis: SpendAnalysis[];
  summary: SummaryMetrics;
}

/**
 * Convert Excel data to Markdown table format for Step 1 API
 */
function convertToMarkdownTable(excelData: ExcelRow[]): string {
  if (!excelData || excelData.length === 0) {
    return '';
  }

  console.log('[Markdown] Converting Excel data to markdown table:', excelData.length, 'rows');
  console.log('[Markdown] Sample row:', excelData[0]);

  // Get all column headers from the first row
  const headers = Object.keys(excelData[0]);
  console.log('[Markdown] Headers:', headers);

  // Build markdown table
  const rows: string[] = [];
  
  // Add header row
  rows.push('| ' + headers.join(' | ') + ' |');
  
  // Add separator row
  rows.push('| ' + headers.map(() => '---').join(' | ') + ' |');
  
  // Add data rows
  excelData.forEach((row, index) => {
    const values = headers.map(header => {
      const value = row[header];
      // Convert null/undefined to empty string, otherwise convert to string
      return value === null || value === undefined ? '' : String(value);
    });
    rows.push('| ' + values.join(' | ') + ' |');
    
    // Log first few rows for debugging
    if (index < 3) {
      console.log(`[Markdown] Row ${index + 1}:`, values.join(' | '));
    }
  });

  const markdownTable = rows.join('\n');
  console.log('[Markdown] Generated markdown table:');
  console.log(markdownTable.substring(0, 800) + '...');
  console.log(`[Markdown] Table has ${excelData.length} data rows`);
  
  return markdownTable;
}

/**
 * Call Step 1: Excel → Table Format (Data Normalization)
 */
async function callStep1Api(excelData: ExcelRow[]): Promise<any> {
  
  const markdownTable = convertToMarkdownTable(excelData);
  
  console.log('[N8nAPI] Step 1 Request Headers:', {
    'Content-Type': 'application/json',
    'API-KEY': API_KEY.substring(0, 8) + '...'
  });
  console.log('[N8nAPI] Step 1 FULL Markdown Table being sent:');
  console.log(markdownTable);
  console.log('[N8nAPI] Step 1 Body JSON:', JSON.stringify({ csv_data: markdownTable }).substring(0, 500));
  
  const response = await fetch(STEP1_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'API-KEY': API_KEY,
    },
    body: JSON.stringify({
      csv_data: markdownTable  // n8n expects markdown table in csv_data field
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[N8nAPI] Step 1 failed:', response.status, errorText);
    throw handleApiError(response, errorText, 'Step 1 API');
  }

  // First get the response as text to see what we're getting
  const responseText = await response.text();
  console.log('[N8nAPI] Step 1 Raw Response:', responseText.substring(0, 500));
  
  // Try to parse as JSON
  try {
    const result = JSON.parse(responseText);
    return result;
  } catch (error) {
    console.error('[N8nAPI] Step 1 Response is not valid JSON:', responseText);
    throw new Error(`Step 1 returned invalid JSON: ${responseText.substring(0, 200)}`);
  }
}

/**
 * Call Step 2: Table Enrichment (find additional info, suggest alternatives)
 */
async function callStep2Api(normalizedData: any): Promise<any> {
  
  console.log('[N8nAPI] Step 2 Request Headers:', {
    'Content-Type': 'text/plain',
    'API-KEY': API_KEY.substring(0, 8) + '...'
  });
  console.log('[N8nAPI] Step 2 Body:', JSON.stringify(normalizedData).substring(0, 200) + '...');
  
  const response = await fetch(STEP2_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'API-KEY': API_KEY,
    },
    body: JSON.stringify(normalizedData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[N8nAPI] Step 2 failed:', response.status, errorText);
    throw handleApiError(response, errorText, 'Step 2 API');
  }

  // First get the response as text to see what we're getting
  const responseText = await response.text();
  console.log('[N8nAPI] Step 2 Raw Response:', responseText.substring(0, 500));
  
  // Try to parse as JSON
  try {
    const result = JSON.parse(responseText);
    return result;
  } catch (error) {
    console.error('[N8nAPI] Step 2 Response is not valid JSON:', responseText);
    throw new Error(`Step 2 returned invalid JSON: ${responseText.substring(0, 200)}`);
  }
}

/**
 * Convert external API response to our SpendAnalysis format
 */
function mapToSpendAnalysis(_step1Data: any, step2Data: any): SpendAnalysis[] {
  console.log('🔍 Mapping API response to SpendAnalysis format');
  console.log('🔍 step2Data keys:', step2Data ? Object.keys(step2Data) : 'null');
  
  // Check different possible response structures
  let analysisData: any[] = [];
  
  // Try different paths where the analysis data might be - n8n uses 'items'
  if (step2Data && step2Data.items && Array.isArray(step2Data.items)) {
    console.log('✅ Found items array at step2Data.items (n8n format)');
    analysisData = step2Data.items;
  } else if (step2Data && step2Data.analysis && Array.isArray(step2Data.analysis)) {
    console.log('✅ Found analysis array at step2Data.analysis');
    analysisData = step2Data.analysis;
  } else if (step2Data && Array.isArray(step2Data)) {
    console.log('✅ step2Data is already an array');
    analysisData = step2Data;
  } else if (step2Data && step2Data.data && Array.isArray(step2Data.data)) {
    console.log('✅ Found data array at step2Data.data');
    analysisData = step2Data.data;
  } else if (step2Data && step2Data.vendors && Array.isArray(step2Data.vendors)) {
    console.log('✅ Found vendors array at step2Data.vendors');
    analysisData = step2Data.vendors;
  } else if (step2Data && step2Data.result && Array.isArray(step2Data.result)) {
    console.log('✅ Found result array at step2Data.result');
    analysisData = step2Data.result;
  } else {
    console.warn('⚠️ Could not find analysis data in expected locations');
    console.warn('⚠️ step2Data structure:', JSON.stringify(step2Data, null, 2).slice(0, 300));
    return [];
  }
  
  console.log('📊 Processing', analysisData.length, 'vendors from API');
  
  return analysisData.map((item: any, index: number) => {
    // Map n8n response fields to dashboard format - using exact field names from n8n
    const vendorName = item.itemName || `Vendor ${index + 1}`;
    const pastSpend = Number(item.spend || 0);  // n8n returns spend as a number already (e.g., 349.81)
    
    // Calculate projected spend (5% increase assumption)
    const projectedSpend = pastSpend * 1.05;
    const projectedChange = `+5%`;
    
    // Calculate savings based on alternatives if available
    let minSavings = Math.round(pastSpend * 0.08);
    let maxSavings = Math.round(pastSpend * 0.15);
    let savingsPercentage = '-8 to -15%';
    
    // If alternatives exist, calculate potential savings from cheapest alternative
    if (item.alternatives && Array.isArray(item.alternatives) && item.alternatives.length > 0) {
      const alternativePrices = item.alternatives
        .map((alt: any) => {
          // Parse price strings like "108.50 €" 
          const priceStr = alt.price || alt.estimatedPrice || '0';
          const price = parseFloat(priceStr.replace(/[€,$\s]/g, ''));
          return isNaN(price) ? 0 : price;
        })
        .filter((price: number) => price > 0);
      
      if (alternativePrices.length > 0) {
        const cheapestPrice = Math.min(...alternativePrices);
        if (cheapestPrice < pastSpend) {
          minSavings = pastSpend - cheapestPrice;
          maxSavings = Math.round(pastSpend * 0.20); // Up to 20% with alternatives
          const savingsPercent = Math.round(((pastSpend - cheapestPrice) / pastSpend) * 100);
          savingsPercentage = `-${savingsPercent} to -20%`;
        }
      }
    }
    
    const savingsRange = `€${minSavings.toLocaleString()} to €${maxSavings.toLocaleString()}`;
    
    // Map alternatives with proper structure - using exact n8n field names
    const alternatives = (item.alternatives || []).map((alt: any) => ({
      vendor: alt.vendor || 'Alternative Vendor',
      estimatedPrice: alt.price || 'Price on request',
      feasibility: alt.feasibility || 'Contact vendor for details'
    }));
    
    // Calculate confidence based on alternatives count and data completeness
    let confidence = 0.70; // Base confidence
    if (alternatives.length > 0) confidence += 0.10;
    if (alternatives.length > 1) confidence += 0.10;
    if (item.additionalInformation && item.additionalInformation !== '-') confidence += 0.05;
    
    return {
      id: item.uniqueId || `vendor-${index + 1}`,
      vendor: vendorName,
      segment: 'Operations', // Default segment for dashboard
      category: item.subCategory || item.category || 'Hardware', // Use n8n's category fields
      type: item.category || 'MRO', // n8n returns "MRO" in category field
      item: vendorName + ' Analysis',
      pastSpend: pastSpend,
      projectedSpend: Math.round(projectedSpend * 100) / 100,
      projectedChange: projectedChange,
      savingsRange: savingsRange,
      savingsPercentage: savingsPercentage,
      confidence: Math.round(confidence * 100) / 100,
      alternatives: alternatives,
      details: {
        description: `Analysis for ${vendorName} - ${alternatives.length} alternatives found`,
        implementation: alternatives.length > 0 
          ? `Compare with ${alternatives.length} alternative(s) and negotiate terms`
          : 'Review contract terms and market alternatives',
        timeline: alternatives.length > 1 ? '30-60 days' : '45-90 days',
        riskLevel: alternatives.length > 0 ? 'Low' : 'Medium'
      }
    };
  });
}

/**
 * Generate summary metrics from analysis
 */
function generateSummaryMetrics(analysis: SpendAnalysis[]): SummaryMetrics {
  const totalPastSpend = analysis.reduce((sum, item) => sum + item.pastSpend, 0);
  const totalProjectedSpend = analysis.reduce((sum, item) => sum + item.projectedSpend, 0);
  
  // Standard analysis savings potential
  const savings = {
    min: totalPastSpend * 0.08, // 8% minimum savings
    max: totalPastSpend * 0.18  // 18% maximum savings
  };

  return {
    pastSpend: totalPastSpend,
    projectedSpend: totalProjectedSpend,
    potentialSavings: savings,
    roi: Math.round(((savings.min + savings.max) / 2) / totalPastSpend * 100)
  };
}


/**
 * Main function: Process Excel data through n8n APIs
 */
export async function processWithNormalAPIs(excelData: ExcelRow[]): Promise<ExternalApiResponse> {
  console.log('🚀 Starting Analysis with N8n APIs...');
  console.log('Processing', excelData.length, 'records');

  try {
    // Step 1: Data Normalization
    const step1Result = await callStep1Api(excelData);
    console.log('📊 Step 1 COMPLETE Result:', JSON.stringify(step1Result));
    console.log('📊 Step 1 normalizedData content:', step1Result.normalizedData);
    
    // Log what we're sending to Step 2
    console.log('📊 Sending to Step 2:', JSON.stringify(step1Result));
    
    const step2Result = await callStep2Api(step1Result);
    console.log('📊 Step 2 COMPLETE Result:', JSON.stringify(step2Result));
    console.log('📊 Step 2 Result type:', typeof step2Result);
    console.log('📊 Step 2 has analysis?:', step2Result?.analysis ? 'YES' : 'NO');
    
    const analysis = mapToSpendAnalysis(step1Result, step2Result);
    console.log('📊 Mapped analysis length:', analysis.length);
    
    if (!analysis || analysis.length === 0) {
      throw new Error('No analysis data returned from API mapping');
    }
    
    const summary = generateSummaryMetrics(analysis);
    
    console.log('✅ Analysis Complete with Live APIs!');
    console.log('Records processed:', analysis.length, '| Total spend: €' + summary.pastSpend.toLocaleString());
    
    return {
      analysis,
      summary
    };
    
  } catch (error) {
    logError('N8nAPI', error);
    console.error('❌ N8n API Error:', getErrorMessage(error));
    throw error; // Let the error bubble up instead of returning mock data
  }
}

/**
 * Test function to verify API connectivity
 */
export async function testAPIConnection(): Promise<boolean> {
  try {
    // Test with minimal data
    const testData = [
      {
        'Vendor Name': 'Test Vendor',
        'Annual Spend': '1000',
        'Category': 'Software'
      }
    ];
    
    console.log('[N8nAPI] Testing connection...');
    await callStep1Api(testData);
    
    console.log('[N8nAPI] ✅ Connection test successful');
    return true;
  } catch (error) {
    logError('N8nAPI Connection Test', error);
    return false;
  }
}