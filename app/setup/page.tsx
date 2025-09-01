'use client'

import { useEffect, useCallback } from 'react'
import { Toaster } from "@/components/ui/toaster"
import confetti from 'canvas-confetti'
import { useCampaignSetup } from '@/hooks/use-campaign-setup'
import { useCampaignValidation } from '@/hooks/use-campaign-validation'
import { getSteps } from '@/utils/campaign-setup-utils'
import { CampaignData } from '@/types/campaign-setup'
import { parseUploadedFile } from '@/lib/file-parser'
import { fetchAgentList } from '@/lib/agent-api'
import { fetchCampaignTypes, transformCampaignData, launchCampaign } from '@/lib/campaign-api'
import { storeCampaignData, updateKeyMapping, updateUploadedData } from '@/lib/storage-utils'
import { getEstimatedTimeInMinutes, calculateEndDate, calculateAndFormatTimeRange } from '@/lib/time-utils'
import { validateGoogleDriveLink, convertToDirectDownloadLink, getRequiredKeysForUseCase, getDisplayColumns } from '@/utils/campaign-setup-utils'

// Import step components
import Step1CampaignDetails from '@/components/campaign-setup/Step1CampaignDetails'
import Step2FileUpload from '@/components/campaign-setup/Step2FileUpload'
import Step3CallSettings from '@/components/campaign-setup/Step3CallSettings'
import Step4HandoffSettings from '@/components/campaign-setup/Step4HandoffSettings'
import Step5CampaignSuccess from '@/components/campaign-setup/Step5CampaignSuccess'
import StepperSidebar from '@/components/campaign-setup/StepperSidebar'
import StepNavigation from '@/components/campaign-setup/StepNavigation'

export default function CampaignSetupRefactored() {
  // Use the custom hook for state management
  const setupState = useCampaignSetup()
  const {
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
    
    // Utility functions
    resetUpload,
    startFreshCampaign,
    
    // React hooks
    router,
    toast,
  } = setupState

  // Use validation hook
  const { validateCurrentStep, isContinueDisabled } = useCampaignValidation({
    campaignData,
    selectedCategory,
    selectedAgent,
    selectedUploadOption,
    crmSelection,
    enableRecurringLeads,
    leadAgeDays,
    vinSolutionsStartDate,
    vinSolutionsEndDate,
    vinSolutionsStartTime,
    vinSolutionsEndTime,
    googleDriveLink,
    googleDriveComplete,
    uploadComplete,
    csvMappingComplete,
    missingColumns,
    errors,
    setErrors
  })

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
  }, [setCampaignTypes, setIsLoadingCampaignTypes, toast])

  // Load agents when any use case is selected and URL params are available
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
      
      // Use the selected sub use case directly - fetchAgentList will handle the conversion to snake_case
      let agentUseCase = campaignData.subUseCase
      
      // First try to get outbound agents for the specific use case
      let agents = await fetchAgentList(
        urlParams.enterprise_id,
        urlParams.team_id,
        agentUseCase,
        agentType,
        'outbound'
      )
      
      // If no outbound agents found, try to get any agents for the use case (but still respect use case filter)
      if (!agents || agents.length === 0) {
        console.log(`No outbound agents found for use case: ${agentUseCase}, trying all call types for this use case`)
        agents = await fetchAgentList(
          urlParams.enterprise_id,
          urlParams.team_id,
          agentUseCase,
          agentType,
          undefined // Don't filter by call type, but keep use case filter
        )
      }
      
      // Only fall back to all agents if no use case is specified
      // This preserves accurate use case filtering while providing fallback for development/testing
      if ((!agents || agents.length === 0) && !agentUseCase) {
        console.log(`No agents found and no use case specified, getting all agents for type: ${agentType}`)
        agents = await fetchAgentList(
          urlParams.enterprise_id,
          urlParams.team_id,
          undefined, // Don't filter by use case
          agentType,
          undefined // Don't filter by call type
        )
      }
      
      setAvailableAgents(agents)
      
      // Auto-select the first available agent if any
      if (agents.length > 0 && agents[0].available) {
        setSelectedAgent(agents[0])
      } else if (agentUseCase && agents.length === 0) {
        // Show specific message when no agents exist for the selected use case
        setAgentError(`No agents are configured for the "${agentUseCase}" use case. Please select a different use case or contact your administrator to configure agents for this use case.`)
      }
    } catch (error) {
      console.error('Error loading agents:', error)
      setAgentError(`Failed to load agents: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoadingAgents(false)
    }
  }, [urlParams, selectedCategory, campaignData.subUseCase, setIsLoadingAgents, setAgentError, setAvailableAgents, setSelectedAgent])

  useEffect(() => {
    if (campaignData.subUseCase && urlParams.enterprise_id && urlParams.team_id) {
      loadAgents()
    } else {
      setAvailableAgents([])
      setSelectedAgent(null)
      setAgentError(null)
    }
  }, [campaignData.subUseCase, urlParams.enterprise_id, urlParams.team_id, loadAgents, setAvailableAgents, setSelectedAgent, setAgentError])

  // File upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('File upload started:', file.name, file.type, file.size)

    setIsUploading(true)
    setHasError(false)
    setUploadComplete(false)
    setParseErrors([])
    setCsvMappingComplete(false) // Reset CSV mapping completion when uploading new file
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
      // Get API required keys for dynamic validation
      const apiRequiredKeys = getRequiredKeysForUseCase(campaignData.subUseCase, selectedCategory, campaignTypes)
      
      // Parse the uploaded file with dynamic required columns
      const parseResult = await parseUploadedFile(file, apiRequiredKeys.length > 0 ? apiRequiredKeys : undefined)
      
      // Complete the progress
      clearInterval(progressInterval)
      setUploadProgress(100)
      setTimeout(async () => {
        setIsUploading(false)
        
        // File parsing is now always successful if we have data
        if (parseResult.data && parseResult.data.length > 0) {
          setUploadedData(parseResult.data)
          setCampaignData(prev => ({ ...prev, totalRecords: parseResult.totalRecords }))
          setCsvParseResult(parseResult)
          
          // Always use the new CSV mapping system for better UX
          setShowCSVMappingStep(true)
          setUploadComplete(true) // Still set this to show the file was processed
        } else {
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

  // Google Drive data fetcher
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
      const apiRequiredKeys = getRequiredKeysForUseCase(campaignData.subUseCase, selectedCategory, campaignTypes)
      const parsedData = await parseUploadedFile(csvFile, apiRequiredKeys.length > 0 ? apiRequiredKeys : undefined)
      
      // Set the parsed data initially
      setGoogleDriveData(parsedData.data)
      setCampaignData(prev => ({ ...prev, totalRecords: parsedData.data.length }))
      
      // Always use new mapping system for Google Drive data
      setUploadedData(parsedData.data)
      setCsvParseResult(parsedData)
      setShowCSVMappingStep(true)
      
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

  // Handle CSV mapping completion
  const handleCSVMappingComplete = async (mappedData: any[], keyMappingResult: Record<string, string>) => {
    console.log('📥 Setup page - CSV mapping completed:', { mappedData, keyMapping: keyMappingResult })
    
    // Update the uploaded data with mapped data
    setUploadedData(mappedData)
    setKeyMapping(keyMappingResult)
    
    // Hide the mapping step
    setShowCSVMappingStep(false)
    
    // Mark CSV mapping as complete
    setCsvMappingComplete(true)
    
    // Continue with traditional flow if needed
    if (mappedData.length > 0) {
      // Update campaign data
      setCampaignData(prev => ({ ...prev, totalRecords: mappedData.length }))
    }
  }

  // Handle skipping CSV mapping (not used in new system)
  const handleSkipCSVMapping = async () => {
    console.log('Skip mapping called - this should not happen anymore')
  }

  // Get display columns
  const getDisplayColumnsForCurrentState = () => {
    return getDisplayColumns(
      csvMappingComplete,
      uploadedData,
      campaignData.subUseCase,
      selectedCategory,
      campaignTypes
    )
  }

  // Handle campaign launch
  const handleLaunchCampaign = async () => {
    if (!urlParams.enterprise_id || !urlParams.team_id) {
      console.error('Please set enterprise_id and team_id in the URL')
      return
    }
    
    try {
      setIsLaunching(true)
      
      // Transform campaign data to the required payload format
      const agentId = selectedAgent?.id
      
      // Use Google Drive data if available, otherwise use uploaded file data
      const effectiveUploadedData = selectedUploadOption === 'drive' && googleDriveComplete 
        ? googleDriveData 
        : uploadedData
        
      const cleanCampaignData: CampaignData = {
        ...campaignData,
        uploadedData: effectiveUploadedData,
        // Exclude script template data to avoid template evaluation errors
        scriptTemplate: {
          voiceIntroduction: '',
          corePitch: '',
          objectionHandling: '',
          legalConsent: '',
          optOut: '',
          handoffOffer: '',
        },
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
      
      const payload = transformCampaignData(
        cleanCampaignData,
        urlParams.enterprise_id,
        urlParams.team_id,
        agentId,
        storedCampaignId || undefined
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
          ? new Date(`${campaignData.scheduledEndDate}T23:59:59`)
          : calculateEndDate(startDate, campaignData.totalRecords)
        
        const newCampaign = {
          id: campaignId,
          name: campaignData.campaignName,
          useCase: selectedCategory,
          subUseCase: campaignData.subUseCase,
          status: campaignData.schedule === 'now' ? 'Running' : 'Scheduled',
          progress: campaignData.schedule === 'now' ? 0 : 0,
          eta: campaignData.schedule === 'now' ? calculateAndFormatTimeRange(new Date(), campaignData.totalRecords) : null,
          callsPlaced: 0,
          totalRecords: campaignData.totalRecords,
          answerRate: 0,
          appointmentsBooked: 0,
          successRate: 0,
          createdAt: new Date(),
          startDate: startDate,
          endDate: endDate,
          completedAt: null,
          startedAt: campaignData.schedule === 'now' ? new Date() : null,
          scheduledFor: campaignData.schedule === 'scheduled' ? startDate : null,
          fileName: campaignData.fileName,
          payload: payload,
          scriptTemplate: campaignData.scriptTemplate
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

  // Navigation handlers
  const handleNextStep = async () => {
    const maxStep = selectedCategory === 'sales' ? 5 : 4
    
    if (currentStep < maxStep) {
      // Validate current step before proceeding
      if (!validateCurrentStep(currentStep)) {
        return // Stop if validation fails
      }

      // Store initial campaign data after step 1 (Campaign Details) if agent is selected
      if (currentStep === 1 && selectedAgent) {
        // Store campaign data locally without API call
        storeCampaignData({
          campaignName: campaignData.campaignName,
          useCase: selectedCategory,
          subUseCase: campaignData.subUseCase,
          selectedAgent: selectedAgent.id,
          teamAgentMappingId: selectedAgent.id,
          enterpriseId: urlParams.enterprise_id!,
          teamId: urlParams.team_id!
        })
      }

      // If we're launching the campaign (moving from step 3 to 4 for service, or step 4 to 5 for sales), create and save the campaign
      if ((selectedCategory === 'service' && currentStep === 3) || (selectedCategory === 'sales' && currentStep === 4)) {
        await handleLaunchCampaign()
      } else {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCancel = () => {
    router.push('/results')
  }

  // Check if continue is disabled
  const isContinueDisabledCheck = () => {
    // For step 2 (Upload Customer Data), check CSV validation
    if (currentStep === 2) {
      if (selectedCategory === 'sales') {
        // For sales, check if upload method is selected and if file upload is complete
        if (selectedUploadOption === 'upload') {
          return !uploadComplete || !csvMappingComplete
        }
        // For other upload options (CRM, Google Drive), use existing validation
        return false
      } else {
        // For service, file upload and CSV mapping must be complete
        return !uploadComplete || !csvMappingComplete
      }
    }
    
    return isLaunching
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1CampaignDetails
            campaignData={campaignData}
            setCampaignData={setCampaignData}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            errors={errors}
            setErrors={setErrors}
            availableAgents={availableAgents}
            selectedAgent={selectedAgent}
            setSelectedAgent={setSelectedAgent}
            isLoadingAgents={isLoadingAgents}
            agentError={agentError}
            campaignTypes={campaignTypes}
          />
        )

      case 2:
        return (
          <Step2FileUpload
            campaignData={campaignData}
            setCampaignData={setCampaignData}
            selectedCategory={selectedCategory}
            errors={errors}
            setErrors={setErrors}
            
            // Upload states
            uploadProgress={uploadProgress}
            isUploading={isUploading}
            uploadComplete={uploadComplete}
            hasError={hasError}
            uploadedData={uploadedData}
            parseErrors={parseErrors}
            missingColumns={missingColumns}
            
            // Sales upload options
            selectedUploadOption={selectedUploadOption}
            setSelectedUploadOption={setSelectedUploadOption}
            crmSelection={crmSelection}
            setCrmSelection={setCrmSelection}
            googleDriveLink={googleDriveLink}
            setGoogleDriveLink={setGoogleDriveLink}
            
            // VinSolutions state
            vinSolutionsStartDate={vinSolutionsStartDate}
            setVinSolutionsStartDate={setVinSolutionsStartDate}
            vinSolutionsEndDate={vinSolutionsEndDate}
            setVinSolutionsEndDate={setVinSolutionsEndDate}
            vinSolutionsStartTime={vinSolutionsStartTime}
            setVinSolutionsStartTime={setVinSolutionsStartTime}
            vinSolutionsEndTime={vinSolutionsEndTime}
            setVinSolutionsEndTime={setVinSolutionsEndTime}
            enableRecurringLeads={enableRecurringLeads}
            setEnableRecurringLeads={setEnableRecurringLeads}
            leadAgeDays={leadAgeDays}
            setLeadAgeDays={setLeadAgeDays}
            
            // Google Drive state
            isGoogleDriveLoading={isGoogleDriveLoading}
            googleDriveData={googleDriveData}
            googleDriveComplete={googleDriveComplete}
            googleDriveErrors={googleDriveErrors}
            
            // CSV mapping
            showCSVMappingStep={showCSVMappingStep}
            csvParseResult={csvParseResult}
            csvMappingComplete={csvMappingComplete}
            setCsvMappingComplete={setCsvMappingComplete}
            keyMapping={keyMapping}
            isProcessingKeyMapping={isProcessingKeyMapping}
            
            // Campaign types
            campaignTypes={campaignTypes}
            
            // Handlers
            handleFileUpload={handleFileUpload}
            fetchGoogleDriveData={fetchGoogleDriveData}
            handleCSVMappingComplete={handleCSVMappingComplete}
            handleSkipCSVMapping={handleSkipCSVMapping}
            getDisplayColumns={getDisplayColumnsForCurrentState}
          />
        )

      case 3:
        return (
          <Step3CallSettings
            campaignData={campaignData}
            setCampaignData={setCampaignData}
            selectedCategory={selectedCategory}
            selectedAgent={selectedAgent}
            errors={errors}
            setErrors={setErrors}
            campaignTypes={campaignTypes}
          />
        )

      case 4:
        // For service use case, step 4 is "Start Campaign", for sales it's "Handoff Settings"
        if (selectedCategory === 'service') {
          return (
            <Step5CampaignSuccess
              campaignData={campaignData}
              setCampaignData={setCampaignData}
              createdCampaignId={createdCampaignId}
              startFreshCampaign={startFreshCampaign}
            />
          )
        }
        
        // Sales use case - show handoff settings
        return (
          <Step4HandoffSettings
            campaignData={campaignData}
            setCampaignData={setCampaignData}
            selectedCategory={selectedCategory}
            errors={errors}
            setErrors={setErrors}
          />
        )

      case 5:
        return (
          <Step5CampaignSuccess
            campaignData={campaignData}
            setCampaignData={setCampaignData}
            createdCampaignId={createdCampaignId}
            startFreshCampaign={startFreshCampaign}
          />
        )

      default:
        return (
          <div className="max-w-3xl">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Step {currentStep}</h2>
              <p className="text-gray-600">Invalid step number.</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <div className="min-h-screen bg-[#F4F5F8] relative">
        {/* Vertical Stepper Sidebar - Fixed on Left */}
        <StepperSidebar 
          steps={getSteps(selectedCategory || 'sales')} 
          currentStep={currentStep} 
        />

        {/* Main Content Area - Scrollable on Right */}
        <div className="ml-64 min-h-screen bg-[#F4F5F8]">
          {/* Content - Scrollable */}
          <div className="px-12 py-8 pb-20 min-h-full overflow-hidden">
            {renderStepContent()}
          </div>
        </div>

        {/* Sticky Navigation - Outside main content for proper positioning */}
        <StepNavigation
          currentStep={currentStep}
          maxStep={selectedCategory === 'sales' ? 6 : 4}
          isLaunching={isLaunching}
          selectedCategory={selectedCategory}
          isContinueDisabled={isContinueDisabledCheck}
          onPrevStep={handlePrevStep}
          onNextStep={handleNextStep}
          onCancel={handleCancel}
        />
      </div>
      <Toaster />
    </div>
  )
}
