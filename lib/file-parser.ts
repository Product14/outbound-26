import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ParsedCustomerData {
  [key: string]: string | number | boolean;
}

// No longer using hardcoded required columns - these come from API
// export const REQUIRED_CSV_COLUMNS = [];

export interface ParseResult {
  success: boolean;
  data: any[]; // Changed to any[] to support dynamic column structures
  errors: string[];
  totalRecords: number;
  missingColumns: string[];
  suggestedMappings?: Record<string, string>; // AI-suggested field mappings
}

export function validateColumns(headers: string[], requiredColumns: string[] = []): string[] {
  const normalizedHeaders = headers.map(h => h.trim());
  const missingColumns = requiredColumns.filter(
    required => !normalizedHeaders.includes(required)
  );
  return missingColumns;
}


// Generate smart mapping suggestions based on column names
export function generateMappingSuggestions(headers: string[], apiRequiredFields?: string[]): Record<string, string> {
  const suggestions: Record<string, string> = {};
  
  // If no API required fields provided, return empty suggestions
  if (!apiRequiredFields || apiRequiredFields.length === 0) {
    return suggestions;
  }

  headers.forEach(header => {
    const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Try to match against API required fields with enhanced matching
    for (const apiField of apiRequiredFields) {
      const normalizedApiField = apiField.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Enhanced similarity matching including common field name variations
      if (normalizedHeader === normalizedApiField ||
          normalizedHeader.includes(normalizedApiField) || 
          normalizedApiField.includes(normalizedHeader) ||
          // Handle exact case-insensitive match
          header.toLowerCase() === apiField.toLowerCase() ||
          // Handle PascalCase to camelCase matching
          header === apiField.charAt(0).toUpperCase() + apiField.slice(1)){
        
        // Only assign if not already used
        if (!Object.values(suggestions).includes(apiField)) {
          suggestions[header] = apiField;
          console.log(`📝 File Parser - Mapping suggestion: "${header}" -> "${apiField}"`);
          break;
        }
      }
    }
  });

  return suggestions;
}

export function parseCSVFile(file: File, requiredColumns: string[] = []): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        
        // Don't fail immediately on missing columns - let key mapping handle it
        // Just log what's missing for debugging
        const missingColumns = validateColumns(headers, requiredColumns);
        if (missingColumns.length > 0) {
          console.log('Note: Some columns are missing from CSV, but key mapping will handle this:', missingColumns);
        }

        // Validate and clean data
        const validData: ParsedCustomerData[] = [];

        results.data.forEach((row: any, index: number) => {
          // Don't validate required fields at row level - let key mapping handle this
          // Just collect all available data from the row
          const rowData: any = {};
          Object.keys(row).forEach(key => {
            const value = row[key];
            rowData[key] = value ? String(value).trim() : '';
          });
          
          // Preserve original CSV column names to match API field names exactly
          validData.push(rowData);
        });

        // Generate mapping suggestions (will be enhanced with API fields later)
        const suggestedMappings = generateMappingSuggestions(headers);

        resolve({
          success: validData.length > 0, // Success if we have data
          data: validData,
          errors: [], // No row-level errors since we're not validating required fields
          totalRecords: validData.length,
          missingColumns: missingColumns, // Pass through missing columns for reference
          suggestedMappings: suggestedMappings
        });
      },
      error: (error) => {
        resolve({
          success: false,
          data: [],
          errors: [`CSV parsing error: ${error.message}`],
          totalRecords: 0,
          missingColumns: []
        });
      }
    });
  });
}

export function parseExcelFile(file: File, requiredColumns: string[] = []): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          resolve({
            success: false,
            data: [],
            errors: ['Excel file is empty'],
            totalRecords: 0,
            missingColumns: []
          });
          return;
        }

        // Get headers (first row)
        const headers = (jsonData[0] as string[]).map(h => h ? String(h).trim() : '');
        const missingColumns = validateColumns(headers, requiredColumns);
        
        // Don't fail immediately on missing columns - let key mapping handle it
        if (missingColumns.length > 0) {
          console.log('Note: Some columns are missing from Excel, but key mapping will handle this:', missingColumns);
        }

        // Process data rows
        const validData: ParsedCustomerData[] = [];

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          const rowObj: any = {};
          
          // Map row data to headers
          headers.forEach((header, index) => {
            const value = row[index];
            rowObj[header] = value ? String(value).trim() : '';
          });

          // Don't validate required fields at row level - let key mapping handle this
          // Just collect all available data from the row
          const dynamicRowData: any = {};
          Object.keys(rowObj).forEach(key => {
            dynamicRowData[key] = rowObj[key] || '';
          });
          
          // Preserve original Excel column names to match API field names exactly
          validData.push(dynamicRowData);
        }

        // Generate mapping suggestions for Excel (will be enhanced with API fields later)
        const suggestedMappings = generateMappingSuggestions(headers);

        resolve({
          success: validData.length > 0, // Success if we have data
          data: validData,
          errors: [], // No row-level errors since we're not validating required fields
          totalRecords: validData.length,
          missingColumns: missingColumns, // Pass through missing columns for reference
          suggestedMappings: suggestedMappings
        });

      } catch (error) {
        resolve({
          success: false,
          data: [],
          errors: [`Excel parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`],
          totalRecords: 0,
          missingColumns: []
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        data: [],
        errors: ['Failed to read Excel file'],
        totalRecords: 0,
        missingColumns: []
      });
    };

    reader.readAsArrayBuffer(file);
  });
}

export async function parseUploadedFile(file: File, requiredColumns?: string[]): Promise<ParseResult> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  switch (fileExtension) {
    case 'csv':
      return parseCSVFile(file, requiredColumns);
    case 'xlsx':
    case 'xls':
      return parseExcelFile(file, requiredColumns);
    default:
      return {
        success: false,
        data: [],
        errors: ['Unsupported file format. Please upload a CSV or Excel file.'],
        totalRecords: 0,
        missingColumns: []
      };
  }
}
