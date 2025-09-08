import type { SpendAnalysis, SummaryMetrics, ExcelRow } from '../types';
import { groupByVendor } from '../utils/dataExtraction';
import { handleApiError, handleConfigError, handleParsingError, handleNetworkError, logError } from '../utils/errorHandling';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

interface AnalysisResponse {
  analysis: SpendAnalysis[];
  summary: SummaryMetrics;
}

// STAGE 1: Data Extraction Prompt (extract exact values from Excel)
const NORMALIZATION_PROMPT = `You are a procurement data analyst. Extract the EXACT values from this Excel data without any calculations or modifications.

Task: Extract actual values from the Excel data and normalize into structured format. IMPORTANT: Process ALL vendors/suppliers found in the data - do not skip any!

Return a JSON object with this EXACT structure:

{
  "normalizedData": [
    {
      "id": "vendor-1",
      "vendorName": "Fastenal Company",
      "category": "Fasteners", 
      "subCategory": "Hardware Components",
      "annualSpend": 11571.68,
      "potentialSavings": 1080.62,
      "savingsPercentage": "9.3%",
      "contractDetails": "Current procurement order",
      "department": "Engineering",
      "additionalInfo": "Hex Head Cap Screw M8x25mm, 22513 pieces"
    }
  ]
}

CRITICAL RULES:
1. PROCESS EVERY VENDOR - create one entry for EACH unique vendor/supplier in the data
2. If using preprocessed/grouped data, use the vendor, spend, potentialSavings fields directly
3. If using raw Excel data: Use Supplier for vendorName, Total_Current_Cost for annualSpend
4. Keep EXACT decimal values (e.g., 11571.68, not 11572)
5. PRESERVE negative savings values - do not convert to positive
6. Include ALL vendors even if they have negative savings or small amounts
7. The normalizedData array must contain ALL vendors from the input
8. Use sequential IDs: vendor-1, vendor-2, vendor-3, etc.

Return ONLY the JSON object, no markdown, no explanation.`;

// STAGE 2: Data Presentation Prompt (using actual Excel values including savings)
const OPTIMIZATION_PROMPT = `You are a procurement data analyst. Convert ALL normalized vendor data into dashboard format using ACTUAL values from Excel.

IMPORTANT: You MUST process EVERY vendor from the normalizedData array - do not skip any vendors!

Based on the normalized vendor data provided, return a JSON object with this EXACT structure:

{
  "analysis": [
    {
      "id": "vendor-1",
      "vendor": "Fastenal Company",
      "segment": "Engineering",
      "category": "Fasteners",
      "type": "Hardware Components", 
      "item": "Hex Head Cap Screw M8x25mm",
      "pastSpend": 11571.68,
      "projectedSpend": 10491.06,
      "projectedChange": "-9.3%",
      "savingsRange": "€1,080.62",
      "savingsPercentage": "9.3%",
      "confidence": 1.0,
      "alternatives": [],
      "details": {
        "description": "Actual procurement data showing current vs market pricing",
        "implementation": "Market analysis shows potential cost optimization",
        "timeline": "Immediate opportunity",
        "riskLevel": "Low"
      }
    }
  ],
  "summary": {
    "pastSpend": 11571.68,
    "projectedSpend": 10491.06,
    "potentialSavings": {
      "min": 1080.62,
      "max": 1080.62
    },
    "roi": 9
  }
}

CRITICAL RULES:
1. CREATE ONE ENTRY in the analysis array for EACH vendor in normalizedData
2. The analysis array length MUST equal the normalizedData array length
3. Use exact values: annualSpend → pastSpend, potentialSavings → savingsRange
4. Calculate projectedSpend = pastSpend - potentialSavings (keep negatives)
5. Format savingsRange as currency: €X,XXX.XX (include negative sign if negative)
6. For negative savings: show as negative in savingsRange and projectedChange
7. Summary MUST include totals of ALL vendors (sum all pastSpend, projectedSpend, potentialSavings)
8. Do NOT skip vendors with small amounts or negative savings
9. Preserve exact decimal values (11571.68, not 11572)

Return ONLY the JSON object, no markdown, no explanation.`;

// Test OpenAI API connectivity
async function testOpenAIConnection(): Promise<boolean> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      }
    });
    
    if (response.ok) {
      return true;
    } else {
      const errorText = await response.text();
      console.error('[OpenAI] API connection test: ❌ Failed -', response.status, errorText);
      return false;
    }
  } catch (error) {
    logError('OpenAI Connection Test', error);
    return false;
  }
}

// Export test function for debugging
export { testOpenAIConnection };

export async function analyzeExcelData(excelData: ExcelRow[]): Promise<AnalysisResponse> {
  if (!OPENAI_API_KEY) {
    console.error('OpenAI API key not found. Using mock data.');
    throw handleConfigError('OpenAI API key not configured');
  }

  // Create a hash of the data to prevent duplicate requests
  const dataHash = await generateDataHash(JSON.stringify(excelData));
  
  // Check if there's already an active request for this data
  if (activeRequests.has(dataHash)) {
    console.log('[OpenAI] Reusing active request for identical data');
    return await activeRequests.get(dataHash)!;
  }

  // Create the request promise and store it to prevent duplicates
  const requestPromise = performAnalysis(excelData, dataHash);
  activeRequests.set(dataHash, requestPromise);
  
  try {
    const result = await requestPromise;
    return result;
  } finally {
    // Clean up the active request when done
    activeRequests.delete(dataHash);
  }
}

async function performAnalysis(excelData: any[], _dataHash: string): Promise<AnalysisResponse> {
  // Test API connection first
  const isConnected = await testOpenAIConnection();
  if (!isConnected) {
    throw handleNetworkError('OpenAI API connection failed', new Error('Check your API key and network'));
  }

  console.log('🚀 Starting two-stage analysis...');

  // Prepare data for analysis
  const cleanedData = groupByVendor(excelData);
  
  const shouldUseMarkdown = cleanedData.length === 0 || cleanedData.filter(row => row.spend > 0).length < 2;
  
  let finalData;
  if (shouldUseMarkdown) {
    finalData = convertToMarkdownTable(excelData);
  } else {
    finalData = cleanedData;
  }

  // Prepare prompt data
  let promptData;
  if (typeof finalData === 'string') {
    promptData = finalData;
  } else {
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
  }

  // Check data size to prevent API errors
  const dataSize = typeof promptData === 'string' ? promptData.length : JSON.stringify(promptData).length;
  if (dataSize > 50000) {
    console.warn('⚠️ Large data size detected:', dataSize, 'characters - analysis may take longer');
  }

  try {
    // ============= STAGE 1: DATA NORMALIZATION =============
    console.log('[Stage 1] Sending data to OpenAI for normalization...');
    
    const stage1Response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: NORMALIZATION_PROMPT
          },
          {
            role: 'user',
            content: typeof promptData === 'string' 
              ? `Normalize this procurement data:\n\n${promptData}`
              : `Normalize this procurement data:\n\n${JSON.stringify(promptData, null, 2)}`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 3000
      })
    });

    if (!stage1Response.ok) {
      const errorText = await stage1Response.text();
      console.error('[Stage 1] OpenAI API error details:');
      console.error('Status:', stage1Response.status);
      console.error('Response:', errorText);
      console.error('Request body preview:', JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'system',
          content: NORMALIZATION_PROMPT.substring(0, 200) + '...'
        }, {
          role: 'user', 
          content: (typeof promptData === 'string' ? promptData : JSON.stringify(promptData)).substring(0, 200) + '...'
        }],
        dataSize: typeof promptData === 'string' ? promptData.length : JSON.stringify(promptData).length
      }, null, 2));
      throw handleApiError(stage1Response, errorText, 'Stage 1 OpenAI API');
    }

    const stage1Result = await stage1Response.json();
    const stage1Content = stage1Result.choices[0].message.content;
    
    console.log('[Stage 1] Raw response:', stage1Content);
    
    let normalizedData;
    try {
      const cleanStage1Content = stage1Content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      normalizedData = JSON.parse(cleanStage1Content);
      console.log('[Stage 1] ✓ NORMALIZED OUTPUT:', JSON.stringify(normalizedData, null, 2));
    } catch (parseError) {
      console.error('[Stage 1] Failed to parse normalization response:', parseError);
      throw handleParsingError('Stage 1 normalization response');
    }

    // ============= STAGE 2: OPTIMIZATION ANALYSIS =============
    console.log('[Stage 2] Feeding normalized data into optimization analysis...');
    
    const stage2Response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: OPTIMIZATION_PROMPT
          },
          {
            role: 'user',
            content: `Provide optimization recommendations for this normalized procurement data:\n\n${JSON.stringify(normalizedData, null, 2)}`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    if (!stage2Response.ok) {
      const errorText = await stage2Response.text();
      console.error('[Stage 2] OpenAI API error details:');
      console.error('Status:', stage2Response.status);
      console.error('Response:', errorText);
      console.error('Normalized data size:', JSON.stringify(normalizedData).length, 'characters');
      throw handleApiError(stage2Response, errorText, 'Stage 2 OpenAI API');
    }

    const stage2Result = await stage2Response.json();
    const stage2Content = stage2Result.choices[0].message.content;
    
    console.log('[Stage 2] Raw response:', stage2Content);
    
    let analysis: AnalysisResponse;
    try {
      const cleanStage2Content = stage2Content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanStage2Content) as AnalysisResponse;
      console.log('[Stage 2] ✓ OPTIMIZATION OUTPUT:', JSON.stringify(analysis, null, 2));
    } catch (parseError) {
      console.error('[Stage 2] Failed to parse optimization response:', parseError);
      console.error('[Stage 2] Raw content:', stage2Content);
      throw handleParsingError('Stage 2 optimization response');
    }
    
    // Validate the response structure
    if (!analysis.analysis || !Array.isArray(analysis.analysis)) {
      console.error('[Stage 2] Invalid analysis structure:', analysis);
      throw new Error('Invalid response structure: missing analysis array');
    }
    
    if (!analysis.summary || typeof analysis.summary !== 'object') {
      console.error('[Stage 2] Invalid summary structure:', analysis);
      throw new Error('Invalid response structure: missing summary object');
    }

    // Add unique IDs if not present
    analysis.analysis = analysis.analysis.map((item, index) => ({
      ...item,
      id: item.id || `vendor-${index + 1}`
    }));

    console.log('✅ Two-stage analysis complete');
    console.log('[Final] Returning optimized analysis with', analysis.analysis.length, 'vendors');
    
    return analysis;
  } catch (error) {
    logError('Two-stage Analysis', error);
    throw error;
  }
}

// Lightweight function to parse Excel without blocking UI
export async function parseExcelFile(file: File): Promise<ExcelRow[]> {
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
        
        // Convert to JSON with better options for complex Excel files
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
          defval: '', // Default value for empty cells
          raw: false, // Format numbers as strings to preserve formatting
          dateNF: 'YYYY-MM-DD', // Normalize date format
          blankrows: false, // Skip blank rows
          header: 1 // Use first row as headers
        });
        
        // Handle merged cells and complex formatting by trying alternative parsing
        if (jsonData.length === 0 || Object.keys(jsonData[0] || {}).length < 2) {
          console.log('[Excel] Primary parsing failed, trying alternative parsing method');
          const alternativeData = XLSX.utils.sheet_to_json(firstSheet, {
            header: 'A', // Use column letters as keys
            defval: '',
            raw: false
          });
          
          if (alternativeData.length > 0) {
            console.log('[Excel] Alternative parsing successful, converting format');
            // Convert from column-letter format to more readable format
            const convertedData = alternativeData.map((row: any) => {
              const newRow: any = {};
              Object.keys(row).forEach((key, index) => {
                const columnName = row['A'] && index === 0 ? 'Header' : `Column_${key}`;
                newRow[columnName] = row[key];
              });
              return newRow;
            });
            resolve(convertedData);
            return;
          }
        }
        
        console.log('[Excel] Parsed', jsonData.length, 'rows with', Object.keys(jsonData[0] || {}).length, 'columns');
        
        resolve(jsonData as ExcelRow[]);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

// Function to parse CSV files with support for various delimiters and formats
export async function parseCsvFile(file: File): Promise<ExcelRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        console.log('[CSV] Raw CSV content preview:', text.slice(0, 500));
        
        // Detect delimiter (semicolon, comma, or tab)
        const delimiter = detectCsvDelimiter(text);
        console.log('[CSV] Detected delimiter:', delimiter === ';' ? 'semicolon' : delimiter === ',' ? 'comma' : 'tab');
        
        // Parse CSV content
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
          resolve([]);
          return;
        }
        
        // Extract headers
        const headers = lines[0].split(delimiter).map(h => h.trim());
        console.log('[CSV] Headers:', headers);
        
        // Parse data rows
        const data = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(delimiter);
          if (values.length > 1) { // Skip empty lines
            const row: any = {};
            headers.forEach((header, index) => {
              const value = values[index]?.trim() || '';
              // Convert European decimal format (0,514) to US format (0.514) for numbers
              row[header] = convertEuropeanDecimals(value);
            });
            data.push(row);
          }
        }
        
        console.log('[CSV] Parsed', data.length, 'rows, sample:', data[0]);
        resolve(data);
      } catch (error) {
        console.error('[CSV] Error parsing CSV file:', error);
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsText(file, 'utf-8');
  });
}

// Detect CSV delimiter by analyzing the first few lines
function detectCsvDelimiter(text: string): string {
  const lines = text.split('\n').slice(0, 3); // Check first 3 lines
  const delimiters = [';', ',', '\t'];
  
  let bestDelimiter = ',';
  let maxCount = 0;
  
  for (const delimiter of delimiters) {
    let totalCount = 0;
    for (const line of lines) {
      totalCount += (line.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
    }
    if (totalCount > maxCount) {
      maxCount = totalCount;
      bestDelimiter = delimiter;
    }
  }
  
  return bestDelimiter;
}

// Convert European decimal format to US format for parsing
function convertEuropeanDecimals(value: string): string {
  if (!value || typeof value !== 'string') return value;
  
  // Check if this looks like a European number (has comma as decimal separator)
  // Pattern: digits, optional comma with 2-3 digits after
  const europeanNumberPattern = /^\d+,\d{2,3}$/;
  
  if (europeanNumberPattern.test(value)) {
    // Convert comma to dot for US decimal format
    return value.replace(',', '.');
  }
  
  return value;
}

// Cache analysis results to avoid re-processing
const analysisCache = new Map<string, AnalysisResponse>();

// Prevent duplicate API calls for the same file
const activeRequests = new Map<string, Promise<AnalysisResponse>>();

export async function getCachedAnalysis(fileHash: string): Promise<AnalysisResponse | null> {
  return analysisCache.get(fileHash) || null;
}

export function cacheAnalysis(fileHash: string, analysis: AnalysisResponse): void {
  analysisCache.set(fileHash, analysis);
  
  // Clean up old cache entries if too many
  if (analysisCache.size > 10) {
    const firstKey = analysisCache.keys().next().value;
    if (firstKey) {
      analysisCache.delete(firstKey);
    }
  }
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

// Generate hash for data to prevent duplicate API calls
async function generateDataHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}