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
  onComplete: (mappedData: any[]) => void;
  onCancel: () => void;
  existingKeyMapping?: Record<string, string>;
  apiRequiredFields?: string[];
  campaignUseCase?: string; // Add campaign use case for API integration
}

export default function CSVMappingFlow({
  csvData,
  onComplete,
  onCancel,
  existingKeyMapping,
  apiRequiredFields,
  campaignUseCase
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
  const itemsPerPage = 8;

  const steps = ['Map Fields', 'Review Data'];

  // Helper function to determine if a CSV header should map to a specific API field
  const shouldMapToApiField = (csvHeader: string, apiField: string): boolean => {
    const csvNormalized = csvHeader.toLowerCase().replace(/[^a-z0-9]/g, '');
    const apiNormalized = apiField.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Exact match (case-insensitive)
    if (csvNormalized === apiNormalized) return true;
    
    // PascalCase to camelCase matching
    if (csvHeader === apiField.charAt(0).toUpperCase() + apiField.slice(1)) return true;
    
    // Handle specific mappings
    const mappings: Record<string, string> = {
      'customerfullname': 'customerFullName',
      'contactphonenumber': 'contactPhoneNumber',
      'vin': 'vin',
      'recalldescription': 'recallDescription',
      'vehiclemake': 'vehicleMake',
      'vehiclemodel': 'vehicleModel',
      'vehicleyear': 'vehicleYear',
      'partsavailabilityflag': 'partsAvailabilityFlag',
      'loanereligibility': 'loanerEligibility',
      'symptom': 'symptom',
      'riskdetails': 'riskDetails',
      'remedysteps': 'remedySteps'
    };
    
    return mappings[csvNormalized] === apiField;
  };

  // Initialize CSV mappings with API integration
  useEffect(() => {
    const initializeMapping = async () => {
      if (!csvData || csvData.length === 0) return;

      setIsLoadingApiData(true);
      
      try {
        // Get CSV headers
        const csvHeaders = Object.keys(csvData[0]);
        console.log('CSV Headers:', csvHeaders);

        // If campaign use case is provided, integrate with APIs
        if (campaignUseCase) {
          console.log('Integrating with APIs for use case:', campaignUseCase);
          
          const apiResult = await integrateCsvWithApis(campaignUseCase, csvHeaders);
          
          if (apiResult.success) {
            console.log('API integration successful:', apiResult);
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
                  console.log(`🔧 Correcting mapping: ${csvHeader} → ${apiField} (was: ${currentMapping})`);
                  return {
                    ...mapping,
                    importAs: apiField,
                    mappingStatus: 'mapped' as const
                  };
                }
              }
              
              return mapping;
            });
            
            console.log('🗂️ Generated CSV mappings:', mappings);
            console.log('🔧 Corrected CSV mappings:', correctedMappings);
            console.log('📋 API required fields:', apiResult.requiredFields);
            console.log('🔗 Combined key mapping:', { ...existingKeyMapping, ...apiResult.keyMapping });
            setCsvMappings(correctedMappings);
          } else {
            console.error('API integration failed:', apiResult.error);
            toast.error(`Failed to fetch mapping data: ${apiResult.error}`);
            
            // Fallback to existing behavior
            const mappings = generateCSVFieldMapping(csvData, existingKeyMapping, apiRequiredFields);
            setCsvMappings(mappings);
          }
        } else {
          // Fallback to existing behavior when no use case is provided
          console.log('No campaign use case provided, using fallback mapping');
          const mappings = generateCSVFieldMapping(csvData, existingKeyMapping, apiRequiredFields);
          setCsvMappings(mappings);
        }
      } catch (error) {
        console.error('Error during mapping initialization:', error);
        toast.error('Failed to initialize field mapping');
        
        // Fallback to existing behavior on error
        const mappings = generateCSVFieldMapping(csvData, existingKeyMapping, apiRequiredFields);
        setCsvMappings(mappings);
      } finally {
        setIsLoadingApiData(false);
      }
    };

    initializeMapping();
  }, [csvData, existingKeyMapping, apiRequiredFields, campaignUseCase]);

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
      
      // FORCE EXACT API FIELD NAMES - Ignore all CSV mappings and use only API fields
      const apiRequiredFieldsToUse = dynamicRequiredFields.length > 0 ? dynamicRequiredFields : (apiRequiredFields || []);
      
      console.log('🎯 FORCING exact API fields:', apiRequiredFieldsToUse);
      
      // Create mapping from CSV headers to API field names
      const csvToApiMapping: Record<string, string> = {
        'CustomerFullName': 'customerFullName',
        'ContactPhoneNumber': 'contactPhoneNumber', 
        'VIN': 'vin',
        'RecallDescription': 'recallDescription',
        'VehicleMake': 'vehicleMake',
        'VehicleModel': 'vehicleModel',
        'VehicleYear': 'vehicleYear',
        'PartsAvailabilityFlag': 'partsAvailabilityFlag',
        'LoanerEligibility': 'loanerEligibility',
        'Symptom': 'symptom',
        'RiskDetails': 'riskDetails',
        'RemedySteps': 'remedySteps'
      };
      
      // Map each API field by finding its CSV data
      apiRequiredFieldsToUse.forEach(apiFieldName => {
        // Find CSV column that contains the data for this API field
        let csvValue = '';
        
        // Look through all possible CSV column names for this API field
        for (const [csvColumnName, apiField] of Object.entries(csvToApiMapping)) {
          if (apiField === apiFieldName && row[csvColumnName]) {
            csvValue = row[csvColumnName];
            console.log(`🎯 ${apiFieldName} ← ${csvColumnName} = "${csvValue}"`);
            break;
          }
        }
        
        // If not found in mapping, try direct match
        if (!csvValue) {
          csvValue = row[apiFieldName] || '';
        }
        
        // Transform the value based on field type
        if (apiFieldName.toLowerCase().includes('flag') || 
            apiFieldName.toLowerCase().includes('eligible') || 
            apiFieldName.toLowerCase().includes('available')) {
          // Boolean fields
          transformedRow[apiFieldName] = csvValue.toLowerCase() === 'true' || 
                                       csvValue.toLowerCase() === 'available' || 
                                       csvValue.toLowerCase() === 'eligible' ? 'true' : 'false';
        } else {
          // Regular text fields
          transformedRow[apiFieldName] = csvValue;
        }
      });

      console.log('✅ Final transformed row with exact API fields:', transformedRow);

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
      {currentStep === 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Mapping Progress</span>
              <span className="text-sm text-gray-600">{mappedCount}/{csvMappings.length} mapped</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Step Content */}
      {currentStep === 0 && (
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

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        
        <div className="flex items-center gap-3">
          {currentStep > 0 && (
            <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
              Back
            </Button>
          )}
          
          {currentStep === 0 ? (
            <Button 
              onClick={() => {
                // Generate preview data and move to next step
                const preview = generatePreviewData();
                setPreviewData(preview);
                setCurrentStep(1);
              }}
              disabled={isLoadingApiData}
            >
              {isLoadingApiData ? 'Loading...' : 'Continue to Review'}
            </Button>
          ) : (
            <Button 
              onClick={() => {
                console.log('🚀 FINAL DATA being sent to onComplete:', previewData);
                console.log('🚀 Sample customer keys:', previewData?.[0] ? Object.keys(previewData[0]) : 'No data');
                onComplete(previewData);
              }}
            >
              Complete Mapping
            </Button>
          )}
        </div>
      </div>

    </div>
  );
}
