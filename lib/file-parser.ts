import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ParsedCustomerData {
  CustomerFullName: string;
  ContactPhoneNumber: string;
  VIN: string;
  RecallDescription: string;
  VehicleMake: string;
  VehicleModel: string;
  VehicleYear: string;
  PartsAvailabilityFlag: string;
  LoanerEligibility: string;
  Symptom: string;
  RiskDetails: string;
  RemedySteps: string;
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
  data: ParsedCustomerData[];
  errors: string[];
  totalRecords: number;
  missingColumns: string[];
}

export function validateColumns(headers: string[]): string[] {
  const normalizedHeaders = headers.map(h => h.trim());
  const missingColumns = REQUIRED_CSV_COLUMNS.filter(
    required => !normalizedHeaders.includes(required)
  );
  return missingColumns;
}

export function parseCSVFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const missingColumns = validateColumns(headers);
        
        if (missingColumns.length > 0) {
          resolve({
            success: false,
            data: [],
            errors: [`Missing required columns: ${missingColumns.join(', ')}`],
            totalRecords: 0,
            missingColumns
          });
          return;
        }

        // Validate and clean data
        const validData: ParsedCustomerData[] = [];
        const errors: string[] = [];

        results.data.forEach((row: any, index: number) => {
          const rowErrors: string[] = [];
          
          // Check for required fields
          REQUIRED_CSV_COLUMNS.forEach(column => {
            if (!row[column] || row[column].toString().trim() === '') {
              rowErrors.push(`Row ${index + 1}: Missing ${column}`);
            }
          });

          // Validate phone number format (basic validation)
          if (row.ContactPhoneNumber && !row.ContactPhoneNumber.match(/^\+?[\d\s\-\(\)]{10,}$/)) {
            rowErrors.push(`Row ${index + 1}: Invalid phone number format`);
          }

          if (rowErrors.length === 0) {
            validData.push({
              CustomerFullName: row.CustomerFullName?.toString().trim() || '',
              ContactPhoneNumber: row.ContactPhoneNumber?.toString().trim() || '',
              VIN: row.VIN?.toString().trim() || '',
              RecallDescription: row.RecallDescription?.toString().trim() || '',
              VehicleMake: row.VehicleMake?.toString().trim() || '',
              VehicleModel: row.VehicleModel?.toString().trim() || '',
              VehicleYear: row.VehicleYear?.toString().trim() || '',
              PartsAvailabilityFlag: row.PartsAvailabilityFlag?.toString().trim() || '',
              LoanerEligibility: row.LoanerEligibility?.toString().trim() || '',
              Symptom: row.Symptom?.toString().trim() || '',
              RiskDetails: row.RiskDetails?.toString().trim() || '',
              RemedySteps: row.RemedySteps?.toString().trim() || ''
            });
          } else {
            errors.push(...rowErrors);
          }
        });

        resolve({
          success: errors.length === 0 && validData.length > 0,
          data: validData,
          errors,
          totalRecords: validData.length,
          missingColumns: []
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

export function parseExcelFile(file: File): Promise<ParseResult> {
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
        const missingColumns = validateColumns(headers);
        
        if (missingColumns.length > 0) {
          resolve({
            success: false,
            data: [],
            errors: [`Missing required columns: ${missingColumns.join(', ')}`],
            totalRecords: 0,
            missingColumns
          });
          return;
        }

        // Process data rows
        const validData: ParsedCustomerData[] = [];
        const errors: string[] = [];

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          const rowObj: any = {};
          
          // Map row data to headers
          headers.forEach((header, index) => {
            rowObj[header] = row[index]?.toString().trim() || '';
          });

          const rowErrors: string[] = [];
          
          // Check for required fields
          REQUIRED_CSV_COLUMNS.forEach(column => {
            if (!rowObj[column] || rowObj[column] === '') {
              rowErrors.push(`Row ${i + 1}: Missing ${column}`);
            }
          });

          // Validate phone number format
          if (rowObj.ContactPhoneNumber && !rowObj.ContactPhoneNumber.match(/^\+?[\d\s\-\(\)]{10,}$/)) {
            rowErrors.push(`Row ${i + 1}: Invalid phone number format`);
          }

          if (rowErrors.length === 0) {
            validData.push({
              CustomerFullName: rowObj.CustomerFullName || '',
              ContactPhoneNumber: rowObj.ContactPhoneNumber || '',
              VIN: rowObj.VIN || '',
              RecallDescription: rowObj.RecallDescription || '',
              VehicleMake: rowObj.VehicleMake || '',
              VehicleModel: rowObj.VehicleModel || '',
              VehicleYear: rowObj.VehicleYear || '',
              PartsAvailabilityFlag: rowObj.PartsAvailabilityFlag || '',
              LoanerEligibility: rowObj.LoanerEligibility || '',
              Symptom: rowObj.Symptom || '',
              RiskDetails: rowObj.RiskDetails || '',
              RemedySteps: rowObj.RemedySteps || ''
            });
          } else {
            errors.push(...rowErrors);
          }
        }

        resolve({
          success: errors.length === 0 && validData.length > 0,
          data: validData,
          errors,
          totalRecords: validData.length,
          missingColumns: []
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

export async function parseUploadedFile(file: File): Promise<ParseResult> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  switch (fileExtension) {
    case 'csv':
      return parseCSVFile(file);
    case 'xlsx':
    case 'xls':
      return parseExcelFile(file);
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
