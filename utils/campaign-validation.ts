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
  googleDriveLink: string,
  googleDriveComplete: boolean,
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
    newErrors.googleDriveLink = false
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
      } else if (selectedUploadOption === 'drive') {
        if (!googleDriveLink.trim()) {
          newErrors.googleDriveLink = true
          missingFields.push('Google Drive Link')
          isValid = false
        } else if (!googleDriveComplete) {
          newErrors.googleDriveLink = true
          missingFields.push('Google Drive Data Import (please fetch and validate the data)')
          isValid = false
        } else if (!csvMappingComplete) {
          // Check CSV mapping completion for Google Drive imports
          newErrors.googleDriveLink = true
          missingFields.push('CSV Field Mapping - Please complete the field mapping process')
          isValid = false
        }
        
        // Also check if there are missing required fields after key mapping
        if (googleDriveComplete && missingColumns.length > 0) {
          newErrors.googleDriveLink = true
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
      // This ensures comprehensive validation across all upload methods (CRM, Google Drive, CSV)
      if (uploadComplete && selectedUploadOption && missingColumns.length > 0) {
        // Set the appropriate error based on upload method
        if (selectedUploadOption === 'crm') {
          newErrors.crmSelection = true
        } else if (selectedUploadOption === 'drive') {
          newErrors.googleDriveLink = true
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
    if (selectedCategory === 'sales') {
      // For sales campaigns, dates are only required if scheduled (not for "Start Now")
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
        
        // Validate daily time slots for scheduled sales campaigns
        if (!campaignData.dailyTimeSlots || campaignData.dailyTimeSlots.length === 0) {
          newErrors.dailyStartTime = true
          missingFields.push('Daily Time Slots')
          isValid = false
        } else {
          // Validate each time slot
          let hasInvalidSlot = false
          for (const slot of campaignData.dailyTimeSlots) {
            if (!slot.startTime || !slot.endTime) {
              newErrors.dailyStartTime = true
              missingFields.push('All time slots must have start and end times')
              isValid = false
              hasInvalidSlot = true
              break
            }
            
            // Validate time relationship within each slot
            const startTime = slot.startTime.split(':').map(Number)
            const endTime = slot.endTime.split(':').map(Number)
            const startMinutes = startTime[0] * 60 + startTime[1]
            const endMinutes = endTime[0] * 60 + endTime[1]
            
            if (endMinutes <= startMinutes) {
              newErrors.dailyEndTime = true
              missingFields.push('End time must be after start time in all slots')
              isValid = false
              hasInvalidSlot = true
              break
            }
          }
          
          // Check for overlapping time slots
          if (!hasInvalidSlot && campaignData.dailyTimeSlots.length > 1) {
            const sortedSlots = [...campaignData.dailyTimeSlots].sort((a, b) => {
              const aStart = a.startTime.split(':').map(Number)
              const bStart = b.startTime.split(':').map(Number)
              return (aStart[0] * 60 + aStart[1]) - (bStart[0] * 60 + bStart[1])
            })
            
            for (let i = 0; i < sortedSlots.length - 1; i++) {
              const currentEnd = sortedSlots[i].endTime.split(':').map(Number)
              const nextStart = sortedSlots[i + 1].startTime.split(':').map(Number)
              const currentEndMinutes = currentEnd[0] * 60 + currentEnd[1]
              const nextStartMinutes = nextStart[0] * 60 + nextStart[1]
              
              if (currentEndMinutes > nextStartMinutes) {
                newErrors.dailyStartTime = true
                missingFields.push('Time slots cannot overlap')
                isValid = false
                break
              }
            }
          }
        }
      }
      
      // Validate date relationship if both dates are provided
      if (campaignData.scheduledDate && campaignData.scheduledEndDate) {
        const startDate = new Date(campaignData.scheduledDate)
        const endDate = new Date(campaignData.scheduledEndDate)
        
        if (endDate < startDate) {
          newErrors.scheduledEndDate = true
          missingFields.push('End date must be after start date')
          isValid = false
        }
      }
    } else {
      // For service campaigns, similar validation but simplified
      if (campaignData.schedule === 'scheduled') {
        if (!campaignData.scheduledDate) {
          newErrors.scheduledDate = true
          missingFields.push('Scheduled Date')
          isValid = false
        }

        // Validate daily time slots
        if (!campaignData.dailyTimeSlots || campaignData.dailyTimeSlots.length === 0) {
          newErrors.dailyStartTime = true
          missingFields.push('Daily Time Slots')
          isValid = false
        }
        
        // Validate end date if provided
        if (campaignData.scheduledEndDate) {
          const startDate = new Date(campaignData.scheduledDate)
          const endDate = new Date(campaignData.scheduledEndDate)
          
          if (endDate < startDate) {
            newErrors.scheduledEndDate = true
            missingFields.push('End date must be after start date')
            isValid = false
          }
        }
      }
    }
    
    // Validate new required fields for Call Settings (step 3)
    
    // Communication Channels validation
    if (!campaignData.channels.voiceAi && !campaignData.channels.email && !campaignData.channels.sms) {
      newErrors.communicationChannels = true
      missingFields.push('Communication Channels')
      isValid = false
    }
    
    // Campaign Summary validation (always required as it's just a display)
    if (!campaignData.campaignName) {
      newErrors.campaignSummary = true
      missingFields.push('Campaign Summary')
      isValid = false
    }
    
    // Schedule Campaign validation (always required)
    if (selectedCategory === 'sales' && campaignData.schedule === 'scheduled') {
      if (!campaignData.scheduledDate || !campaignData.scheduledEndDate) {
        newErrors.scheduleCampaign = true
        missingFields.push('Schedule Campaign')
        isValid = false
      }
    }
    
    // Voicemail Strategy validation
    if (!campaignData.voicemailStrategy) {
      newErrors.voicemailStrategy = true
      missingFields.push('Voicemail Strategy')
      isValid = false
    }
    
    // Retry Settings validation
    if (!campaignData.maxRetryAttempts || !campaignData.retryDelayMinutes) {
      newErrors.retrySettings = true
      missingFields.push('Retry Settings')
      isValid = false
    }
    
    // Retry Scenarios validation
    if (!campaignData.busySignalRetry && !campaignData.noAnswerRetry && !campaignData.busyCustomerRetry) {
      newErrors.retryScenarios = true
      missingFields.push('Retry Scenarios')
      isValid = false
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

  return {
    isValid,
    errors: newErrors,
    missingFields
  }
}
