import { CampaignData, ValidationErrors } from '@/types/campaign-setup'
import { Agent } from '@/lib/agent-api'

export const validateStep = (
  step: number,
  campaignData: CampaignData,
  selectedCategory: string,
  selectedAgent: Agent | null,
  selectedUploadOption: string,
  crmSelection: string,
  enableRecurringLeads: boolean,
  leadAgeDays: number,
  vinSolutionsStartDate: string,
  vinSolutionsEndDate: string,
  vinSolutionsStartTime: string,
  vinSolutionsEndTime: string,
  uploadComplete: boolean,
  csvMappingComplete: boolean,
  missingColumns: string[],
  errors: ValidationErrors
) => {
  const newErrors = { ...errors }
  let isValid = true
  const missingFields: string[] = []

  // Reset errors for current step
  if (step === 1) {
    newErrors.campaignName = false
    newErrors.useCase = false
    newErrors.subUseCase = false
    newErrors.agentSelection = false
  } else if (step === 2) {
    newErrors.fileUpload = false
    newErrors.crmSelection = false
    newErrors.vinSolutionsDateRange = false
    newErrors.leadAgeDays = false
  } else if (step === 3) {
    newErrors.scheduledDate = false
    newErrors.scheduledEndDate = false
    newErrors.dailyStartTime = false
    newErrors.dailyEndTime = false
    newErrors.communicationChannels = false
    newErrors.campaignSummary = false
    newErrors.scheduleCampaign = false
    newErrors.voicemailStrategy = false
    newErrors.retrySettings = false
    newErrors.retryScenarios = false
  } else if (step === 4) {
    newErrors.callWindowStart = false
    newErrors.callWindowEnd = false
    newErrors.handoffBusinessHoursStart = false
    newErrors.handoffBusinessHoursEnd = false
  }

  if (step === 1) {
    if (!campaignData.campaignName.trim()) {
      newErrors.campaignName = true
      missingFields.push('Campaign Name')
      isValid = false
    } else if (campaignData.campaignName.length > 50) {
      newErrors.campaignName = true
      missingFields.push('Campaign Name (must be 50 characters or less)')
      isValid = false
    }
    if (!selectedCategory) {
      newErrors.useCase = true
      missingFields.push('Use Case')
      isValid = false
    }
    if (!campaignData.subUseCase) {
      newErrors.subUseCase = true
      missingFields.push('Campaign Type')
      isValid = false
    }
    // Check agent selection - required for all campaign types
    if (!selectedAgent) {
      newErrors.agentSelection = true
      missingFields.push('Agent Selection')
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
          // For recurring leads, validate lead age (1-365 days)
          if (!leadAgeDays || leadAgeDays < 1 || leadAgeDays > 365) {
            newErrors.leadAgeDays = true
            missingFields.push('Lead Age (must be between 1-365 days)')
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
          } else {
            // Create full datetime objects for proper comparison
            const startDateTime = new Date(`${vinSolutionsStartDate}T${vinSolutionsStartTime}:00`)
            const endDateTime = new Date(`${vinSolutionsEndDate}T${vinSolutionsEndTime}:00`)
            
            if (startDateTime >= endDateTime) {
              newErrors.vinSolutionsDateRange = true
              missingFields.push('Valid Date Range (Start date/time must be before end date/time)')
              isValid = false
            }
            
            // Check if end date is not too far in the future (reasonable limit for CRM imports)
            const maxEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
            if (endDateTime > maxEndDate) {
              newErrors.vinSolutionsDateRange = true
              missingFields.push('End date cannot be more than 7 days in the future')
              isValid = false
            }
          }
        }
        
        // Check CSV mapping completion for CRM uploads
        if (uploadComplete && !csvMappingComplete) {
          newErrors.crmSelection = true
          missingFields.push('CSV Field Mapping - Please complete the field mapping process')
          isValid = false
        }
        
        // Also check if there are missing required fields after key mapping
        if (uploadComplete && missingColumns.length > 0) {
          newErrors.crmSelection = true
          missingFields.push(`Missing required data: ${missingColumns.join(', ')}`)
          isValid = false
        }
      } else if (selectedUploadOption === 'upload') {
        // For CSV upload option, comprehensive validation like service campaigns
        if (!uploadComplete) {
          newErrors.fileUpload = true
          missingFields.push('CSV File Upload')
          isValid = false
        } else if (!csvMappingComplete) {
          newErrors.fileUpload = true
          missingFields.push('CSV Field Mapping - Please complete the field mapping process')
          isValid = false
        } else if (missingColumns.length > 0) {
          // Check for missing required fields after key mapping
          newErrors.fileUpload = true
          missingFields.push(`Missing required data: ${missingColumns.join(', ')}`)
          isValid = false
        }
      }
      
      // Final validation for all sales upload options: check for missing required data
      // This ensures comprehensive validation across all upload methods (CRM, CSV)
      if (uploadComplete && selectedUploadOption && missingColumns.length > 0) {
        // Set the appropriate error based on upload method
        if (selectedUploadOption === 'crm') {
          newErrors.crmSelection = true
        } else if (selectedUploadOption === 'upload') {
          newErrors.fileUpload = true
        }
        
        // Only add missing fields error if not already added above
        if (!missingFields.some(field => field.includes('Missing required data'))) {
          missingFields.push(`Missing required data: ${missingColumns.join(', ')}`)
          isValid = false
        }
      }
    } else {
      // For service, use original validation
      if (!uploadComplete) {
        newErrors.fileUpload = true
        missingFields.push('File Upload')
        isValid = false
      }
      
      // Check if CSV mapping is complete (new requirement)
      if (uploadComplete && !csvMappingComplete) {
        newErrors.fileUpload = true
        missingFields.push('CSV Field Mapping - Please complete the field mapping process')
        isValid = false
      }
      
      // Also check if there are missing required fields after key mapping
      if (uploadComplete && missingColumns.length > 0) {
        newErrors.fileUpload = true
        missingFields.push(`Missing required data: ${missingColumns.join(', ')}`)
        isValid = false
      }
    }
  } else if (step === 3) {
    // Step 3 = Workflow — only validate message content when SMS is enabled
    const channelMode = campaignData.channelMode || 'both'
    const smsEnabled = channelMode !== 'call'

    if (smsEnabled) {
      const msgs = campaignData.messageSchedule || []
      if (msgs.length === 0) {
        missingFields.push('At least one day message is required for SMS campaigns')
        isValid = false
      } else if (!msgs[0]?.body?.trim()) {
        missingFields.push('Day 1 message body cannot be empty')
        isValid = false
      }
    }
    // No schedule / voicemail / retry validation here — those are on step 4 now

  } else if (step === 4) {
    // Step 4 = Schedule — validate schedule, voicemail, quiet hours

    // Schedule dates (only if "scheduled", not "now")
    if (campaignData.schedule === 'scheduled') {
      if (!campaignData.scheduledDate) {
        newErrors.scheduledDate = true
        missingFields.push('Start Date')
        isValid = false
      }
      if (!campaignData.scheduledEndDate) {
        newErrors.scheduledEndDate = true
        missingFields.push('End Date')
        isValid = false
      }
      // Validate date relationship
      if (campaignData.scheduledDate && campaignData.scheduledEndDate) {
        const startDate = new Date(campaignData.scheduledDate)
        const endDate = new Date(campaignData.scheduledEndDate)
        if (endDate < startDate) {
          newErrors.scheduledEndDate = true
          missingFields.push('End date must be after start date')
          isValid = false
        }
      }
    }

    // Voicemail Strategy
    const channelMode4 = campaignData.channelMode || 'both'
    if (channelMode4 !== 'sms' && !campaignData.voicemailStrategy) {
      newErrors.voicemailStrategy = true
      missingFields.push('Voicemail Strategy')
      isValid = false
    }
    
    // For sales campaigns, validate handoff business hours
    // if (selectedCategory === 'sales') {
    //   if (!campaignData.handoffSettings?.businessHoursStart) {
    //     newErrors.handoffBusinessHoursStart = true
    //     missingFields.push('Handoff Business Hours Start Time')
    //     isValid = false
    //   }
    //   if (!campaignData.handoffSettings?.businessHoursEnd) {
    //     newErrors.handoffBusinessHoursEnd = true
    //     missingFields.push('Handoff Business Hours End Time')
    //     isValid = false
    //   }
      
    //   // Validate business hours times if both are provided
    //   if (campaignData.handoffSettings?.businessHoursStart && campaignData.handoffSettings?.businessHoursEnd) {
    //     const startTime = campaignData.handoffSettings.businessHoursStart.split(':').map(Number)
    //     const endTime = campaignData.handoffSettings.businessHoursEnd.split(':').map(Number)
    //     const startMinutes = startTime[0] * 60 + startTime[1]
    //     const endMinutes = endTime[0] * 60 + endTime[1]
        
    //     if (endMinutes <= startMinutes) {
    //       newErrors.handoffBusinessHoursEnd = true
    //       missingFields.push('Business hours end time must be after start time')
    //       isValid = false
    //     }
    //   }
    // }
  }

  return {
    isValid,
    errors: newErrors,
    missingFields
  }
}
