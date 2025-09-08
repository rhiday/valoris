/**
 * Shared data extraction utilities for Excel/CSV processing
 */

import type { ExcelRow } from '../types';

export interface ExtractedData {
  vendor: string;
  spend: number;
  category: string;
  segment: string;
}

/**
 * Extract vendor name from Excel row using multiple field patterns
 */
export function extractVendorName(row: ExcelRow): string {
  // Try exact field names first
  if (row.Supplier) return String(row.Supplier).trim();
  if (row.supplier) return String(row.supplier).trim();
  if (row.vendor) return String(row.vendor).trim();
  if (row.Vendor) return String(row.Vendor).trim();
  
  // Then try pattern matching
  const keys = Object.keys(row).filter(key => 
    key.toLowerCase().includes('vendor') || 
    key.toLowerCase().includes('supplier') ||
    key.toLowerCase().includes('company')
  );
  
  return keys.length > 0 ? String(row[keys[0]] || '').trim() : '';
}

/**
 * Extract spend amount from Excel row with multiple field patterns
 */
export function extractSpendAmount(row: ExcelRow): number {
  // Try exact field names first
  if (row.Total_Current_Cost) return Number(row.Total_Current_Cost) || 0;
  if (row['Total Current Cost']) return Number(row['Total Current Cost']) || 0;
  if (row.spend) return Number(row.spend) || 0;
  if (row.Spend) return Number(row.Spend) || 0;
  if (row.cost) return Number(row.cost) || 0;
  if (row.Cost) return Number(row.Cost) || 0;
  
  // Then try pattern matching
  const keys = Object.keys(row).filter(key => 
    key.toLowerCase().includes('spend') || 
    key.toLowerCase().includes('cost') ||
    key.toLowerCase().includes('amount')
  );
  
  if (keys.length > 0) {
    const value = String(row[keys[0]] || '').replace(/[^\d.,]/g, '');
    return parseFloat(value.replace(',', '.')) || 0;
  }
  return 0;
}

/**
 * Extract category from Excel row
 */
export function extractCategory(row: ExcelRow): string {
  if (row.category) return String(row.category).trim();
  if (row.Category) return String(row.Category).trim();
  
  const keys = Object.keys(row).filter(key => 
    key.toLowerCase().includes('category') || 
    key.toLowerCase().includes('type')
  );
  return keys.length > 0 ? String(row[keys[0]] || 'Software').trim() : 'Software';
}

/**
 * Extract segment/department from Excel row
 */
export function extractSegment(row: ExcelRow): string {
  if (row.segment) return String(row.segment).trim();
  if (row.Segment) return String(row.Segment).trim();
  
  const keys = Object.keys(row).filter(key => 
    key.toLowerCase().includes('segment') || 
    key.toLowerCase().includes('department')
  );
  return keys.length > 0 ? String(row[keys[0]] || 'IT').trim() : 'IT';
}

/**
 * Normalize Excel data by extracting key fields consistently
 */
export function normalizeExcelRow(row: ExcelRow): ExtractedData {
  return {
    vendor: extractVendorName(row),
    spend: extractSpendAmount(row),
    category: extractCategory(row),
    segment: extractSegment(row)
  };
}

/**
 * Group Excel data by vendor and sum spending
 */
export function groupByVendor(data: ExcelRow[]): ExtractedData[] {
  const vendorMap = new Map<string, ExtractedData>();
  
  data.forEach(row => {
    const extracted = normalizeExcelRow(row);
    if (!extracted.vendor || extracted.spend === 0) return;
    
    const key = extracted.vendor.toLowerCase();
    if (vendorMap.has(key)) {
      const existing = vendorMap.get(key)!;
      existing.spend += extracted.spend;
    } else {
      vendorMap.set(key, extracted);
    }
  });
  
  return Array.from(vendorMap.values());
}