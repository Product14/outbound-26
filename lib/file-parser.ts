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
  // Additional fields for new sales use cases
  LeadSource: string;
  InterestLevel: string;
  VehicleInterest: string;
  PreviousPrice: string;
  NewPrice: string;
  NewVehicleDetails: string;
  FormType: string;
  AbandonmentTime: string;
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
  'RemedySteps',
  // Additional fields for new sales use cases
  'LeadSource',
  'InterestLevel',
  'VehicleInterest',
  'PreviousPrice',
  'NewPrice',
  'NewVehicleDetails',
  'FormType',
  'AbandonmentTime'
];

// Dynamic required fields based on use case
export function getRequiredFieldsForUseCase(useCase: string, subUseCase: string): string[] {
  const baseFields = ['CustomerFullName', 'ContactPhoneNumber'];
  
  if (useCase === 'service') {
    return [
      ...baseFields,
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
  }
  
  if (useCase === 'sales') {
    switch (subUseCase) {
      case 'lead-qualification':
        return [...baseFields, 'LeadSource', 'InterestLevel'];
      case 'lead-enrichment':
        return [...baseFields, 'LeadSource', 'InterestLevel'];
      case 'price-drop-alert':
        return [
          ...baseFields,
          'VIN',
          'RecallDescription',
          'VehicleMake',
          'VehicleModel',
          'VehicleYear',
          'PartsAvailabilityFlag',
          'LoanerEligibility',
          'Symptom',
          'RiskDetails',
          'RemedySteps',
          'VehicleInterest',
          'PreviousPrice',
          'NewPrice'
        ];
      case 'new-arrival-alert':
        return [...baseFields, 'VehicleInterest', 'NewVehicleDetails'];
      default:
        return baseFields;
    }
  }
  
  // Default fallback
  return baseFields;
}

export interface ParseResult {
  success: boolean;
  data: ParsedCustomerData[];
  errors: string[];
  totalRecords: number;
  missingColumns: string[];
}

export function validateColumns(headers: string[], requiredColumns: string[] = REQUIRED_CSV_COLUMNS): string[] {
  const normalizedHeaders = headers.map(h => h.trim());
  const missingColumns = requiredColumns.filter(
    required => !normalizedHeaders.includes(required)
  );
  return missingColumns;
}

export function parseCSVFile(file: File, useCase?: string, subUseCase?: string): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const requiredColumns = useCase && subUseCase 
          ? getRequiredFieldsForUseCase(useCase, subUseCase)
          : REQUIRED_CSV_COLUMNS;
        const missingColumns = validateColumns(headers, requiredColumns);
        
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

        results.data.forEach((row, index: number) => {
          const rowData = row as Record<string, unknown>;
          const rowErrors: string[] = [];
          
          // Check for required fields
          requiredColumns.forEach(column => {
            if (!rowData[column] || rowData[column].toString().trim() === '') {
              rowErrors.push(`Row ${index + 1}: Missing ${column}`);
            }
          });

          // Validate phone number format (basic validation)
          if (rowData.ContactPhoneNumber && !rowData.ContactPhoneNumber.toString().match(/^\+?[\d\s\-\(\)]{10,}$/)) {
            rowErrors.push(`Row ${index + 1}: Invalid phone number format`);
          }

          if (rowErrors.length === 0) {
            validData.push({
              CustomerFullName: rowData.CustomerFullName?.toString().trim() || '',
              ContactPhoneNumber: rowData.ContactPhoneNumber?.toString().trim() || '',
              VIN: rowData.VIN?.toString().trim() || '',
              RecallDescription: rowData.RecallDescription?.toString().trim() || '',
              VehicleMake: rowData.VehicleMake?.toString().trim() || '',
              VehicleModel: rowData.VehicleModel?.toString().trim() || '',
              VehicleYear: rowData.VehicleYear?.toString().trim() || '',
              PartsAvailabilityFlag: rowData.PartsAvailabilityFlag?.toString().trim() || '',
              LoanerEligibility: rowData.LoanerEligibility?.toString().trim() || '',
              Symptom: rowData.Symptom?.toString().trim() || '',
              RiskDetails: rowData.RiskDetails?.toString().trim() || '',
              RemedySteps: rowData.RemedySteps?.toString().trim() || '',
              // Additional fields for new sales use cases
              LeadSource: rowData.LeadSource?.toString().trim() || '',
              InterestLevel: rowData.InterestLevel?.toString().trim() || '',
              VehicleInterest: rowData.VehicleInterest?.toString().trim() || '',
              PreviousPrice: rowData.PreviousPrice?.toString().trim() || '',
              NewPrice: rowData.NewPrice?.toString().trim() || '',
              NewVehicleDetails: rowData.NewVehicleDetails?.toString().trim() || '',
              FormType: rowData.FormType?.toString().trim() || '',
              AbandonmentTime: rowData.AbandonmentTime?.toString().trim() || ''
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

export function parseExcelFile(file: File, useCase?: string, subUseCase?: string): Promise<ParseResult> {
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
        const requiredColumns = useCase && subUseCase 
          ? getRequiredFieldsForUseCase(useCase, subUseCase)
          : REQUIRED_CSV_COLUMNS;
        const missingColumns = validateColumns(headers, requiredColumns);
        
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
          const row = jsonData[i] as Record<string, unknown>;
          const rowObj: Record<string, string> = {};
          
          // Map row data to headers
          headers.forEach((header, index) => {
            rowObj[header] = row[index]?.toString().trim() || '';
          });

          const rowErrors: string[] = [];
          
          // Check for required fields
          requiredColumns.forEach(column => {
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
              RemedySteps: rowObj.RemedySteps || '',
              // Additional fields for new sales use cases
              LeadSource: rowObj.LeadSource || '',
              InterestLevel: rowObj.InterestLevel || '',
              VehicleInterest: rowObj.VehicleInterest || '',
              PreviousPrice: rowObj.PreviousPrice || '',
              NewPrice: rowObj.NewPrice || '',
              NewVehicleDetails: rowObj.NewVehicleDetails || '',
              FormType: rowObj.FormType || '',
              AbandonmentTime: rowObj.AbandonmentTime || ''
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

export async function parseUploadedFile(file: File, useCase?: string, subUseCase?: string): Promise<ParseResult> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  switch (fileExtension) {
    case 'csv':
      return parseCSVFile(file, useCase, subUseCase);
    case 'xlsx':
    case 'xls':
      return parseExcelFile(file, useCase, subUseCase);
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
