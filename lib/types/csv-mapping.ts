// Types for CSV field mapping system inspired by BulkUpload pattern

export interface CSVFieldMapping {
  columnHeader: string;
  columnValues: string; // Sample values from the first row
  mappingStatus: 'mapped' | 'unmapped';
  importAs: string; // The category this column maps to
  spyneProperty: string | null; // Specific property within the category (if applicable)
  fieldPath?: string; // Internal path for data transformation
}

export interface MappingOption {
  label: string;
  value: string;
}

export interface MappingConfig {
  label: string;
  value: string;
  spyneProperties?: MappingOption[];
  required?: boolean;
  description?: string;
}

// No hardcoded configurations - everything comes from API

// Generate import options from API fields only
export const getImportAsOptions = (apiRequiredFields?: string[]): MappingOption[] => {
  // If API required fields are provided, use them as the only source
  if (apiRequiredFields && apiRequiredFields.length > 0) {
    const dynamicOptions = apiRequiredFields.map(field => ({
      label: field.replace(/[_-]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      value: field
    }));
    
    // Always include the "Do Not Import" option
    const doNotImportOption = {
      label: 'Do Not Import',
      value: 'do_not_import'
    };
    
    return [...dynamicOptions, doNotImportOption];
  }
  
  // If no API fields are provided, return only the "Do Not Import" option
  return [{
    label: 'Do Not Import',
    value: 'do_not_import'
  }];
};

// Helper function to get spyne properties for a given import category
// Since we're removing hardcoded configs, this will return empty array
// If spyne properties are needed, they should come from the API
export const getSpynePropertiesForImport = (importAsValue: string): MappingOption[] => {
  // No hardcoded spyne properties - these should come from API if needed
  return [];
};

// Helper function to check if an import category requires spyne property selection
export const requiresSpyneProperty = (importAsValue: string): boolean => {
  const spyneProperties = getSpynePropertiesForImport(importAsValue);
  return spyneProperties.length > 0 && importAsValue !== 'do_not_import';
};

// API Response structure for processed CSV data
export interface CSVMappingApiResponse {
  mapped_data: any[];
  column_mapping: Record<string, {
    original_csv_column_name: string;
    child_key?: string;
  }>;
  unmatched: Array<{
    columnName: string;
    key: string;
  }>;
}

// Helper function to convert field path to human readable import category
export const getImportCategoryFromValue = (value: string): string => {
  // Convert field value to readable label dynamically
  return value.replace(/[_-]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
};

// Helper function to find spyne property label by value
export const getSpynePropertyLabelByValue = (
  importAsValue: string,
  value: string
): string | null => {
  // Since we removed hardcoded spyne properties, return the value as a readable label
  return value ? value.replace(/[_-]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : null;
};

// No legacy mapping needed - everything is API-driven

// Generate CSV field mapping from raw CSV data
export const generateCSVFieldMapping = (
  csvData: any[],
  existingKeyMapping?: Record<string, string>,
  apiRequiredFields?: string[]
): CSVFieldMapping[] => {
  if (!csvData || csvData.length === 0) {
    return [];
  }

  const firstDataRow = csvData[0];
  const csvHeaders = Object.keys(firstDataRow);

  return csvHeaders.map((header) => {
    const columnValues = firstDataRow[header]?.toString() || '';
    
    // Try to auto-detect mapping based on existing key mapping or column name
    let importAs = '';
    let spyneProperty: string | null = null;
    let mappingStatus: 'mapped' | 'unmapped' = 'unmapped';

    // Check existing key mapping first - now works with camel case keys
    if (existingKeyMapping && existingKeyMapping[header]) {
      importAs = existingKeyMapping[header];
      mappingStatus = 'mapped';
    } else {
      // Try to auto-detect based on column name
      const headerLower = header.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Try to match against API required fields if provided
      if (apiRequiredFields && apiRequiredFields.length > 0) {
        for (const apiField of apiRequiredFields) {
          const apiFieldNormalized = apiField.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (headerLower.includes(apiFieldNormalized) || 
              apiFieldNormalized.includes(headerLower) ||
              headerLower === apiFieldNormalized) {
            // Use the API field directly
            importAs = apiField;
            mappingStatus = 'mapped';
            break;
          }
        }
      }
    }

    return {
      columnHeader: header,
      columnValues: columnValues.length > 50 ? 
        columnValues.substring(0, 50) + '...' : columnValues,
      mappingStatus,
      importAs,
      spyneProperty,
      fieldPath: header
    };
  });
};

// Validation helper - purely API-driven
export const validateMappingCompleteness = (
  mappings: CSVFieldMapping[],
  apiRequiredFields?: string[]
): { isValid: boolean; missingRequired: string[]; unmappedCount: number } => {
  // Use only API required fields
  const requiredFields = apiRequiredFields || [];
  
  const mappedFields = mappings.filter(
    mapping => mapping.mappingStatus === 'mapped' && 
               mapping.importAs !== 'do_not_import'
  );
  
  const missingRequired = requiredFields.filter(requiredField => {
    return !mappedFields.some(mapping => mapping.importAs === requiredField);
  });
  
  const unmappedCount = mappings.filter(
    mapping => mapping.mappingStatus === 'unmapped' && 
               mapping.importAs !== 'do_not_import'
  ).length;
  
  return {
    isValid: missingRequired.length === 0,
    missingRequired,
    unmappedCount
  };
};
