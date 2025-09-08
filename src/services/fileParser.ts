import type { ExcelRow } from '../types';

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
            const convertedData = (alternativeData as ExcelRow[]).map((row: ExcelRow) => {
              const newRow: ExcelRow = {};
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
            const row: ExcelRow = {};
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

// Generate a simple hash for file caching
export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Simple in-memory cache for analysis results
const analysisCache = new Map<string, unknown>();

export async function getCachedAnalysis(fileHash: string): Promise<unknown | null> {
  return analysisCache.get(fileHash) || null;
}

export function cacheAnalysis(fileHash: string, analysis: unknown): void {
  analysisCache.set(fileHash, analysis);
  
  // Clean up old cache entries if too many
  if (analysisCache.size > 10) {
    const firstKey = analysisCache.keys().next().value;
    if (firstKey) {
      analysisCache.delete(firstKey);
    }
  }
}