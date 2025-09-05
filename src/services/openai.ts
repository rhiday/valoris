import type { SpendAnalysis, SummaryMetrics } from '../types';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

interface AnalysisResponse {
  analysis: SpendAnalysis[];
  summary: SummaryMetrics;
}

const ANALYSIS_PROMPT = `You are a procurement spend analysis expert. Analyze the provided Excel data and return a JSON response.

You MUST return a JSON object with EXACTLY this structure:

{
  "analysis": [
    {
      "id": "vendor-1",
      "vendor": "Microsoft",
      "segment": "IT",
      "category": "Software",
      "type": "Office Suite",
      "item": "MS 365 E3",
      "pastSpend": 450000,
      "projectedSpend": 495000,
      "projectedChange": "+10%",
      "savingsRange": "€22,500 to €49,500",
      "savingsPercentage": "-5 to -10%",
      "confidence": 0.92,
      "details": {
        "description": "Optimize licenses based on usage",
        "implementation": "Review user activity and remove unused licenses",
        "timeline": "30-45 days",
        "riskLevel": "Low"
      }
    }
  ],
  "summary": {
    "pastSpend": 450000,
    "projectedSpend": 495000,
    "potentialSavings": {
      "min": 24750,
      "max": 74250
    },
    "roi": 67
  }
}

RULES:
1. Create one analysis entry for EACH vendor in the data
2. All numbers must be actual numbers, not strings
3. Segment should be: IT, Sales, Marketing, HR, Operations, or Finance
4. Category should be: Software, Cloud, Services, or Hardware
5. Calculate projected spend as past spend * 1.08 to 1.15 (8-15% growth)
6. Savings range format: "€X to €Y" as a string
7. Confidence: 0.5 to 1.0 based on optimization potential
8. Summary must aggregate ALL vendors

Return ONLY the JSON object, no markdown, no explanation, no text before or after.`;

export async function analyzeExcelData(excelData: any[]): Promise<AnalysisResponse> {
  if (!OPENAI_API_KEY) {
    console.error('OpenAI API key not found. Using mock data.');
    throw new Error('OpenAI API key not configured');
  }

  console.log('[OpenAI] Raw Excel data received:', excelData.slice(0, 3));

  // Try multiple preprocessing approaches
  const cleanedData = preprocessExcelData(excelData);
  console.log('[OpenAI] Cleaned data:', cleanedData.slice(0, 3));
  
  // If cleaned data is empty or insufficient, try markdown approach
  const shouldUseMarkdown = cleanedData.length === 0 || cleanedData.filter(row => row.spend > 0).length < 2;
  
  let finalData;
  if (shouldUseMarkdown) {
    console.log('[OpenAI] Using markdown approach for better data extraction');
    finalData = convertToMarkdownTable(excelData);
  } else {
    finalData = cleanedData;
  }

  // Prepare data for OpenAI based on chosen method
  let promptData;
  
  if (typeof finalData === 'string') {
    // Markdown table approach
    promptData = finalData;
    console.log('[OpenAI] Using markdown table format');
  } else {
    // Traditional JSON approach
    const sampleData = finalData.slice(0, 100);
    promptData = {
      totalRows: finalData.length,
      sampleRows: sampleData,
      columns: Object.keys(finalData[0] || {}),
      dataQuality: {
        totalVendors: sampleData.filter(row => row.vendor).length,
        withSpendData: sampleData.filter(row => row.spend > 0).length,
        avgSpend: sampleData.reduce((sum, row) => sum + (row.spend || 0), 0) / sampleData.length
      }
    };
    console.log('[OpenAI] Using JSON format with', promptData.dataQuality.totalVendors, 'vendors');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: ANALYSIS_PROMPT
          },
          {
            role: 'user',
            content: typeof promptData === 'string' 
              ? `Analyze this procurement data table and provide spend optimization recommendations:\n\n${promptData}`
              : `Analyze this procurement data and provide spend optimization recommendations:\n\n${JSON.stringify(promptData, null, 2)}`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3, // Lower temperature for more consistent outputs
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error response:', errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('OpenAI API raw response:', result);
    
    // Get the content from the response
    const content = result.choices[0].message.content;
    console.log('OpenAI response content:', content);
    
    // Try to parse the JSON response
    let analysis: AnalysisResponse;
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanContent) as AnalysisResponse;
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.error('Raw content:', content);
      throw new Error('Failed to parse OpenAI response as JSON');
    }
    
    // Validate the response structure
    if (!analysis.analysis || !Array.isArray(analysis.analysis)) {
      console.error('Invalid analysis structure:', analysis);
      throw new Error('Invalid response structure: missing analysis array');
    }
    
    if (!analysis.summary || typeof analysis.summary !== 'object') {
      console.error('Invalid summary structure:', analysis);
      throw new Error('Invalid response structure: missing summary object');
    }

    // Add unique IDs if not present
    analysis.analysis = analysis.analysis.map((item, index) => ({
      ...item,
      id: item.id || `vendor-${index + 1}`
    }));

    return analysis;
  } catch (error) {
    console.error('Error analyzing Excel data:', error);
    throw error;
  }
}

// Lightweight function to parse Excel without blocking UI
export async function parseExcelFile(file: File): Promise<any[]> {
  // Dynamically import xlsx to keep initial bundle small
  const XLSX = await import('xlsx');
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Get the first worksheet
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
          defval: '', // Default value for empty cells
          raw: false  // Format numbers as strings to preserve formatting
        });
        
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

// Cache analysis results to avoid re-processing
const analysisCache = new Map<string, AnalysisResponse>();

export async function getCachedAnalysis(fileHash: string): Promise<AnalysisResponse | null> {
  return analysisCache.get(fileHash) || null;
}

export function cacheAnalysis(fileHash: string, analysis: AnalysisResponse): void {
  analysisCache.set(fileHash, analysis);
  
  // Clean up old cache entries if too many
  if (analysisCache.size > 10) {
    const firstKey = analysisCache.keys().next().value;
    analysisCache.delete(firstKey);
  }
}

// Preprocess Excel data to standardize field names and clean data
function preprocessExcelData(rawData: any[]): any[] {
  if (!rawData || rawData.length === 0) {
    console.warn('[OpenAI] No data to preprocess');
    return [];
  }

  console.log('[OpenAI] Preprocessing Excel data, sample row:', rawData[0]);
  
  return rawData.map((row, index) => {
    // Extract vendor name from various possible field names
    const vendor = extractField(row, [
      'vendor name', 'vendor', 'supplier', 'company name', 'company', 
      'contractor', 'provider', 'service provider', 'organization'
    ]);

    // Extract spend amount from various possible field names
    const spendText = extractField(row, [
      'annual spend (eur)', 'annual spend', 'spend', 'amount', 'cost', 
      'total cost', 'yearly cost', 'budget', 'expense', 'value',
      'contract value', 'total amount', 'price'
    ]);

    // Clean and parse spend amount
    const spend = parseSpendAmount(spendText);

    // Extract category/type
    const category = extractField(row, [
      'category', 'type', 'service type', 'product type', 
      'classification', 'service category'
    ]);

    // Extract segment/department
    const segment = extractField(row, [
      'segment', 'department', 'division', 'business unit',
      'area', 'function', 'team', 'group'
    ]);

    // Extract contract information
    const contractEnd = extractField(row, [
      'contract end date', 'contract end', 'expiry date', 'end date',
      'renewal date', 'expiration', 'contract expiry'
    ]);

    // Extract usage metrics
    const usage = extractField(row, [
      'licenses', 'users', 'seats', 'usage', 'volume',
      'quantity', 'count', 'instances'
    ]);

    // Create standardized row
    const cleanedRow = {
      vendor: vendor || `Unknown Vendor ${index + 1}`,
      spend: spend || 0,
      category: normalizeCategory(category),
      segment: normalizeSegment(segment),
      contractEnd: contractEnd || '',
      usage: usage || '',
      originalData: row // Keep original for reference
    };

    return cleanedRow;
  }).filter(row => row.vendor && row.spend > 0); // Only keep rows with vendor and spend data
}

// Extract field value from various possible column names
function extractField(row: any, possibleNames: string[]): string {
  for (const name of possibleNames) {
    // Try exact match first
    if (row[name] !== undefined && row[name] !== null) {
      return String(row[name]).trim();
    }
    
    // Try case-insensitive match
    const keys = Object.keys(row);
    const matchingKey = keys.find(key => 
      key.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(key.toLowerCase())
    );
    
    if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null) {
      return String(row[matchingKey]).trim();
    }
  }
  return '';
}

// Parse spend amount from various formats
function parseSpendAmount(spendText: string): number {
  if (!spendText) return 0;
  
  // Remove currency symbols and common formatting
  const cleaned = spendText
    .replace(/[€$£¥₹,\s]/g, '') // Remove currency symbols and commas
    .replace(/[^\d.-]/g, ''); // Keep only digits, dots, and dashes
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.abs(parsed); // Return absolute value
}

// Normalize category to standard values
function normalizeCategory(category: string): string {
  if (!category) return 'Other';
  
  const cat = category.toLowerCase();
  if (cat.includes('software') || cat.includes('saas') || cat.includes('application')) return 'Software';
  if (cat.includes('cloud') || cat.includes('hosting') || cat.includes('infrastructure')) return 'Cloud';
  if (cat.includes('service') || cat.includes('consulting') || cat.includes('support')) return 'Services';
  if (cat.includes('hardware') || cat.includes('equipment') || cat.includes('device')) return 'Hardware';
  if (cat.includes('marketing') || cat.includes('advertising')) return 'Marketing';
  if (cat.includes('hr') || cat.includes('human resources')) return 'HR';
  
  return category; // Return original if no match
}

// Normalize segment to standard departments
function normalizeSegment(segment: string): string {
  if (!segment) return 'Operations';
  
  const seg = segment.toLowerCase();
  if (seg.includes('it') || seg.includes('tech') || seg.includes('information')) return 'IT';
  if (seg.includes('sales') || seg.includes('revenue')) return 'Sales';
  if (seg.includes('marketing') || seg.includes('brand')) return 'Marketing';
  if (seg.includes('hr') || seg.includes('human') || seg.includes('people')) return 'HR';
  if (seg.includes('finance') || seg.includes('accounting') || seg.includes('financial')) return 'Finance';
  if (seg.includes('operations') || seg.includes('ops')) return 'Operations';
  
  return segment; // Return original if no match
}

// Convert Excel data to markdown table format for better AI comprehension
function convertToMarkdownTable(rawData: any[]): string {
  if (!rawData || rawData.length === 0) {
    return 'No data available';
  }

  console.log('[Markdown] Converting', rawData.length, 'rows to markdown table');
  
  // Get all unique column names from the data
  const allColumns = new Set<string>();
  rawData.forEach(row => {
    Object.keys(row).forEach(key => allColumns.add(key));
  });
  
  const columns = Array.from(allColumns).slice(0, 10); // Limit to 10 columns for readability
  console.log('[Markdown] Using columns:', columns);
  
  // Create markdown table header
  let markdown = `# Procurement Data Analysis\n\n`;
  markdown += `**Total Records:** ${rawData.length}\n\n`;
  markdown += `| ${columns.join(' | ')} |\n`;
  markdown += `| ${columns.map(() => '---').join(' | ')} |\n`;
  
  // Sort by spend amount and limit to top 12 rows for efficiency
  const sortedData = rawData.sort((a, b) => {
    const spendA = parseFloat(String(a['Annual Spend'] || a['Spend'] || a['Amount'] || a['Cost'] || 0).replace(/[^\d.-]/g, '')) || 0;
    const spendB = parseFloat(String(b['Annual Spend'] || b['Spend'] || b['Amount'] || b['Cost'] || 0).replace(/[^\d.-]/g, '')) || 0;
    return spendB - spendA; // Sort descending by spend
  });
  
  const limitedData = sortedData.slice(0, 12);
  
  limitedData.forEach(row => {
    const rowValues = columns.map(col => {
      const value = row[col];
      if (value === null || value === undefined) return '';
      
      // Clean up the value for markdown
      const cleanValue = String(value)
        .replace(/\|/g, '\\|') // Escape pipe characters
        .replace(/\n/g, ' ') // Replace newlines with spaces
        .trim();
        
      return cleanValue.slice(0, 100); // Limit cell content length
    });
    
    markdown += `| ${rowValues.join(' | ')} |\n`;
  });
  
  if (rawData.length > 12) {
    markdown += `\n*Note: Showing top 12 highest-spend vendors of ${rawData.length} total records*\n`;
  }
  
  markdown += `\n## Instructions\n`;
  markdown += `Please analyze this procurement data table and identify:\n`;
  markdown += `1. Vendor/supplier information\n`;
  markdown += `2. Annual spend amounts\n`;
  markdown += `3. Categories and segments\n`;
  markdown += `4. Potential cost optimization opportunities\n`;
  
  console.log(`[Markdown] Generated table with top ${limitedData.length} vendors (from ${rawData.length} total)`);
  console.log('[Markdown] Sample:', markdown.slice(0, 500) + '...');
  
  return markdown;
}

// Generate a simple hash for file caching
export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}