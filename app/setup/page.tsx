'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { TimePicker } from "@/components/ui/time-picker"
import { DatePicker } from "@/components/ui/date-picker"
import { ArrowRight, ArrowLeft, Upload, FileText, Calendar, CheckCircle, Download, AlertCircle, Zap, Clock, Users, Database, Plus, X, TrendingUp, Wrench, Play, Pause, MessageSquare, Shield, Link as LinkIcon, Cloud, Mail, Phone, Loader2 } from 'lucide-react'
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { cn } from "@/lib/utils"
import { BarChart3 } from 'lucide-react'
import confetti from 'canvas-confetti'
import { extractUrlParams, buildUrlWithParams, type UrlParams } from '@/lib/url-utils'
import { transformCampaignData, launchCampaign, createInitialCampaignPayload, fetchCampaignTypes, processKeyMapping, type Customer, type CampaignTypesResponse, type CampaignType } from '@/lib/campaign-api'
import { parseUploadedFile, REQUIRED_CSV_COLUMNS, type ParsedCustomerData, type ParseResult } from '@/lib/file-parser'
import { fetchAgentList, type Agent } from '@/lib/agent-api'
import { useToast } from "@/hooks/use-toast"
import { calculateAndFormatEstimatedTime, getShortEstimatedTime, calculateAndFormatTimeRange, getEstimatedTimeInMinutes, calculateEndDate } from '@/lib/time-utils'
import { storeCampaignData, getCampaignData, updateCampaignId, updateKeyMapping, updateUploadedData, clearCampaignData } from '@/lib/storage-utils'
import CSVMappingStep from '@/components/csv-mapping/CSVMappingStep'

interface SubCase {
  value: string;
  label: string;
  requiredFields: string[];
  disabled?: boolean;
}

interface UseCase {
  label: string;
  color: string;
  disabled?: boolean;
  subCases: SubCase[];
}

interface UseCases {
  [key: string]: UseCase;
}



const useCases: UseCases = {
  sales: {
    label: 'Sales',
    color: 'bg-green-lighter text-green-darker border-green-8',
    disabled: false,
    subCases: [
      { value: 'lead-qualification', label: 'Lead Qualification', requiredFields: ['Customer Name', 'Phone', 'Lead Source', 'Interest Level'], disabled: false },
      { value: 'lead-enrichment', label: 'Lead Enrichment', requiredFields: ['Customer Name', 'Phone', 'Company', 'Contact Info'], disabled: false },
      { value: 'price-drop-alert', label: 'Price Drop Alert', requiredFields: ['Customer Name', 'Phone', 'Vehicle Interest', 'Previous Price', 'New Price'], disabled: false },
      { value: 'new-arrival-alert', label: 'New Arrival Alert', requiredFields: ['Customer Name', 'Phone', 'Vehicle Interest', 'New Vehicle Details'], disabled: false }
    ]
  },
  service: {
    label: 'Service',
    color: 'bg-blue-lighter text-blue-purple border-blue-8',
    disabled: false,
    subCases: [
      { value: 'maintenance-reminder', label: 'Maintenance Reminder', requiredFields: ['Customer Name', 'Phone', 'VIN', 'Last Service Date', 'Vehicle Make/Model'], disabled: false },
      { value: 'recall-notification', label: 'Recall Notification', requiredFields: ['Customer Name', 'Phone', 'VIN', 'Vehicle Make/Model/Year'], disabled: false },
      { value: 'warranty-expiration', label: 'Warranty Expiration', requiredFields: ['Customer Name', 'Phone', 'VIN', 'Warranty End Date', 'Vehicle Make/Model'], disabled: false },
      { value: 'seasonal-service', label: 'Seasonal Service', requiredFields: ['Customer Name', 'Phone', 'VIN', 'Service Type', 'Vehicle Make/Model'], disabled: false },
      { value: 'service-appointment-booking', label: 'Service Appointment Booking', requiredFields: ['Customer Name', 'Phone', 'VIN', 'Vehicle Make/Model', 'Preferred Service Type'], disabled: false },
      { value: 'customer-satisfaction-followup', label: 'Customer Satisfaction Follow-up', requiredFields: ['Customer Name', 'Phone', 'VIN', 'Last Service Date', 'Service Type'], disabled: false }
    ]
  }
}

// Dynamic steps based on use case
const getSteps = (useCase: string) => {
  if (useCase === 'sales') {
    return [
      { id: 1, name: 'Campaign Details', number: '01' },
      { id: 2, name: 'File Upload', number: '02' },
      { id: 3, name: 'Call Settings', number: '03' },
      { id: 4, name: 'Handoff Settings', number: '04' },
      { id: 5, name: 'Start Campaign', number: '05' }
    ]
  } else {
    return [
      { id: 1, name: 'Campaign Details', number: '01' },
      { id: 2, name: 'File Upload', number: '02' },
      { id: 3, name: 'Call Settings', number: '03' },
      { id: 4, name: 'Start Campaign', number: '04' }
    ]
  }
}

export default function CampaignSetup() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [hasError, setHasError] = useState(false)

  const [campaignData, setCampaignData] = useState({
    campaignName: '',
    useCase: 'sales',
    subUseCase: '',
    bcdDetails: '',
    fileName: '',
    schedule: 'now',
    scheduledDate: '',
    scheduledEndDate: '',
    scheduledTime: '',
    totalRecords: 0,
    // Sales specific
    channels: {
      email: false,
      sms: true,
      voiceAi: true,
    },
    scriptTemplate: {
                              voiceIntroduction: "Hi {first_name}, I have exciting news! We just received the {vehicle_interest} that matches what you were looking for. It&apos;s exactly what you described – would you like me to hold it for a test drive today or tomorrow?",
      corePitch: '',
      objectionHandling: '',
      legalConsent: 'This call may be recorded for quality purposes.',
      optOut: 'Reply STOP to opt out of future messages.',
      handoffOffer: 'Would you like me to connect you with a specialist?',
    },
    compliance: {
      includeRecordingConsent: true,
      includeSmsOptOut: true,
    },
    // Call Rules
    maxRetryAttempts: 3,
    retryDelayMinutes: 60,
    callWindowStart: '09:00',
    callWindowEnd: '17:00',
    timezone: 'America/New_York',
    doNotCallList: true,
    maxCallsPerHour: 50,
                          maxCallsPerDay: 200,
                      maxConcurrentCalls: 5,
                      voicemailStrategy: 'leave_message',
                      disconnectedCallRetry: true,
                      busySignalRetry: true,
                      noAnswerRetry: true,
                      busyCustomerRetry: true,
                      voicemailMessage: '',
                      // Campaign Goals & Handoff
                      primaryGoal: 'book_test_drive',
                      secondaryActions: {
                        sendInventoryLink: false,
                        emailQuote: false,
                        textFinanceLink: false,
                      },
                      handoffSettings: {
                        target: 'round_robin',
                        businessHoursStart: '09:00',
                        businessHoursEnd: '17:00',
                      },
                      escalationTriggers: {
                        leadRequestsPerson: false,
                        complexFinancing: false,
                        pricingNegotiation: false,
                                                technicalQuestions: false,
                      }
                    })
  
  // Calculate estimated time and time range dynamically based on total records
  const estimatedTime = calculateAndFormatEstimatedTime(campaignData.totalRecords)
  
  // Calculate time range based on start date
  const getEstimatedTimeRange = () => {
    // For "now" campaigns, start immediately
    if (campaignData.schedule === 'now') {
      return calculateAndFormatTimeRange(new Date(), campaignData.totalRecords)
    }
    // For scheduled campaigns, use the scheduled date/time
    if (campaignData.schedule === 'scheduled' && campaignData.scheduledDate && campaignData.scheduledTime) {
      const startDate = new Date(`${campaignData.scheduledDate}T${campaignData.scheduledTime}`)
      return calculateAndFormatTimeRange(startDate, campaignData.totalRecords)
    }
    // Fallback to current time if schedule details are incomplete
    return calculateAndFormatTimeRange(new Date(), campaignData.totalRecords)
  }
  const [selectedCategory, setSelectedCategory] = useState<string>('sales')
  const [createdCampaignId, setCreatedCampaignId] = useState('')
  const [urlParams, setUrlParams] = useState<UrlParams>({ enterprise_id: null, team_id: null, auth_key: null })
  const [uploadedData, setUploadedData] = useState<ParsedCustomerData[]>([])
  const [isLaunching, setIsLaunching] = useState(false)
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [missingColumns, setMissingColumns] = useState<string[]>([])
  
  // Sales upload options state
  const [selectedUploadOption, setSelectedUploadOption] = useState<string>('')
  const [crmSelection, setCrmSelection] = useState<string>('')
  const [googleDriveLink, setGoogleDriveLink] = useState<string>('')
  
  // VinSolutions date/time filter state
  const [vinSolutionsStartDate, setVinSolutionsStartDate] = useState<string>('')
  const [vinSolutionsEndDate, setVinSolutionsEndDate] = useState<string>('')
  const [vinSolutionsStartTime, setVinSolutionsStartTime] = useState<string>('')
  const [vinSolutionsEndTime, setVinSolutionsEndTime] = useState<string>('')
  
  // VinSolutions recurring lead filter state
  const [enableRecurringLeads, setEnableRecurringLeads] = useState<boolean>(false)
  const [leadAgeDays, setLeadAgeDays] = useState<number>(10)
  
  // Google Drive import state
  const [isGoogleDriveLoading, setIsGoogleDriveLoading] = useState<boolean>(false)
  const [googleDriveData, setGoogleDriveData] = useState<ParsedCustomerData[]>([])
  const [googleDriveComplete, setGoogleDriveComplete] = useState<boolean>(false)
  const [googleDriveErrors, setGoogleDriveErrors] = useState<string[]>([])
  
  // Agent state
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [isLoadingAgents, setIsLoadingAgents] = useState(false)
  
  // API integration state
  const [campaignTypes, setCampaignTypes] = useState<CampaignTypesResponse | null>(null)
  const [isLoadingCampaignTypes, setIsLoadingCampaignTypes] = useState(false)
  const [storedCampaignId, setStoredCampaignId] = useState<string | null>(null)
  const [requiredKeys, setRequiredKeys] = useState<string[]>([])
  const [keyMapping, setKeyMapping] = useState<Record<string, string> | null>(null)
  const [isProcessingKeyMapping, setIsProcessingKeyMapping] = useState(false)
  
  // New CSV mapping system state
  const [showCSVMappingStep, setShowCSVMappingStep] = useState(false)
  const [csvParseResult, setCsvParseResult] = useState<ParseResult | null>(null)
  // OLD MAPPING SYSTEM STATE - COMMENTED OUT
  // const [useNewMappingSystem, setUseNewMappingSystem] = useState(true)

  // Get required keys for the selected use case from API data
  const getRequiredKeysForUseCase = () => {
    if (!campaignTypes || !campaignData.subUseCase) {
      return []
    }

    const categoryData = campaignTypes.data.find(group => 
      group.campaignFor.toLowerCase() === selectedCategory.toLowerCase()
    )
    
    if (!categoryData) return []

    const selectedCampaignType = categoryData.campaignTypes.find(type => 
      type.name === campaignData.subUseCase || 
      type.name.replace(/[_\s]/g, '-').toLowerCase() === campaignData.subUseCase.replace(/[_\s]/g, '-').toLowerCase()
    )

    return selectedCampaignType?.requiredKeys?.map(key => key.name) || []
  }

  // Get dynamic use cases from API data
  const getDynamicUseCases = () => {
    if (!campaignTypes) {
      return useCases // Return static use cases as fallback
    }

    const dynamicUseCases: any = {}
    
    campaignTypes.data.forEach(group => {
      const categoryKey = group.campaignFor.toLowerCase()
      const existingCategory = useCases[categoryKey as keyof typeof useCases]
      
      if (existingCategory) {
        dynamicUseCases[categoryKey] = {
          ...existingCategory,
          subCases: group.campaignTypes.map(type => ({
            value: type.name.replace(/[_\s]/g, '-').toLowerCase(),
            label: type.name.replace(/[_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            requiredFields: type.requiredKeys?.map(key => key.name) || [],
            disabled: !type.isActive
          }))
        }
      }
    })

    // Fill in any missing categories with static data
    Object.keys(useCases).forEach(key => {
      if (!dynamicUseCases[key]) {
        dynamicUseCases[key] = useCases[key as keyof typeof useCases]
      }
    })

    return dynamicUseCases
  }

  // Get dynamic columns based on current use case
  const getDisplayColumns = () => {
    const apiRequiredKeys = getRequiredKeysForUseCase()
    if (apiRequiredKeys.length > 0) {
      return apiRequiredKeys
    }
    // If no API keys and we have uploaded data, use actual columns from the data
    if (uploadedData.length > 0) {
      return Object.keys(uploadedData[0])
    }
    // Final fallback to hardcoded columns
    return REQUIRED_CSV_COLUMNS
  }

  // Process key mapping when file is uploaded
  const processUploadedFile = async (data: any[], fileName: string, isGoogleDriveData: boolean = false) => {
    const apiRequiredKeys = getRequiredKeysForUseCase()
    
    if (data.length > 0) {
      try {
        setIsProcessingKeyMapping(true)
        const availableKeys = Object.keys(data[0])
        
        console.log('Processing key mapping:', {
          requiredKeys: apiRequiredKeys,
          availableKeys
        })
        
        // Always attempt key mapping, even if no specific required keys from API
        // This helps with column standardization and mapping
        const keysToMap = apiRequiredKeys.length > 0 ? apiRequiredKeys : availableKeys
        const mapping = await processKeyMapping(keysToMap, availableKeys)
        
        console.log('Key mapping result:', {
          apiRequiredKeys,
          availableKeys,
          keysToMap,
          mapping
        })
        
        setKeyMapping(mapping)
        setRequiredKeys(keysToMap)
        
        // After key mapping, validate that the transformed data has all required fields
        if (apiRequiredKeys.length > 0) {
          const transformedData = data.map(row => {
            const transformedRow: any = {}
            apiRequiredKeys.forEach(requiredKey => {
              const mappedKey = mapping[requiredKey]
              if (mappedKey && row[mappedKey] !== undefined) {
                transformedRow[requiredKey] = row[mappedKey]
              } else {
                transformedRow[requiredKey] = '' // Set empty for missing mapped fields
              }
            })
            return transformedRow
          })
          
          // Check for missing required fields in transformed data
          const missingFields: string[] = []
          console.log('Validating transformed data:', {
            apiRequiredKeys,
            transformedDataSample: transformedData[0],
            mapping
          })
          
          apiRequiredKeys.forEach(requiredKey => {
            const hasData = transformedData.some(row => {
              // Check both the required key and the original mapped field
              const value = row[requiredKey]
              return value && value.toString().trim() !== ''
            })
            
            console.log(`Checking required key "${requiredKey}":`, {
              hasData,
              mappedKey: mapping[requiredKey],
              sampleValue: transformedData[0]?.[requiredKey]
            })
            
            if (!hasData) {
              // Double-check by looking at the mapping
              const mappedKey = mapping[requiredKey]
              if (mappedKey) {
                const hasOriginalData = data.some(row => {
                  const value = row[mappedKey]
                  return value && value.toString().trim() !== ''
                })
                console.log(`Double-checking original data for "${mappedKey}":`, {
                  hasOriginalData,
                  sampleOriginalValue: data[0]?.[mappedKey]
                })
                if (!hasOriginalData) {
                  missingFields.push(requiredKey)
                }
              } else {
                console.log(`No mapping found for required key "${requiredKey}"`)
                missingFields.push(requiredKey)
              }
            }
          })
          
          if (missingFields.length > 0) {
            setMissingColumns(missingFields)
            setParseErrors([`Missing required data after column mapping: ${missingFields.join(', ')}`])
            toast({
              title: "Missing Required Data",
              description: `Some required fields are missing data: ${missingFields.join(', ')}`,
              variant: "destructive",
            })
          } else {
            setMissingColumns([])
            setParseErrors([])
            // Apply the transformed data for display
            if (isGoogleDriveData) {
              setGoogleDriveData(transformedData)
            } else {
              setUploadedData(transformedData)
            }
            toast({
              title: "File Processed",
              description: "Column mapping completed successfully.",
            })
          }
        } else {
          // No specific required keys from API, but still apply any mapping that was done
          const mappedData = data.map(row => {
            const mappedRow: any = {}
            Object.keys(row).forEach(originalKey => {
              // Find if this key has a mapping
              const mappedKey = Object.keys(mapping).find(reqKey => mapping[reqKey] === originalKey)
              if (mappedKey) {
                mappedRow[mappedKey] = row[originalKey]
              } else {
                mappedRow[originalKey] = row[originalKey]
              }
            })
            return mappedRow
          })
          
          if (isGoogleDriveData) {
            setGoogleDriveData(mappedData)
          } else {
            setUploadedData(mappedData)
          }
          setMissingColumns([])
          setParseErrors([])
          toast({
            title: "File Processed",
            description: "Column mapping completed successfully.",
          })
        }
        
        // Store the mapping and uploaded data
        updateKeyMapping(keysToMap, mapping)
        updateUploadedData(data)
        
      } catch (error) {
        console.error('Error processing key mapping:', error)
        toast({
          title: "Warning",
          description: "Column mapping failed. Using available columns as-is.",
          variant: "destructive",
        })
        
        // Fallback: use available keys directly
        const availableKeys = Object.keys(data[0])
        setRequiredKeys(availableKeys)
        updateUploadedData(data)
      } finally {
        setIsProcessingKeyMapping(false)
      }
    }
  }
  const [agentError, setAgentError] = useState<string | null>(null)
  const [playingAgentId, setPlayingAgentId] = useState<string | null>(null)
  
  // Animation states
  const [isPageLoaded, setIsPageLoaded] = useState(false)
  const [isStepTransitioning, setIsStepTransitioning] = useState(false)
  
  // Error states for form validation
  const [errors, setErrors] = useState({
    campaignName: false,
    useCase: false,
    subUseCase: false,
    agentSelection: false,
    fileUpload: false,
    scheduledDate: false,
    scheduledEndDate: false,
    scheduledTime: false,
    callWindowStart: false,
    callWindowEnd: false,
    handoffBusinessHoursStart: false,
    handoffBusinessHoursEnd: false,
    // Sub-validation errors for file upload
    crmSelection: false,
    googleDriveLink: false,
    vinSolutionsDateRange: false,
    leadAgeDays: false
  })
  
  // Refs for scrolling to sections
  const campaignNameRef = useRef<HTMLDivElement | null>(null)
  
    // Function to download sample file
  const downloadSampleFile = () => {
    try {
      // Determine which template to use based on the sub use case
      let fileUrl = 'https://spyne-test.s3.us-east-1.amazonaws.com/csv-template1.csv';
      let fileName = 'sample-customer-data.csv';
      
      if (campaignData.subUseCase === 'price-drop-alert') {
        fileUrl = '/price-drop-alert-template.csv';
        fileName = 'price-drop-alert-template.csv';
      } else if (campaignData.useCase === 'service') {
        fileUrl = '/csv-template.csv';
        fileName = 'service-recall-template.csv';
      }
      
      parent.postMessage({
        type: 'DOWNLOAD_SAMPLE_CSV',
        data: { 
          fileUrl: fileUrl,
          fileName: fileName
        }
      }, '*');
    } catch (error) {
      // Fallback for direct download
      const link = document.createElement('a');
      
      if (campaignData.subUseCase === 'price-drop-alert') {
        link.href = '/price-drop-alert-template.csv';
        link.download = 'price-drop-alert-template.csv';
      } else if (campaignData.useCase === 'service') {
        link.href = '/csv-template.csv';
        link.download = 'service-recall-template.csv';
      } else {
        link.href = 'https://spyne-test.s3.us-east-1.amazonaws.com/csv-template1.csv';
        link.download = 'sample-customer-data.csv';
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Google Drive utility functions
  const validateGoogleDriveLink = (url: string): boolean => {
    // Check if it's a valid Google Drive share link
    const googleDriveRegex = /^https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/(view|edit)(\?[^#]*)?(\#.*)?$/
    const googleDriveOpenRegex = /^https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)$/
    const googleSheetsRegex = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/
    
    return googleDriveRegex.test(url) || googleDriveOpenRegex.test(url) || googleSheetsRegex.test(url)
  }

  const convertToDirectDownloadLink = (shareUrl: string): string => {
    // Extract file ID from various Google Drive URL formats
    let fileId = ''
    
    // Format: https://drive.google.com/file/d/FILE_ID/view
    const driveMatch = shareUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)\//)
    if (driveMatch) {
      fileId = driveMatch[1]
    }
    
    // Format: https://drive.google.com/open?id=FILE_ID
    const openMatch = shareUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/)
    if (openMatch) {
      fileId = openMatch[1]
    }
    
    // Format: https://docs.google.com/spreadsheets/d/FILE_ID/
    const sheetsMatch = shareUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
    if (sheetsMatch) {
      fileId = sheetsMatch[1]
      // For Google Sheets, export as CSV
      return `https://docs.google.com/spreadsheets/d/${fileId}/export?format=csv`
    }
    
    if (fileId) {
      // Convert to direct download link
      return `https://drive.google.com/uc?export=download&id=${fileId}`
    }
    
    return shareUrl // Return original if can't parse
  }

  const fetchGoogleDriveData = async (shareUrl: string) => {
    try {
      setIsGoogleDriveLoading(true)
      setGoogleDriveErrors([])
      setGoogleDriveComplete(false)
      
      // Validate the URL format first
      if (!validateGoogleDriveLink(shareUrl)) {
        throw new Error('Invalid Google Drive link format. Please use a valid Google Drive share link.')
      }
      
      // Convert to direct download link
      const downloadUrl = convertToDirectDownloadLink(shareUrl)
      
      // Fetch the CSV data
      const response = await fetch(downloadUrl, {
        method: 'GET',
        mode: 'cors'
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('File not found. Please check if the file exists and is publicly accessible.')
        } else if (response.status === 403) {
          throw new Error('Access denied. Please make sure the file is shared publicly or with link access.')
        } else {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
        }
      }
      
      const csvText = await response.text()
      
      if (!csvText || csvText.trim().length === 0) {
        throw new Error('The file appears to be empty.')
      }
      
      // Parse the CSV data using the existing parser with dynamic columns
      const csvFile = new File([csvText], 'google-drive-data.csv', { type: 'text/csv' })
      const apiRequiredKeys = getRequiredKeysForUseCase()
      const parsedData = await parseUploadedFile(csvFile, apiRequiredKeys.length > 0 ? apiRequiredKeys : undefined)
      
      // Set the parsed data initially
      setGoogleDriveData(parsedData.data)
      setCampaignData(prev => ({ ...prev, totalRecords: parsedData.data.length }))
      
      // Always use new mapping system for Google Drive data
      setUploadedData(parsedData.data)
      setCsvParseResult(parsedData)
      setShowCSVMappingStep(true)
      
      // OLD MAPPING SYSTEM - COMMENTED OUT
      // Process key mapping for the parsed data
      // await processUploadedFile(parsedData.data, 'google-drive-data.csv', true)
      
      setGoogleDriveComplete(true)
      
      // Clear any previous errors
      setGoogleDriveErrors([])
      
      // Clear the googleDriveLink error if it exists
      if (errors.googleDriveLink) {
        setErrors(prev => ({ ...prev, googleDriveLink: false }))
      }
      
    } catch (error) {
      console.error('Google Drive fetch error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data from Google Drive'
      setGoogleDriveErrors([errorMessage])
      setGoogleDriveComplete(false)
      setGoogleDriveData([])
    } finally {
      setIsGoogleDriveLoading(false)
    }
  }

  const useCaseRef = useRef<HTMLDivElement | null>(null)
  const agentSelectionRef = useRef<HTMLDivElement | null>(null)
  const fileUploadRef = useRef<HTMLDivElement | null>(null)
  const scheduleRef = useRef<HTMLDivElement | null>(null)

  // Page entrance animation and URL params extraction
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoaded(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Extract URL parameters on component mount
  useEffect(() => {
    const params = extractUrlParams()
    setUrlParams(params)
  }, [])

  // Fetch agents based on selected use case
  const loadAgents = useCallback(async () => {
    
    if (!urlParams.enterprise_id || !urlParams.team_id) {
      console.error('Missing enterprise_id or team_id in URL params:', {
        enterprise_id: urlParams.enterprise_id,
        team_id: urlParams.team_id
      })
      setAgentError('Missing enterprise or team ID')
      return
    }

    setIsLoadingAgents(true)
    setAgentError(null)
    
    try {
      // Determine agent parameters based on use case
      let agentType = selectedCategory === 'sales' ? 'Sales' : 'Service'
      
      // Convert subUseCase to agent use case format (lowercase with underscores)
      let agentUseCase = 'recall_notification' // Default fallback
      
      if (campaignData.subUseCase) {
        // Convert kebab-case to lowercase with underscores
        agentUseCase = campaignData.subUseCase.replace(/-/g, '_').toLowerCase()
      }
      
      console.log('Agent loading parameters:', {
        enterpriseId: urlParams.enterprise_id,
        teamId: urlParams.team_id,
        agentUseCase,
        agentType,
        selectedCategory,
        subUseCase: campaignData.subUseCase
      })
      
      
      // First try to get outbound agents for the specific use case
      let agents = await fetchAgentList(
        urlParams.enterprise_id,
        urlParams.team_id,
        agentUseCase,
        agentType,
        'outbound'
      )
      
      // If no outbound agents found, try to get any agents for the use case
      if (!agents || agents.length === 0) {
        console.log('No outbound agents found, trying to get any agents for use case:', agentUseCase)
        agents = await fetchAgentList(
          urlParams.enterprise_id,
          urlParams.team_id,
          agentUseCase,
          agentType,
          undefined // Don't filter by call type
        )
      }
      
      // If still no agents found, try without use case filter (get all agents for the type)
      if (!agents || agents.length === 0) {
        console.log('No agents found for specific use case, trying to get all agents for type:', agentType)
        agents = await fetchAgentList(
          urlParams.enterprise_id,
          urlParams.team_id,
          undefined, // Don't filter by use case
          agentType,
          undefined // Don't filter by call type
        )
      }
      
      console.log('Fetched agents:', agents)
      setAvailableAgents(agents)
      
      // Auto-select the first available agent if any
      if (agents.length > 0 && agents[0].available) {
        setSelectedAgent(agents[0])
      }
    } catch (error) {
      console.error('Error loading agents:', error)
      setAgentError(`Failed to load agents: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoadingAgents(false)
    }
  }, [urlParams, selectedCategory, campaignData.subUseCase])

  // Load campaign types on component mount
  useEffect(() => {
    const loadCampaignTypes = async () => {
      try {
        setIsLoadingCampaignTypes(true)
        const response = await fetchCampaignTypes()
        setCampaignTypes(response)
      } catch (error) {
        console.error('Error loading campaign types:', error)
        toast({
          title: "Error",
          description: "Failed to load campaign types. Using default options.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingCampaignTypes(false)
      }
    }

    loadCampaignTypes()
  }, [])

  // Load agents when any use case is selected and URL params are available
  useEffect(() => {
    if (campaignData.subUseCase && urlParams.enterprise_id && urlParams.team_id) {
      loadAgents()
    } else {
      setAvailableAgents([])
      setSelectedAgent(null)
      setAgentError(null)
    }
  }, [campaignData.subUseCase, urlParams.enterprise_id, urlParams.team_id, loadAgents])

  // Load stored campaign data on mount
  useEffect(() => {
    const stored = getCampaignData()
    if (stored?.campaignId) {
      setStoredCampaignId(stored.campaignId)
    }
  }, [])

  // Function to clear campaign data and start fresh
  const startFreshCampaign = () => {
    clearCampaignData()
    setStoredCampaignId(null)
    setKeyMapping(null)
    setShowCSVMappingStep(false)
    setCsvParseResult(null)
    setRequiredKeys([])
    setCampaignData({
      campaignName: '',
      useCase: 'sales',
      subUseCase: '',
      bcdDetails: '',
      fileName: '',
      schedule: 'now',
      scheduledDate: '',
      scheduledEndDate: '',
      scheduledTime: '',
      totalRecords: 0,
      channels: {
        email: false,
        sms: true,
        voiceAi: true,
      },
      scriptTemplate: {
        voiceIntroduction: "Hi {first_name}, I have exciting news! We just received the {vehicle_interest} that matches what you were looking for. It's exactly what you described – would you like me to hold it for a test drive today or tomorrow?",
        corePitch: '',
        objectionHandling: '',
        legalConsent: 'This call may be recorded for quality purposes.',
        optOut: 'Reply STOP to opt out of future messages.',
        handoffOffer: 'Would you like me to connect you with a specialist?',
      },
      compliance: {
        includeRecordingConsent: true,
        includeSmsOptOut: true,
      },
      maxRetryAttempts: 3,
      retryDelayMinutes: 60,
      callWindowStart: '09:00',
      callWindowEnd: '17:00',
      timezone: 'America/New_York',
      doNotCallList: true,
      maxCallsPerHour: 50,
      maxCallsPerDay: 200,
      maxConcurrentCalls: 5,
      voicemailStrategy: 'leave_message',
      disconnectedCallRetry: true,
      busySignalRetry: true,
      noAnswerRetry: true,
      busyCustomerRetry: true,
      voicemailMessage: '',
      primaryGoal: 'book_test_drive',
      secondaryActions: {
        sendInventoryLink: false,
        emailQuote: false,
        textFinanceLink: false,
      },
      handoffSettings: {
        target: 'round_robin',
        businessHoursStart: '09:00',
        businessHoursEnd: '17:00',
      },
      escalationTriggers: {
        leadRequestsPerson: false,
        complexFinancing: false,
        pricingNegotiation: false,
        technicalQuestions: false,
      }
    })
    setCurrentStep(1)
    setSelectedAgent(null)
    setUploadedData([])
    setUploadComplete(false)
    setHasError(false)
    toast({
      title: "Campaign Reset",
      description: "Starting fresh campaign setup.",
    })
  }

  // Handle CSV mapping completion
  const handleCSVMappingComplete = async (mappedData: any[], keyMapping: Record<string, string>) => {
    console.log('CSV mapping completed:', { mappedData, keyMapping })
    
    // Update the uploaded data with mapped data
    setUploadedData(mappedData)
    setKeyMapping(keyMapping)
    
    // Hide the mapping step
    setShowCSVMappingStep(false)
    
    // Continue with traditional flow if needed
    if (mappedData.length > 0) {
      // Update campaign data
      setCampaignData(prev => ({ ...prev, totalRecords: mappedData.length }))
      
      // OLD MAPPING SYSTEM - COMMENTED OUT
      // Process any additional key mapping if needed
      // await processUploadedFile(mappedData, 'mapped-data.csv', false)
    }
  }

  // Handle skipping the new mapping system (DEPRECATED - not used anymore)
  const handleSkipCSVMapping = async () => {
    console.log('Skip mapping called - this should not happen anymore')
    // Do nothing since we always use the new mapping system
    
    // OLD MAPPING SYSTEM - COMMENTED OUT
    // console.log('Skipping new CSV mapping system')
    // setShowCSVMappingStep(false)
    // setUseNewMappingSystem(false)
    // Continue with traditional key mapping
    // if (uploadedData.length > 0) {
    //   await processUploadedFile(uploadedData, 'uploaded-data.csv')
    // }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('File upload started:', file.name, file.type, file.size)

    setIsUploading(true)
    setHasError(false)
    setUploadComplete(false)
    setParseErrors([])
    setMissingColumns([])
    setCampaignData(prev => ({ ...prev, fileName: file.name, totalRecords: 0 }))
    
    // Simulate progress during parsing
    let progress = 0
    const progressInterval = setInterval(() => {
      progress += 20
      setUploadProgress(progress)
      
      if (progress >= 80) {
        clearInterval(progressInterval)
      }
    }, 200)

    try {
      console.log('Starting file parsing...')
      
      // Test the import
      console.log('parseUploadedFile function:', typeof parseUploadedFile)
      
      // Get API required keys for dynamic validation
      const apiRequiredKeys = getRequiredKeysForUseCase()
      console.log('Using required columns for validation:', apiRequiredKeys)
      
      // Parse the uploaded file with dynamic required columns
      const parseResult = await parseUploadedFile(file, apiRequiredKeys.length > 0 ? apiRequiredKeys : undefined)
      console.log('Parse result:', parseResult)
      
      // Complete the progress
      clearInterval(progressInterval)
      setUploadProgress(100)
      setTimeout(async () => {
        setIsUploading(false)
        
        // File parsing is now always successful if we have data
        // The actual validation happens after key mapping
        if (parseResult.data && parseResult.data.length > 0) {
          console.log('File parsed successfully:', parseResult.totalRecords, 'records')
          setUploadedData(parseResult.data)
          setCampaignData(prev => ({ ...prev, totalRecords: parseResult.totalRecords }))
          setCsvParseResult(parseResult)
          
          // Always use the new CSV mapping system for better UX
          setShowCSVMappingStep(true)
          setUploadComplete(true) // Still set this to show the file was processed
          
          // OLD MAPPING SYSTEM - COMMENTED OUT
          // Check if we should use the new mapping system
          // if (useNewMappingSystem) {
          //   // Show the new CSV mapping step (regardless of auto-suggestions)
          //   setShowCSVMappingStep(true)
          //   setUploadComplete(true) // Still set this to show the file was processed
          // } else {
          //   // Use the traditional key mapping system
          //   await processUploadedFile(parseResult.data, file.name)
          //   setUploadComplete(true)
          // }
        } else {
          console.log('File parsing failed - no data extracted')
          setHasError(true)
          setUploadedData([])
          setParseErrors(parseResult.errors)
        }
      }, 500)
      
    } catch (error) {
      console.error('File upload error:', error)
      clearInterval(progressInterval)
      setUploadProgress(100)
      setTimeout(() => {
        setIsUploading(false)
        setHasError(true)
        setParseErrors([`File parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`])
        setUploadedData([])
      }, 500)
    }
  }

  const validateStep = (step: number) => {
    const newErrors = { ...errors }
    let isValid = true
    const missingFields: string[] = []
    let scrollTarget: React.RefObject<HTMLDivElement | null> | null = null

    // Reset errors for current step
    if (step === 1) {
      newErrors.campaignName = false
      newErrors.useCase = false
      newErrors.subUseCase = false
      newErrors.agentSelection = false
    } else if (step === 2) {
      newErrors.fileUpload = false
      newErrors.crmSelection = false
      newErrors.googleDriveLink = false
      newErrors.vinSolutionsDateRange = false
      newErrors.leadAgeDays = false
    } else if (step === 3) {
      newErrors.scheduledDate = false
      newErrors.scheduledEndDate = false
      newErrors.scheduledTime = false
    } else if (step === 4) {
      // Reset call settings errors
      newErrors.callWindowStart = false
      newErrors.callWindowEnd = false
      newErrors.handoffBusinessHoursStart = false
      newErrors.handoffBusinessHoursEnd = false
    }

    if (step === 1) {
      if (!campaignData.campaignName.trim()) {
        newErrors.campaignName = true
        missingFields.push('Campaign Name')
        if (!scrollTarget) scrollTarget = campaignNameRef
        isValid = false
      }
      if (!selectedCategory) {
        newErrors.useCase = true
        missingFields.push('Use Case')
        if (!scrollTarget) scrollTarget = useCaseRef
        isValid = false
      }
      if (!campaignData.subUseCase) {
        newErrors.subUseCase = true
        missingFields.push('Campaign Type')
        if (!scrollTarget) scrollTarget = useCaseRef
        isValid = false
      }
      // Check agent selection - required only for service use cases
      if (campaignData.subUseCase && selectedCategory === 'service' && !selectedAgent) {
        newErrors.agentSelection = true
        missingFields.push('Agent Selection')
        if (!scrollTarget) scrollTarget = agentSelectionRef
        isValid = false
      }
    } else if (step === 2) {
      if (selectedCategory === 'sales') {
        // For sales, check if any upload option is selected and completed
        if (!selectedUploadOption) {
          newErrors.fileUpload = true
          missingFields.push('Import Method Selection')
          isValid = false
        } else if (selectedUploadOption === 'crm' && !crmSelection) {
          newErrors.crmSelection = true
          missingFields.push('CRM Selection')
          isValid = false
        } else if (selectedUploadOption === 'crm' && crmSelection === 'vinsolutions') {
          // Validate VinSolutions settings
          if (enableRecurringLeads) {
            // For recurring leads, validate lead age
            if (!leadAgeDays || leadAgeDays < 1) {
              newErrors.leadAgeDays = true
              missingFields.push('Lead Age (must be at least 1 day)')
              isValid = false
            }
          } else {
            // For date range filter, validate date/time fields
            if (!vinSolutionsStartDate || !vinSolutionsEndDate) {
              newErrors.vinSolutionsDateRange = true
              missingFields.push('Date Range Selection')
              isValid = false
            } else if (!vinSolutionsStartTime || !vinSolutionsEndTime) {
              newErrors.vinSolutionsDateRange = true
              missingFields.push('Time Range Selection')
              isValid = false
            } else if (new Date(vinSolutionsStartDate) > new Date(vinSolutionsEndDate)) {
              newErrors.vinSolutionsDateRange = true
              missingFields.push('Valid Date Range (Start date must be before end date)')
              isValid = false
            }
          }
          
          // Also check if there are missing required fields after key mapping
          if (uploadComplete && missingColumns.length > 0) {
            newErrors.crmSelection = true
            missingFields.push(`Missing required data: ${missingColumns.join(', ')}`)
            isValid = false
          }
        } else if (selectedUploadOption === 'drive') {
          if (!googleDriveLink.trim()) {
            newErrors.googleDriveLink = true
            missingFields.push('Google Drive Link')
            isValid = false
          } else if (!googleDriveComplete) {
            newErrors.googleDriveLink = true
            missingFields.push('Google Drive Data Import (please fetch and validate the data)')
            isValid = false
          }
          
          // Also check if there are missing required fields after key mapping
          if (googleDriveComplete && missingColumns.length > 0) {
            newErrors.googleDriveLink = true
            missingFields.push(`Missing required data: ${missingColumns.join(', ')}`)
            isValid = false
          }
        } else if (selectedUploadOption === 'upload' && !uploadComplete) {
          newErrors.fileUpload = true
          missingFields.push('CSV File Upload')
          isValid = false
        }
        
        // Also check if there are missing required fields after key mapping
        if (uploadComplete && missingColumns.length > 0) {
          newErrors.fileUpload = true
          missingFields.push(`Missing required data: ${missingColumns.join(', ')}`)
          isValid = false
        }
      } else {
        // For service, use original validation
        if (!uploadComplete) {
          newErrors.fileUpload = true
          missingFields.push('File Upload')
          if (!scrollTarget) scrollTarget = fileUploadRef
          isValid = false
        }
        
        // Also check if there are missing required fields after key mapping
        if (uploadComplete && missingColumns.length > 0) {
          newErrors.fileUpload = true
          missingFields.push(`Missing required data: ${missingColumns.join(', ')}`)
          if (!scrollTarget) scrollTarget = fileUploadRef
          isValid = false
        }
      }
    } else if (step === 3) {
      if (selectedCategory === 'sales') {
        // For sales campaigns, dates are only required if scheduled (not for "Start Now")
        if (campaignData.schedule === 'scheduled') {
          if (!campaignData.scheduledDate) {
            newErrors.scheduledDate = true
            missingFields.push('Start Date')
            if (!scrollTarget) scrollTarget = scheduleRef
            isValid = false
          }
          
          if (!campaignData.scheduledEndDate) {
            newErrors.scheduledEndDate = true
            missingFields.push('End Date')
            if (!scrollTarget) scrollTarget = scheduleRef
            isValid = false
          }
        }
        
        // Validate date relationship if both dates are provided
        if (campaignData.scheduledDate && campaignData.scheduledEndDate) {
          const startDate = new Date(campaignData.scheduledDate)
          const endDate = new Date(campaignData.scheduledEndDate)
          
          if (endDate < startDate) {
            newErrors.scheduledEndDate = true
            missingFields.push('End date must be after start date')
            if (!scrollTarget) scrollTarget = scheduleRef
            isValid = false
          }
        }
      } else {
        // For service campaigns, only validate if scheduled
        if (campaignData.schedule === 'scheduled') {
          if (!campaignData.scheduledDate) {
            newErrors.scheduledDate = true
            missingFields.push('Scheduled Date')
            if (!scrollTarget) scrollTarget = scheduleRef
            isValid = false
          }
          if (!campaignData.scheduledTime) {
            newErrors.scheduledTime = true
            missingFields.push('Scheduled Time')
            if (!scrollTarget) scrollTarget = scheduleRef
            isValid = false
          }
          
          // Validate end date if provided
          if (campaignData.scheduledEndDate) {
            const startDate = new Date(campaignData.scheduledDate)
            const endDate = new Date(campaignData.scheduledEndDate)
            
            if (endDate < startDate) {
              newErrors.scheduledEndDate = true
              missingFields.push('End date must be after start date')
              if (!scrollTarget) scrollTarget = scheduleRef
              isValid = false
            }
          }
        }
      }
    } else if (step === 4) {
      // Validate call window timing - required for all campaigns
      if (!campaignData.callWindowStart) {
        newErrors.callWindowStart = true
        missingFields.push('Call Window Start Time')
        isValid = false
      }
      if (!campaignData.callWindowEnd) {
        newErrors.callWindowEnd = true
        missingFields.push('Call Window End Time')
        isValid = false
      }
      
      // Validate call window times if both are provided
      if (campaignData.callWindowStart && campaignData.callWindowEnd) {
        const startTime = campaignData.callWindowStart.split(':').map(Number)
        const endTime = campaignData.callWindowEnd.split(':').map(Number)
        const startMinutes = startTime[0] * 60 + startTime[1]
        const endMinutes = endTime[0] * 60 + endTime[1]
        
        if (endMinutes <= startMinutes) {
          newErrors.callWindowEnd = true
          missingFields.push('End time must be after start time')
          isValid = false
        }
      }
      
      // For sales campaigns, validate handoff business hours
      if (selectedCategory === 'sales') {
        if (!campaignData.handoffSettings?.businessHoursStart) {
          newErrors.handoffBusinessHoursStart = true
          missingFields.push('Handoff Business Hours Start Time')
          isValid = false
        }
        if (!campaignData.handoffSettings?.businessHoursEnd) {
          newErrors.handoffBusinessHoursEnd = true
          missingFields.push('Handoff Business Hours End Time')
          isValid = false
        }
        
        // Validate business hours times if both are provided
        if (campaignData.handoffSettings?.businessHoursStart && campaignData.handoffSettings?.businessHoursEnd) {
          const startTime = campaignData.handoffSettings.businessHoursStart.split(':').map(Number)
          const endTime = campaignData.handoffSettings.businessHoursEnd.split(':').map(Number)
          const startMinutes = startTime[0] * 60 + startTime[1]
          const endMinutes = endTime[0] * 60 + endTime[1]
          
          if (endMinutes <= startMinutes) {
            newErrors.handoffBusinessHoursEnd = true
            missingFields.push('Business hours end time must be after start time')
            isValid = false
          }
        }
      }
    }

    setErrors(newErrors)

    if (!isValid) {
      // Scroll to the first missing field
      if (scrollTarget?.current) {
        scrollTarget.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }
    }

    return isValid
  }

  // Store initial campaign data locally after agent selection (no API call yet)
  const storeInitialCampaignData = () => {
    if (!selectedAgent || !urlParams.enterprise_id || !urlParams.team_id) {
      console.error('Missing required data for campaign data storage')
      return
    }

    try {
      // Store campaign data locally without API call
      storeCampaignData({
        campaignName: campaignData.campaignName,
        useCase: selectedCategory,
        subUseCase: campaignData.subUseCase,
        selectedAgent: selectedAgent.id,
        teamAgentMappingId: selectedAgent.id,
        enterpriseId: urlParams.enterprise_id,
        teamId: urlParams.team_id
      })
      
      console.log('Campaign data stored locally for:', campaignData.campaignName)
      
      toast({
        title: "Campaign Details Saved",
        description: "Campaign configuration has been saved. Continue to upload customer data.",
      })
    } catch (error) {
      console.error('Error storing campaign data:', error)
      toast({
        title: "Error",
        description: "Failed to save campaign data. Please try again.",
        variant: "destructive",
      })
    }
  }

  const nextStep = async () => {
    const maxStep = selectedCategory === 'sales' ? 5 : 4
    
    if (currentStep < maxStep) {
      // Validate current step before proceeding
      if (!validateStep(currentStep)) {
        return // Stop if validation fails
      }

      // Store initial campaign data after step 1 (Campaign Details) if agent is selected
      if (currentStep === 1 && selectedAgent) {
        storeInitialCampaignData()
      }

      // If we're launching the campaign (moving from step 3 to 4 for service, or step 4 to 5 for sales), create and save the campaign
      if ((selectedCategory === 'service' && currentStep === 3) || (selectedCategory === 'sales' && currentStep === 4)) {
        await handleLaunchCampaign()
      } else {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handleLaunchCampaign = async () => {
    if (!urlParams.enterprise_id || !urlParams.team_id) {
      console.error('Please set enterprise_id and team_id in the URL')
      return
    }
    
    // For local testing, we'll use default values if URL params are missing
    const effectiveEnterpriseId = urlParams.enterprise_id 
    const effectiveTeamId = urlParams.team_id 
    

    try {
      setIsLaunching(true)
      
      // Transform campaign data to the required payload format
      const agentId = selectedAgent?.id // Use selected agent ID or fallback
      
      // Create a clean campaign data object without script template for API
      // Use Google Drive data if available, otherwise use uploaded file data
      const effectiveUploadedData = selectedUploadOption === 'drive' && googleDriveComplete 
        ? googleDriveData 
        : uploadedData
        
      const cleanCampaignData = {
        ...campaignData,
        uploadedData: effectiveUploadedData,
        // Exclude script template data to avoid template evaluation errors
        scriptTemplate: undefined,
        // Include VinSolutions recurring settings
        vinSolutionsSettings: {
          enableRecurringLeads,
          leadAgeDays,
          startDate: vinSolutionsStartDate,
          endDate: vinSolutionsEndDate,
          startTime: vinSolutionsStartTime,
          endTime: vinSolutionsEndTime
        }
      }
      
      console.log('Campaign data for transformation:', {
        effectiveUploadedData,
        uploadedDataLength: effectiveUploadedData?.length,
        cleanCampaignDataUploadedData: cleanCampaignData.uploadedData,
        sampleData: effectiveUploadedData?.[0]
      })
      
      const payload = transformCampaignData(
        cleanCampaignData,
        effectiveEnterpriseId,
        effectiveTeamId,
        agentId,
        storedCampaignId || undefined // Pass the stored campaign ID for final launch
      )

      console.log('Launching campaign with payload:', payload)
      
      // Call the launch campaign API
      const response = await launchCampaign(payload)
      
      if (response.success) {
        // Create the new campaign object for local storage
        const campaignId = response.campaignId || `camp_${Date.now()}`
        
        // Calculate start and end dates
        const startDate = campaignData.schedule === 'now' 
          ? new Date() 
          : new Date(`${campaignData.scheduledDate}T${campaignData.scheduledTime}`)
        
        // Use user-provided end date if available, otherwise calculate based on records
        const endDate = campaignData.scheduledEndDate 
          ? new Date(`${campaignData.scheduledEndDate}T23:59:59`) // End of the selected end date
          : calculateEndDate(startDate, campaignData.totalRecords)
        
        const newCampaign = {
          id: campaignId,
          name: campaignData.campaignName,
          useCase: useCases[selectedCategory]?.label || selectedCategory,
          subUseCase: useCases[selectedCategory]?.subCases.find(sc => sc.value === campaignData.subUseCase)?.label || campaignData.subUseCase,
          status: campaignData.schedule === 'now' ? 'Running' : 'Scheduled',
          progress: campaignData.schedule === 'now' ? 0 : 0,
          eta: campaignData.schedule === 'now' ? getEstimatedTimeRange() : null,
          callsPlaced: 0,
          totalRecords: campaignData.totalRecords,
          answerRate: 0,
          appointmentsBooked: 0,
          successRate: 0,
          createdAt: new Date(),
          startDate: startDate, // Add startDate for results page compatibility
          endDate: endDate,     // Add endDate for time range display
          completedAt: campaignData.schedule === 'now' ? null : null, // Will be set when campaign completes
          startedAt: campaignData.schedule === 'now' ? new Date() : null,
          scheduledFor: campaignData.schedule === 'scheduled' ? startDate : null,
          fileName: campaignData.fileName,
          payload: payload, // Store the API payload for reference
          scriptTemplate: campaignData.scriptTemplate // Store script template separately for UI
        }

        // Save to localStorage
        try {
          const existingCampaigns = localStorage.getItem('outbound-campaigns')
          const campaigns = existingCampaigns ? JSON.parse(existingCampaigns) : []
          campaigns.push(newCampaign)
          localStorage.setItem('outbound-campaigns', JSON.stringify(campaigns))
        } catch (error) {
          console.error('Error saving campaign to localStorage:', error)
        }

        // Store the campaign ID for the analytics button
        setCreatedCampaignId(campaignId)
        
        // Trigger confetti animation
        confetti({
          particleCount: 150,
          spread: 180,
          origin: { y: 1, x: 0.5 },
          colors: ['#4600F2', '#22C55E', '#FACC15', '#3B82F6', '#EF4444', '#8B5CF6']
        })
        
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 180,
            origin: { y: 1, x: 0.2 },
            colors: ['#4600F2', '#22C55E', '#FACC15', '#3B82F6', '#EF4444', '#8B5CF6']
          })
        }, 150)
        
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 180,
            origin: { y: 1, x: 0.8 },
            colors: ['#4600F2', '#22C55E', '#FACC15', '#3B82F6', '#EF4444', '#8B5CF6']
          })
        }, 300)

        // Move to next step
        setCurrentStep(currentStep + 1)
        
      } else {
        throw new Error(response.message || 'Failed to launch campaign')
      }
      
    } catch (error) {
      console.error('Error launching campaign:', error)
      alert(`Failed to launch campaign: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLaunching(false)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCancel = () => {
    // Navigate back to the campaigns list page
    router.push('/results')
  }

  const getRequiredFields = () => {
    return getDisplayColumns()
  }

  const resetUpload = () => {
    setIsUploading(false)
    setUploadComplete(false)
    setHasError(false)
    setUploadProgress(0)
    setUploadedData([])
    setParseErrors([])
    setMissingColumns([])
    setCampaignData(prev => ({ ...prev, fileName: '', totalRecords: 0 }))
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="max-w-3xl">
            <div className="space-y-8">
              <div className="mb-8 bg-transparent">
                <h1 className="text-[24px] font-bold text-[#1A1A1A] leading-[1.4]">Campaign Details</h1>
                <p className="text-[14px] text-[#6B7280] mt-2 leading-[1.5]">
                  Configure your campaign settings and define the specific use case for optimal AI performance
                </p>
              </div>
              <div className="space-y-6">
                
                {/* Campaign Name Section */}
                <div ref={campaignNameRef} className={`bg-white border rounded-lg p-6 transition-colors ${
                  errors.campaignName ? 'border-red-500' : 'border-[#E5E7EB]'
                }`}>
                  <div className="space-y-3">
                    <Label htmlFor="campaign-name" className={`text-[16px] font-bold ${
                      errors.campaignName ? 'text-red-600' : 'text-[#1A1A1A]'
                    }`}>
                      Campaign Name {errors.campaignName && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id="campaign-name"
                      placeholder="Enter a descriptive campaign name"
                      value={campaignData.campaignName}
                      onChange={(e) => {
                        setCampaignData(prev => ({ ...prev, campaignName: e.target.value }))
                        if (errors.campaignName && e.target.value.trim()) {
                          setErrors(prev => ({ ...prev, campaignName: false }))
                        }
                      }}
                      className={`h-11 text-[14px] rounded-md focus:ring-[#4600F2] transition-colors ${
                        errors.campaignName 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-[#E5E7EB] focus:border-[#4600F2] focus:ring-2 focus:ring-[#4600F2]/20'
                      }`}
                    />
                    {errors.campaignName && (
                      <p className="text-[12px] text-red-600 flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Campaign name is required
                      </p>
                    )}
                  </div>
                </div>

                {/* Use Case Section */}
                <div ref={useCaseRef} className={`bg-white border rounded-lg p-6 transition-colors ${
                  errors.useCase || errors.subUseCase ? 'border-red-500' : 'border-[#E5E7EB]'
                }`}>
                  <div className="space-y-4">
                    <Label className={`text-[16px] font-bold ${
                      errors.useCase || errors.subUseCase ? 'text-red-600' : 'text-[#1A1A1A]'
                    }`}>
                      Select Campaign Type {(errors.useCase || errors.subUseCase) && <span className="text-red-500">*</span>}
                    </Label>
                    {(errors.useCase || errors.subUseCase) && (
                      <p className="text-[12px] text-red-600 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Please select a use case and campaign type
                      </p>
                    )}
                    {/* Category Selection */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {Object.entries(useCases).map(([categoryKey, useCase]) => (
                        <div 
                          key={categoryKey} 
                          className={`p-4 rounded-lg border transition-all cursor-pointer ${
                            selectedCategory === categoryKey
                              ? 'border-[#4600f2] bg-[#4600f2]/5 shadow-sm'
                              : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB] hover:shadow-sm'
                          }`}
                          onClick={() => {
                            setSelectedCategory(categoryKey);
                            setCampaignData(prev => ({ 
                              ...prev, 
                              useCase: categoryKey, 
                              subUseCase: '' 
                            }));
                            // Clear errors when category is selected
                            if (errors.useCase || errors.subUseCase) {
                              setErrors(prev => ({ ...prev, useCase: false, subUseCase: false }))
                            }
                          }}
                        >
                          {/* Category Header */}
                          <div className="flex items-center space-x-3 mb-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              categoryKey === 'sales' 
                                ? 'bg-[#22C55E]/10 text-[#22C55E]' 
                                : 'bg-[#3B82F6]/10 text-[#3B82F6]'
                            }`}>
                              {categoryKey === 'sales' ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <Wrench className="w-4 h-4" />
                              )}
                            </div>
                            <h3 className="text-[16px] font-semibold leading-[1.4] text-[#1A1A1A]">
                              {useCase.label}
                            </h3>
                          </div>

                          {/* Category Description */}
                          <p className="text-[13px] leading-[1.5] text-[#6B7280]">
                            {categoryKey === 'sales' 
                              ? 'AI-powered outreach campaigns for lead generation and sales conversion'
                              : 'Automated customer service communications and maintenance reminders'
                            }
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Sub-options for selected category */}
                    {selectedCategory && useCases[selectedCategory] && (
                      <div className="space-y-3">
                        <div className="text-[12px] font-medium text-[#6B7280] mt-6 mb-4">
                          What type of campaign would you like to run?
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {getDynamicUseCases()[selectedCategory].subCases.map((subCase: any) => (
                            <button
                              key={subCase.value}
                              type="button"
                              onClick={() => {
                                setCampaignData(prev => ({ 
                                  ...prev, 
                                  subUseCase: subCase.value 
                                }));

                                // Clear errors when valid selection is made
                                if (errors.subUseCase) {
                                  setErrors(prev => ({ ...prev, subUseCase: false }))
                                }
                                // Scroll to agent selection for service use cases only
                                if (selectedCategory === 'service') {
                                  setTimeout(() => {
                                    agentSelectionRef.current?.scrollIntoView({ 
                                      behavior: 'smooth', 
                                      block: 'center' 
                                    });
                                  }, 100); // Small delay to ensure element is rendered
                                }
                              }}
                              className={`px-4 py-2 rounded-full border transition-all duration-200 text-[14px] font-medium whitespace-nowrap ${
                                campaignData.subUseCase === subCase.value
                                  ? 'border-[#4600f2] bg-[#4600f2] text-white shadow-sm'
                                  : 'border-[#E5E7EB] bg-white text-[#1A1A1A] hover:border-[#4600f2]/40 hover:bg-[#4600f2]/5 hover:shadow-sm'
                              }`}
                            >
                              {subCase.label}
                            </button>
                          ))}
                        </div>
                        

                      </div>
                    )}
                  </div>
                </div>

                {/* Agent Selection for All Use Cases */}
                {campaignData.subUseCase && (
                  <div 
                    ref={agentSelectionRef}
                    className={`bg-white border rounded-lg p-6 transition-colors ${
                      errors.agentSelection ? 'border-red-500' : 'border-[#E5E7EB]'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center">
                          <Users className="w-4 h-4" />
                        </div>
                        <h3 className={`text-[16px] font-semibold ${
                          errors.agentSelection ? 'text-red-600' : 'text-[#1A1A1A]'
                        }`}>
                          Select AI agent {selectedCategory === 'service' ? (errors.agentSelection && <span className="text-red-500">*</span>) : <span className="text-[#6B7280] text-[14px] font-normal">(Optional)</span>}
                        </h3>
                      </div>

                      {errors.agentSelection && (
                        <div className="flex items-center text-[12px] text-red-600">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Please select an agent to continue
                        </div>
                      )}

                      {isLoadingAgents && (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin h-6 w-6 border-2 border-[#3B82F6] border-t-transparent rounded-full" />
                          <span className="ml-3 text-[14px] text-[#6B7280]">Loading agents...</span>
                        </div>
                      )}

                      {agentError && (
                        <div className="flex items-center p-4 bg-[#EF4444]/10 border border-[#EF4444] rounded-lg">
                          <AlertCircle className="h-5 w-5 text-[#EF4444] mr-3" />
                          <span className="text-[14px] text-[#EF4444]">{agentError}</span>
                        </div>
                      )}

                      {!isLoadingAgents && !agentError && availableAgents.length === 0 && (
                        <div className="flex items-center p-4 bg-[#FACC15]/10 border border-[#FACC15] rounded-lg">
                          <AlertCircle className="h-5 w-5 text-[#FACC15] mr-3" />
                          <span className="text-[14px] text-[#6B7280]">No agents available for this campaign type</span>
                        </div>
                      )}

                      {!isLoadingAgents && availableAgents.length > 0 && (
                        <div className="grid grid-cols-2 gap-4">
                          {availableAgents.map((agent) => (
                            <div 
                              key={agent.id} 
                              onClick={() => {
                                if (agent.available) {
                                  setSelectedAgent(agent)
                                  // Clear agent selection error when an agent is selected
                                  if (errors.agentSelection) {
                                    setErrors(prev => ({ ...prev, agentSelection: false }))
                                  }
                                }
                              }}
                              className={`relative bg-white border rounded-xl p-4 pb-16 transition-all duration-200 ${
                                !agent.available
                                  ? 'opacity-50 cursor-not-allowed border-[#E5E7EB]'
                                  : selectedAgent?.id === agent.id
                                  ? 'cursor-pointer border-[#4600F2] bg-[#4600F2]/5'
                                  : 'cursor-pointer border-[#E5E7EB] hover:border-[#4600F2]/60 hover:bg-[#4600F2]/5'
                              }`}
                            >


                              {/* Selection Indicator */}
                              {selectedAgent?.id === agent.id && (
                                <div className="absolute top-3 right-3 w-6 h-6 bg-[#4600F2] rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}

                              <div className="space-y-4">
                                {/* Top Section: Profile Photo, Name, and Chips */}
                                <div className="flex items-start space-x-4">
                                  {/* Profile Picture */}
                                  <div className="flex-shrink-0 -mt-1">
                                    <img
                                      src={agent.imageUrl}
                                      alt={agent.name}
                                      className="w-16 h-16 rounded-lg object-cover object-top border-2 border-[#E5E7EB]"
                                      onError={(e) => {
                                        e.currentTarget.src = '/placeholder-user.jpg'
                                      }}
                                    />
                                  </div>

                                  {/* Agent Info */}
                                  <div className="flex-1 min-w-0">
                                    {/* Name */}
                                    <h4 className={`text-[16px] font-bold text-black mb-2 ${
                                      !agent.available ? 'text-[#9CA3AF]' : ''
                                    }`}>
                                      {agent.name}
                                    </h4>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-1.5">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-300">
                                        {agent.city}
                                      </span>
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-300">
                                        {agent.languageName}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Bottom Section: Call Statistics */}
                                <div className="flex justify-between">
                                  <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 flex-1 mr-2">
                                    <p className="text-xs text-gray-500 mb-1">Total Calls</p>
                                    <p className="text-base font-bold text-black">{agent.totalCalls}</p>
                                  </div>
                                  <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 flex-1">
                                    <p className="text-xs text-gray-500 mb-1">Success Rate</p>
                                    <p className="text-base font-bold text-black">{agent.totalCalls > 0 ? '75%' : '0%'}</p>
                                  </div>
                                </div>

                                {/* Talk to Agent Button */}
                                <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Handle talk to agent functionality
                                  if (selectedAgent) {
                                    parent.postMessage({
                                      type: 'CALL_AGENT_BLANK',
                                      data: { 
                                        agentMappingId: selectedAgent.id,
                                        customerDetails: {
                                          customerName: '',
                                          recallDetails: {}
                                        }
                                      }
                                    }, '*');
                                  } else {
                                    console.error('No agent selected for talk to agent functionality');
                                  }
                                }}
                                className="absolute bottom-3 left-3 right-3 bg-[#4600F2]/10 hover:bg-[#4600F2]/15 text-[#4600F2] font-medium py-3 px-4 transition-colors text-sm font-semibold rounded-lg"
                              >
                                Talk to Agent
                              </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}



              </div>
            </div>
          </div>
        )

      case 2:
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
                        Required Fields for {useCases[selectedCategory]?.subCases.find(sc => sc.value === campaignData.subUseCase)?.label}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getRequiredFields().map((field) => (
                        <Badge key={field} variant="outline" className="border-[#3B82F6] text-[#3B82F6] text-[12px] bg-white rounded-full">
                          {field.replace(/[_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                                        />
                                      </div>
                                    </div>
                                      {errors.vinSolutionsDateRange && (
                                        <p className="text-[12px] text-red-600 mt-1">Please select valid date and time range</p>
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
                                              const value = parseInt(e.target.value) || 0
                                              setLeadAgeDays(value)
                                              if (errors.leadAgeDays && value >= 1) {
                                                setErrors(prev => ({ ...prev, leadAgeDays: false }))
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
                                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                          <p className="text-[12px] text-blue-800">
                                            <strong>Example:</strong> If set to {leadAgeDays} days, the system will automatically call leads that were created exactly {leadAgeDays} days ago. A lead created on January 1st will be called on January {leadAgeDays + 1}th.
                                          </p>
                                        </div>
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

                    {/* Option 2: Google Drive Link */}
                    <div 
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedUploadOption === 'drive'
                          ? 'border-[#4600f2] bg-[#4600f2]/5 shadow-sm'
                          : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB] hover:shadow-sm'
                      }`}
                      onClick={() => {
                        setSelectedUploadOption('drive')
                        setCrmSelection('')
                        setGoogleDriveLink('')
                        // Clear file upload error when method is selected
                        if (errors.fileUpload) {
                          setErrors(prev => ({ ...prev, fileUpload: false }))
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mt-1 ${
                          selectedUploadOption === 'drive' 
                            ? 'bg-[#4600F2]/10 text-[#4600F2]' 
                            : 'bg-[#E0F2FE] text-[#0284C7]'
                        }`}>
                          <Cloud className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-[14px] font-semibold text-[#1A1A1A] mb-1">Add Google Drive link</h4>
                          <p className="text-[13px] text-[#6B7280] leading-[1.5] mb-3">
                            Provide a shareable Google Drive link to your customer data file
                          </p>
                          {selectedUploadOption === 'drive' && (
                            <div className="mt-3 space-y-3">
                              <div className="flex gap-2">
                              <Input
                                placeholder="Paste your Google Drive shareable link here"
                                value={googleDriveLink}
                                  onChange={(e) => {
                                    setGoogleDriveLink(e.target.value)
                                    // Reset states when link changes
                                    setGoogleDriveComplete(false)
                                    setGoogleDriveData([])
                                    setGoogleDriveErrors([])
                                    // Clear Google Drive link error when link is provided
                                    if (errors.googleDriveLink && e.target.value.trim()) {
                                      setErrors(prev => ({ ...prev, googleDriveLink: false }))
                                    }
                                  }}
                                  className={`flex-1 h-10 text-[14px] bg-white ${
                                    errors.googleDriveLink
                                      ? 'border-red-500 focus:border-red-500' 
                                      : 'border-[#E5E7EB] focus:border-[#4600F2]'
                                  }`}
                                />
                                <Button
                                  type="button"
                                  onClick={() => fetchGoogleDriveData(googleDriveLink)}
                                  disabled={!googleDriveLink.trim() || isGoogleDriveLoading}
                                  className="h-10 px-4 text-[14px] bg-[#4600F2] hover:bg-[#4600F2]/90 text-white rounded-lg font-medium disabled:opacity-50"
                                >
                                  {isGoogleDriveLoading ? 'Fetching...' : 'Fetch Data'}
                                </Button>
                            </div>
                              
                              {/* Error Messages */}
                              {errors.googleDriveLink && !googleDriveLink.trim() && (
                                <p className="text-[12px] text-red-600 mt-1">Google Drive link is required</p>
                              )}
                              {googleDriveErrors.length > 0 && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                  <div className="flex items-start">
                                    <AlertCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-[12px] font-medium text-red-800 mb-1">Import failed</p>
                                      {googleDriveErrors.map((error, index) => (
                                        <p key={index} className="text-[12px] text-red-600">• {error}</p>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Loading State */}
                              {isGoogleDriveLoading && (
                                <div className="flex items-center justify-center py-8">
                                  <div className="animate-spin h-6 w-6 border-2 border-[#4600F2] border-t-transparent rounded-full" />
                                  <span className="ml-3 text-[14px] text-[#6B7280]">Fetching data from Google Drive...</span>
                                </div>
                              )}

                              {/* Key Mapping Processing State for Google Drive */}
                              {!isGoogleDriveLoading && isProcessingKeyMapping && googleDriveData.length > 0 && (
                                <div className="flex items-center justify-center py-8">
                                  <div className="flex items-center space-x-3">
                                    <Loader2 className="h-5 w-5 animate-spin text-[#4600F2]" />
                                    <div>
                                      <p className="text-[14px] font-semibold text-[#1A1A1A]">Processing column mapping...</p>
                                      <p className="text-[12px] text-[#6B7280]">Analyzing imported data structure</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Success State - Show Parsed Data */}
                              {googleDriveComplete && googleDriveData.length > 0 && !isProcessingKeyMapping && (
                                <div className="mt-4">
                                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-start">
                                      <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                                      <div className="flex-1">
                                        <p className="text-[14px] font-medium text-green-800 mb-2">Import successful!</p>
                                        <p className="text-[12px] text-green-700">
                                          Found {googleDriveData.length} customer records
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Customer Data Preview */}
                                  <div className="mt-4 border border-[#E5E7EB] rounded-lg overflow-hidden">
                                    <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] px-4 py-3">
                                      <h4 className="text-[14px] font-semibold text-[#1A1A1A]">Customer Data Preview</h4>
                                      <p className="text-[12px] text-[#6B7280] mt-1">
                                        Showing first 5 records of {googleDriveData.length} total
                                      </p>
                                    </div>
                                    <div className="p-4">
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-[12px]">
                                          <thead>
                                            <tr className="border-b border-[#E5E7EB]">
                                              {Object.keys(googleDriveData[0] || {}).slice(0, 5).map((key) => (
                                                <th key={key} className="text-left py-2 px-2 text-[#6B7280] font-medium">
                                                  {key}
                                                </th>
                                              ))}
                                              {Object.keys(googleDriveData[0] || {}).length > 5 && (
                                                <th className="text-left py-2 px-2 text-[#6B7280] font-medium">...</th>
                                              )}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {googleDriveData.slice(0, 5).map((row, index) => (
                                              <tr key={index} className="border-b border-[#F3F4F6] last:border-b-0">
                                                {Object.values(row).slice(0, 5).map((value, cellIndex) => (
                                                  <td key={cellIndex} className="py-2 px-2 text-[#1A1A1A]">
                                                    {String(value).length > 20 
                                                      ? String(value).substring(0, 20) + '...' 
                                                      : String(value)
                                                    }
                                                  </td>
                                                ))}
                                                {Object.values(row).length > 5 && (
                                                  <td className="py-2 px-2 text-[#6B7280]">...</td>
                                                )}
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
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
                                
                                {/* Download sample file CTA for sales */}
                                <div className="mt-4">
                                  <button 
                                    onClick={downloadSampleFile}
                                    className="inline-flex items-center text-[12px] font-medium text-[#4600F2] hover:text-[#4600F2]/80 transition-colors"
                                  >
                                    <Download className="w-3 h-3 mr-1" />
                                    Download sample file
                                  </button>
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
                        onClick={downloadSampleFile}
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
                        onClick={downloadSampleFile}
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
                  <div className="flex items-center justify-between p-6 bg-[#22C55E]/10 border-2 border-[#22C55E] rounded-lg mb-6">
                    <div className="flex items-center">
                      <CheckCircle className="h-6 w-6 text-[#22C55E] mr-4" />
                      <div>
                        <p className="font-semibold text-[#1A1A1A] text-[16px]">File uploaded successfully</p>
                        <p className="text-[#6B7280] text-[14px]">{campaignData.fileName} • {campaignData.totalRecords} rows detected</p>
                      </div>
                    </div>
                    {/* OLD MAPPING SYSTEM TOGGLE - COMMENTED OUT
                    <div className="flex items-center gap-3">
                      <Label htmlFor="mapping-system" className="text-sm font-medium text-gray-700">
                        Use New Mapping System
                      </Label>
                      <Checkbox 
                        id="mapping-system"
                        checked={useNewMappingSystem}
                        onCheckedChange={(checked) => {
                          setUseNewMappingSystem(checked as boolean)
                          if (checked) {
                            setShowCSVMappingStep(true)
                          } else {
                            setShowCSVMappingStep(false)
                            // Process with traditional system
                            if (uploadedData.length > 0) {
                              processUploadedFile(uploadedData, campaignData.fileName || 'uploaded-data.csv')
                            }
                          }
                        }}
                      />
                    </div>
                    */}
                  </div>

                  {/* CSV Mapping Step */}
                  {showCSVMappingStep && csvParseResult && (
                    <div className="mb-6">
                      <CSVMappingStep
                        csvData={uploadedData}
                        parseResult={csvParseResult}
                        existingKeyMapping={keyMapping || undefined}
                        apiRequiredFields={getRequiredKeysForUseCase()}
                        onMappingComplete={handleCSVMappingComplete}
                        onSkipMapping={handleSkipCSVMapping}
                        showSkipOption={false}
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
                            {getDisplayColumns().map((field) => (
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
                              {getDisplayColumns().map((field) => (
                                <td key={field} className="px-2 py-3 text-[#1A1A1A] max-w-[150px]">
                                  <div className="truncate" title={row[field as keyof typeof row]}>
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
                        onClick={async () => {
                          try {
                            // Download the CSV template
                            const response = await fetch('/csv-template.csv')
                            if (!response.ok) {
                              throw new Error(`Failed to fetch template: ${response.status}`)
                            }
                            
                            const blob = await response.blob()
                            const url = window.URL.createObjectURL(blob)
                            const link = document.createElement('a')
                            link.href = url
                            link.download = 'campaign-template.csv'
                            link.style.display = 'none'
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                            window.URL.revokeObjectURL(url)
                            
                            toast({
                              title: "Template Downloaded",
                              description: "CSV template has been downloaded successfully."
                            })
                            resetUpload()
                          } catch (error) {
                            console.error('Download error:', error)
                            toast({
                              title: "Download Failed",
                              description: "Could not download the CSV template. Please try again.",
                              variant: "destructive"
                            })
                          }
                        }}
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



      case 3:
        return (
          <div className="max-w-3xl">
            <div className="space-y-6">
              <div className="bg-transparent border-0 p-0">
                <div className="mb-4">
                  <h1 className="text-[24px] font-bold text-[#1A1A1A] leading-[1.4]">
                    Call Settings
                  </h1>
                  <p className="text-[14px] text-[#6B7280] mt-2 leading-[1.5]">
                    Configure call pacing, retry logic, and voicemail handling for your campaign
                  </p>
                </div>
              </div>

              {/* Communication Channels */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-[16px] font-bold text-[#1A1A1A]">Communication Channels</h3>
                        <p className="text-[14px] text-[#6B7280] mt-1 leading-[1.5]">Choose how you want to reach customers</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 overflow-hidden">
                        {/* Voice AI - First and Available */}
                        <div
                          className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all overflow-hidden ${
                            campaignData.channels.voiceAi ? 'border-[#4600F2] bg-[#4600F2]/5' : 'border-[#E5E7EB] bg-white hover:border-[#D1D5D8]'
                          }`}
                          onClick={() => setCampaignData(prev => ({ ...prev, channels: { ...prev.channels, voiceAi: !prev.channels.voiceAi } }))}
                        >
                          <div className="p-2 bg-[#F0F9FF] rounded-lg flex-shrink-0"><Phone className="h-5 w-5 text-[#0EA5E9]" /></div>
                          <span className="text-[14px] font-medium text-[#1A1A1A] truncate">Voice AI</span>
                        </div>
                        
                        {/* Email - Coming Soon */}
                        <div className="relative flex items-center space-x-3 p-4 border border-[#E5E7EB] bg-gray-50 rounded-lg cursor-not-allowed transition-all overflow-hidden opacity-60">
                          <div className="p-2 bg-[#EEF2FF] rounded-lg flex-shrink-0"><Mail className="h-5 w-5 text-[#6366F1]" /></div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[14px] font-medium text-[#1A1A1A] truncate">Email</span>
                          </div>
                          <div className="absolute top-1 right-1">
                            <span className="text-[10px] font-medium text-[#6B7280] bg-white px-2 py-0.5 rounded-full border border-[#E5E7EB]">
                              Coming Soon
                            </span>
                          </div>
                        </div>
                        
                        {/* SMS - Coming Soon */}
                        <div className="relative flex items-center space-x-3 p-4 border border-[#E5E7EB] bg-gray-50 rounded-lg cursor-not-allowed transition-all overflow-hidden opacity-60">
                          <div className="p-2 bg-[#ECFDF5] rounded-lg flex-shrink-0"><MessageSquare className="h-5 w-5 text-[#10B981]" /></div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[14px] font-medium text-[#1A1A1A] truncate">SMS</span>
                          </div>
                          <div className="absolute top-1 right-1">
                            <span className="text-[10px] font-medium text-[#6B7280] bg-white px-2 py-0.5 rounded-full border border-[#E5E7EB]">
                              Coming Soon
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Compliance Settings */}
                  <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-[16px] font-bold text-[#1A1A1A]">Compliance Settings</h3>
                      </div>
                      <div className="space-y-4 overflow-hidden">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="includeRecordingConsent"
                            checked={campaignData.compliance.includeRecordingConsent}
                            onCheckedChange={(c) => setCampaignData(prev => ({ ...prev, compliance: { ...prev.compliance, includeRecordingConsent: Boolean(c) } }))}
                          />
                          <Label htmlFor="includeRecordingConsent" className="text-[14px] text-[#1A1A1A]">Include legal consent line in script</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="includeSmsOptOut"
                            checked={campaignData.compliance.includeSmsOptOut}
                            onCheckedChange={(c) => setCampaignData(prev => ({ ...prev, compliance: { ...prev.compliance, includeSmsOptOut: Boolean(c) } }))}
                          />
                          <Label htmlFor="includeSmsOptOut" className="text-[14px] text-[#1A1A1A]">Include opt-out instructions in SMS</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="respectDnc"
                            checked={campaignData.doNotCallList}
                            onCheckedChange={(c) => setCampaignData(prev => ({ ...prev, doNotCallList: Boolean(c) }))}
                          />
                          <Label htmlFor="respectDnc" className="text-[14px] text-[#1A1A1A]">Respect Do Not Call list</Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Campaign Summary */}
                  <div className="bg-white border border-[#E5E7EB] rounded-lg">
                    <div className="bg-[#F4F5F8] border-b border-[#E5E7EB] px-6 py-4">
                      <h3 className="text-[16px] font-semibold text-[#1A1A1A]">Campaign Summary</h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-[14px] font-medium text-[#666666] mb-1">Campaign Name</p>
                          <p className="text-[16px] font-bold text-[#1A1A1A]">{campaignData.campaignName || 'Untitled Campaign'}</p>
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-[#666666] mb-1">Use Case</p>
                          <div className="mt-1">
                            <Badge className="bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]">
                              {useCases[selectedCategory]?.label} - {useCases[selectedCategory]?.subCases.find(sc => sc.value === campaignData.subUseCase)?.label}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-[#666666] mb-1">Total Records</p>
                          <p className="text-[16px] font-bold text-[#1A1A1A]">{campaignData.totalRecords} customers</p>
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-[#666666] mb-1">Estimated Time</p>
                          <p className="text-[16px] font-bold text-[#1A1A1A]">{getEstimatedTimeInMinutes(campaignData.totalRecords)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[14px] font-medium text-[#666666] mb-1">File</p>
                          <p className="text-[16px] font-bold text-[#1A1A1A]">{campaignData.fileName}</p>
                        </div>
                        {selectedAgent && campaignData.subUseCase === 'recall-notification' && (
                          <div className="col-span-2">
                            <p className="text-[14px] font-medium text-[#666666] mb-2">Selected Agent</p>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="relative bg-white border border-[#E5E7EB] rounded-xl p-4 pb-16 transition-all duration-200 hover:border-[#4600F2]/40 hover:bg-[#4600F2]/5 hover:shadow-sm">
                                <div className="space-y-4">
                                  {/* Top Section: Profile Photo, Name, and Chips */}
                                  <div className="flex items-start space-x-4">
                                    {/* Profile Picture */}
                                    <div className="flex-shrink-0 -mt-1">
                                      <img
                                        src={selectedAgent.imageUrl}
                                        alt={selectedAgent.name}
                                        className="w-16 h-16 rounded-lg object-cover object-top border-2 border-[#E5E7EB]"
                                        onError={(e) => {
                                          e.currentTarget.src = '/placeholder-user.jpg'
                                        }}
                                      />
                                    </div>

                                    {/* Agent Info */}
                                    <div className="flex-1 min-w-0">
                                      {/* Name */}
                                      <h4 className="text-[16px] font-bold text-black mb-2">
                                        {selectedAgent.name}
                                      </h4>

                                      {/* Tags */}
                                      <div className="flex flex-wrap gap-1.5">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-300">
                                          {selectedAgent.city}
                                        </span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-300">
                                          {selectedAgent.languageName}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Bottom Section: Call Statistics */}
                                  <div className="flex justify-between">
                                    <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 flex-1 mr-2">
                                      <p className="text-xs text-gray-500 mb-1">Total Calls</p>
                                      <p className="text-base font-bold text-black">{selectedAgent.totalCalls}</p>
                                    </div>
                                    <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 flex-1">
                                      <p className="text-xs text-gray-500 mb-1">Success Rate</p>
                                      <p className="text-base font-bold text-black">{selectedAgent.totalCalls > 0 ? '75%' : '0%'}</p>
                                    </div>
                                  </div>

                                  {/* Talk to Agent Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      // Handle talk to agent functionality
                                      if (selectedAgent) {
                                        parent.postMessage({
                                          type: 'TALK_TO_AGENT',
                                          agentId: selectedAgent.id,
                                          agentName: selectedAgent.name
                                        }, '*')
                                      }
                                    }}
                                    className="absolute bottom-4 left-4 right-4 bg-[#4600F2] text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-[#4600F2]/90 transition-colors"
                                  >
                                    Talk to Agent
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Schedule Options */}
                  <div ref={scheduleRef} className={`bg-white border rounded-lg transition-colors ${
                    errors.scheduledDate || errors.scheduledTime ? 'border-red-500' : 'border-[#E5E7EB]'
                  }`}>
                    <div className="bg-[#F4F5F8] border-b border-[#E5E7EB] px-6 py-4">
                      <h3 className={`text-[16px] font-semibold ${
                        errors.scheduledDate || errors.scheduledTime ? 'text-red-600' : 'text-[#1A1A1A]'
                      }`}>
                        Schedule Campaign {(errors.scheduledDate || errors.scheduledTime) && <span className="text-red-500">*</span>}
                      </h3>
                      <p className="text-[14px] text-[#6B7280] mt-1 leading-[1.5]">Choose when to launch your AI-powered calling campaign</p>
                      {(errors.scheduledDate || errors.scheduledTime) && (
                        <p className="text-[12px] text-red-600 flex items-center mt-2">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Please select both date and time for scheduled campaigns
                        </p>
                      )}
                    </div>
                    <div className="p-6">
                      <RadioGroup
                        value={campaignData.schedule}
                        onValueChange={(value) => setCampaignData(prev => ({ ...prev, schedule: value }))}
                        className="space-y-4"
                      >
                        <div className="flex items-center space-x-3 p-4 border border-[#E5E7EB] rounded-lg hover:bg-[#4600F214] transition-colors">
                          <RadioGroupItem value="now" id="now" className="border-[#E5E7EB]" />
                          <Label htmlFor="now" className="flex-1 cursor-pointer">
                            <div className="flex items-center">
                              <div className="p-2 bg-[#4600F2]/10 rounded-lg mr-3">
                                <Zap className="h-5 w-5 text-[#4600F2]" />
                              </div>
                              <div>
                                <p className="text-[14px] font-medium text-[#1A1A1A]">Start Now</p>
                                <p className="text-[14px] text-[#6B7280] leading-[1.5]">Begin calling immediately after campaign creation</p>
                              </div>
                            </div>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-3 p-4 border border-[#E5E7EB] rounded-lg hover:bg-[#4600F214] transition-colors">
                          <RadioGroupItem value="scheduled" id="scheduled" className="border-[#E5E7EB]" />
                          <Label htmlFor="scheduled" className="flex-1 cursor-pointer">
                            <div className="flex items-center">
                              <div className="p-2 bg-[#FACC15]/10 rounded-lg mr-3">
                                <Clock className="h-5 w-5 text-[#FACC15]" />
                              </div>
                              <div>
                                <p className="text-[14px] font-medium text-[#1A1A1A]">Schedule for Later</p>
                                <p className="text-[14px] text-[#6B7280] leading-[1.5]">Choose a specific date and time</p>
                              </div>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>

                      {campaignData.schedule === 'scheduled' && (
                        <div className="bg-white border border-[#E5E7EB] rounded-lg mt-6">
                          <div className="bg-[#F4F5F8] border-b border-[#E5E7EB] px-6 py-4">
                            <h3 className="text-[16px] font-semibold text-[#1A1A1A]">Schedule Settings</h3>
                            <p className="text-[14px] text-[#6B7280] mt-1 leading-[1.5]">Set the date and time for your campaign to start</p>
                          </div>
                          <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="date" className={`text-[14px] font-medium mb-2 block ${
                                  errors.scheduledDate ? 'text-red-600' : 'text-[#1A1A1A]/60'
                                }`}>
                                  Campaign Date {errors.scheduledDate && <span className="text-red-500">*</span>}
                                </Label>
                                <DatePicker
                                  value={campaignData.scheduledDate}
                                  onChange={(value) => {
                                    setCampaignData(prev => ({ ...prev, scheduledDate: value }))
                                    if (errors.scheduledDate && value) {
                                      setErrors(prev => ({ ...prev, scheduledDate: false }))
                                    }
                                  }}
                                  placeholder="Select date"
                                  minDate={new Date().toISOString().split('T')[0]}
                                />
                                {errors.scheduledDate && (
                                  <p className="text-[12px] text-red-600 flex items-center mt-1">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Date is required
                                  </p>
                                )}
                              </div>
                              <div>
                                <Label htmlFor="time" className={`text-[14px] font-medium mb-2 block ${
                                  errors.scheduledTime ? 'text-red-600' : 'text-[#1A1A1A]/60'
                                }`}>
                                  Campaign Time {errors.scheduledTime && <span className="text-red-500">*</span>}
                                </Label>
                                <TimePicker
                                  value={campaignData.scheduledTime}
                                  onChange={(value) => {
                                    setCampaignData(prev => ({ ...prev, scheduledTime: value }))
                                    if (errors.scheduledTime && value) {
                                      setErrors(prev => ({ ...prev, scheduledTime: false }))
                                    }
                                  }}
                                  placeholder="Select time"
                                />
                                {errors.scheduledTime && (
                                  <p className="text-[12px] text-red-600 flex items-center mt-1">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Time is required
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Call Rules & Behavior */}
                  <div className="bg-white border border-[#E5E7EB] rounded-lg">
                    <div className="bg-[#F4F5F8] border-b border-[#E5E7EB] px-6 py-4">
                      <h3 className="text-[16px] font-semibold text-[#1A1A1A]">Call Rules & Behavior</h3>
                      <p className="text-[14px] text-[#6B7280] mt-1 leading-[1.5]">Configure how your AI agent handles different call scenarios and retry logic</p>
                    </div>
                    <div className="p-6">
                      {/* Retry Scenarios - Moved to top with chips UI */}
                      <div className="mb-10">
                        <h4 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">
                          Retry Scenarios
                        </h4>
                        
                        <div className="flex flex-wrap gap-3">
                          <div 
                            className={`px-3 py-2 rounded-full border cursor-pointer transition-all ${
                              campaignData.disconnectedCallRetry 
                                ? 'border-[#4600F2] bg-[#4600F2]/10 text-[#4600F2]' 
                                : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1D5DB]'
                            }`}
                            onClick={() => setCampaignData(prev => ({ ...prev, disconnectedCallRetry: !prev.disconnectedCallRetry }))}
                          >
                            <span className={`text-[14px] ${campaignData.disconnectedCallRetry ? 'font-bold' : 'font-medium'}`}>Disconnected calls</span>
                          </div>
                          
                          <div 
                            className={`px-3 py-2 rounded-full border cursor-pointer transition-all ${
                              campaignData.busySignalRetry 
                                ? 'border-[#4600F2] bg-[#4600F2]/10 text-[#4600F2]' 
                                : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1D5DB]'
                            }`}
                            onClick={() => setCampaignData(prev => ({ ...prev, busySignalRetry: !prev.busySignalRetry }))}
                          >
                            <span className={`text-[14px] ${campaignData.busySignalRetry ? 'font-bold' : 'font-medium'}`}>Busy signals</span>
                          </div>
                          
                          <div 
                            className={`px-3 py-2 rounded-full border cursor-pointer transition-all ${
                              campaignData.noAnswerRetry 
                                ? 'border-[#4600F2] bg-[#4600F2]/10 text-[#4600F2]' 
                                : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1D5DB]'
                            }`}
                            onClick={() => setCampaignData(prev => ({ ...prev, noAnswerRetry: !prev.noAnswerRetry }))}
                          >
                            <span className={`text-[14px] ${campaignData.noAnswerRetry ? 'font-bold' : 'font-medium'}`}>No answer</span>
                          </div>
                          
                          <div 
                            className={`px-3 py-2 rounded-full border cursor-pointer transition-all ${
                              campaignData.busyCustomerRetry 
                                ? 'border-[#4600F2] bg-[#4600F2]/10 text-[#4600F2]' 
                                : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1D5DB]'
                            }`}
                            onClick={() => setCampaignData(prev => ({ ...prev, busyCustomerRetry: !prev.busyCustomerRetry }))}
                          >
                            <span className={`text-[14px] ${campaignData.busyCustomerRetry ? 'font-bold' : 'font-medium'}`}>Customer says busy</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Retry Settings */}
                        <div className="space-y-4 lg:col-span-2">
                          <h4 className="text-[16px] font-semibold text-[#1A1A1A]">
                            Retry Settings
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="maxRetries" className="text-[14px] font-medium text-[#1A1A1A]/60 mb-2 block">
                                Maximum Retry Attempts
                              </Label>
                              <Select
                                value={campaignData.maxRetryAttempts.toString()}
                                onValueChange={(value) => setCampaignData(prev => ({ ...prev, maxRetryAttempts: parseInt(value) }))}
                              >
                                <SelectTrigger className="h-10 text-[14px] border-[#E5E7EB] focus:border-[#4600F2]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">1 attempt</SelectItem>
                                  <SelectItem value="2">2 attempts</SelectItem>
                                  <SelectItem value="3">3 attempts</SelectItem>
                                  <SelectItem value="4">4 attempts</SelectItem>
                                  <SelectItem value="5">5 attempts</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label htmlFor="retryDelay" className="text-[14px] font-medium text-[#1A1A1A]/60 mb-2 block">
                                Retry Delay
                              </Label>
                              <Select
                                value={campaignData.retryDelayMinutes.toString()}
                                onValueChange={(value) => setCampaignData(prev => ({ ...prev, retryDelayMinutes: parseInt(value) }))}
                              >
                                <SelectTrigger className="h-10 text-[14px] border-[#E5E7EB] focus:border-[#4600F2]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="30">30 minutes</SelectItem>
                                  <SelectItem value="60">1 hour</SelectItem>
                                  <SelectItem value="120">2 hours</SelectItem>
                                  <SelectItem value="240">4 hours</SelectItem>
                                  <SelectItem value="480">8 hours</SelectItem>
                                  <SelectItem value="1440">24 hours</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Voicemail Strategy */}
                      <div className="mt-8">
                        <h4 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">
                          Voicemail Strategy
                        </h4>
                        
                        <div className="mb-4">
                          <Select
                            value={campaignData.voicemailStrategy || 'leave_message'}
                            onValueChange={(value) => setCampaignData(prev => ({ ...prev, voicemailStrategy: value }))}
                          >
                            <SelectTrigger className="h-10 text-[14px] border-[#E5E7EB] focus:border-[#4600F2]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="leave_message">Leave voicemail message</SelectItem>
                              <SelectItem value="hang_up">Hang up</SelectItem>
                              <SelectItem value="transfer">Transfer to human</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {campaignData.voicemailStrategy === 'leave_message' && (
                          <div>
                            <Label className="text-[14px] font-medium text-[#1A1A1A]/60 mb-2 block">
                              Voicemail Message
                            </Label>
                            <Textarea
                              value={campaignData.voicemailMessage || "Hi, this is [Company Name] calling about an important safety recall for your vehicle. This is a free service to ensure your safety. Please call us back at [Phone Number] as soon as possible to schedule your free recall repair. Your safety is our top priority. Thank you."}
                              onChange={(e) => setCampaignData(prev => ({ ...prev, voicemailMessage: e.target.value }))}
                              placeholder="Enter your voicemail message..."
                              className="min-h-[120px] text-[14px] border-[#E5E7EB] focus:border-[#4600F2] focus:ring-2 focus:ring-[#4600F2]/20 transition-all duration-200 resize-none"
                            />
                            <p className="text-[13px] text-[#6B7280] mt-2">
                              This message will be left when the AI agent reaches voicemail
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

              {/* Schedule & Pacing */}
              <div className={`bg-white border rounded-lg p-6 transition-colors ${
                errors.scheduledDate || errors.scheduledEndDate ? 'border-red-500' : 'border-[#E5E7EB]'
              }`}>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[16px] font-bold text-[#1A1A1A]">Schedule Campaign</h3>
                    <p className="text-[14px] text-[#6B7280] mt-1 leading-[1.5]">Set timing and call limits</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className={`text-[14px] font-medium mb-2 block ${
                        errors.scheduledDate ? 'text-red-600' : 'text-[#1A1A1A]/60'
                      }`}>
                        Start Date {errors.scheduledDate && <span className="text-red-500">*</span>}
                      </Label>
                      <DatePicker
                        value={campaignData.scheduledDate || ""}
                        onChange={(value) => {
                          setCampaignData(prev => ({ ...prev, scheduledDate: value }))
                          // Clear start date error if value is provided
                          if (errors.scheduledDate && value) {
                            setErrors(prev => ({ ...prev, scheduledDate: false }))
                          }
                          // Validate end date against new start date if end date exists
                          if (value && campaignData.scheduledEndDate) {
                            const startDate = new Date(value)
                            const endDate = new Date(campaignData.scheduledEndDate)
                            if (endDate < startDate) {
                              setErrors(prev => ({ ...prev, scheduledEndDate: true }))
                            } else {
                              setErrors(prev => ({ ...prev, scheduledEndDate: false }))
                            }
                          }
                        }}
                        placeholder="Select start date"
                        minDate={new Date().toISOString().split('T')[0]}
                        className={errors.scheduledDate ? 'border-red-500' : ''}
                      />
                      {errors.scheduledDate && (
                        <p className="text-[12px] text-red-600 flex items-center mt-1">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Start date is required
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className={`text-[14px] font-medium mb-2 block ${
                        errors.scheduledEndDate ? 'text-red-600' : 'text-[#1A1A1A]/60'
                      }`}>
                        End Date {errors.scheduledEndDate && <span className="text-red-500">*</span>}
                      </Label>
                      <DatePicker
                        value={campaignData.scheduledEndDate || ""}
                        onChange={(value) => {
                          setCampaignData(prev => ({ ...prev, scheduledEndDate: value }))
                          // Clear end date error when value is provided
                          if (errors.scheduledEndDate && value) {
                            setErrors(prev => ({ ...prev, scheduledEndDate: false }))
                          }
                          // Validate end date against start date
                          if (value && campaignData.scheduledDate) {
                            const startDate = new Date(campaignData.scheduledDate)
                            const endDate = new Date(value)
                            if (endDate < startDate) {
                              setErrors(prev => ({ ...prev, scheduledEndDate: true }))
                            }
                          }
                        }}
                        placeholder="Select end date"
                        minDate={campaignData.scheduledDate || new Date().toISOString().split('T')[0]}
                        className={errors.scheduledEndDate ? 'border-red-500' : ''}
                      />
                      {errors.scheduledEndDate && (
                        <p className="text-[12px] text-red-600 flex items-center mt-1">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {!campaignData.scheduledEndDate 
                            ? 'End date is required' 
                            : 'End date must be after start date'
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quiet Hours */}
              <div className={`bg-white border rounded-lg p-6 transition-colors ${
                errors.callWindowStart || errors.callWindowEnd ? 'border-red-500' : 'border-[#E5E7EB]'
              }`}>
                <div className="space-y-6">
                  <div>
                    <h3 className={`text-[16px] font-bold ${
                      errors.callWindowStart || errors.callWindowEnd ? 'text-red-600' : 'text-[#1A1A1A]'
                    }`}>
                      Quiet Hours {(errors.callWindowStart || errors.callWindowEnd) && <span className="text-red-500">*</span>}
                    </h3>
                    <p className="text-[14px] text-[#6B7280] mt-1 leading-[1.5]">Define acceptable calling hours (lead&apos;s local time)</p>
                    {(errors.callWindowStart || errors.callWindowEnd) && (
                      <p className="text-[12px] text-red-600 flex items-center mt-2">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.callWindowStart && !errors.callWindowEnd && 'Start time is required'}
                        {!errors.callWindowStart && errors.callWindowEnd && 'End time is required'}
                        {errors.callWindowStart && errors.callWindowEnd && 'Start and end times are required'}
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className={`text-[14px] font-medium mb-2 block ${
                        errors.callWindowStart ? 'text-red-600' : 'text-[#1A1A1A]/60'
                      }`}>
                        Start Time {errors.callWindowStart && <span className="text-red-500">*</span>}
                      </Label>
                      <TimePicker
                        value={campaignData.callWindowStart || "08:00"}
                        onChange={(value) => {
                          setCampaignData(prev => ({ ...prev, callWindowStart: value }))
                          if (errors.callWindowStart && value) {
                            setErrors(prev => ({ ...prev, callWindowStart: false }))
                          }
                        }}
                        placeholder="Select start time"
                        className={errors.callWindowStart ? 'border-red-500' : ''}
                      />
                      {errors.callWindowStart && (
                        <p className="text-[12px] text-red-600 mt-1">Start time is required</p>
                      )}
                    </div>
                    <div>
                      <Label className={`text-[14px] font-medium mb-2 block ${
                        errors.callWindowEnd ? 'text-red-600' : 'text-[#1A1A1A]/60'
                      }`}>
                        End Time {errors.callWindowEnd && <span className="text-red-500">*</span>}
                      </Label>
                      <TimePicker
                        value={campaignData.callWindowEnd || "20:00"}
                        onChange={(value) => {
                          setCampaignData(prev => ({ ...prev, callWindowEnd: value }))
                          if (errors.callWindowEnd && value) {
                            setErrors(prev => ({ ...prev, callWindowEnd: false }))
                          }
                        }}
                        placeholder="Select end time"
                        className={errors.callWindowEnd ? 'border-red-500' : ''}
                      />
                      {errors.callWindowEnd && (
                        <p className="text-[12px] text-red-600 mt-1">End time is required</p>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-[13px] text-[#6B7280]">
                    Calls will only be made between 08:00 and 20:00 in each lead&apos;s local timezone
                  </p>
                </div>
              </div>

              {/* Pacing & Limits */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[16px] font-bold text-[#1A1A1A]">Pacing & Limits</h3>
                    <p className="text-[14px] text-[#6B7280] mt-1 leading-[1.5]">Control the rate and volume of outreach</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <Label className="text-[14px] font-medium text-[#1A1A1A]">Daily Contact Limit</Label>
                        <span className="text-[14px] font-semibold text-[#4600F2]">{campaignData.maxCallsPerDay || 110} contacts/day</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-[12px] text-[#6B7280]">10</span>
                        <div className="flex-1">
                          <input
                            type="range"
                            min="10"
                            max="500"
                            value={campaignData.maxCallsPerDay || 110}
                            onChange={(e) => setCampaignData(prev => ({ ...prev, maxCallsPerDay: parseInt(e.target.value) }))}
                            className="w-full h-2 bg-[#E5E7EB] rounded-full appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, #4600F2 0%, #4600F2 ${((campaignData.maxCallsPerDay || 110) - 10) / (500 - 10) * 100}%, #E5E7EB ${((campaignData.maxCallsPerDay || 110) - 10) / (500 - 10) * 100}%, #E5E7EB 100%)`
                            }}
                          />
                        </div>
                        <span className="text-[12px] text-[#6B7280]">500</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <Label className="text-[14px] font-medium text-[#1A1A1A]">Hourly Throttle</Label>
                        <span className="text-[14px] font-semibold text-[#4600F2]">{campaignData.maxCallsPerHour || 10} contacts/hour</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-[12px] text-[#6B7280]">1</span>
                        <div className="flex-1">
                          <input
                            type="range"
                            min="1"
                            max="50"
                            value={campaignData.maxCallsPerHour || 10}
                            onChange={(e) => setCampaignData(prev => ({ ...prev, maxCallsPerHour: parseInt(e.target.value) }))}
                            className="w-full h-2 bg-[#E5E7EB] rounded-full appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, #4600F2 0%, #4600F2 ${((campaignData.maxCallsPerHour || 10) - 1) / (50 - 1) * 100}%, #E5E7EB ${((campaignData.maxCallsPerHour || 10) - 1) / (50 - 1) * 100}%, #E5E7EB 100%)`
                            }}
                          />
                        </div>
                        <span className="text-[12px] text-[#6B7280]">50</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <Label className="text-[14px] font-medium text-[#1A1A1A]">Max Concurrent Calls</Label>
                        <span className="text-[14px] font-semibold text-[#4600F2]">{campaignData.maxConcurrentCalls || 5} concurrent</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-[12px] text-[#6B7280]">1</span>
                        <div className="flex-1">
                          <input
                            type="range"
                            min="1"
                            max="20"
                            value={campaignData.maxConcurrentCalls || 5}
                            onChange={(e) => setCampaignData(prev => ({ ...prev, maxConcurrentCalls: parseInt(e.target.value) }))}
                            className="w-full h-2 bg-[#E5E7EB] rounded-full appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, #4600F2 0%, #4600F2 ${((campaignData.maxConcurrentCalls || 5) - 1) / (20 - 1) * 100}%, #E5E7EB ${((campaignData.maxConcurrentCalls || 5) - 1) / (20 - 1) * 100}%, #E5E7EB 100%)`
                            }}
                          />
                        </div>
                        <span className="text-[12px] text-[#6B7280]">20</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Retry Logic */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[16px] font-bold text-[#1A1A1A]">Retry Logic</h3>
                    <p className="text-[14px] text-[#6B7280] mt-1 leading-[1.5]">Configure how to handle unsuccessful contact attempts</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[14px] font-medium text-[#1A1A1A]/60 mb-2 block">Maximum Attempts</Label>
                      <Input
                        type="number"
                        value={campaignData.maxRetryAttempts || 3}
                        onChange={(e) => setCampaignData(prev => ({ ...prev, maxRetryAttempts: parseInt(e.target.value) }))}
                        min="1"
                        max="10"
                        className="h-10 text-[14px] border-[#E5E7EB] focus:border-[#4600F2] focus:ring-2 focus:ring-[#4600F2]/20 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <Label className="text-[14px] font-medium text-[#1A1A1A]/60 mb-2 block">Hours Between Attempts</Label>
                      <Input
                        type="number"
                        value={campaignData.retryDelayMinutes ? Math.round(campaignData.retryDelayMinutes / 60) : 4}
                        onChange={(e) => setCampaignData(prev => ({ ...prev, retryDelayMinutes: parseInt(e.target.value) * 60 }))}
                        min="1"
                        max="24"
                        className="h-10 text-[14px] border-[#E5E7EB] focus:border-[#4600F2] focus:ring-2 focus:ring-[#4600F2]/20 transition-all duration-200"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="sms-fallback" 
                      checked={campaignData.busyCustomerRetry || false}
                      onCheckedChange={(checked) => setCampaignData(prev => ({ ...prev, busyCustomerRetry: checked as boolean }))}
                    />
                    <Label htmlFor="sms-fallback" className="text-[14px] text-[#1A1A1A]">
                      Switch to SMS on 2nd attempt if voice fails
                    </Label>
                  </div>
                </div>
              </div>

              {/* Voicemail Handling */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[16px] font-bold text-[#1A1A1A]">Voicemail Handling</h3>
                    <p className="text-[14px] text-[#6B7280] mt-1 leading-[1.5]">Choose how to handle voicemail scenarios</p>
                  </div>
                  
                  <RadioGroup 
                    value={campaignData.voicemailStrategy || "leave_message"} 
                    onValueChange={(value) => setCampaignData(prev => ({ ...prev, voicemailStrategy: value }))}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="leave_message" id="leave_message" />
                      <Label htmlFor="leave_message" className="text-[14px] text-[#1A1A1A]">Leave voicemail message</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="sms_fallback" id="sms_fallback" />
                      <Label htmlFor="sms_fallback" className="text-[14px] text-[#1A1A1A]">Send SMS fallback instead</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        // For service use case, step 4 is "Start Campaign", for sales it's "Handoff Settings"
        if (selectedCategory === 'service') {
          return (
            <div className="max-w-3xl">
              <div className="space-y-6">
                <div className="bg-transparent border-0 p-0">
                  <div className="mb-4">
                    <h1 className="text-[24px] font-bold text-[#1A1A1A] leading-[1.4]">Campaign Started!</h1>
                    <p className="text-[14px] text-[#6B7280] mt-2 leading-[1.5]">
                      Your AI-powered outbound calling campaign is now active and running
                    </p>
                  </div>
                </div>

                {/* Campaign Status Overview */}
                <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[14px] font-medium text-[#666666] mb-1">Campaign ID</p>
                      <p className="text-[16px] font-mono text-[#1A1A1A]">{createdCampaignId || 'Loading...'}</p>
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-[#666666] mb-2">Status</p>
                      <Badge className="bg-[#4600F2] text-white px-3 py-1 text-[12px]">
                        <Zap className="h-4 w-4 mr-2" />
                        {campaignData.schedule === 'now' ? 'Running' : 'Scheduled'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-[#666666] mb-1">
                        {campaignData.schedule === 'now' ? 'Campaign Time Range' : 'Scheduled Time Range'}
                      </p>
                      <p className="text-[16px] text-[#1A1A1A]">
                        {getEstimatedTimeRange()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <Button 
                    onClick={() => router.push(`/results/${createdCampaignId}`)}
                    size="lg"
                    className="flex-1 h-11 text-[14px] bg-[#4600F2] hover:bg-[#4600F2]/90 text-white rounded-lg font-medium"
                  >
                    <BarChart3 className="h-5 w-5 mr-2" />
                    View Campaign Analytics
                  </Button>
                  <Button 
                    onClick={() => router.push('/setup')}
                    variant="outline"
                    size="lg"
                    className="flex-1 h-11 text-[14px] border-[#E5E7EB] text-[#1A1A1A] hover:bg-[#F3F4F6] rounded-lg font-medium"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Setup Another Campaign
                  </Button>
                </div>
              </div>
            </div>
          )
        }
        
        // Sales use case - show handoff settings
        return (
          <div className="max-w-3xl">
            <div className="space-y-6">
              <div className="bg-transparent border-0 p-0">
                <div className="mb-4">
                  <h1 className="text-[24px] font-bold text-[#1A1A1A] leading-[1.4]">Handoff Settings</h1>
                  <p className="text-[14px] text-[#6B7280] mt-2 leading-[1.5]">
                    Configure human agent handoff settings for your sales campaign
                  </p>
                </div>
              </div>




              {/* Human Handoff Settings */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[16px] font-bold text-[#1A1A1A]">Human Handoff Settings</h3>
                    <p className="text-[14px] text-[#6B7280] mt-1 leading-[1.5]">Configure when and how to escalate to human agents</p>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Handoff Target */}
                    <div>
                      <h4 className="text-[14px] font-semibold text-[#1A1A1A] mb-3">Handoff Target</h4>
                      <RadioGroup 
                        value={campaignData.handoffSettings?.target || "round_robin"} 
                        onValueChange={(value) => setCampaignData(prev => ({ 
                          ...prev, 
                          handoffSettings: { 
                            ...prev.handoffSettings, 
                            target: value 
                          } 
                        }))}
                        className="space-y-3"
                      >
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="round_robin" id="round_robin" />
                          <Label htmlFor="round_robin" className="text-[14px] text-[#1A1A1A]">Round-robin to available team</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="specific_user" id="specific_user" />
                          <Label htmlFor="specific_user" className="text-[14px] text-[#1A1A1A]">Specific user or number</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    {/* Business Hours */}
                    <div>
                      <h4 className={`text-[14px] font-semibold mb-3 ${
                        errors.handoffBusinessHoursStart || errors.handoffBusinessHoursEnd ? 'text-red-600' : 'text-[#1A1A1A]'
                      }`}>
                        Business Hours {(errors.handoffBusinessHoursStart || errors.handoffBusinessHoursEnd) && <span className="text-red-500">*</span>}
                      </h4>
                      {(errors.handoffBusinessHoursStart || errors.handoffBusinessHoursEnd) && (
                        <p className="text-[12px] text-red-600 flex items-center mb-3">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.handoffBusinessHoursStart && !errors.handoffBusinessHoursEnd && 'Start time is required'}
                          {!errors.handoffBusinessHoursStart && errors.handoffBusinessHoursEnd && 'End time is required'}
                          {errors.handoffBusinessHoursStart && errors.handoffBusinessHoursEnd && 'Start and end times are required'}
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className={`text-[14px] font-medium mb-2 block ${
                            errors.handoffBusinessHoursStart ? 'text-red-600' : 'text-[#1A1A1A]/60'
                          }`}>
                            Start Time {errors.handoffBusinessHoursStart && <span className="text-red-500">*</span>}
                          </Label>
                          <TimePicker
                            value={campaignData.handoffSettings?.businessHoursStart || "09:00"}
                            onChange={(value) => {
                              setCampaignData(prev => ({ 
                              ...prev, 
                              handoffSettings: { 
                                ...prev.handoffSettings, 
                                businessHoursStart: value 
                              } 
                              }))
                              if (errors.handoffBusinessHoursStart && value) {
                                setErrors(prev => ({ ...prev, handoffBusinessHoursStart: false }))
                              }
                            }}
                            placeholder="Select start time"
                            className={errors.handoffBusinessHoursStart ? 'border-red-500' : ''}
                          />
                          {errors.handoffBusinessHoursStart && (
                            <p className="text-[12px] text-red-600 mt-1">Start time is required</p>
                          )}
                        </div>
                        <div>
                          <Label className={`text-[14px] font-medium mb-2 block ${
                            errors.handoffBusinessHoursEnd ? 'text-red-600' : 'text-[#1A1A1A]/60'
                          }`}>
                            End Time {errors.handoffBusinessHoursEnd && <span className="text-red-500">*</span>}
                          </Label>
                          <TimePicker
                            value={campaignData.handoffSettings?.businessHoursEnd || "17:00"}
                            onChange={(value) => {
                              setCampaignData(prev => ({ 
                              ...prev, 
                              handoffSettings: { 
                                ...prev.handoffSettings, 
                                businessHoursEnd: value 
                              } 
                              }))
                              if (errors.handoffBusinessHoursEnd && value) {
                                setErrors(prev => ({ ...prev, handoffBusinessHoursEnd: false }))
                              }
                            }}
                            placeholder="Select end time"
                            className={errors.handoffBusinessHoursEnd ? 'border-red-500' : ''}
                          />
                          {errors.handoffBusinessHoursEnd && (
                            <p className="text-[12px] text-red-600 mt-1">End time is required</p>
                          )}
                        </div>
                      </div>
                      <p className="text-[13px] text-[#6B7280] mt-3">
                        Outside business hours, leads will be sent to voicemail or SMS fallback
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Escalation Triggers */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[16px] font-bold text-[#1A1A1A]">Escalation Triggers</h3>
                    <p className="text-[14px] text-[#6B7280] mt-1 leading-[1.5]">Automatic conditions that trigger human handoff</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="lead_requests_person" 
                        checked={campaignData.escalationTriggers?.leadRequestsPerson || false}
                        onCheckedChange={(checked) => setCampaignData(prev => ({ 
                          ...prev, 
                          escalationTriggers: { 
                            ...prev.escalationTriggers, 
                            leadRequestsPerson: checked as boolean 
                          } 
                        }))}
                      />
                      <div className="flex-1">
                        <Label htmlFor="lead_requests_person" className="text-[14px] font-medium text-[#1A1A1A]">
                          Lead requests to &quot;talk to a person&quot;
                        </Label>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="complex_financing" 
                        checked={campaignData.escalationTriggers?.complexFinancing || false}
                        onCheckedChange={(checked) => setCampaignData(prev => ({ 
                          ...prev, 
                          escalationTriggers: { 
                            ...prev.escalationTriggers, 
                            complexFinancing: checked as boolean 
                          } 
                        }))}
                      />
                      <div className="flex-1">
                        <Label htmlFor="complex_financing" className="text-[14px] font-medium text-[#1A1A1A]">
                          Complex financing questions
                        </Label>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="pricing_negotiation" 
                        checked={campaignData.escalationTriggers?.pricingNegotiation || false}
                        onCheckedChange={(checked) => setCampaignData(prev => ({ 
                          ...prev, 
                          escalationTriggers: { 
                            ...prev.escalationTriggers, 
                            pricingNegotiation: checked as boolean 
                          } 
                        }))}
                      />
                      <div className="flex-1">
                        <Label htmlFor="pricing_negotiation" className="text-[14px] font-medium text-[#1A1A1A]">
                          Pricing negotiation requests
                        </Label>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="technical_questions" 
                        checked={campaignData.escalationTriggers?.technicalQuestions || false}
                        onCheckedChange={(checked) => setCampaignData(prev => ({ 
                          ...prev, 
                          escalationTriggers: { 
                            ...prev.escalationTriggers, 
                            technicalQuestions: checked as boolean 
                          } 
                        }))}
                      />
                      <div className="flex-1">
                        <Label htmlFor="technical_questions" className="text-[14px] font-medium text-[#1A1A1A]">
                          Detailed technical vehicle questions
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
        
      case 4:
        return selectedCategory === 'service' ? (
          // Service Step 4: Review & Schedule (Final step for service)
          <div className="max-w-3xl">
            <div className="space-y-6">
              <div className="bg-transparent border-0 p-0">
                <div className="mb-4">
                  <h1 className="text-[24px] font-bold text-[#1A1A1A] leading-[1.4]">Review & Schedule</h1>
                  <p className="text-[14px] text-[#6B7280] mt-2 leading-[1.5]">Review your campaign details and schedule execution</p>
                </div>
              </div>
              {/* Review content would go here */}
            </div>
          </div>
        ) : null // Sales step 4 would be handled separately

      case 5:
        return (
          <div className="max-w-3xl">
            <div className="space-y-6">
              <div className="bg-transparent border-0 p-0">
                <div className="mb-4">
                  <h1 className="text-[24px] font-bold text-[#1A1A1A] leading-[1.4]">Start Campaign!</h1>
                  <p className="text-[14px] text-[#6B7280] mt-2 leading-[1.5]">
                    Your AI-powered outbound calling campaign is now active and running
                  </p>
                </div>
              </div>

              {/* Campaign Status Overview */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-[14px] font-medium text-[#666666] mb-1">Campaign ID</p>
                    <p className="text-[16px] font-mono text-[#1A1A1A]">{createdCampaignId || 'Loading...'}</p>
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-[#666666] mb-2">Status</p>
                    <Badge className="bg-[#4600F2] text-white px-3 py-1 text-[12px]">
                      <Zap className="h-4 w-4 mr-2" />
                      {campaignData.schedule === 'now' ? 'Running' : 'Scheduled'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-[#666666] mb-1">
                      {campaignData.schedule === 'now' ? 'Campaign Time Range' : 'Scheduled Time Range'}
                    </p>
                    <p className="text-[16px] text-[#1A1A1A]">
                      {getEstimatedTimeRange()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href={buildUrlWithParams(createdCampaignId ? `/results/${createdCampaignId}` : '/results')}>
                  <Button size="lg" className="w-full h-11 px-4 text-[14px] bg-[#4600F2] hover:bg-[#4600F2]/90 text-white rounded-lg font-medium">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    View Campaign Analytics
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  onClick={() => {
                    // Reset all campaign data to initial state
                    setCampaignData({
                      campaignName: '',
                      useCase: 'sales',
                      subUseCase: '',
                      bcdDetails: '',
                      fileName: '',
                      schedule: 'now',
                      scheduledDate: '',
                      scheduledEndDate: '',
                      scheduledTime: '',
                      totalRecords: 0,
                      channels: {
                        email: false,
                        sms: true,
                        voiceAi: true,
                      },
                      scriptTemplate: {
                        voiceIntroduction: "Hi {first_name}, I have exciting news! We just received the {vehicle_interest} that matches what you were looking for. It&apos;s exactly what you described – would you like me to hold it for a test drive today or tomorrow?",
                        corePitch: '',
                        objectionHandling: '',
                        legalConsent: 'This call may be recorded for quality purposes.',
                        optOut: 'Reply STOP to opt out of future messages.',
                        handoffOffer: 'Would you like me to connect you with a specialist?',
                      },
                      compliance: {
                        includeRecordingConsent: true,
                        includeSmsOptOut: true,
                      },
                      maxRetryAttempts: 3,
                      retryDelayMinutes: 60,
                      callWindowStart: '09:00',
                      callWindowEnd: '17:00',
                      timezone: 'America/New_York',
                      doNotCallList: true,
                      maxCallsPerHour: 50,
                      maxCallsPerDay: 200,
                      maxConcurrentCalls: 5,
                      voicemailStrategy: 'leave_message',
                      disconnectedCallRetry: true,
                      busySignalRetry: true,
                      noAnswerRetry: true,
                      busyCustomerRetry: true,
                      voicemailMessage: '',
                      primaryGoal: 'book_test_drive',
                      secondaryActions: {
                        sendInventoryLink: false,
                        emailQuote: false,
                        textFinanceLink: false,
                      },
                      handoffSettings: {
                        target: 'round_robin',
                        businessHoursStart: '09:00',
                        businessHoursEnd: '17:00',
                      },
                      escalationTriggers: {
                        leadRequestsPerson: false,
                        complexFinancing: false,
                        pricingNegotiation: false,
                        technicalQuestions: false,
                      }
                    })
                    // Reset upload states
                    setUploadProgress(0)
                    setIsUploading(false)
                    setUploadComplete(false)
                    setHasError(false)

                    setCreatedCampaignId('')
                    setUploadedData([])
                    setIsLaunching(false)
                    setParseErrors([])
                    setMissingColumns([])
                    // Reset to first step
                    setCurrentStep(1)
                  }}
                  className="w-full h-11 px-4 text-[14px] bg-white hover:bg-gray-50 text-[#1A1A1A] border border-[#E5E7EB] rounded-lg font-medium"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Setup Another Campaign
                  </Button>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <div className="min-h-screen bg-[#F4F5F8] relative">
        {/* Vertical Stepper Sidebar - Fixed on Left */}
        <div className="fixed left-0 top-0 w-64 h-full bg-white border-r border-[#E5E7EB] p-6 z-10 overflow-y-auto">
          <div className="space-y-8">
            <div>
              <h3 className="text-[20px] font-semibold text-[#1A1A1A] mb-6 leading-[1.4]">Setup Progress</h3>
              <div className="flex flex-col space-y-6">
                {getSteps(selectedCategory || 'sales').map((step, index) => (
                  <div key={step.id} className="flex items-start min-w-0 flex-shrink-0">
                    <div className="flex flex-col items-center mr-4">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                        currentStep > step.id 
                          ? 'bg-[#22C55E] text-white' 
                          : currentStep === step.id
                          ? 'bg-[#4600F2] text-white'
                          : 'bg-[#E5E7EB] text-[#6B7280]'
                      }`}>
                        {currentStep > step.id ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <span className="text-[14px] font-semibold">{step.number}</span>
                        )}
                      </div>
                                             {index < getSteps(selectedCategory || 'sales').length - 1 && (
                        <div className={`w-0.5 h-12 mt-4 ${
                          currentStep > step.id ? 'bg-[#22C55E]' : 'bg-[#E5E7EB]'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-[14px] font-medium whitespace-nowrap lg:whitespace-normal leading-[1.5] ${
                        currentStep >= step.id ? 'text-[#1A1A1A]' : 'text-[#6B7280]'
                      }`}>
                        {step.name}
                      </h4>
                      <p className={`text-[12px] mt-1 leading-[1.5] ${
                        currentStep > step.id 
                          ? 'text-[#22C55E]' 
                          : currentStep === step.id
                          ? 'text-[#4600F2]'
                          : 'text-[#6B7280]'
                      }`}>
                        {currentStep > step.id 
                          ? 'Completed' 
                          : currentStep === step.id
                          ? 'In Progress'
                          : 'Pending'
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area - Scrollable on Right */}
        <div className="ml-64 min-h-screen bg-[#F4F5F8]">
          {/* Content - Scrollable */}
          <div className="px-12 py-8 pb-20 min-h-full overflow-hidden">
            {renderStepContent()}
          </div>
        </div>

        {/* Sticky Navigation - Outside main content for proper positioning */}
        {currentStep < (selectedCategory === 'sales' ? 6 : 4) && (
          <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-[#E5E7EB] z-50 shadow-lg px-6 py-4">
              <div className="flex justify-between items-center">
                {/* Cancel Button - Left Side */}
                <Button
                  onClick={handleCancel}
                  variant="ghost"
                  size="lg"
                  className="h-11 px-4 text-[14px] text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#374151] rounded-lg font-medium"
                >
                  <X className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline">Cancel</span>
                </Button>

                {/* Navigation Buttons - Right Side */}
                <div className="flex items-center space-x-3">
                  {currentStep > 1 && (
                    <Button
                      onClick={prevStep}
                      variant="outline"
                      size="lg"
                      className="h-11 px-4 text-[14px] border-[#E5E7EB] text-[#6B7280] hover:bg-[#4600F214] rounded-lg font-medium"
                    >
                      <ArrowLeft className="h-5 w-5 mr-2" />
                      <span className="hidden sm:inline">Back</span>
                    </Button>
                  )}
                  <Button
                    onClick={nextStep}
                    disabled={isLaunching}
                    size="lg"
                    className="h-11 px-4 text-[14px] bg-[#4600F2] hover:bg-[#4600F2]/90 text-white rounded-lg font-medium"
                  >
                    {isLaunching ? 'Starting...' : ((selectedCategory === 'service' && currentStep === 3) || (selectedCategory === 'sales' && currentStep === 4)) ? 'Start Campaign' : 'Continue'}
                    {isLaunching ? (
                      <div className="animate-spin h-5 w-5 ml-2 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <ArrowRight className="h-5 w-5 ml-2" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
      </div>
      <Toaster />
    </div>
  )
}
