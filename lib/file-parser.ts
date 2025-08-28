import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { convertKeysToCamelCase } from './utils';

export interface ParsedCustomerData {
  [key: string]: string | number | boolean;
}

export const REQUIRED_CSV_COLUMNS = [
  'CustomerFullName',
  'ContactPhoneNumber', 
  'VIN',
  'RecallDescription',
  'VehicleMake',
  'VehicleModel',
  'VehicleYear',
  'PartsAvailabilityFlag',
  'LoanerEligibility',
  'Symptom',
  'RiskDetails',
  'RemedySteps'
];

export interface ParseResult {
  success: boolean;
  data: any[]; // Changed to any[] to support dynamic column structures
  errors: string[];
  totalRecords: number;
  missingColumns: string[];
  suggestedMappings?: Record<string, string>; // AI-suggested field mappings
}

export function validateColumns(headers: string[], requiredColumns: string[] = REQUIRED_CSV_COLUMNS): string[] {
  const normalizedHeaders = headers.map(h => h.trim());
  const missingColumns = requiredColumns.filter(
    required => !normalizedHeaders.includes(required)
  );
  return missingColumns;
}

// Generate smart mapping suggestions based on column names
export function generateMappingSuggestions(headers: string[]): Record<string, string> {
  const suggestions: Record<string, string> = {};
  
  // Mapping rules for common column name patterns
  const mappingRules = [
    // Customer name patterns
    { patterns: ['customer.*name', 'customername', 'name', 'customer', 'full.*name', 'fullname'], target: 'CustomerFullName' },
    // Phone patterns  
    { patterns: ['phone.*number', 'phonenumber', 'phone', 'mobile', 'contact.*phone', 'telephone', 'cell'], target: 'ContactPhoneNumber' },
    // VIN patterns
    { patterns: ['vehicle.*vin', 'vehiclevin', 'vin', 'vehicle.*id', 'vehicle.*number'], target: 'VIN' },
    // Vehicle make patterns
    { patterns: ['vehicle.*make', 'vehiclemake', 'make', 'manufacturer', 'brand'], target: 'VehicleMake' },
    // Vehicle model patterns
    { patterns: ['vehicle.*model', 'vehiclemodel', 'model'], target: 'VehicleModel' },
    // Vehicle year patterns
    { patterns: ['vehicle.*year', 'vehicleyear', 'year', 'model.*year', 'manufacture.*year'], target: 'VehicleYear' },
    // Recall patterns
    { patterns: ['recall.*description', 'recalldescription', 'recall', 'description', 'recall.*desc', 'issue'], target: 'RecallDescription' },
    // Parts availability patterns
    { patterns: ['parts.*availability.*flag', 'partsavailabilityflag', 'parts.*avail', 'parts.*available', 'availability'], target: 'PartsAvailabilityFlag' },
    // Loaner eligibility patterns
    { patterns: ['loaner.*eligibility', 'loanereligibility', 'loaner', 'eligible', 'eligibility', 'loaner.*eligible'], target: 'LoanerEligibility' },
    // Symptom patterns
    { patterns: ['symptom', 'symptoms', 'problem', 'issue'], target: 'Symptom' },
    // Risk patterns
    { patterns: ['risk.*details', 'riskdetails', 'risk', 'danger', 'hazard', 'safety'], target: 'RiskDetails' },
    // Remedy patterns
    { patterns: ['remedy.*steps', 'remedysteps', 'remedy', 'solution', 'fix', 'repair', 'steps'], target: 'RemedySteps' }
  ];

  headers.forEach(header => {
    const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    for (const rule of mappingRules) {
      // Check if any pattern matches the header
      const matches = rule.patterns.some(pattern => {
        const regex = new RegExp(pattern, 'i');
        return regex.test(normalizedHeader) || regex.test(header.toLowerCase());
      });
      
      if (matches && !suggestions[header]) {
        suggestions[header] = rule.target;
        break; // Only assign first match
      }
    }
  });

  return suggestions;
}

export function parseCSVFile(file: File, requiredColumns: string[] = REQUIRED_CSV_COLUMNS): Promise<ParseResult> {
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
            rowData[key] = row[key]?.toString().trim() || '';
          });
          
          // Convert all keys to camel case to ensure consistent metadata format
          const camelCaseRowData = convertKeysToCamelCase(rowData);
          validData.push(camelCaseRowData);
        });

        // Generate mapping suggestions
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

export function parseExcelFile(file: File, requiredColumns: string[] = REQUIRED_CSV_COLUMNS): Promise<ParseResult> {
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
        const headers = (jsonData[0] as string[]).map(h => h?.toString().trim());
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
            rowObj[header] = row[index]?.toString().trim() || '';
          });

          // Don't validate required fields at row level - let key mapping handle this
          // Just collect all available data from the row
          const dynamicRowData: any = {};
          Object.keys(rowObj).forEach(key => {
            dynamicRowData[key] = rowObj[key] || '';
          });
          
          // Convert all keys to camel case to ensure consistent metadata format
          const camelCaseRowData = convertKeysToCamelCase(dynamicRowData);
          validData.push(camelCaseRowData);
        }

        // Generate mapping suggestions for Excel
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
