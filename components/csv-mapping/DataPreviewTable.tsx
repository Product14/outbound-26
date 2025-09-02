import React from 'react';
import { Edit, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TransformedDataItem {
  [key: string]: string | number | boolean;
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

  // Generate column definitions dynamically from data
  const columns = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const sampleItem = data[0];
    const columnKeys = Object.keys(sampleItem);
    
    return columnKeys.map(key => ({
      key,
      label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim(),
      width: getColumnWidth(key)
    }));
  }, [data]);

  // Helper function to determine column width based on content type
  const getColumnWidth = (key: string): string => {
    const keyLower = key.toLowerCase();
    
    if (keyLower.includes('name') || keyLower.includes('description')) return 'w-48';
    if (keyLower.includes('phone') || keyLower.includes('mobile')) return 'w-40';
    if (keyLower.includes('vin')) return 'w-44';
    if (keyLower.includes('year')) return 'w-24';
    if (keyLower.includes('flag') || keyLower.includes('eligible') || keyLower.includes('available')) return 'w-32';
    if (keyLower.includes('make') || keyLower.includes('model')) return 'w-32';
    
    // Default width for other fields
    return 'w-40';
  };

  // Helper function to render cell values with appropriate formatting
  const renderCellValue = (value: string | number | boolean, columnKey: string) => {
    if (value === undefined || value === null || value === '') {
      return '-';
    }

    const keyLower = columnKey.toLowerCase();
    
    // Check if this is a boolean field that should be displayed as Yes/No
    if (typeof value === 'boolean' || 
        (typeof value === 'string' && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) ||
        keyLower.includes('flag') || keyLower.includes('eligible') || keyLower.includes('available')) {
      
      const boolValue = typeof value === 'boolean' ? value : String(value).toLowerCase() === 'true';
      return (
        <Badge variant={boolValue ? 'default' : 'secondary'}>
          {boolValue ? 'Yes' : 'No'}
        </Badge>
      );
    }
    
    return String(value);
  };

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
                            value={String(editedData[column.key] || item[column.key] || '')}
                            onChange={(e) => onInputChange(column.key, e.target.value)}
                            className="w-full text-sm"
                          />
                        ) : (
                          <div className="text-sm text-gray-900 truncate">
                            {renderCellValue(item[column.key], column.key)}
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
