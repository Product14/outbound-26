import React from 'react';
import { Edit, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TransformedDataItem {
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

interface DataPreviewTableProps {
  data: TransformedDataItem[];
  currentItems: TransformedDataItem[];
  indexOfFirstItem: number;
  currentPage: number;
  totalPages: number;
  editingRow: number | null;
  editedData: Partial<TransformedDataItem>;
  onInputChange: (field: string, value: string) => void;
  onEditClick: (index: number, rowData: TransformedDataItem) => void;
  onSaveEdit: (index: number) => void;
  onCancelEdit: () => void;
  onPageChange: (pageNumber: number) => void;
  onDelete: (index: number) => void;
}

export default function DataPreviewTable({
  data,
  currentItems,
  indexOfFirstItem,
  currentPage,
  totalPages,
  editingRow,
  editedData,
  onInputChange,
  onEditClick,
  onSaveEdit,
  onCancelEdit,
  onPageChange,
  onDelete,
}: DataPreviewTableProps) {
  const itemsPerPage = currentItems.length;

  // Column definitions
  const columns = [
    { key: 'CustomerFullName', label: 'Customer Name', width: 'w-48' },
    { key: 'ContactPhoneNumber', label: 'Phone', width: 'w-40' },
    { key: 'VIN', label: 'VIN', width: 'w-44' },
    { key: 'RecallDescription', label: 'Recall Description', width: 'w-60' },
    { key: 'VehicleMake', label: 'Make', width: 'w-32' },
    { key: 'VehicleModel', label: 'Model', width: 'w-32' },
    { key: 'VehicleYear', label: 'Year', width: 'w-24' },
    { key: 'PartsAvailabilityFlag', label: 'Parts Available', width: 'w-32' },
    { key: 'LoanerEligibility', label: 'Loaner Eligible', width: 'w-32' },
    { key: 'Symptom', label: 'Symptom', width: 'w-48' },
    { key: 'RiskDetails', label: 'Risk Details', width: 'w-48' },
    { key: 'RemedySteps', label: 'Remedy Steps', width: 'w-48' },
  ];

  const renderPagination = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          Showing {indexOfFirstItem + 1} to {Math.min(indexOfFirstItem + itemsPerPage, data.length)} of {data.length} entries
        </div>
        
      </div>
    );
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`text-left py-4 px-4 font-medium text-gray-900 ${column.width}`}
                  >
                    {column.label}
                  </th>
                ))}
                <th className="text-center py-4 px-4 font-medium text-gray-900 w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item, index) => {
                const actualIndex = indexOfFirstItem + index;
                const isEditing = editingRow === actualIndex;

                return (
                  <tr key={actualIndex} className="border-b hover:bg-gray-50">
                    {columns.map((column) => (
                      <td key={column.key} className={`py-3 px-4 ${column.width}`}>
                        {isEditing ? (
                          <Input
                            value={editedData[column.key as keyof TransformedDataItem] || item[column.key as keyof TransformedDataItem] || ''}
                            onChange={(e) => onInputChange(column.key, e.target.value)}
                            className="w-full text-sm"
                          />
                        ) : (
                          <div className="text-sm text-gray-900 truncate">
                            {column.key === 'PartsAvailabilityFlag' || column.key === 'LoanerEligibility' ? (
                              <Badge variant={item[column.key as keyof TransformedDataItem] === 'true' ? 'default' : 'secondary'}>
                                {item[column.key as keyof TransformedDataItem] === 'true' ? 'Yes' : 'No'}
                              </Badge>
                            ) : (
                              item[column.key as keyof TransformedDataItem] || '-'
                            )}
                          </div>
                        )}
                      </td>
                    ))}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onSaveEdit(actualIndex)}
                              className="h-8 w-8 p-0"
                            >
                              <Save className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={onCancelEdit}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4 text-gray-600" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEditClick(actualIndex, item)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onDelete(actualIndex)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && renderPagination()}
      </CardContent>
    </Card>
  );
}
