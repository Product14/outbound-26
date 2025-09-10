import React from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import { CSVFieldMapping, getImportAsOptions } from '@/lib/types/csv-mapping';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface CSVFieldMappingTableProps {
  csvMappings: CSVFieldMapping[];
  onImportAsChange: (index: number, value: string) => void;
  apiRequiredFields?: string[];
  isLoadingApiData?: boolean;
}

export default function CSVFieldMappingTable({
  csvMappings,
  onImportAsChange,
  apiRequiredFields,
  isLoadingApiData = false,
}: CSVFieldMappingTableProps) {
  const mappedCount = csvMappings.filter(
    (item) => item.mappingStatus === 'mapped'
  ).length;
  const totalCount = csvMappings.length;

  // ⚠️ CRITICAL: Only show import options when API data is available
  const importAsOptions = isLoadingApiData 
    ? [] // Show empty options while loading to prevent hardcoded data
    : getImportAsOptions(apiRequiredFields);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Map your CSV fields
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {isLoadingApiData 
              ? 'Loading campaign requirements and mapping your CSV fields...'
              : 'Fields have been mapped based on your campaign requirements. Please verify or adjust as needed.'
            }
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <span className="font-medium">
            {mappedCount}/{totalCount} mapped
          </span>
          <Check className="h-4 w-4 text-green-600" />
        </Badge>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
                    Column header from file ({csvMappings.length})
                  </th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
                    Column values
                  </th>
                  <th className="text-center py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
                    Import as
                  </th>
                </tr>
              </thead>
              <tbody>
                {csvMappings.length === 0 && !isLoadingApiData && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      No CSV data found. Please upload a valid CSV file.
                    </td>
                  </tr>
                )}
                {csvMappings.map((mapping, index) => {
                  return (
                    <tr
                      key={index}
                      className={`border-b hover:bg-gray-50 ${
                        mapping.mappingStatus !== 'mapped' ? 'bg-red-50' : ''
                      }`}
                    >
                      {/* Column Header */}
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900 truncate max-w-[200px]">
                          {mapping.columnHeader}
                        </div>
                      </td>

                      {/* Column Values */}
                      <td className="py-4 px-6">
                        <div className="text-gray-600 text-sm truncate max-w-[250px]">
                          {mapping.columnValues}
                        </div>
                      </td>

                      {/* Mapping Status */}
                      <td className="py-4 px-6 text-center">
                        {mapping.mappingStatus === 'mapped' ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 bg-green-600 rounded-full">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-6 h-6 bg-red-500 rounded-full">
                            <AlertTriangle className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </td>

                      {/* Import As Dropdown */}
                      <td className="py-4 px-6">
                        <Select
                          value={mapping.importAs}
                          onValueChange={(value) => onImportAsChange(index, value)}
                          disabled={isLoadingApiData} // Disable while loading API data
                        >
                          <SelectTrigger 
                            className={`w-full ${
                              mapping.mappingStatus !== 'mapped'
                                ? 'border-red-300 bg-red-50'
                                : 'border-gray-300'
                            } ${isLoadingApiData ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <SelectValue 
                              placeholder={isLoadingApiData ? "Loading API data..." : "Select import type"} 
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {importAsOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
