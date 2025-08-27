import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Upload } from 'lucide-react';
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
  requiresSpyneProperty,
  getSpynePropertiesForImport,
  getImportCategoryFromValue,
  CAMPAIGN_MAPPING_CONFIG 
} from '@/lib/types/csv-mapping';

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
}

export default function CSVMappingFlow({
  csvData,
  onComplete,
  onCancel,
  existingKeyMapping,
  apiRequiredFields
}: CSVMappingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [csvMappings, setCsvMappings] = useState<CSVFieldMapping[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const steps = ['Map Fields', 'Review Data'];

  // Initialize CSV mappings on mount
  useEffect(() => {
    if (csvData && csvData.length > 0) {
      const mappings = generateCSVFieldMapping(csvData, existingKeyMapping, apiRequiredFields);
      setCsvMappings(mappings);
    }
  }, [csvData, existingKeyMapping, apiRequiredFields]);

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
        !requiresSpyneProperty(value) &&
        value !== 'do_not_import'
    );

    if (isAlreadyMapped) {
      const config = Object.values(CAMPAIGN_MAPPING_CONFIG).find(c => c.value === value);
      toast.error(`${config?.label || value} can only be mapped to one column`);
      return;
    }

    mapping.importAs = value;
    mapping.spyneProperty = null;
    
    // Update mapping status based on whether spyne properties are required
    if (requiresSpyneProperty(value)) {
      mapping.mappingStatus = 'unmapped';
    } else {
      mapping.mappingStatus = value === 'do_not_import' ? 'mapped' : 'mapped';
    }
    
    setCsvMappings(updatedMappings);
  };

  // Handle spyne property change
  const handleSpynePropertyChange = (index: number, value: string) => {
    const updatedMappings = [...csvMappings];
    const mapping = updatedMappings[index];
    
    // Check if this spyne property is already mapped
    const isAlreadyMapped = updatedMappings.some(
      (item, idx) => 
        idx !== index &&
        item.spyneProperty === value &&
        item.mappingStatus === 'mapped'
    );

    if (isAlreadyMapped) {
      const spyneProperties = getSpynePropertiesForImport(mapping.importAs);
      const property = spyneProperties.find(p => p.value === value);
      toast.error(`${property?.label || value} can only be mapped to one column`);
      return;
    }

    mapping.spyneProperty = value;
    mapping.mappingStatus = 'mapped';
    setCsvMappings(updatedMappings);
  };

  // Generate preview data based on current mappings
  const generatePreviewData = () => {
    const mappedFields = csvMappings.filter(
      mapping => mapping.mappingStatus === 'mapped' && mapping.importAs !== 'do_not_import'
    );

    return csvData.map(row => {
      const transformedRow: any = {};
      
      mappedFields.forEach(mapping => {
        const csvValue = row[mapping.columnHeader] || '';
        
        // Map to the appropriate field based on importAs and spyneProperty
        if (mapping.importAs === 'customer_name') {
          transformedRow.CustomerFullName = csvValue;
        } else if (mapping.importAs === 'phone_number') {
          transformedRow.ContactPhoneNumber = csvValue;
        } else if (mapping.importAs === 'vehicle_info') {
          if (mapping.spyneProperty === 'vin') {
            transformedRow.VIN = csvValue;
          }
          // Could handle registration_number and stock_number here if needed
        } else if (mapping.importAs === 'recall_description') {
          transformedRow.RecallDescription = csvValue;
        } else if (mapping.importAs === 'vehicle_make') {
          transformedRow.VehicleMake = csvValue;
        } else if (mapping.importAs === 'vehicle_model') {
          transformedRow.VehicleModel = csvValue;
        } else if (mapping.importAs === 'vehicle_year') {
          transformedRow.VehicleYear = csvValue;
        } else if (mapping.importAs === 'parts_availability') {
          transformedRow.PartsAvailabilityFlag = csvValue.toLowerCase() === 'true' || csvValue.toLowerCase() === 'available' ? 'true' : 'false';
        } else if (mapping.importAs === 'loaner_eligibility') {
          transformedRow.LoanerEligibility = csvValue.toLowerCase() === 'true' || csvValue.toLowerCase() === 'eligible' ? 'true' : 'false';
        } else if (mapping.importAs === 'symptom') {
          transformedRow.Symptom = csvValue;
        } else if (mapping.importAs === 'risk_details') {
          transformedRow.RiskDetails = csvValue;
        } else if (mapping.importAs === 'remedy_steps') {
          transformedRow.RemedySteps = csvValue;
        }
      });

      // Set defaults for unmapped required fields
      const requiredFields = [
        'CustomerFullName', 'ContactPhoneNumber', 'VIN', 'RecallDescription',
        'VehicleMake', 'VehicleModel', 'VehicleYear', 'PartsAvailabilityFlag',
        'LoanerEligibility', 'Symptom', 'RiskDetails', 'RemedySteps'
      ];
      
      requiredFields.forEach(field => {
        if (!transformedRow[field]) {
          transformedRow[field] = '';
        }
      });

      return transformedRow;
    });
  };

  // Handle next step
  const handleNext = () => {
    if (currentStep === 0) {
      // Validate mappings before proceeding
      const validation = validateMappingCompleteness(csvMappings, apiRequiredFields);
      
      if (!validation.isValid) {
        toast.error(
          `Missing required mappings: ${validation.missingRequired.join(', ')}`
        );
        return;
      }

      if (validation.unmappedCount > 0) {
        toast.warning(
          `${validation.unmappedCount} column(s) are not mapped and will be ignored`
        );
      }

      // Generate preview data
      const preview = generatePreviewData();
      setPreviewData(preview);
      setCurrentStep(1);
    } else {
      // Complete the flow
      onComplete(previewData);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep === 0) {
      onCancel();
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  // Pagination calculations for preview
  const totalPages = Math.ceil(previewData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = previewData.slice(indexOfFirstItem, indexOfLastItem);

  // Preview table handlers
  const handleInputChange = (field: string, value: string) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
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
          onSpynePropertyChange={handleSpynePropertyChange}
          apiRequiredFields={apiRequiredFields}
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

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {currentStep === 0 ? 'Cancel' : 'Previous'}
        </Button>

        <Button
          onClick={handleNext}
          className="flex items-center gap-2"
          disabled={currentStep === 0 && mappedCount === 0}
        >
          {currentStep === steps.length - 1 ? (
            <>
              <Upload className="h-4 w-4" />
              Complete Setup
            </>
          ) : (
            <>
              Next
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
