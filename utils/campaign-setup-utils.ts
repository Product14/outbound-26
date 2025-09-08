import { CampaignData, ValidationErrors, UseCases, SetupStep } from '@/types/campaign-setup'
import { CampaignTypesResponse } from '@/lib/campaign-api'

// Helper function to convert camelCase and other formats to properly spaced text
export const formatUseCaseLabel = (text: string): string => {
  return text
    // First handle underscores and hyphens
    .replace(/[_-]/g, ' ')
    // Then handle camelCase by adding space before capital letters (except the first one)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Capitalize first letter of each word
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim()
}

// Fallback use cases definition - used when API data is not available
export const fallbackUseCases: UseCases = {
  sales: {
    label: 'Sales',
    color: 'bg-green-lighter text-green-darker border-green-8',
    disabled: false,
    subCases: []
  },
  service: {
    label: 'Service',
    color: 'bg-blue-lighter text-blue-purple border-blue-8',
    disabled: false,
    subCases: []
  }
}

// Dynamic steps based on use case
export const getSteps = (useCase: string): SetupStep[] => {
  // Both sales and service now have the same 3 steps + launch
  return [
    { id: 1, name: 'Campaign Details', number: '01' },
    { id: 2, name: 'File Upload', number: '02' },
    { id: 3, name: 'Call Settings', number: '03' },
    { id: 4, name: 'Start Campaign', number: '04' }
  ]
}

// Get dynamic use cases from API data
export const getDynamicUseCases = (campaignTypes: CampaignTypesResponse | null) => {
  if (!campaignTypes || !campaignTypes.success || !campaignTypes.data) {
    return fallbackUseCases // Return fallback use cases when API data is not available
  }

  const dynamicUseCases: any = {}
  
  campaignTypes.data.forEach(group => {
    if (!group.isActive) return // Skip inactive groups
    
    const categoryKey = group.campaignFor.toLowerCase()
    const existingCategory = fallbackUseCases[categoryKey as keyof typeof fallbackUseCases]
    
    if (existingCategory) {
      dynamicUseCases[categoryKey] = {
        ...existingCategory,
        subCases: group.campaignTypes
          .filter(type => type.isActive) // Only include active campaign types
          .map(type => ({
            value: type.name.replace(/[_\s]/g, '-').toLowerCase(),
            label: formatUseCaseLabel(type.name),
            requiredFields: type.requiredKeys?.filter(key => key.isActive).map(key => key.name) || [],
            disabled: false
          }))
      }
    } else {
      // Handle new categories not in fallback
      dynamicUseCases[categoryKey] = {
        label: group.campaignFor,
        color: categoryKey === 'sales' ? 'bg-green-lighter text-green-darker border-green-8' : 'bg-blue-lighter text-blue-purple border-blue-8',
        disabled: false,
        subCases: group.campaignTypes
          .filter(type => type.isActive)
          .map(type => ({
            value: type.name.replace(/[_\s]/g, '-').toLowerCase(),
            label: formatUseCaseLabel(type.name),
            requiredFields: type.requiredKeys?.filter(key => key.isActive).map(key => key.name) || [],
            disabled: false
          }))
      }
    }
  })

  // Fill in any missing categories with fallback data
  Object.keys(fallbackUseCases).forEach(key => {
    if (!dynamicUseCases[key]) {
      dynamicUseCases[key] = fallbackUseCases[key as keyof typeof fallbackUseCases]
    }
  })

  return dynamicUseCases
}

// Get required keys for the selected use case from API data
export const getRequiredKeysForUseCase = (
  subUseCase: string,
  selectedCategory: string,
  campaignTypes: CampaignTypesResponse | null
) => {
  if (!subUseCase) {
    return []
  }

  // Use the dynamic use cases data which already handles API integration correctly
  const dynamicUseCases = getDynamicUseCases(campaignTypes)
  const categoryData = dynamicUseCases[selectedCategory]
  
  if (!categoryData) {
    return []
  }

  const selectedSubCase = categoryData.subCases.find((subCase: any) => 
    subCase.value === subUseCase
  )

  if (!selectedSubCase) {
    return []
  }

  return selectedSubCase.requiredFields || []
}

// Get display columns based on current use case
export const getDisplayColumns = (
  csvMappingComplete: boolean,
  uploadedData: any[],
  subUseCase: string,
  selectedCategory: string,
  campaignTypes: CampaignTypesResponse | null
) => {
  // After CSV mapping is complete, use the actual keys from the mapped data
  if (csvMappingComplete && uploadedData.length > 0) {
    return Object.keys(uploadedData[0])
  }
  
  const apiRequiredKeys = getRequiredKeysForUseCase(subUseCase, selectedCategory, campaignTypes)
  if (apiRequiredKeys.length > 0) {
    return apiRequiredKeys
  }
  // If no API keys and we have uploaded data, use actual columns from the data
  if (uploadedData.length > 0) {
    return Object.keys(uploadedData[0])
  }
  // Final fallback to hardcoded columns
  return []
}

// Google Drive utility functions
export const validateGoogleDriveLink = (url: string): boolean => {
  // Check if it's a valid Google Drive share link
  const googleDriveRegex = /^https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/(view|edit)(\?[^#]*)?(\#.*)?$/
  const googleDriveOpenRegex = /^https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)$/
  const googleSheetsRegex = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/
  
  return googleDriveRegex.test(url) || googleDriveOpenRegex.test(url) || googleSheetsRegex.test(url)
}

export const convertToDirectDownloadLink = (shareUrl: string): string => {
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

// Sample file download utility - dynamically determines template based on use case
export const downloadSampleFile = (subUseCase: string, useCase: string, campaignTypes?: CampaignTypesResponse | null) => {
  try {
    // Default template
    let fileUrl = 'https://spyne-test.s3.us-east-1.amazonaws.com/csv-template1.csv';
    let fileName = 'sample-customer-data.csv';
    
    // Dynamic template selection based on campaign types
    if (campaignTypes?.data) {
      const categoryGroup = campaignTypes.data.find(group => 
        group.campaignFor.toLowerCase() === useCase.toLowerCase()
      );
      
      if (categoryGroup) {
        const campaignType = categoryGroup.campaignTypes.find(type => 
          type.name.replace(/[_\s]/g, '-').toLowerCase() === subUseCase
        );
        
        // Customize template based on specific campaign type
        if (campaignType) {
          if (campaignType.name.toLowerCase().includes('recall')) {
            fileUrl = '/csv-template.csv';
            fileName = 'recall-notification-template.csv';
          } else if (campaignType.name.toLowerCase().includes('price')) {
            fileUrl = '/price-drop-alert-template.csv';
            fileName = 'price-drop-alert-template.csv';
          } else if (useCase.toLowerCase() === 'service') {
            fileUrl = '/csv-template.csv';
            fileName = 'service-template.csv';
          } else if (useCase.toLowerCase() === 'sales') {
            fileUrl = 'https://spyne-test.s3.us-east-1.amazonaws.com/csv-template1.csv';
            fileName = 'sales-template.csv';
          }
        }
      }
    } else {
      // Fallback to hardcoded logic if no API data
      if (subUseCase === 'price-drop-alert') {
        fileUrl = '/price-drop-alert-template.csv';
        fileName = 'price-drop-alert-template.csv';
      } else if (useCase === 'service') {
        fileUrl = '/csv-template.csv';
        fileName = 'service-recall-template.csv';
      }
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
    
    // Use same logic for fallback
    if (subUseCase === 'price-drop-alert') {
      link.href = '/price-drop-alert-template.csv';
      link.download = 'price-drop-alert-template.csv';
    } else if (useCase === 'service') {
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
