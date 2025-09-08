import type { SpendAnalysis, SummaryMetrics } from '../types';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

interface AnalysisResponse {
  analysis: SpendAnalysis[];
  summary: SummaryMetrics;
}

// STAGE 1: Data Extraction Prompt (extract exact values from Excel)
const NORMALIZATION_PROMPT = `You are a procurement data analyst. Extract the EXACT values from this Excel data without any calculations or modifications.

Task: Extract actual values from the Excel data and normalize into structured format.

Return a JSON object with this EXACT structure:

{
  "normalizedData": [
    {
      "id": "HW-001-1",
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
1. Extract EXACT values - do not calculate, estimate, or modify any numbers
2. Use Supplier field for vendorName
3. Use Total_Current_Cost for annualSpend (exact value)
4. Use Potential_Savings for potentialSavings (including negative values)
5. Use Savings_Percentage for savingsPercentage (keep original format)
6. Use Department for department
7. Use Category for category
8. Use Item_ID for id
9. Create subCategory from Product_Name or Category
10. PRESERVE negative savings values - do not convert to positive
11. Keep all decimal places in numbers
12. Sum up values by Supplier if multiple rows exist for same supplier

Return ONLY the JSON object, no markdown, no explanation.`;

// STAGE 2: Data Presentation Prompt (using actual Excel values including savings)
const OPTIMIZATION_PROMPT = `You are a procurement data analyst. Convert normalized vendor data into dashboard format using the ACTUAL values from Excel, including real potential savings.

Based on the normalized vendor data provided, return a JSON object with this EXACT structure:

{
  "analysis": [
    {
      "id": "HW-001-1",
      "vendor": "Fastenal Company",
      "segment": "Engineering",
      "category": "Fasteners",
      "type": "Hardware Components", 
      "item": "Hex Head Cap Screw M8x25mm, 22513 pieces",
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
1. Use annualSpend from normalized data for pastSpend (exact value)
2. Calculate projectedSpend = pastSpend - potentialSavings (if positive savings) OR pastSpend + abs(potentialSavings) (if negative)
3. Use actual savingsPercentage from normalized data for both projectedChange and savingsPercentage
4. Use potentialSavings for savingsRange (format as €X,XXX.XX - keep negative signs!)
5. Use vendorName for vendor
6. Use department for segment
7. Use category and subCategory for type
8. Use additionalInfo for item
9. For negative savings: projectedSpend = pastSpend + abs(potentialSavings), show negative percentages
10. Summary: sum all pastSpend, all projectedSpend, all potentialSavings
11. Preserve all decimal places and negative values exactly as in Excel
12. Group by vendor name and sum values if multiple entries

Return ONLY the JSON object, no markdown, no explanation.`;

// Test OpenAI API connectivity
async function testOpenAIConnection(): Promise<boolean> {
  try {
    console.log('[OpenAI] Testing API connectivity...');
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      }
    });
    
    if (response.ok) {
      console.log('[OpenAI] API connection test: ✅ Success - OpenAI API is working!');
      return true;
    } else {
      const errorText = await response.text();
      console.error('[OpenAI] API connection test: ❌ Failed -', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('[OpenAI] API connection test: ❌ Network error -', error);
    return false;
  }
}

// Export test function for debugging
export { testOpenAIConnection };

export async function analyzeExcelData(excelData: any[]): Promise<AnalysisResponse> {
  if (!OPENAI_API_KEY) {
    console.error('OpenAI API key not found. Using mock data.');
    throw new Error('OpenAI API key not configured');
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
  console.log('[OpenAI] Testing API connection...');
  const isConnected = await testOpenAIConnection();
  if (!isConnected) {
    throw new Error('OpenAI API connection failed - check your API key and network');
  }

  console.log('\n=== STARTING TWO-STAGE ANALYSIS ===');
  console.log('[OpenAI] Raw Excel data received:', excelData.slice(0, 3));

  // Prepare data for analysis
  const cleanedData = preprocessExcelData(excelData);
  console.log('[OpenAI] Cleaned data:', cleanedData.slice(0, 3));
  
  const shouldUseMarkdown = cleanedData.length === 0 || cleanedData.filter(row => row.spend > 0).length < 2;
  
  let finalData;
  if (shouldUseMarkdown) {
    console.log('[OpenAI] Using markdown approach for better data extraction');
    finalData = convertToMarkdownTable(excelData);
  } else {
    finalData = cleanedData;
  }

  // Prepare prompt data
  let promptData;
  if (typeof finalData === 'string') {
    promptData = finalData;
    console.log('[OpenAI] Using markdown table format, size:', promptData.length, 'characters');
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
    const jsonSize = JSON.stringify(promptData).length;
    console.log('[OpenAI] Using JSON format with', promptData.dataQuality.totalVendors, 'vendors, size:', jsonSize, 'characters');
  }

  // Check data size to prevent API errors
  const dataSize = typeof promptData === 'string' ? promptData.length : JSON.stringify(promptData).length;
  if (dataSize > 50000) {
    console.warn('[OpenAI] Large data size detected:', dataSize, 'characters - this may cause API errors');
  }

  try {
    // ============= STAGE 1: DATA NORMALIZATION =============
    console.log('\n=== STAGE 1: DATA NORMALIZATION ===');
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
      throw new Error(`Stage 1 OpenAI API error: ${stage1Response.status} - ${errorText}`);
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
      throw new Error('Failed to parse Stage 1 normalization response');
    }

    // ============= STAGE 2: OPTIMIZATION ANALYSIS =============
    console.log('\n=== STAGE 2: OPTIMIZATION ANALYSIS ===');
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
      throw new Error(`Stage 2 OpenAI API error: ${stage2Response.status} - ${errorText}`);
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
      throw new Error('Failed to parse Stage 2 optimization response');
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

    console.log('\n=== TWO-STAGE ANALYSIS COMPLETE ===');
    console.log('[Final] Returning optimized analysis with', analysis.analysis.length, 'vendors');
    
    return analysis;
  } catch (error) {
    console.error('Error in two-stage analysis:', error);
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
        
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

// Function to parse CSV files with support for various delimiters and formats
export async function parseCsvFile(file: File): Promise<any[]> {
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

// Preprocess Excel data to standardize field names and clean data
function preprocessExcelData(rawData: any[]): any[] {
  if (!rawData || rawData.length === 0) {
    console.warn('[OpenAI] No data to preprocess');
    return [];
  }

  console.log('[OpenAI] Preprocessing Excel data, sample row:', rawData[0]);
  
  // Group by supplier to sum up values for same vendors
  const supplierGroups: { [key: string]: any[] } = {};
  
  rawData.forEach(row => {
    const supplier = row.Supplier || row.supplier || `Unknown Supplier`;
    if (!supplierGroups[supplier]) {
      supplierGroups[supplier] = [];
    }
    supplierGroups[supplier].push(row);
  });

  return Object.entries(supplierGroups).map(([supplier, rows]) => {
    // Sum up costs and savings for same supplier
    const totalCurrentCost = rows.reduce((sum, row) => sum + (row.Total_Current_Cost || 0), 0);
    const totalMarketCost = rows.reduce((sum, row) => sum + (row.Total_Market_Cost || 0), 0);
    const totalPotentialSavings = rows.reduce((sum, row) => sum + (row.Potential_Savings || 0), 0);
    
    // Calculate average percentage (weighted by cost)
    const avgSavingsPercentage = totalCurrentCost > 0 ? 
      ((totalPotentialSavings / totalCurrentCost) * 100).toFixed(1) + '%' : '0%';

    // Get representative data from first row of the group
    const firstRow = rows[0];
    
    const cleanedRow = {
      vendor: supplier,
      spend: Math.round(totalCurrentCost * 100) / 100, // Round to 2 decimal places
      potentialSavings: Math.round(totalPotentialSavings * 100) / 100,
      savingsPercentage: avgSavingsPercentage,
      projectedSpend: Math.round(totalMarketCost * 100) / 100,
      category: normalizeCategory(firstRow.Category || 'Other'),
      segment: normalizeSegment(firstRow.Department || 'Operations'),
      productInfo: rows.map(r => r.Product_Name).filter((v, i, a) => a.indexOf(v) === i).join(', '), // Unique products
      originalData: rows // Keep all original rows for reference
    };

    console.log(`[Preprocessing] ${supplier}: €${cleanedRow.spend} → €${cleanedRow.projectedSpend}, savings: €${cleanedRow.potentialSavings} (${cleanedRow.savingsPercentage})`);

    return cleanedRow;
  }).filter(row => row.vendor && row.spend > 0); // Only keep rows with vendor and spend data
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

// Generate hash for data to prevent duplicate API calls
async function generateDataHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}