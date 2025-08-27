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

// Campaign-specific mapping configuration
export const CAMPAIGN_MAPPING_CONFIG: Record<string, MappingConfig> = {
  CUSTOMER_NAME: {
    label: 'Customer Name',
    value: 'customer_name',
    required: true,
    description: 'Full name of the customer'
  },
  PHONE_NUMBER: {
    label: 'Phone Number',
    value: 'phone_number', 
    required: true,
    description: 'Customer contact phone number'
  },
  VIN: {
    label: 'Vehicle Information',
    value: 'vehicle_info',
    spyneProperties: [
      { label: 'VIN', value: 'vin' },
      { label: 'Registration Number', value: 'registration_number' },
      { label: 'Stock Number', value: 'stock_number' }
    ],
    required: true,
    description: 'Vehicle identification information'
  },
  RECALL_DESCRIPTION: {
    label: 'Recall Description',
    value: 'recall_description',
    required: true,
    description: 'Description of the recall issue'
  },
  VEHICLE_MAKE: {
    label: 'Vehicle Make',
    value: 'vehicle_make',
    required: true,
    description: 'Manufacturer of the vehicle'
  },
  VEHICLE_MODEL: {
    label: 'Vehicle Model',
    value: 'vehicle_model',
    required: true,
    description: 'Model of the vehicle'
  },
  VEHICLE_YEAR: {
    label: 'Vehicle Year',
    value: 'vehicle_year',
    required: true,
    description: 'Year of manufacture'
  },
  PARTS_AVAILABILITY: {
    label: 'Parts Availability',
    value: 'parts_availability',
    spyneProperties: [
      { label: 'Available', value: 'available' },
      { label: 'Not Available', value: 'not_available' },
      { label: 'Partial', value: 'partial' }
    ],
    required: false,
    description: 'Status of parts availability'
  },
  LOANER_ELIGIBILITY: {
    label: 'Loaner Eligibility',
    value: 'loaner_eligibility',
    spyneProperties: [
      { label: 'Eligible', value: 'eligible' },
      { label: 'Not Eligible', value: 'not_eligible' }
    ],
    required: false,
    description: 'Customer eligibility for loaner vehicle'
  },
  SYMPTOM: {
    label: 'Symptom',
    value: 'symptom',
    required: false,
    description: 'Reported symptoms or issues'
  },
  RISK_DETAILS: {
    label: 'Risk Details',
    value: 'risk_details',
    required: false,
    description: 'Details about potential risks'
  },
  REMEDY_STEPS: {
    label: 'Remedy Steps',
    value: 'remedy_steps',
    required: false,
    description: 'Steps to remedy the issue'
  },
  DO_NOT_IMPORT: {
    label: 'Do not import this column',
    value: 'do_not_import',
    required: false,
    description: 'Skip this column during import'
  }
};

// Generate import options from the config
export const getImportAsOptions = (apiRequiredFields?: string[]): MappingOption[] => {
  const staticOptions = Object.values(CAMPAIGN_MAPPING_CONFIG).map((config) => ({
    label: config.label,
    value: config.value,
  }));
  
  // Add dynamic API fields if provided
  if (apiRequiredFields && apiRequiredFields.length > 0) {
    const dynamicOptions = apiRequiredFields
      .filter(field => !staticOptions.some(opt => opt.value === field)) // Avoid duplicates
      .map(field => ({
        label: field.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Convert to readable label
        value: field
      }));
    
    return [...staticOptions, ...dynamicOptions];
  }
  
  return staticOptions;
};

// Helper function to get spyne properties for a given import category
export const getSpynePropertiesForImport = (importAsValue: string): MappingOption[] => {
  const config = Object.values(CAMPAIGN_MAPPING_CONFIG).find(
    (config) => config.value === importAsValue
  );
  return config?.spyneProperties || [];
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
  const config = Object.values(CAMPAIGN_MAPPING_CONFIG).find(
    (config) => config.value === value
  );
  return config?.label || value;
};

// Helper function to find spyne property label by value
export const getSpynePropertyLabelByValue = (
  importAsValue: string,
  value: string
): string | null => {
  const spyneProperties = getSpynePropertiesForImport(importAsValue);
  const property = spyneProperties.find((prop) => prop.value === value);
  return property ? property.label : null;
};

// Legacy mapping conversion from old column names to new config values
const LEGACY_MAPPING_CONVERSION: Record<string, string> = {
  'CustomerFullName': 'customer_name',
  'ContactPhoneNumber': 'phone_number',
  'VIN': 'vehicle_info',
  'RecallDescription': 'recall_description',
  'VehicleMake': 'vehicle_make',
  'VehicleModel': 'vehicle_model',
  'VehicleYear': 'vehicle_year',
  'PartsAvailabilityFlag': 'parts_availability',
  'LoanerEligibility': 'loaner_eligibility',
  'Symptom': 'symptom',
  'RiskDetails': 'risk_details',
  'RemedySteps': 'remedy_steps'
};

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

    // Check existing key mapping first
    if (existingKeyMapping && existingKeyMapping[header]) {
      const mappedValue = existingKeyMapping[header];
      
      // Convert legacy mapping to new config value if needed
      const convertedValue = LEGACY_MAPPING_CONVERSION[mappedValue] || mappedValue;
      
      const config = Object.values(CAMPAIGN_MAPPING_CONFIG).find(
        c => c.value === convertedValue
      );
      if (config) {
        importAs = config.value;
        mappingStatus = requiresSpyneProperty(config.value) ? 'unmapped' : 'mapped';
        
        // For vehicle_info, set default spyne property to 'vin' if it was VIN
        if (config.value === 'vehicle_info' && mappedValue === 'VIN') {
          spyneProperty = 'vin';
          mappingStatus = 'mapped';
        }
      }
    } else {
      // Try to auto-detect based on column name
      const headerLower = header.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // First, try to match against API required fields if provided
      if (apiRequiredFields && apiRequiredFields.length > 0) {
        for (const apiField of apiRequiredFields) {
          const apiFieldNormalized = apiField.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (headerLower.includes(apiFieldNormalized) || 
              apiFieldNormalized.includes(headerLower) ||
              headerLower === apiFieldNormalized) {
            // Find matching config or create dynamic mapping
            const config = Object.values(CAMPAIGN_MAPPING_CONFIG).find(cfg => {
              const configValueNormalized = cfg.value.toLowerCase().replace(/[^a-z0-9]/g, '');
              return configValueNormalized === apiFieldNormalized;
            });
            
            if (config) {
              importAs = config.value;
              mappingStatus = requiresSpyneProperty(config.value) ? 'unmapped' : 'mapped';
            } else {
              // Create dynamic mapping for API field
              importAs = apiField;
              mappingStatus = 'mapped';
            }
            break;
          }
        }
      }
      
      // If no API match found, try hardcoded config
      if (!importAs) {
        for (const [key, config] of Object.entries(CAMPAIGN_MAPPING_CONFIG)) {
          const configValueNormalized = config.value.toLowerCase().replace(/[^a-z0-9]/g, '');
          const configLabelNormalized = config.label.toLowerCase().replace(/[^a-z0-9]/g, '');
          
          if (headerLower.includes(configValueNormalized) || 
              headerLower.includes(configLabelNormalized) ||
              configValueNormalized.includes(headerLower) ||
              configLabelNormalized.includes(headerLower)) {
            importAs = config.value;
            mappingStatus = requiresSpyneProperty(config.value) ? 'unmapped' : 'mapped';
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

// Validation helper - now accepts dynamic required fields
export const validateMappingCompleteness = (
  mappings: CSVFieldMapping[],
  apiRequiredFields?: string[]
): { isValid: boolean; missingRequired: string[]; unmappedCount: number } => {
  // Use API required fields if provided, otherwise fall back to hardcoded required configs
  let requiredFields: string[] = [];
  
  if (apiRequiredFields && apiRequiredFields.length > 0) {
    // Convert API field names to our mapping config values
    requiredFields = apiRequiredFields.map(apiField => {
      // Try to find matching config by comparing with API field name
      const config = Object.values(CAMPAIGN_MAPPING_CONFIG).find(cfg => {
        const configValueNormalized = cfg.value.toLowerCase().replace(/[^a-z0-9]/g, '');
        const apiFieldNormalized = apiField.toLowerCase().replace(/[^a-z0-9]/g, '');
        return configValueNormalized === apiFieldNormalized || 
               cfg.label.toLowerCase().replace(/[^a-z0-9]/g, '') === apiFieldNormalized;
      });
      return config?.value || apiField;
    });
  } else {
    // Fallback to hardcoded required configs
    const requiredConfigs = Object.values(CAMPAIGN_MAPPING_CONFIG).filter(
      config => config.required
    );
    requiredFields = requiredConfigs.map(config => config.value);
  }
  
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
