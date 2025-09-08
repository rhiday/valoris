import type { SpendAnalysis, SummaryMetrics, ExcelRow } from '../types';
import { groupByVendor } from '../utils/dataExtraction';
import { handleApiError, handleConfigError, handleParsingError, handleNetworkError, logError } from '../utils/errorHandling';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const N8N_NORMALIZATION_URL = import.meta.env.VITE_N8N_NORMALIZATION_URL || '';
const N8N_ENRICHMENT_URL = import.meta.env.VITE_N8N_ENRICHMENT_URL || '';
const N8N_KEY = import.meta.env?.VITE_N8N_KEY as string || 'KEY';

interface AnalysisResponse {
  analysis: SpendAnalysis[];
  summary: SummaryMetrics;
}

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

export async function analyzeExcelData(excelData: Record<string, unknown>[]): Promise<AnalysisResponse> {
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
  const requestPromise = performAnalysis(excelData);
  activeRequests.set(dataHash, requestPromise);
  
  try {
    const result = await requestPromise;
    return result;
  } finally {
    // Clean up the active request when done
    activeRequests.delete(dataHash);
  }
}

async function performAnalysis(excelData: Record<string, unknown>[]): Promise<AnalysisResponse> {
  // Test API connection first
  const isConnected = await testOpenAIConnection();
  if (!isConnected) {
    throw handleNetworkError('OpenAI API connection failed', new Error('Check your API key and network'));
  }

  console.log('🚀 Starting two-stage analysis...');

  // Prepare data for analysis
  const cleanedData = groupByVendor(excelData);
  
  const shouldUseMarkdown = cleanedData.length === 0 || cleanedData.filter(row => (row.spend as number) > 0).length < 2;
  
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
        withSpendData: sampleData.filter(row => (row.spend as number) > 0).length,
        avgSpend: sampleData.reduce((sum, row) => sum + ((row.spend as number) || 0), 0) / sampleData.length
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
    console.log('\n=== STAGE 1: DATA NORMALIZATION ===');
    console.log('[Stage 1] Sending data to n8n for normalization...');
    console.log(promptData);

    const stage1Response = await fetch(N8N_NORMALIZATION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-KEY': N8N_KEY,
      },
      body: JSON.stringify(promptData),
    });
    

    const stage1Result = await stage1Response.json();
    //const stage1Content = stage1Result.choices[0].message.content;
    const stage1Content = stage1Result.normalizedData;
    
    console.log('[Stage 1] Raw response:', stage1Content);
    
    // ============= STAGE 2: OPTIMIZATION ANALYSIS =============
    console.log('[Stage 2] Feeding normalized data into optimization analysis...');

    const stage2Response = await fetch(N8N_ENRICHMENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-KEY': N8N_KEY,
      },
      body: JSON.stringify(stage1Content),
    });

    if (!stage2Response.ok) {
      const errorText = await stage2Response.text();
      console.error('[Stage 2] API error details:');
      console.error('Status:', stage2Response.status);
      console.error('Response:', errorText);
      throw new Error(`Stage 2 API error: ${stage2Response.status} - ${errorText}`);
    }

    const stage2Result = await stage2Response.json();
    console.log('[Stage 2] Response:', stage2Result);
    
    const analysis = stage2Result;
    
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
    analysis.analysis = analysis.analysis.map((item: Record<string, unknown>, index: number) => ({
      ...item,
      id: item.id || `vendor-${index + 1}`
    }));


    console.log('\n=== TWO-STAGE ANALYSIS COMPLETE ===');
    console.log('[Final] Returning optimized analysis with', analysis.analysis.length, 'vendors');
    
    return analysis;
  } catch (error) {
    logError('Two-stage Analysis', error);
    throw error;
  }
}

// Lightweight function to parse Excel without blocking UI
export async function parseExcelFile(file: File): Promise<Record<string, unknown>[]> {
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
            const convertedData = (alternativeData as Record<string, unknown>[]).map((row: Record<string, unknown>) => {
              const newRow: Record<string, unknown> = {};
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
        
        resolve(jsonData as Record<string, unknown>[]);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

// Function to parse CSV files with support for various delimiters and formats
export async function parseCsvFile(file: File): Promise<Record<string, unknown>[]> {
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
            const row: Record<string, unknown> = {};
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

// Preprocess Excel data to standardize field names and clean data
function preprocessExcelData(rawData: Record<string, unknown>[]): Record<string, unknown>[] {
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
function extractField(row: Record<string, unknown>, possibleNames: string[]): string {
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

// Parse spend amount from various formats including European decimal notation
function parseSpendAmount(spendText: string): number {
  if (!spendText) return 0;
  
  const text = String(spendText).trim();
  console.log('[parseSpendAmount] Input:', text);
  
  // Handle European number format first (comma as decimal separator)
  // Pattern examples: "11.571,68", "0,514", "1.234,56"
  const europeanPattern = /^[\d.]*,\d{2,3}$/;
  
  if (europeanPattern.test(text.replace(/[€$£¥₹\s]/g, ''))) {
    console.log('[parseSpendAmount] Detected European format');
    // Remove currency symbols and spaces, then convert comma to dot
    const cleaned = text
      .replace(/[€$£¥₹\s]/g, '') // Remove currency symbols and spaces
      .replace(/\./g, '') // Remove thousands separators (dots in European format)
      .replace(',', '.'); // Convert decimal comma to dot
    
    const parsed = parseFloat(cleaned);
    console.log('[parseSpendAmount] European parsed:', parsed);
    return isNaN(parsed) ? 0 : Math.abs(parsed);
  }
  
  // Handle US number format (dot as decimal separator)
  // Remove currency symbols and commas (thousands separators)
  const cleaned = text
    .replace(/[€$£¥₹\s]/g, '') // Remove currency symbols and spaces
    .replace(/,/g, '') // Remove thousands separators (commas in US format)
    .replace(/[^\d.-]/g, ''); // Keep only digits, dots, and dashes
  
  const parsed = parseFloat(cleaned);
  console.log('[parseSpendAmount] US format parsed:', parsed);
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
function convertToMarkdownTable(rawData: Record<string, unknown>[]): string {
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
  markdown += `**Total Records:** ${rawData.length - 1}\n\n`;
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
  /*
  markdown += `\n## Instructions\n`;
  markdown += `Please analyze this procurement data table and identify:\n`;
  markdown += `1. Vendor/supplier information\n`;
  markdown += `2. Annual spend amounts\n`;
  markdown += `3. Categories and segments\n`;
  markdown += `4. Potential cost optimization opportunities\n`;*/
  
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