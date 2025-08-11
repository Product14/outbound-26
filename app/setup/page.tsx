'use client'

import { useState, useEffect, useRef } from 'react'
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
import { ArrowRight, ArrowLeft, Upload, FileText, Calendar, CheckCircle, Download, AlertCircle, Zap, Clock, Users, Database, Plus, X, TrendingUp, Wrench, Play, Pause, MessageSquare, Shield } from 'lucide-react'
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { cn } from "@/lib/utils"
import { BarChart3 } from 'lucide-react'
import confetti from 'canvas-confetti'
import { extractUrlParams, buildUrlWithParams, type UrlParams } from '@/lib/url-utils'
import { transformCampaignData, launchCampaign, type Customer } from '@/lib/campaign-api'
import { parseUploadedFile, REQUIRED_CSV_COLUMNS, type ParsedCustomerData } from '@/lib/file-parser'
import { fetchAgentList, type Agent } from '@/lib/agent-api'
import { useToast } from "@/hooks/use-toast"
import { calculateAndFormatEstimatedTime, getShortEstimatedTime } from '@/lib/time-utils'

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



const steps = [
  { id: 1, name: 'Campaign Details', number: '01' },
  { id: 2, name: 'File Upload', number: '02' },
  { id: 3, name: 'Review & Schedule', number: '03' },
  { id: 4, name: 'Campaign Started', number: '04' }
]

const useCases: UseCases = {
  sales: {
    label: 'Sales',
    color: 'bg-green-lighter text-green-darker border-green-8',
    disabled: false,
    subCases: [
      { value: 'lead-follow-up', label: 'Lead Follow-up', requiredFields: ['Customer Name', 'Phone', 'Lead Source', 'Interest Level'], disabled: false },
      { value: 'trade-in-offers', label: 'Trade-in Offers', requiredFields: ['Customer Name', 'Phone', 'Current Vehicle', 'Vehicle Year', 'Mileage'], disabled: false },
      { value: 'promotional-offers', label: 'Promotional Offers', requiredFields: ['Customer Name', 'Phone', 'Vehicle Interest', 'Budget Range'], disabled: false },
      { value: 'appointment-booking', label: 'Test Drive Appointment', requiredFields: ['Customer Name', 'Phone', 'Vehicle Interest', 'Preferred Time'], disabled: false }
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
    useCase: '',
    subUseCase: '',
    bcdDetails: '',
    fileName: '',
    schedule: 'now',
    scheduledDate: '',
    scheduledTime: '',
    totalRecords: 0,
    // Call Rules
    maxRetryAttempts: 3,
    retryDelayMinutes: 60,
    callWindowStart: '09:00',
    callWindowEnd: '17:00',
    timezone: 'America/New_York',
    doNotCallList: true,
    maxCallsPerHour: 50,
    maxCallsPerDay: 200,
    voicemailStrategy: 'leave_message',
    disconnectedCallRetry: true,
    busySignalRetry: true,
    noAnswerRetry: true,
    busyCustomerRetry: true,
    voicemailMessage: ''
  })
  
  // Calculate estimated time dynamically based on total records
  const estimatedTime = calculateAndFormatEstimatedTime(campaignData.totalRecords)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [createdCampaignId, setCreatedCampaignId] = useState('')
  const [urlParams, setUrlParams] = useState<UrlParams>({ enterprise_id: null, team_id: null, auth_key: null })
  const [uploadedData, setUploadedData] = useState<ParsedCustomerData[]>([])
  const [isLaunching, setIsLaunching] = useState(false)
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [missingColumns, setMissingColumns] = useState<string[]>([])
  
  // Agent state
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [isLoadingAgents, setIsLoadingAgents] = useState(false)
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
    scheduledTime: false
  })
  
  // Refs for scrolling to sections
  const campaignNameRef = useRef<HTMLDivElement | null>(null)
  
  // Function to download sample file
  const downloadSampleFile = () => {
    const link = document.createElement('a')
    link.href = '/csv-template.csv'
    link.download = 'sample-customer-data.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
    console.log('Extracted URL params:', params)
  }, [])

  // Fetch agents when recall notification is selected
  const loadAgents = async () => {
    console.log('loadAgents called with URL params:', urlParams)
    
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
      console.log('Fetching agents with params:', {
        enterpriseId: urlParams.enterprise_id,
        teamId: urlParams.team_id,
        agentUseCase: 'recall_notification',
        agentType: 'Service',
        agentCallType: 'outbound'
      })
      
      const agents = await fetchAgentList(
        urlParams.enterprise_id,
        urlParams.team_id,
        'recall_notification',
        'Service',
        'outbound'
      )
      
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
  }

  // Load agents when recall notification is selected and URL params are available
  useEffect(() => {
    if (campaignData.subUseCase === 'recall-notification' && urlParams.enterprise_id && urlParams.team_id) {
      loadAgents()
    } else {
      setAvailableAgents([])
      setSelectedAgent(null)
      setAgentError(null)
    }
  }, [campaignData.subUseCase, urlParams.enterprise_id, urlParams.team_id])

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
      
      // Parse the uploaded file
      const parseResult = await parseUploadedFile(file)
      console.log('Parse result:', parseResult)
      
      // Complete the progress
      clearInterval(progressInterval)
      setUploadProgress(100)
      setTimeout(() => {
        setIsUploading(false)
        
        if (parseResult.success) {
          console.log('File parsed successfully:', parseResult.totalRecords, 'records')
          setUploadComplete(true)
          setUploadedData(parseResult.data)
          setCampaignData(prev => ({ ...prev, totalRecords: parseResult.totalRecords }))
        } else {
          console.log('File parsing failed:', parseResult.errors)
          setHasError(true)
          setParseErrors(parseResult.errors)
          setMissingColumns(parseResult.missingColumns)
          setUploadedData([])
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
    let missingFields: string[] = []
    let scrollTarget: React.RefObject<HTMLDivElement | null> | null = null

    // Reset errors for current step
    if (step === 1) {
      newErrors.campaignName = false
      newErrors.useCase = false
      newErrors.subUseCase = false
      newErrors.agentSelection = false
    } else if (step === 2) {
      newErrors.fileUpload = false
    } else if (step === 3) {
      newErrors.scheduledDate = false
      newErrors.scheduledTime = false
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
      // Check agent selection for recall notifications
      if (campaignData.subUseCase === 'recall-notification' && !selectedAgent) {
        newErrors.agentSelection = true
        missingFields.push('Agent Selection')
        if (!scrollTarget) scrollTarget = agentSelectionRef
        isValid = false
      }
    } else if (step === 2) {
      if (!uploadComplete) {
        newErrors.fileUpload = true
        missingFields.push('File Upload')
        if (!scrollTarget) scrollTarget = fileUploadRef
        isValid = false
      }
    } else if (step === 3) {
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

  const nextStep = async () => {
    if (currentStep < 4) {
      // Validate current step before proceeding
      if (!validateStep(currentStep)) {
        return // Stop if validation fails
      }

      // If we're launching the campaign (moving from step 3 to 4), create and save the campaign
      if (currentStep === 3) {
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
    

    console.log('Using enterprise_id:', effectiveEnterpriseId, 'team_id:', effectiveTeamId)

    try {
      setIsLaunching(true)
      
      // Transform campaign data to the required payload format
      const agentId = selectedAgent?.id || "agent234" // Use selected agent ID or fallback
      const payload = transformCampaignData(
        { ...campaignData, uploadedData },
        effectiveEnterpriseId,
        effectiveTeamId,
        agentId
      )

      console.log('Launching campaign with payload:', payload)
      
      // Call the launch campaign API
      const response = await launchCampaign(payload)
      
      if (response.success) {
        // Create the new campaign object for local storage
        const campaignId = response.campaignId || `camp_${Date.now()}`
        const newCampaign = {
          id: campaignId,
          name: campaignData.campaignName,
          useCase: useCases[selectedCategory]?.label || selectedCategory,
          subUseCase: useCases[selectedCategory]?.subCases.find(sc => sc.value === campaignData.subUseCase)?.label || campaignData.subUseCase,
          status: campaignData.schedule === 'now' ? 'Running' : 'Scheduled',
          progress: campaignData.schedule === 'now' ? 0 : 0,
          eta: campaignData.schedule === 'now' ? estimatedTime : null,
          callsPlaced: 0,
          totalRecords: campaignData.totalRecords,
          answerRate: 0,
          appointmentsBooked: 0,
          successRate: 0,
          createdAt: new Date(),
          startedAt: campaignData.schedule === 'now' ? new Date() : null,
          scheduledFor: campaignData.schedule === 'scheduled' ? new Date(`${campaignData.scheduledDate}T${campaignData.scheduledTime}`) : null,
          fileName: campaignData.fileName,
          payload: payload // Store the API payload for reference
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
    return REQUIRED_CSV_COLUMNS
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
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-[#E5E7EB] focus:border-[#4600F2]'
                      }`}
                    />
                    {errors.campaignName && (
                      <p className="text-sm text-red-600 flex items-center mt-1">
                        <AlertCircle className="h-4 w-4 mr-1" />
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
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
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
                          {useCases[selectedCategory].subCases.map((subCase) => (
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
                                // Scroll to agent selection for recall notification
                                if (subCase.value === 'recall-notification') {
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
                        
                        {/* Information message for non-recall campaigns */}
                        {campaignData.subUseCase && campaignData.subUseCase !== 'recall-notification' && (
                          <div className="mt-4 p-4 bg-[#FACC15]/10 border border-[#FACC15] rounded-lg">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-[#FACC15] mt-0.5" />
                              </div>
                              <div>
                                <h4 className="text-[14px] font-medium text-[#1A1A1A]">Feature Not Enabled Yet</h4>
                                <p className="text-[14px] text-[#6B7280] leading-[1.5] mt-1">
                                  This campaign type is not enabled yet. Please contact your customer success manager for more information.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Agent Selection for Recall Notification */}
                {campaignData.subUseCase === 'recall-notification' && (
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
                          Select recall agent {errors.agentSelection && <span className="text-red-500">*</span>}
                        </h3>
                      </div>

                      {errors.agentSelection && (
                        <div className="flex items-center text-sm text-red-600">
                          <AlertCircle className="h-4 w-4 mr-1" />
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
                          <span className="text-[14px] text-[#6B7280]">No agents available for recall notifications</span>
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
                                        New York
                                      </span>
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-300">
                                        English
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Bottom Section: Call Statistics */}
                                <div className="flex justify-between">
                                  <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 flex-1 mr-2">
                                    <p className="text-xs text-gray-500 mb-1">Total Calls</p>
                                    <p className="text-base font-bold text-black">0</p>
                                  </div>
                                  <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 flex-1">
                                    <p className="text-xs text-gray-500 mb-1">Success Rate</p>
                                    <p className="text-base font-bold text-black">0%</p>
                                  </div>
                                </div>

                                {/* Talk to Agent Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // Handle talk to agent functionality
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
                  <h1 className="text-[24px] font-bold text-[#1A1A1A] leading-[1.4]">Upload Customer Data</h1>
                  <p className="text-[14px] text-[#6B7280] mt-2 leading-[1.5]">
                    Upload your customer data file to power your AI calling campaign with personalized outreach
                  </p>
                </div>
              </div>

              {campaignData.subUseCase && (
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
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={fileUploadRef} className={`bg-white border rounded-lg p-6 transition-colors ${
                errors.fileUpload ? 'border-red-500' : 'border-[#E5E7EB]'
              }`}>
                {errors.fileUpload && (
                  <div className="mb-4">
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
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
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <Button 
                        type="button"
                        className={`mt-2 h-9 px-3 text-[12px] rounded-lg font-medium ${
                          errors.fileUpload
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-[#4600F2] text-white hover:bg-[#4600F2]/90'
                        }`}
                        size="sm"
                        onClick={() => {
                          console.log('Browse Files button clicked')
                          document.getElementById('file-upload')?.click()
                        }}
                      >
                        Browse Files
                      </Button>
                      <Input
                        id="file-upload"
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
                  
                  {/* Download sample file CTA in the middle */}
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
                  <div className="flex items-center p-6 bg-[#22C55E]/10 border-2 border-[#22C55E] rounded-lg mb-6">
                    <CheckCircle className="h-6 w-6 text-[#22C55E] mr-4" />
                    <div>
                      <p className="font-semibold text-[#1A1A1A] text-[16px]">File uploaded successfully</p>
                      <p className="text-[#6B7280] text-[14px]">{campaignData.fileName} • {campaignData.totalRecords} rows detected</p>
                    </div>
                  </div>

                  {/* Complete Uploaded Data Preview - All 12 Columns */}
                  <div className="border border-[#E5E7EB] rounded-lg bg-white">
                    <div className="bg-[#F4F5F8] border-b border-[#E5E7EB] px-6 py-4">
                      <h3 className="text-[16px] font-semibold text-[#1A1A1A]">Uploaded Data Preview</h3>
                      <p className="text-[14px] text-[#6B7280]">All {uploadedData.length} rows with {REQUIRED_CSV_COLUMNS.length} columns uploaded successfully</p>
                    </div>
                    <div className="max-h-96 overflow-auto">
                      <table className="min-w-full divide-y divide-[#E5E7EB] text-[13px]">
                        <thead className="bg-[#F4F5F8] sticky top-0">
                          <tr>
                            <th className="px-2 py-3 text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap">
                              #
                            </th>
                            {REQUIRED_CSV_COLUMNS.map((field) => (
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
                              {REQUIRED_CSV_COLUMNS.map((field) => (
                                <td key={field} className="px-2 py-3 text-[#1A1A1A] max-w-[150px]">
                                  <div className="truncate" title={row[field as keyof typeof row]}>
                                    {row[field as keyof typeof row] || 'N/A'}
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
                        <span>Showing all {uploadedData.length} records with {REQUIRED_CSV_COLUMNS.length} required fields</span>
                        <span>Scroll horizontally to view all columns →</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {hasError && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-start p-6 bg-[#EF4444]/10 border-2 border-[#EF4444] rounded-lg">
                    <AlertCircle className="h-6 w-6 text-[#EF4444] mr-4 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-[#1A1A1A] text-[16px]">
                        {missingColumns.length > 0 ? 'Missing Required Columns' : 'File Validation Error'}
                      </p>
                      
                      {missingColumns.length > 0 && (
                        <div className="mb-4">
                          <p className="text-[#6B7280] text-[14px] mb-2">The following required columns are missing:</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {missingColumns.map((column) => (
                              <Badge key={column} variant="outline" className="border-[#EF4444] text-[#EF4444] bg-white">
                                {column}
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
                        onClick={() => {
                          // Download the CSV template
                          const link = document.createElement('a')
                          link.href = '/csv-template.csv'
                          link.download = 'campaign-template.csv'
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                          resetUpload()
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
                  <h1 className="text-[24px] font-bold text-[#1A1A1A] leading-[1.4]">Review & Schedule</h1>
                  <p className="text-[14px] text-[#6B7280] mt-2 leading-[1.5]">
                    Review your campaign details and schedule execution
                  </p>
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
                      <p className="text-[16px] font-bold text-[#1A1A1A]">{estimatedTime}</p>
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
                                      New York
                                    </span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-300">
                                      English
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Bottom Section: Call Statistics */}
                              <div className="flex justify-between">
                                <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 flex-1 mr-2">
                                  <p className="text-xs text-gray-500 mb-1">Total Calls</p>
                                  <p className="text-base font-bold text-black">0</p>
                                </div>
                                <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 flex-1">
                                  <p className="text-xs text-gray-500 mb-1">Success Rate</p>
                                  <p className="text-base font-bold text-black">0%</p>
                                </div>
                              </div>

                              {/* Talk to Agent Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Handle talk to agent functionality
                                }}
                                className="absolute bottom-3 left-3 right-3 bg-[#4600F2]/10 hover:bg-[#4600F2]/15 text-[#4600F2] font-medium py-3 px-4 transition-colors text-sm font-semibold rounded-lg"
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
                    <p className="text-sm text-red-600 flex items-center mt-2">
                      <AlertCircle className="h-4 w-4 mr-1" />
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
                            <Input
                              id="date"
                              type="date"
                              value={campaignData.scheduledDate}
                              onChange={(e) => {
                                setCampaignData(prev => ({ ...prev, scheduledDate: e.target.value }))
                                if (errors.scheduledDate && e.target.value) {
                                  setErrors(prev => ({ ...prev, scheduledDate: false }))
                                }
                              }}
                              className={`h-10 text-[14px] border-[#E5E7EB] focus:border-[#4600F2] focus:ring-[#4600F2] transition-colors ${
                                errors.scheduledDate 
                                  ? 'border-red-500 focus:border-red-500' 
                                  : ''
                              }`}
                            />
                            {errors.scheduledDate && (
                              <p className="text-sm text-red-600 flex items-center mt-1">
                                <AlertCircle className="h-4 w-4 mr-1" />
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
                            <Input
                              id="time"
                              type="time"
                              value={campaignData.scheduledTime}
                              onChange={(e) => {
                                setCampaignData(prev => ({ ...prev, scheduledTime: e.target.value }))
                                if (errors.scheduledTime && e.target.value) {
                                  setErrors(prev => ({ ...prev, scheduledTime: false }))
                                }
                              }}
                              className={`h-10 text-[14px] border-[#E5E7EB] focus:border-[#4600F2] focus:ring-[#4600F2] transition-colors ${
                                errors.scheduledTime 
                                  ? 'border-red-500 focus:border-red-500' 
                                  : ''
                              }`}
                            />
                            {errors.scheduledTime && (
                              <p className="text-sm text-red-600 flex items-center mt-1">
                                <AlertCircle className="h-4 w-4 mr-1" />
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

              {/* Call Rules Section */}
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
                              <SelectItem value="1440">24 hours</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Voicemail Strategy - Moved below retry settings */}
                  <div className="mt-10">
                    <h4 className="text-[16px] font-semibold text-[#1A1A1A] mb-4">
                      Voicemail Strategy
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <Select
                          value={campaignData.voicemailStrategy}
                          onValueChange={(value) => setCampaignData(prev => ({ ...prev, voicemailStrategy: value }))}
                        >
                          <SelectTrigger className="h-10 text-[14px] border-[#E5E7EB] focus:border-[#4600F2]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="leave_message">Leave voicemail message</SelectItem>
                            <SelectItem value="hang_up">Hang up immediately</SelectItem>
                            <SelectItem value="retry_later">Retry later without voicemail</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {campaignData.voicemailStrategy === 'leave_message' && (
                        <div>
                          <Label htmlFor="voicemailMessage" className="text-[14px] font-medium text-[#1A1A1A]/60 mb-2 block">
                            Voicemail Message
                          </Label>
                          <Textarea
                            id="voicemailMessage"
                            placeholder="Enter your custom voicemail message..."
                            value={campaignData.voicemailMessage || "Hi, this is [Company Name] calling about an important safety recall for your vehicle. This is a free service to ensure your safety. Please call us back at [Phone Number] as soon as possible to schedule your free recall repair. Your safety is our top priority. Thank you."}
                            onChange={(e) => setCampaignData(prev => ({ ...prev, voicemailMessage: e.target.value }))}
                            className="min-h-[100px] text-[14px] border-[#E5E7EB] focus:border-[#4600F2] focus:ring-[#4600F2] resize-none"
                          />
                          <p className="text-[12px] text-[#6B7280] mt-1">
                            This message will be left when the AI agent reaches voicemail
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
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
                      {campaignData.schedule === 'now' ? 'Expected Completion' : 'Scheduled Start'}
                    </p>
                    <p className="text-[16px] text-[#1A1A1A]">
                      {campaignData.schedule === 'now' ? estimatedTime : `${campaignData.scheduledDate} at ${campaignData.scheduledTime}`}
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
                    // Reset all campaign data
                    setCampaignData({
                      campaignName: '',
                      useCase: '',
                      subUseCase: '',
                      bcdDetails: '',
                      fileName: '',
                      schedule: 'now',
                      scheduledDate: '',
                      scheduledTime: '',
                      totalRecords: 0,
                      // Call Rules
                      maxRetryAttempts: 3,
                      retryDelayMinutes: 60,
                      callWindowStart: '09:00',
                      callWindowEnd: '17:00',
                      timezone: 'America/New_York',
                      doNotCallList: true,
                      maxCallsPerHour: 50,
                      maxCallsPerDay: 200,
                      voicemailStrategy: 'leave_message',
                      voicemailMessage: '',
                      disconnectedCallRetry: true,
                      busySignalRetry: true,
                      noAnswerRetry: true,
                      busyCustomerRetry: true
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
                {steps.map((step, index) => (
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
                      {index < steps.length - 1 && (
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
          <div className="px-12 py-8 pb-20 min-h-full">
            {renderStepContent()}
          </div>
        </div>

        {/* Sticky Navigation - Outside main content for proper positioning */}
        {currentStep < 4 && (
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
                    disabled={
                      (currentStep === 1 && (!campaignData.campaignName || !selectedCategory || !campaignData.subUseCase || (campaignData.subUseCase === 'recall-notification' && !selectedAgent))) ||
                      (currentStep === 2 && !uploadComplete) ||
                      (currentStep === 3 && campaignData.schedule === 'scheduled' && (!campaignData.scheduledDate || !campaignData.scheduledTime)) ||
                      isLaunching
                    }
                    size="lg"
                    className="h-11 px-4 text-[14px] bg-[#4600F2] hover:bg-[#4600F2]/90 text-white rounded-lg font-medium"
                  >
                    {isLaunching ? 'Launching...' : currentStep === 3 ? 'Launch Campaign' : 'Continue'}
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
