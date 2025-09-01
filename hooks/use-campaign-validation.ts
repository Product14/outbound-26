'use client'

import { useCallback } from 'react'
import { validateStep } from '@/utils/campaign-validation'
import { CampaignData, ValidationErrors } from '@/types/campaign-setup'
import { Agent } from '@/lib/agent-api'

interface UseCampaignValidationProps {
  campaignData: CampaignData
  selectedCategory: string
  selectedAgent: Agent | null
  selectedUploadOption: string
  crmSelection: string
  enableRecurringLeads: boolean
  leadAgeDays: number
  vinSolutionsStartDate: string
  vinSolutionsEndDate: string
  vinSolutionsStartTime: string
  vinSolutionsEndTime: string
  googleDriveLink: string
  googleDriveComplete: boolean
  uploadComplete: boolean
  csvMappingComplete: boolean
  missingColumns: string[]
  errors: ValidationErrors
  setErrors: (updater: (prev: ValidationErrors) => ValidationErrors) => void
}

export function useCampaignValidation({
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
}: UseCampaignValidationProps) {

  const validateCurrentStep = useCallback((step: number) => {
    const result = validateStep(
      step,
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
      errors
    )

    setErrors(result.errors)
    return result.isValid
  }, [
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
  ])

  const isContinueDisabled = useCallback(() => {
    // Add any step-specific continue disabled logic here
    return false
  }, [])

  return {
    validateCurrentStep,
    isContinueDisabled
  }
}
