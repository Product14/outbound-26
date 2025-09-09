'use client'

import { useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/ui/time-picker"
import { Progress } from "@/components/ui/progress"
import { Upload, Database, Cloud, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { CampaignData, ValidationErrors } from '@/types/campaign-setup'
import { getRequiredKeysForUseCase, downloadSampleFile } from '@/utils/campaign-setup-utils'
import { ParsedCustomerData, ParseResult } from '@/lib/file-parser'
import { CampaignTypesResponse } from '@/lib/campaign-api'
import CSVMappingStep from '@/components/csv-mapping/CSVMappingStep'

interface Step2FileUploadProps {
  campaignData: CampaignData
  setCampaignData: (updater: (prev: CampaignData) => CampaignData) => void
  selectedCategory: string
  errors: ValidationErrors
  setErrors: (updater: (prev: ValidationErrors) => ValidationErrors) => void
  
  // Upload states
  uploadProgress: number
  isUploading: boolean
  uploadComplete: boolean
  hasError: boolean
  uploadedData: ParsedCustomerData[]
  parseErrors: string[]
  missingColumns: string[]
  
  // Sales upload options
  selectedUploadOption: string
  setSelectedUploadOption: (option: string) => void
  crmSelection: string
  setCrmSelection: (selection: string) => void
  googleDriveLink: string
  setGoogleDriveLink: (link: string) => void
  
  // VinSolutions state
  vinSolutionsStartDate: string
  setVinSolutionsStartDate: (date: string) => void
  vinSolutionsEndDate: string
  setVinSolutionsEndDate: (date: string) => void
  vinSolutionsStartTime: string
  setVinSolutionsStartTime: (time: string) => void
  vinSolutionsEndTime: string
  setVinSolutionsEndTime: (time: string) => void
  enableRecurringLeads: boolean
  setEnableRecurringLeads: (enabled: boolean) => void
  leadAgeDays: number
  setLeadAgeDays: (days: number) => void
  
  // Google Drive state
  isGoogleDriveLoading: boolean
  googleDriveData: ParsedCustomerData[]
  googleDriveComplete: boolean
  googleDriveErrors: string[]
  
  // CSV mapping
  showCSVMappingStep: boolean
  csvParseResult: ParseResult | null
  csvMappingComplete: boolean
  setCsvMappingComplete: (complete: boolean) => void
  keyMapping: Record<string, string> | null
  isProcessingKeyMapping: boolean
  
  // Campaign types for dynamic fields
  campaignTypes: CampaignTypesResponse | null
  
  // Authentication
  authKey?: string
  
  // Handlers
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  fetchGoogleDriveData: (shareUrl: string) => void
  handleCSVMappingComplete: (mappedData: any[], keyMapping: Record<string, string>) => Promise<void>
  handleSkipCSVMapping: () => Promise<void>
  getDisplayColumns: () => string[]
}

export default function Step2FileUpload({
  campaignData,
  setCampaignData,
  selectedCategory,
  errors,
  setErrors,
  
  // Upload states
  uploadProgress,
  isUploading,
  uploadComplete,
  hasError,
  uploadedData,
  parseErrors,
  missingColumns,
  
  // Sales upload options
  selectedUploadOption,
  setSelectedUploadOption,
  crmSelection,
  setCrmSelection,
  googleDriveLink,
  setGoogleDriveLink,
  
  // VinSolutions state
  vinSolutionsStartDate,
  setVinSolutionsStartDate,
  vinSolutionsEndDate,
  setVinSolutionsEndDate,
  vinSolutionsStartTime,
  setVinSolutionsStartTime,
  vinSolutionsEndTime,
  setVinSolutionsEndTime,
  enableRecurringLeads,
  setEnableRecurringLeads,
  leadAgeDays,
  setLeadAgeDays,
  
  // Google Drive state
  isGoogleDriveLoading,
  googleDriveData,
  googleDriveComplete,
  googleDriveErrors,
  
  // CSV mapping
  showCSVMappingStep,
  csvParseResult,
  csvMappingComplete,
  setCsvMappingComplete,
  keyMapping,
  isProcessingKeyMapping,
  
  // Campaign types
  campaignTypes,
  
  // Authentication
  authKey,
  
  // Handlers
  handleFileUpload,
  fetchGoogleDriveData,
  handleCSVMappingComplete,
  handleSkipCSVMapping,
  getDisplayColumns
}: Step2FileUploadProps) {
  const fileUploadRef = useRef<HTMLDivElement | null>(null)

  const getRequiredFields = () => {
    return getRequiredKeysForUseCase(campaignData.subUseCase, selectedCategory, campaignTypes)
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-6">
        <div className="bg-transparent border-0 p-0">
          <div className="mb-4">
            <h1 className="text-[24px] font-bold text-[#1A1A1A] leading-[1.4]">
              {selectedCategory === 'sales' ? 'Import Customer Data' : 'Upload Customer Data'}
            </h1>
            <p className="text-[14px] text-[#6B7280] mt-2 leading-[1.5]">
              {selectedCategory === 'sales' 
                ? 'Choose how you want to import your customer data for your AI calling campaign'
                : 'Upload your customer data file to power your AI calling campaign with personalized outreach'
              }
            </p>
          </div>
        </div>

        {campaignData.subUseCase && selectedCategory === 'service' && (
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
            <div className="border border-[#3B82F6] bg-[#3B82F6]/10 rounded-lg p-4">
              <div className="mb-3">
                <h3 className="text-[#3B82F6] flex items-center text-[14px] font-medium">
                  <Database className="h-4 w-4 mr-2" />
                  Required Fields for {campaignData.subUseCase}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {getRequiredFields().map((field: string) => (
                  <Badge key={field} variant="outline" className="border-[#3B82F6] text-[#3B82F6] text-[12px] bg-white rounded-full">
                    {field.replace(/[_]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sales Upload Options */}
        {selectedCategory === 'sales' && (
          <div className={`bg-white border rounded-lg p-6 transition-colors ${
            errors.fileUpload && !selectedUploadOption ? 'border-red-500' : 'border-[#E5E7EB]'
          }`}>
            <h3 className={`text-[16px] font-semibold mb-4 ${
              errors.fileUpload && !selectedUploadOption ? 'text-red-600' : 'text-[#1A1A1A]'
            }`}>
              Choose Import Method {errors.fileUpload && !selectedUploadOption && <span className="text-red-500">*</span>}
            </h3>
            {errors.fileUpload && !selectedUploadOption && (
              <p className="text-[12px] text-red-600 flex items-center mb-4">
                <AlertCircle className="h-3 w-3 mr-1" />
                Please select an import method to continue
              </p>
            )}
            <div className="grid grid-cols-1 gap-4">
              {/* Option 1: Import from CRM */}
              <div 
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedUploadOption === 'crm'
                    ? 'border-[#4600f2] bg-[#4600f2]/5 shadow-sm'
                    : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB] hover:shadow-sm'
                }`}
                onClick={() => {
                  setSelectedUploadOption('crm')
                  if (selectedUploadOption !== 'crm') {
                    setCrmSelection('')
                  }
                  setGoogleDriveLink('')
                  // Reset CSV mapping completion when switching methods
                  setCsvMappingComplete(false)
                  // Clear file upload error when method is selected
                  if (errors.fileUpload) {
                    setErrors(prev => ({ ...prev, fileUpload: false }))
                  }
                }}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mt-1 ${
                    selectedUploadOption === 'crm' 
                      ? 'bg-[#4600F2]/10 text-[#4600F2]' 
                      : 'bg-[#EEF2FF] text-[#6366F1]'
                  }`}>
                    <Database className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[14px] font-semibold text-[#1A1A1A] mb-1">Import from other CRM</h4>
                    <p className="text-[13px] text-[#6B7280] leading-[1.5] mb-3">
                      Connect and import customer data directly from your existing CRM system
                    </p>
                    {selectedUploadOption === 'crm' && (
                      <div className="mt-3 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <Select value={crmSelection} onValueChange={(value) => {
                          setCrmSelection(value)
                          // Clear CRM selection error when CRM is selected
                          if (errors.crmSelection && value) {
                            setErrors(prev => ({ ...prev, crmSelection: false }))
                          }
                        }}>
                          <SelectTrigger className={`w-full h-10 text-[14px] bg-white ${
                            errors.crmSelection
                              ? 'border-red-500 focus:border-red-500' 
                              : 'border-[#E5E7EB] focus:border-[#4600F2]'
                          }`}>
                            <SelectValue placeholder="Select your CRM" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="vinsolutions">VinSolutions</SelectItem>
                            <SelectItem value="others">Others</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.crmSelection && (
                          <p className="text-[12px] text-red-600 mt-1">Please select a CRM system</p>
                        )}
                        
                        {/* VinSolutions Date/Time Filters */}
                        {crmSelection === 'vinsolutions' && (
                          <div className="mt-4 p-4 bg-white rounded-lg border border-[#E5E7EB]" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">Lead Filter Options</h3>
                            
                            {/* Filter Type Toggle */}
                            <div className="mb-6">
                              <div className="flex items-center space-x-4">
                                <div 
                                  className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${
                                    !enableRecurringLeads 
                                      ? 'border-[#4600F2] bg-[#4600F2]/5 shadow-sm' 
                                      : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB]'
                                  }`}
                                  onClick={() => {
                                    setEnableRecurringLeads(false)
                                    if (errors.leadAgeDays) {
                                      setErrors(prev => ({ ...prev, leadAgeDays: false }))
                                    }
                                  }}
                                >
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                    !enableRecurringLeads ? 'border-[#4600F2] bg-[#4600F2]' : 'border-[#D1D5DB]'
                                  }`}>
                                    {!enableRecurringLeads && <div className="w-2 h-2 rounded-full bg-white" />}
                                  </div>
                                  <span className="text-[14px] font-medium text-[#1A1A1A]">Date Range Filter</span>
                                </div>
                                
                                <div 
                                  className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${
                                    enableRecurringLeads 
                                      ? 'border-[#4600F2] bg-[#4600F2]/5 shadow-sm' 
                                      : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB]'
                                  }`}
                                  onClick={() => {
                                    setEnableRecurringLeads(true)
                                    if (errors.vinSolutionsDateRange) {
                                      setErrors(prev => ({ ...prev, vinSolutionsDateRange: false }))
                                    }
                                  }}
                                >
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                    enableRecurringLeads ? 'border-[#4600F2] bg-[#4600F2]' : 'border-[#D1D5DB]'
                                  }`}>
                                    {enableRecurringLeads && <div className="w-2 h-2 rounded-full bg-white" />}
                                  </div>
                                  <span className="text-[14px] font-medium text-[#1A1A1A]">Recurring Lead Age</span>
                                </div>
                              </div>
                              <p className="text-[12px] text-[#6B7280] mt-2">
                                {!enableRecurringLeads 
                                  ? 'Import leads created within a specific date range' 
                                  : 'Automatically call leads when they reach a specific age (e.g., call 10-day old leads)'
                                }
                              </p>
                            </div>

                            {!enableRecurringLeads ? (
                              /* Date Range Filter */
                            <div className="space-y-4">
                              {/* Start Date/Time Row */}
                              <div>
                                <label className="text-[12px] font-normal text-[#6B7280] mb-2 block">From</label>
                                <div className="grid grid-cols-2 gap-3">
                                  <DatePicker
                                    value={vinSolutionsStartDate}
                                      onChange={(value) => {
                                        setVinSolutionsStartDate(value)
                                        if (errors.vinSolutionsDateRange && value) {
                                          setErrors(prev => ({ ...prev, vinSolutionsDateRange: false }))
                                        }
                                      }}
                                    placeholder="Select start date"
                                      className={errors.vinSolutionsDateRange ? 'border-red-500' : ''}
                                    // For CRM imports, start date should not be in the future since we're importing historical leads
                                    maxDate={new Date().toISOString().split('T')[0]}
                                  />
                                  <TimePicker
                                    value={vinSolutionsStartTime}
                                      onChange={(value) => {
                                        setVinSolutionsStartTime(value)
                                        if (errors.vinSolutionsDateRange && value) {
                                          setErrors(prev => ({ ...prev, vinSolutionsDateRange: false }))
                                        }
                                      }}
                                    placeholder="Select start time"
                                      className={errors.vinSolutionsDateRange ? 'border-red-500' : ''}
                                    selectedDate={vinSolutionsStartDate}
                                    isCrmImport={true} // Enable CRM import mode: allow past times, restrict future times for today
                                  />
                                </div>
                              </div>
                              
                              {/* End Date/Time Row */}
                              <div>
                                <label className="text-[12px] font-normal text-[#6B7280] mb-2 block">To</label>
                                <div className="grid grid-cols-2 gap-3">
                                  <DatePicker
                                    value={vinSolutionsEndDate}
                                      onChange={(value) => {
                                        setVinSolutionsEndDate(value)
                                        if (errors.vinSolutionsDateRange && value) {
                                          setErrors(prev => ({ ...prev, vinSolutionsDateRange: false }))
                                        }
                                      }}
                                    placeholder="Select end date"
                                      className={errors.vinSolutionsDateRange ? 'border-red-500' : ''}
                                    // Allow end date to be up to today + reasonable buffer for CRM imports
                                    maxDate={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                  />
                                  <TimePicker
                                    value={vinSolutionsEndTime}
                                      onChange={(value) => {
                                        setVinSolutionsEndTime(value)
                                        if (errors.vinSolutionsDateRange && value) {
                                          setErrors(prev => ({ ...prev, vinSolutionsDateRange: false }))
                                        }
                                      }}
                                    placeholder="Select end time"
                                      className={errors.vinSolutionsDateRange ? 'border-red-500' : ''}
                                    selectedDate={vinSolutionsEndDate}
                                    isCrmImport={true} // Enable CRM import mode: allow past times, restrict future times for today
                                  />
                                </div>
                              </div>
                                {errors.vinSolutionsDateRange && (
                                  <p className="text-[12px] text-red-600 mt-1">
                                    Please ensure start date/time is before end date/time, and end date is not more than 7 days in the future
                                  </p>
                                )}
                            </div>
                            ) : (
                              /* Recurring Lead Age Filter */
                              <div className="space-y-4">
                                <div>
                                  <Label className={`text-[14px] font-medium mb-2 block ${
                                    errors.leadAgeDays ? 'text-red-600' : 'text-[#1A1A1A]'
                                  }`}>
                                    Call leads that are {errors.leadAgeDays && <span className="text-red-500">*</span>}
                                  </Label>
                                  <div className="flex items-center space-x-3">
                                    <Input
                                      type="number"
                                      min="1"
                                      max="365"
                                      value={leadAgeDays}
                                      onChange={(e) => {
                                        const inputValue = e.target.value
                                        // Allow empty input for better UX
                                        if (inputValue === '') {
                                          setLeadAgeDays(0)
                                          return
                                        }
                                        
                                        const value = parseInt(inputValue)
                                        // Ensure value is within 1-365 range
                                        if (!isNaN(value)) {
                                          const clampedValue = Math.min(Math.max(value, 1), 365)
                                          setLeadAgeDays(clampedValue)
                                          
                                          // Clear error if value is now valid
                                          if (errors.leadAgeDays && clampedValue >= 1 && clampedValue <= 365) {
                                            setErrors(prev => ({ ...prev, leadAgeDays: false }))
                                          }
                                        }
                                      }}
                                      className={`w-20 h-10 text-[14px] text-center ${
                                        errors.leadAgeDays 
                                          ? 'border-red-500 focus:border-red-500' 
                                          : 'border-[#E5E7EB] focus:border-[#4600F2]'
                                      }`}
                                      placeholder="10"
                                    />
                                    <span className="text-[14px] text-[#1A1A1A] font-medium">days old</span>
                          </div>
                                  {errors.leadAgeDays && (
                                    <p className="text-[12px] text-red-600 mt-1">Please enter a valid number of days (1-365)</p>
                                  )}
                                  {/* <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-[12px] text-blue-800">
                                      <strong>Example:</strong> If set to {leadAgeDays} days, the system will automatically call leads that were created exactly {leadAgeDays} days ago. A lead created on January 1st will be called on January {leadAgeDays + 1}th.
                                    </p>
                                  </div> */}
                                </div>
                      </div>
                    )}
                  </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Option 2: Google Drive Link - DISABLED */}

              {/* Option 3: Upload CSV */}
              <div 
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedUploadOption === 'upload'
                    ? 'border-[#4600f2] bg-[#4600f2]/5 shadow-sm'
                    : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB] hover:shadow-sm'
                }`}
                onClick={() => {
                  setSelectedUploadOption('upload')
                  setCrmSelection('')
                  setGoogleDriveLink('')
                  // Reset CSV mapping completion when switching methods
                  setCsvMappingComplete(false)
                  // Clear file upload error when method is selected
                  if (errors.fileUpload) {
                    setErrors(prev => ({ ...prev, fileUpload: false }))
                  }
                }}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mt-1 ${
                    selectedUploadOption === 'upload' 
                      ? 'bg-[#4600F2]/10 text-[#4600F2]' 
                      : 'bg-[#ECFDF5] text-[#10B981]'
                  }`}>
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[14px] font-semibold text-[#1A1A1A] mb-1">Upload your own CSV</h4>
                    <p className="text-[13px] text-[#6B7280] leading-[1.5] mb-3">
                      Upload a CSV file from your computer with customer data
                    </p>
                    {selectedUploadOption === 'upload' && (
                      <div className="mt-3">
                        {errors.fileUpload && (
                          <div className="mb-4">
                            <p className="text-[12px] text-red-600 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Please upload a customer data file to continue
                            </p>
                          </div>
                        )}
                        <div 
                          className={`border-2 border-dashed rounded-lg p-8 text-center hover:border-[#4600F2] hover:bg-[#4600F214] transition-all duration-300 ${
                            errors.fileUpload 
                              ? 'border-red-400' 
                              : 'border-[#E5E7EB]'
                          } bg-[#F4F5F8]`}
                          onDrop={(e) => {
                            e.preventDefault()
                            const files = e.dataTransfer.files
                            if (files.length > 0) {
                              const file = files[0]
                              if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                                // Create a proper FileList-like object
                                const fileList = {
                                  0: file,
                                  length: 1,
                                  item: (index: number) => index === 0 ? file : null,
                                  [Symbol.iterator]: function* () {
                                    yield file;
                                  }
                                } as FileList;
                                
                                const event = {
                                  target: { files: fileList }
                                } as unknown as React.ChangeEvent<HTMLInputElement>
                                handleFileUpload(event)
                                if (errors.fileUpload) {
                                  setErrors(prev => ({ ...prev, fileUpload: false }))
                                }
                              }
                            }
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDragEnter={(e) => e.preventDefault()}
                          onClick={(e) => {
                            // Prevent the parent container click from interfering
                            e.stopPropagation()
                          }}
                        >
                          <Upload className={`h-12 w-12 mx-auto mb-4 ${
                            errors.fileUpload ? 'text-red-400' : 'text-[#6B7280]'
                          }`} />
                          <div className="space-y-3">
                            <p className="text-[14px] font-semibold text-[#1A1A1A]">Drag and drop your file here</p>
                            <p className="text-[12px] text-[#6B7280]">Supports .csv files up to 10MB</p>
                            <p className="text-[14px] text-[#6B7280]">or</p>
                            <div className="relative">
                              <Input
                                id="sales-file-upload"
                                type="file"
                                accept=".xlsx,.csv"
                                className="hidden"
                                onChange={(e) => {
                                  handleFileUpload(e)
                                  if (errors.fileUpload) {
                                    setErrors(prev => ({ ...prev, fileUpload: false }))
                                  }
                                }}
                              />
                              <button
                                type="button"
                                className={`mt-2 h-9 px-3 text-[12px] rounded-lg font-medium transition-colors ${
                                  errors.fileUpload
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : 'bg-[#4600F2] text-white hover:bg-[#4600F2]/90'
                                }`}
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  const fileInput = document.getElementById('sales-file-upload') as HTMLInputElement
                                  if (fileInput) {
                                    fileInput.click()
                                  }
                                }}
                              >
                                Browse Files
                              </button>
                            </div>
                          </div>
                          
                        
                        </div>
                        
                        {/* Upload Progress */}
                        {isUploading && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-[#1A1A1A]">
                                {campaignData.fileName || 'Uploading file...'}
                              </span>
                              <span className="text-sm text-[#6B7280]">{uploadProgress}%</span>
                            </div>
                            <Progress value={uploadProgress} className="h-2" />
                          </div>
                        )}
                        
                        {/* Upload Success */}
                        {uploadComplete && !isUploading && (
                          <div className="mt-4">
                            <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-green-800">File uploaded successfully</p>
                                <p className="text-xs text-green-600 mt-1">
                                  {campaignData.fileName} • {campaignData.totalRecords} records
                                  {isProcessingKeyMapping && " • Processing column mapping..."}
                                  {keyMapping && " • Column mapping completed"}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Upload Error */}
                        {hasError && !isUploading && (
                          <div className="mt-4">
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-start">
                                <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-red-800 mb-2">Upload failed</p>
                                  {parseErrors.length > 0 && (
                                    <div className="space-y-1">
                                      {parseErrors.map((error, index) => (
                                        <p key={index} className="text-xs text-red-600">• {error}</p>
                                      ))}
                                    </div>
                                  )}
                                  {missingColumns.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-xs text-red-600 font-medium">Missing required columns:</p>
                                      <p className="text-xs text-red-600">{missingColumns.join(', ')}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Download Sample CSV - Always visible for sales */}
            <div className="mt-6 pt-4 border-t border-[#E5E7EB]">
              <div className="flex items-center justify-center">
                <button 
                  onClick={() => downloadSampleFile(campaignData.subUseCase, campaignData.useCase, campaignTypes)}
                  className="inline-flex items-center text-[14px] font-medium text-[#4600F2] hover:text-[#4600F2]/80 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download sample CSV file
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Service Upload - Original Upload UI */}
        {selectedCategory === 'service' && (
          <div ref={fileUploadRef} className={`bg-white border rounded-lg p-6 transition-colors ${
            errors.fileUpload ? 'border-red-500' : 'border-[#E5E7EB]'
          }`}>
            {errors.fileUpload && (
              <div className="mb-4">
                <p className="text-[12px] text-red-600 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Please upload a customer data file to continue
                </p>
              </div>
            )}
            <div className={`border-2 border-dashed rounded-lg p-8 text-center hover:border-[#4600F2] hover:bg-[#4600F214] transition-all duration-300 ${
              errors.fileUpload 
                ? 'border-red-400' 
                : 'border-[#E5E7EB]'
            } bg-[#F4F5F8]`}>
              <Upload className={`h-12 w-12 mx-auto mb-4 ${
                errors.fileUpload ? 'text-red-400' : 'text-[#6B7280]'
              }`} />
              <div className="space-y-3">
                <p className="text-[14px] font-semibold text-[#1A1A1A]">Drag and drop your file here</p>
                <p className="text-[12px] text-[#6B7280]">Supports .xlsx and .csv files up to 10MB</p>
                <p className="text-[14px] text-[#6B7280]">or</p>
                <Label htmlFor="service-file-upload" className="cursor-pointer">
                  <Button 
                    type="button"
                    className={`mt-2 h-9 px-3 text-[12px] rounded-lg font-medium ${
                      errors.fileUpload
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-[#4600F2] text-white hover:bg-[#4600F2]/90'
                    }`}
                    size="sm"
                    onClick={() => {
                      document.getElementById('service-file-upload')?.click()
                    }}
                  >
                    Browse Files
                  </Button>
                  <Input
                    id="service-file-upload"
                    type="file"
                    accept=".xlsx,.csv"
                    className="hidden"
                    onChange={(e) => {
                      handleFileUpload(e)
                      if (errors.fileUpload) {
                        setErrors(prev => ({ ...prev, fileUpload: false }))
                      }
                    }}
                  />
                </Label>
              </div>
              
              {/* Download sample file CTA for service */}
              <div className="mt-4">
                <button 
                  onClick={() => downloadSampleFile(campaignData.subUseCase, campaignData.useCase, campaignTypes)}
                  className="inline-flex items-center text-[12px] font-medium text-[#4600F2] hover:text-[#4600F2]/80 transition-colors"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download sample file
                </button>
              </div>
            </div>
          </div>
        )}

        {isUploading && (
          <div className="space-y-3 mt-6 bg-white p-4 rounded-lg border border-[#E5E7EB]">
            <div className="flex justify-between text-[14px] font-medium">
              <span className="text-[#1A1A1A]">Uploading {campaignData.fileName}...</span>
              <span className="text-[#4600F2]">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-3" />
          </div>
        )}

        {uploadComplete && !hasError && (
          <div className="mt-6">
            {/* CSV Mapping Step */}
            {showCSVMappingStep && csvParseResult && (
              <div className="mb-6">
                <CSVMappingStep
                  csvData={uploadedData}
                  parseResult={csvParseResult}
                  existingKeyMapping={keyMapping || undefined}
                  apiRequiredFields={getRequiredKeysForUseCase(campaignData.subUseCase, selectedCategory, campaignTypes)}
                  onMappingComplete={handleCSVMappingComplete}
                  onSkipMapping={handleSkipCSVMapping}
                  showSkipOption={false}
                  campaignUseCase={campaignData.subUseCase}
                  authKey={authKey}
                />
              </div>
            )}

            {/* Key Mapping Processing Loader */}
            {isProcessingKeyMapping && !showCSVMappingStep && (
              <div className="flex items-center justify-center p-8 bg-white border border-[#E5E7EB] rounded-lg mb-6">
                <div className="flex items-center space-x-3">
                  <Loader2 className="h-5 w-5 animate-spin text-[#4600F2]" />
                  <div>
                    <p className="text-[16px] font-semibold text-[#1A1A1A]">Processing data mapping...</p>
                    <p className="text-[14px] text-[#6B7280]">Analyzing columns and mapping fields</p>
                  </div>
                </div>
              </div>
            )}

            {/* Complete Uploaded Data Preview - All 12 Columns */}
            {!isProcessingKeyMapping && !showCSVMappingStep && (
            <div className="border border-[#E5E7EB] rounded-lg bg-white">
              <div className="bg-[#F4F5F8] border-b border-[#E5E7EB] px-6 py-4">
                <h3 className="text-[16px] font-semibold text-[#1A1A1A]">Uploaded Data Preview</h3>
                <p className="text-[14px] text-[#6B7280]">All {uploadedData.length} rows with {getDisplayColumns().length} columns uploaded successfully</p>
              </div>
              <div className="max-h-96 overflow-auto">
                <table className="min-w-full divide-y divide-[#E5E7EB] text-[13px]">
                  <thead className="bg-[#F4F5F8] sticky top-0">
                    <tr>
                      <th className="px-2 py-3 text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap">
                        #
                      </th>
                      {getDisplayColumns().map((field: string) => (
                        <th key={field} className="px-2 py-3 text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                          {field.replace(/([A-Z])/g, ' $1').trim()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#E5E7EB]">
                    {uploadedData.map((row, index) => (
                      <tr key={index} className="hover:bg-[#F4F5F8]">
                        <td className="px-2 py-3 whitespace-nowrap text-[#6B7280] font-medium">
                          {index + 1}
                        </td>
                        {getDisplayColumns().map((field: string) => (
                          <td key={field} className="px-2 py-3 text-[#1A1A1A] max-w-[150px]">
                            <div className="truncate" title={String(row[field as keyof typeof row] || '')}>
                              {row[field as keyof typeof row] !== undefined ? row[field as keyof typeof row] : 'N/A'}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Data Summary Footer */}
              <div className="border-t border-[#E5E7EB] bg-[#F4F5F8] px-6 py-3">
                <div className="flex items-center justify-between text-[12px] text-[#6B7280]">
                  <span>Showing all {uploadedData.length} records with {getDisplayColumns().length} required fields</span>
                  <span>Scroll horizontally to view all columns →</span>
                </div>
              </div>
            </div>
            )}
          </div>
        )}

        {hasError && (
          <div className="space-y-4 mt-6">
            <div className="flex items-start p-6 bg-[#EF4444]/10 border-2 border-[#EF4444] rounded-lg">
              <AlertCircle className="h-6 w-6 text-[#EF4444] mr-4 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-[#1A1A1A] text-[16px]">
                  {missingColumns.length > 0 ? 'Missing Required Data' : 'File Validation Error'}
                </p>
                
                {missingColumns.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[#6B7280] text-[14px] mb-2">
                      The following required fields are missing data after column mapping:
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {missingColumns.map((column) => (
                        <Badge key={column} variant="outline" className="border-[#EF4444] text-[#EF4444] bg-white">
                          {column.replace(/[_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {parseErrors.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[#6B7280] text-[14px] mb-2">Validation errors:</p>
                    <div className="max-h-32 overflow-y-auto">
                      {parseErrors.slice(0, 5).map((error, index) => (
                        <p key={index} className="text-[13px] text-[#EF4444] mb-1">• {error}</p>
                      ))}
                      {parseErrors.length > 5 && (
                        <p className="text-[13px] text-[#6B7280]">... and {parseErrors.length - 5} more errors</p>
                      )}
                    </div>
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 px-3 text-[12px] border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg font-medium"
                  onClick={() => downloadSampleFile(campaignData.subUseCase, campaignData.useCase, campaignTypes)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
