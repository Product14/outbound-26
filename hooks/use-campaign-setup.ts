'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from "@/hooks/use-toast"
import { CampaignData, ValidationErrors } from '@/types/campaign-setup'
import { extractUrlParams, type UrlParams } from '@/lib/url-utils'
import { ParsedCustomerData, type ParseResult } from '@/lib/file-parser'
import { Agent } from '@/lib/agent-api'
import { CampaignTypesResponse } from '@/lib/campaign-api'

const initialCampaignData: CampaignData = {
  campaignName: '',
  useCase: 'sales',
  subUseCase: '',
  bcdDetails: '',
  fileName: '',
  schedule: 'now',
  scheduledDate: '',
  scheduledEndDate: '',
  scheduledTime: '',
  dailyStartTime: '09:00',
  dailyEndTime: '17:00',
  dailyTimeSlots: [
    { id: '1', startTime: '09:00', endTime: '17:00' }
  ],
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
  maxRetryAttempts: 1,
  retryDelayMinutes: 60,
  callWindowStart: '09:00',
  callWindowEnd: '17:00',
  timezone: 'America/New_York',
  doNotCallList: true,
  maxCallsPerHour: 50,
  maxCallsPerDay: 200,
  maxConcurrentCalls: 5,
  voicemailStrategy: 'leave_message',
  busySignalRetry: false,
  noAnswerRetry: true,
  busyCustomerRetry: false,
  smsSwitchOnSecondAttempt: false,
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
}

const initialErrors: ValidationErrors = {
  campaignName: false,
  useCase: false,
  subUseCase: false,
  agentSelection: false,
  fileUpload: false,
  scheduledDate: false,
  scheduledEndDate: false,
  dailyStartTime: false,
  dailyEndTime: false,
  callWindowStart: false,
  callWindowEnd: false,
  handoffBusinessHoursStart: false,
  handoffBusinessHoursEnd: false,
  crmSelection: false,
  googleDriveLink: false,
  vinSolutionsDateRange: false,
  leadAgeDays: false,
  communicationChannels: false,
  campaignSummary: false,
  scheduleCampaign: false,
  voicemailStrategy: false,
  retrySettings: false,
  retryScenarios: false,
}

export function useCampaignSetup() {
  const router = useRouter()
  const { toast } = useToast()
  
  // Core state
  const [currentStep, setCurrentStep] = useState(1)
  const [campaignData, setCampaignData] = useState<CampaignData>(initialCampaignData)
  const [selectedCategory, setSelectedCategory] = useState<string>('sales')
  const [errors, setErrors] = useState<ValidationErrors>(initialErrors)
  const [urlParams, setUrlParams] = useState<UrlParams>({ 
    enterprise_id: null, 
    team_id: null, 
    auth_key: null,
    tab: null,
    callDetailsTab: null,
    selectedCall: null
  })
  
  // Upload states
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [uploadedData, setUploadedData] = useState<ParsedCustomerData[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [missingColumns, setMissingColumns] = useState<string[]>([])
  
  // Sales upload options state
  const [selectedUploadOption, setSelectedUploadOption] = useState<string>('')
  const [crmSelection, setCrmSelection] = useState<string>('')
  const [googleDriveLink, setGoogleDriveLink] = useState<string>('')
  
  // VinSolutions state
  const [vinSolutionsStartDate, setVinSolutionsStartDate] = useState<string>('')
  const [vinSolutionsEndDate, setVinSolutionsEndDate] = useState<string>('')
  const [vinSolutionsStartTime, setVinSolutionsStartTime] = useState<string>('')
  const [vinSolutionsEndTime, setVinSolutionsEndTime] = useState<string>('')
  const [enableRecurringLeads, setEnableRecurringLeads] = useState<boolean>(false)
  const [leadAgeDays, setLeadAgeDays] = useState<number>(10)
  
  // Google Drive state
  const [isGoogleDriveLoading, setIsGoogleDriveLoading] = useState<boolean>(false)
  const [googleDriveData, setGoogleDriveData] = useState<ParsedCustomerData[]>([])
  const [googleDriveComplete, setGoogleDriveComplete] = useState<boolean>(false)
  const [googleDriveErrors, setGoogleDriveErrors] = useState<string[]>([])
  
  // Agent state
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [isLoadingAgents, setIsLoadingAgents] = useState(false)
  const [agentError, setAgentError] = useState<string | null>(null)
  
  // API integration state
  const [campaignTypes, setCampaignTypes] = useState<CampaignTypesResponse | null>(null)
  const [isLoadingCampaignTypes, setIsLoadingCampaignTypes] = useState(false)
  const [storedCampaignId, setStoredCampaignId] = useState<string | null>(null)
  const [requiredKeys, setRequiredKeys] = useState<string[]>([])
  const [keyMapping, setKeyMapping] = useState<Record<string, string> | null>(null)
  const [isProcessingKeyMapping, setIsProcessingKeyMapping] = useState(false)
  
  // CSV mapping system state
  const [showCSVMappingStep, setShowCSVMappingStep] = useState(false)
  const [csvParseResult, setCsvParseResult] = useState<ParseResult | null>(null)
  const [csvMappingComplete, setCsvMappingComplete] = useState(false)
  
  // Other states
  const [createdCampaignId, setCreatedCampaignId] = useState('')
  const [isLaunching, setIsLaunching] = useState(false)
  const [playingAgentId, setPlayingAgentId] = useState<string | null>(null)
  const [isPageLoaded, setIsPageLoaded] = useState(false)
  const [isStepTransitioning, setIsStepTransitioning] = useState(false)

  // Extract URL parameters on component mount
  useEffect(() => {
    const params = extractUrlParams()
    setUrlParams(params)
    
    // Restore selected category from URL tab parameter
    if (params.tab && ['sales', 'service'].includes(params.tab)) {
      setSelectedCategory(params.tab)
      setCampaignData(prev => ({ 
        ...prev, 
        useCase: params.tab || 'sales', 
        subUseCase: '' 
      }))
    }
  }, [])

  // Page entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoaded(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Reset upload function
  const resetUpload = useCallback(() => {
    setIsUploading(false)
    setUploadComplete(false)
    setHasError(false)
    setUploadProgress(0)
    setUploadedData([])
    setParseErrors([])
    setMissingColumns([])
    setCampaignData(prev => ({ ...prev, fileName: '', totalRecords: 0 }))
  }, [])

  // Start fresh campaign function
  const startFreshCampaign = useCallback(() => {
    setCampaignData(initialCampaignData)
    setCurrentStep(1)
    setSelectedAgent(null)
    setUploadedData([])
    setUploadComplete(false)
    setHasError(false)
    setErrors(initialErrors)
    setShowCSVMappingStep(false)
    setCsvParseResult(null)
    setCsvMappingComplete(false)
    setKeyMapping(null)
    setRequiredKeys([])
    setStoredCampaignId(null)
    
    toast({
      title: "Campaign Reset",
      description: "Starting fresh campaign setup.",
    })
  }, [toast])

  return {
    // Core state
    currentStep,
    setCurrentStep,
    campaignData,
    setCampaignData,
    selectedCategory,
    setSelectedCategory,
    errors,
    setErrors,
    urlParams,
    
    // Upload states
    uploadProgress,
    setUploadProgress,
    isUploading,
    setIsUploading,
    uploadComplete,
    setUploadComplete,
    hasError,
    setHasError,
    uploadedData,
    setUploadedData,
    parseErrors,
    setParseErrors,
    missingColumns,
    setMissingColumns,
    
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
    setIsGoogleDriveLoading,
    googleDriveData,
    setGoogleDriveData,
    googleDriveComplete,
    setGoogleDriveComplete,
    googleDriveErrors,
    setGoogleDriveErrors,
    
    // Agent state
    availableAgents,
    setAvailableAgents,
    selectedAgent,
    setSelectedAgent,
    isLoadingAgents,
    setIsLoadingAgents,
    agentError,
    setAgentError,
    
    // API integration state
    campaignTypes,
    setCampaignTypes,
    isLoadingCampaignTypes,
    setIsLoadingCampaignTypes,
    storedCampaignId,
    setStoredCampaignId,
    requiredKeys,
    setRequiredKeys,
    keyMapping,
    setKeyMapping,
    isProcessingKeyMapping,
    setIsProcessingKeyMapping,
    
    // CSV mapping system state
    showCSVMappingStep,
    setShowCSVMappingStep,
    csvParseResult,
    setCsvParseResult,
    csvMappingComplete,
    setCsvMappingComplete,
    
    // Other states
    createdCampaignId,
    setCreatedCampaignId,
    isLaunching,
    setIsLaunching,
    playingAgentId,
    setPlayingAgentId,
    isPageLoaded,
    isStepTransitioning,
    setIsStepTransitioning,
    
    // Utility functions
    resetUpload,
    startFreshCampaign,
    
    // React hooks
    router,
    toast,
  }
}
