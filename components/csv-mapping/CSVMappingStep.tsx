import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

import CSVMappingFlow from './CSVMappingFlow';
import { generateCSVFieldMapping, validateMappingCompleteness } from '@/lib/types/csv-mapping';
import type { ParseResult } from '@/lib/file-parser';

interface CSVMappingStepProps {
  csvData: any[];
  parseResult?: ParseResult;
  existingKeyMapping?: Record<string, string>;
  apiRequiredFields?: string[]; // Dynamic required fields from API
  onMappingComplete: (mappedData: any[], keyMapping: Record<string, string>) => void;
  onSkipMapping: () => void;
  showSkipOption?: boolean;
  campaignUseCase?: string; // Add campaign use case for API integration
}

export default function CSVMappingStep({
  csvData,
  parseResult,
  existingKeyMapping,
  apiRequiredFields,
  onMappingComplete,
  onSkipMapping,
  showSkipOption = false,
  campaignUseCase
}: CSVMappingStepProps) {
  const [showMappingFlow, setShowMappingFlow] = useState(false);
  const [autoMappingComplete, setAutoMappingComplete] = useState(false);
  const [mappingStats, setMappingStats] = useState<{
    total: number;
    mapped: number;
    unmapped: number;
    missingRequired: string[];
  }>({ total: 0, mapped: 0, unmapped: 0, missingRequired: [] });

  // Check if we can auto-map most fields
  useEffect(() => {
    if (csvData && csvData.length > 0) {
      console.log('CSV Mapping Step - API Required Fields:', apiRequiredFields);
      const suggestedMappings = parseResult?.suggestedMappings || {};
      const mappings = generateCSVFieldMapping(csvData, suggestedMappings, apiRequiredFields);
      const validation = validateMappingCompleteness(mappings, apiRequiredFields);
      console.log('CSV Mapping Step - Generated mappings:', mappings);
      console.log('CSV Mapping Step - Validation result:', validation);
      
      setMappingStats({
        total: mappings.length,
        mapped: mappings.filter(m => m.mappingStatus === 'mapped').length,
        unmapped: validation.unmappedCount,
        missingRequired: validation.missingRequired
      });

      // Auto-complete if all required fields are mapped
      if (validation.isValid && validation.unmappedCount === 0) {
        setAutoMappingComplete(true);
      }
    }
  }, [csvData, parseResult]);

  const handleStartMapping = () => {
    setShowMappingFlow(true);
  };

  const handleMappingFlowComplete = (mappedData: any[]) => {
    console.log('🎯 CSVMappingStep - Received mappedData:', mappedData);
    console.log('🎯 CSVMappingStep - Sample keys:', mappedData?.[0] ? Object.keys(mappedData[0]) : 'No data');
    
    // Generate the key mapping for the traditional system
    const keyMapping: Record<string, string> = {};
    
    // This would be derived from the mapping flow results
    // For now, we'll use the suggested mappings as a fallback
    if (parseResult?.suggestedMappings) {
      Object.assign(keyMapping, parseResult.suggestedMappings);
    }
    
    onMappingComplete(mappedData, keyMapping);
  };

  const handleCancelMapping = () => {
    setShowMappingFlow(false);
  };

  if (showMappingFlow) {
    return (
      <CSVMappingFlow
        csvData={csvData}
        onComplete={handleMappingFlowComplete}
        onCancel={handleCancelMapping}
        existingKeyMapping={existingKeyMapping}
        apiRequiredFields={apiRequiredFields}
        campaignUseCase={campaignUseCase}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              {autoMappingComplete ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  CSV Field Mapping
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {autoMappingComplete
                    ? 'All required fields have been automatically mapped from your CSV.'
                    : 'Some fields require manual mapping to ensure data accuracy.'}
                </p>
              </div>
            </div>

            {/* Mapping Statistics */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{mappingStats.total}</div>
                <div className="text-sm text-gray-600">Total Columns</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{mappingStats.mapped}</div>
                <div className="text-sm text-gray-600">Auto-Mapped</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{mappingStats.unmapped}</div>
                <div className="text-sm text-gray-600">Need Review</div>
              </div>
            </div>

            {/* Smart Mapping Info */}
            {parseResult?.suggestedMappings && Object.keys(parseResult.suggestedMappings).length > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  We've automatically detected and mapped {Object.keys(parseResult.suggestedMappings).length} fields 
                  based on their column names. You can review and adjust these mappings if needed.
                </AlertDescription>
              </Alert>
            )}

            {/* Missing Required Fields Warning */}
            {mappingStats.missingRequired.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div>The following required fields are missing from your CSV:</div>
                    <div className="font-medium">
                      {mappingStats.missingRequired.join(', ')}
                    </div>
                    <div className="text-sm">
                      You'll need to map these fields manually or ensure they're present in your CSV.
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              {autoMappingComplete ? (
                <Button 
                  onClick={() => handleMappingFlowComplete(csvData)}
                  className="flex-1"
                >
                  Use Auto-Mapping & Continue
                </Button>
              ) : (
                <Button 
                  onClick={handleStartMapping}
                  className="flex-1"
                >
                  Review & Adjust Mapping
                </Button>
              )}
              
              {showSkipOption && (
                <Button 
                  variant="outline"
                  onClick={onSkipMapping}
                >
                  Use Original System
                </Button>
              )}
            </div>

            {/* Sample Data Preview */}
            {csvData && csvData.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  CSV Preview (First Row)
                </h4>
                <div className="bg-gray-50 rounded-lg p-3 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        {Object.keys(csvData[0]).slice(0, 6).map((header) => (
                          <th key={header} className="text-left px-2 py-1 font-medium text-gray-700">
                            {header}
                          </th>
                        ))}
                        {Object.keys(csvData[0]).length > 6 && (
                          <th className="text-left px-2 py-1 text-gray-500">
                            ... +{Object.keys(csvData[0]).length - 6} more
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {Object.keys(csvData[0]).slice(0, 6).map((header) => (
                          <td key={header} className="px-2 py-1 text-gray-600 truncate max-w-[120px]">
                            {csvData[0][header] || '-'}
                          </td>
                        ))}
                        {Object.keys(csvData[0]).length > 6 && (
                          <td className="px-2 py-1 text-gray-400">...</td>
                        )}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
