import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

import CSVFieldMappingTable from './CSVFieldMappingTable';
import DataPreviewTable from './DataPreviewTable';
import {
  CSVFieldMapping,
  generateCSVFieldMapping,
  validateMappingCompleteness,
  getImportCategoryFromValue
} from '@/lib/types/csv-mapping';
import { integrateCsvWithApis } from '@/lib/csv-api-integration';
import { toCamelCase } from '@/lib/utils';

// Step indicator component
const StepIndicator = ({ steps, currentStep }: { steps: string[], currentStep: number }) => {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index <= currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {index + 1}
            </div>
            <div className={`ml-2 text-sm font-medium ${
              index <= currentStep ? 'text-blue-600' : 'text-gray-500'
            }`}>
              {step}
            </div>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-16 h-px mx-4 ${
              index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

interface CSVMappingFlowProps {
  csvData: any[];
  onComplete: (mappedData: any[], keyMapping: Record<string, string>) => void;
  onCancel: () => void;
  existingKeyMapping?: Record<string, string>;
  apiRequiredFields?: string[];
  campaignUseCase?: string; // Add campaign use case for API integration
  authKey?: string; // Add auth key for API authentication
}

export default function CSVMappingFlow({
  csvData,
  onComplete,
  onCancel,
  existingKeyMapping,
  apiRequiredFields,
  campaignUseCase,
  authKey
}: CSVMappingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [csvMappings, setCsvMappings] = useState<CSVFieldMapping[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingApiData, setIsLoadingApiData] = useState(false);
  const [dynamicRequiredFields, setDynamicRequiredFields] = useState<string[]>([]);
  const [dynamicKeyMapping, setDynamicKeyMapping] = useState<Record<string, string>>({});
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    missingRequired: string[];
    unmappedCount: number;
  }>({ isValid: false, missingRequired: [], unmappedCount: 0 });
  const itemsPerPage = 8;

  const steps = ['Map Fields', 'Review Data'];

  // ⚠️ CRITICAL: Validate that ALL required fields from API are mapped
  const validateAllRequiredFieldsMapped = () => {
    const effectiveRequiredFields = dynamicRequiredFields.length > 0 ? dynamicRequiredFields : apiRequiredFields;
    const validation = validateMappingCompleteness(csvMappings, effectiveRequiredFields);
    
    console.log('🔍 Validating required fields mapping:', {
      requiredFields: effectiveRequiredFields,
      validation: validation,
      csvMappings: csvMappings.map(m => ({ header: m.columnHeader, importAs: m.importAs, status: m.mappingStatus }))
    });
    
    setValidationResult(validation);
    return validation;
  };

  // Helper function to determine if a CSV header should map to a specific API field
  const shouldMapToApiField = (csvHeader: string, apiField: string): boolean => {
    const csvNormalized = csvHeader.toLowerCase().replace(/[^a-z0-9]/g, '');
    const apiNormalized = apiField.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Exact match (case-insensitive)
    if (csvNormalized === apiNormalized) return true;
    
    // PascalCase to camelCase matching
    if (csvHeader === apiField.charAt(0).toUpperCase() + apiField.slice(1)) return true;
    
    // camelCase to PascalCase matching
    if (csvHeader.charAt(0).toUpperCase() + csvHeader.slice(1) === apiField) return true;
    
    // Handle common variations (spaces, underscores, etc.)
    const csvWords = csvHeader.toLowerCase().split(/[\s_-]+/);
    const apiWords = apiField.replace(/([A-Z])/g, ' $1').trim().toLowerCase().split(/\s+/);
    
    if (csvWords.length === apiWords.length) {
      return csvWords.every((word, index) => word === apiWords[index]);
    }
    
    return false;
  };

  // Initialize CSV mappings with API integration
  useEffect(() => {
    const initializeMapping = async () => {
      if (!csvData || csvData.length === 0) return;

      setIsLoadingApiData(true);
      // ⚠️ CRITICAL: Reset validation during loading to ensure buttons are disabled
      setValidationResult({ isValid: false, missingRequired: [], unmappedCount: 0 });
      
      try {
        // Get CSV headers
        const csvHeaders = Object.keys(csvData[0]);

        // If campaign use case is provided, integrate with APIs
        if (campaignUseCase) {
          
          const apiResult = await integrateCsvWithApis(campaignUseCase, csvHeaders, authKey);
          
          if (apiResult.success) {
            setDynamicRequiredFields(apiResult.requiredFields);
            setDynamicKeyMapping(apiResult.keyMapping);
            
            // Generate mappings using API data (prioritize API mappings over existing ones)
            const mappings = generateCSVFieldMapping(
              csvData, 
              { ...existingKeyMapping, ...apiResult.keyMapping },
              apiResult.requiredFields
            );
            
            // Force correct API field names for any mappings that might be incorrect
            const correctedMappings = mappings.map(mapping => {
              // If this mapping should be using an API field name, ensure it's correct
              const csvHeader = mapping.columnHeader;
              const currentMapping = mapping.importAs;
              
              // Check if we have a better API field mapping for this CSV header
              for (const apiField of apiResult.requiredFields) {
                if (shouldMapToApiField(csvHeader, apiField)) {
                  // Ensure the API field name is in camelCase format
                  const camelCaseApiField = toCamelCase(apiField);
                  return {
                    ...mapping,
                    importAs: camelCaseApiField,
                    mappingStatus: 'mapped' as const
                  };
                }
              }
              
              return mapping;
            });
           
            setCsvMappings(correctedMappings);
            
            // ⚠️ CRITICAL: Validate initial mappings
            setTimeout(() => {
              const validation = validateMappingCompleteness(correctedMappings, apiResult.requiredFields);
              setValidationResult(validation);
            }, 100);
          } else {
            console.error('API integration failed:', apiResult.error);
            toast.error(`Failed to fetch mapping data: ${apiResult.error}`);
            
            // ⚠️ CRITICAL: Do NOT use hardcoded fallback data
            // Only use API required fields if they exist, otherwise show empty mappings
            if (apiRequiredFields && apiRequiredFields.length > 0) {
              const mappings = generateCSVFieldMapping(csvData, existingKeyMapping, apiRequiredFields);
              setCsvMappings(mappings);
              
              // Validate fallback mappings
              setTimeout(() => {
                const validation = validateMappingCompleteness(mappings, apiRequiredFields);
                setValidationResult(validation);
              }, 100);
            } else {
              // Generate mappings without required fields to avoid hardcoded data
              const mappings = generateCSVFieldMapping(csvData, existingKeyMapping, []);
              setCsvMappings(mappings);
              
              // No required fields means always valid
              setValidationResult({ isValid: true, missingRequired: [], unmappedCount: 0 });
            }
          }
        } else {
          // ⚠️ CRITICAL: Only use API required fields, never hardcoded fallbacks
          if (apiRequiredFields && apiRequiredFields.length > 0) {
            const mappings = generateCSVFieldMapping(csvData, existingKeyMapping, apiRequiredFields);
            setCsvMappings(mappings);
            
            // Validate no use case mappings
            setTimeout(() => {
              const validation = validateMappingCompleteness(mappings, apiRequiredFields);
              setValidationResult(validation);
            }, 100);
          } else {
            // Generate mappings without required fields to avoid hardcoded data
            const mappings = generateCSVFieldMapping(csvData, existingKeyMapping, []);
            setCsvMappings(mappings);
            
            // No required fields means always valid
            setValidationResult({ isValid: true, missingRequired: [], unmappedCount: 0 });
          }
        }
      } catch (error) {
        console.error('Error during mapping initialization:', error);
        toast.error('Failed to initialize field mapping');
        
        // ⚠️ CRITICAL: Only use API required fields on error, never hardcoded fallbacks
        if (apiRequiredFields && apiRequiredFields.length > 0) {
          const mappings = generateCSVFieldMapping(csvData, existingKeyMapping, apiRequiredFields);
          setCsvMappings(mappings);
          
          // Validate error fallback mappings
          setTimeout(() => {
            const validation = validateMappingCompleteness(mappings, apiRequiredFields);
            setValidationResult(validation);
          }, 100);
        } else {
          // Generate mappings without required fields to avoid hardcoded data
          const mappings = generateCSVFieldMapping(csvData, existingKeyMapping, []);
          setCsvMappings(mappings);
          
          // No required fields means always valid
          setValidationResult({ isValid: true, missingRequired: [], unmappedCount: 0 });
        }
      } finally {
        setIsLoadingApiData(false);
      }
    };

    initializeMapping();
  }, [csvData, existingKeyMapping, apiRequiredFields, campaignUseCase]);

  // ⚠️ CRITICAL: Re-validate whenever mappings change and auto-complete when ready
  useEffect(() => {
    if (csvMappings.length > 0 && !isLoadingApiData) {
      const validation = validateAllRequiredFieldsMapped();
      
      // ⚠️ CRITICAL: Auto-complete mapping when all required fields are mapped
      if (validation.isValid && validation.missingRequired.length === 0) {
        
        // Generate final data and key mapping
        const finalData = generatePreviewData();
        const keyMapping = csvMappings.reduce((acc, mapping) => {
          if (mapping.mappingStatus === 'mapped' && mapping.importAs !== 'do_not_import') {
            let apiFieldName = mapping.importAs;
            
            // Ensure API field name is in camelCase for API compatibility
            const camelCaseFieldName = toCamelCase(apiFieldName);
            
            // Always use the camelCase version for API compatibility
            if (camelCaseFieldName !== apiFieldName) {
              apiFieldName = camelCaseFieldName;
            }
            
            acc[mapping.columnHeader] = apiFieldName;
          }
          return acc;
        }, {} as Record<string, string>);
        
        
        setTimeout(() => {
          onComplete(finalData, keyMapping);
        }, 500); // Small delay to show validation success
      }
    }
  }, [csvMappings, isLoadingApiData]);

  // Handle import as change
  const handleImportAsChange = (index: number, value: string) => {
    const updatedMappings = [...csvMappings];
    const mapping = updatedMappings[index];
    
    // Check if this import category is already mapped (for non-spyne property categories)
    const isAlreadyMapped = updatedMappings.some(
      (item, idx) => 
        idx !== index &&
        item.importAs === value &&
        item.mappingStatus === 'mapped' &&

        value !== 'do_not_import'
    );

    if (isAlreadyMapped) {
      const readableLabel = getImportCategoryFromValue(value);
      toast.error(`${readableLabel} can only be mapped to one column`);
      return;
    }

    mapping.importAs = value;
    mapping.spyneProperty = null;
    
    // Update mapping status
    mapping.mappingStatus = value === 'do_not_import' ? 'mapped' : 'mapped';
    
    setCsvMappings(updatedMappings);
    
    // Validation is now handled by useEffect automatically
  };



  // Generate preview data based on current mappings
  const generatePreviewData = () => {
    const mappedFields = csvMappings.filter(
      mapping => mapping.mappingStatus === 'mapped' && mapping.importAs !== 'do_not_import'
    );

    console.log('🔄 Generating preview data with mapped fields:', mappedFields.map(m => ({ 
      csvHeader: m.columnHeader, 
      apiField: m.importAs 
    })));

    return csvData.map(row => {
      const transformedRow: any = {};
      
      // Use the actual user mappings from csvMappings state
      mappedFields.forEach(mapping => {
        const csvValue = row[mapping.columnHeader];
        let apiFieldName = mapping.importAs;
        
        // Ensure API field name is in camelCase for API compatibility
        const camelCaseFieldName = toCamelCase(apiFieldName);
        
        // Always use the camelCase version for API compatibility
        if (camelCaseFieldName !== apiFieldName) {
          apiFieldName = camelCaseFieldName;
        }
        
        
        // Just preserve the raw CSV value - no transformations
        // Since all CSVs are different and dynamic, show actual first row values
        transformedRow[apiFieldName] = csvValue !== undefined ? csvValue : '';
      });


      return transformedRow;
    });
  };



  // Pagination calculations for preview
  const totalPages = Math.ceil(previewData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = previewData.slice(indexOfFirstItem, indexOfLastItem);

  // Preview table handlers
  const handleInputChange = (field: string, value: string) => {
    setEditedData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleEditClick = (index: number, rowData: any) => {
    setEditingRow(index);
    setEditedData(rowData);
  };

  const handleSaveEdit = (index: number) => {
    const updatedData = [...previewData];
    updatedData[index] = { ...updatedData[index], ...editedData };
    setPreviewData(updatedData);
    setEditingRow(null);
    setEditedData({});
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditedData({});
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    setEditingRow(null);
    setEditedData({});
  };

  const handleDelete = (index: number) => {
    const updatedData = previewData.filter((_, i) => i !== index);
    setPreviewData(updatedData);
    
    // Adjust current page if necessary
    const newTotalPages = Math.ceil(updatedData.length / itemsPerPage);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    }
    
    setEditingRow(null);
    setEditedData({});
  };

  // Calculate progress
  const mappedCount = csvMappings.filter(m => m.mappingStatus === 'mapped').length;
  const progress = csvMappings.length > 0 ? (mappedCount / csvMappings.length) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Step Indicator */}
      <StepIndicator steps={steps} currentStep={currentStep} />

      {/* Progress Bar for Mapping Step */}
      {currentStep === 0 && !isLoadingApiData && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Mapping Progress</span>
              <span className="text-sm text-gray-600">{mappedCount}/{csvMappings.length} mapped</span>
            </div>
            <Progress value={progress} className="h-2" />
            {validationResult.isValid ? (
              <div className="mt-2 text-sm text-green-600 font-medium">
                ✅ All required fields mapped! Auto-completing...
              </div>
            ) : validationResult.missingRequired.length > 0 ? (
              <div className="mt-2 text-sm text-orange-600">
                Missing required fields: {validationResult.missingRequired.join(', ')}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoadingApiData && (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Campaign Requirements</h3>
                <p className="text-sm text-gray-600">Fetching required fields and analyzing your CSV...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Content */}
      {!isLoadingApiData && currentStep === 0 && (
        <CSVFieldMappingTable
          csvMappings={csvMappings}
          onImportAsChange={handleImportAsChange}
          apiRequiredFields={dynamicRequiredFields.length > 0 ? dynamicRequiredFields : apiRequiredFields}
          isLoadingApiData={isLoadingApiData}
        />
      )}

      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Review Data ({previewData.length} records)
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Review the processed data before finalizing the campaign setup.
            </p>
          </div>
          
          <DataPreviewTable
            data={previewData}
            currentItems={currentItems}
            indexOfFirstItem={indexOfFirstItem}
            currentPage={currentPage}
            totalPages={totalPages}
            editingRow={editingRow}
            editedData={editedData}
            onInputChange={handleInputChange}
            onEditClick={handleEditClick}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onPageChange={handlePageChange}
            onDelete={handleDelete}
          />
        </div>
      )}
    
    </div>
  );
}
