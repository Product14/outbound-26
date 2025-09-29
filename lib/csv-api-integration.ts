// API integration service for CSV mapping workflow

import { fetchCampaignTypes, processKeyMapping, CampaignTypesResponse, KeyMappingResponse } from './campaign-api';
import { generateMappingSuggestions } from './file-parser';

export interface ApiIntegrationResult {
  success: boolean;
  requiredFields: string[];
  keyMapping: Record<string, string>;
  error?: string;
}

/**
 * Integrates with campaign types API and key mapping API to get required fields and mapping
 * @param campaignUseCase The selected campaign use case 
 * @param csvHeaders Headers from the uploaded CSV file
 * @param authKey Optional authentication key for API calls
 * @returns Object containing required fields and key mapping
 */
export async function integrateCsvWithApis(
  campaignUseCase: string,
  csvHeaders: string[],
  authKey?: string
): Promise<ApiIntegrationResult> {
  try {
    // Step 1: Fetch campaign types to get required fields
    const campaignTypesResponse: CampaignTypesResponse = await fetchCampaignTypes(authKey);
    
    if (!campaignTypesResponse.success || !campaignTypesResponse.data) {
      return {
        success: false,
        requiredFields: [],
        keyMapping: {},
        error: 'Failed to fetch campaign types from API'
      };
    }

    // Step 2: Find the required fields for the specific use case
    const requiredFields = extractRequiredFieldsForUseCase(campaignTypesResponse.data, campaignUseCase);
    
    if (requiredFields.length === 0) {
      return {
        success: false,
        requiredFields: [],
        keyMapping: {},
        error: `No required fields found for use case: ${campaignUseCase}`
      };
    }


    // Step 3: Call key mapping API to get intelligent mapping
    const keyMappingResponse: KeyMappingResponse = await processKeyMapping(requiredFields, csvHeaders, authKey);
    
    // Step 4: Transform API response to correct format

    const transformedApiMapping: Record<string, string> = {};
    Object.keys(keyMappingResponse).forEach(apiField => {
      const csvHeader = keyMappingResponse[apiField];
      if (csvHeader && csvHeaders.includes(csvHeader)) {
        transformedApiMapping[csvHeader] = apiField;
      }
    });
    
    
    // Step 5: Generate fallback mapping suggestions for unmapped fields
    const fallbackMappings = generateMappingSuggestions(csvHeaders, requiredFields);
    
    // Combine transformed API mapping with fallback suggestions
    const combinedMapping = { ...fallbackMappings, ...transformedApiMapping };


    return {
      success: true,
      requiredFields,
      keyMapping: combinedMapping
    };

  } catch (error) {
    console.error('Error in CSV API integration:', error);
    return {
      success: false,
      requiredFields: [],
      keyMapping: {},
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Extracts required fields for a specific use case from campaign types response
 */
function extractRequiredFieldsForUseCase(campaignTypeGroups: any[], campaignUseCase: string): string[] {
  const requiredFields: string[] = [];

  
  for (const group of campaignTypeGroups) {
    if (!group.campaignTypes) continue;


    for (const campaignType of group.campaignTypes) {
      if (!campaignType.requiredKeys) continue;

      // Convert both use case and campaign type name to consistent format for matching
      const normalizedUseCaseName = normalizeForMatching(campaignUseCase);
      const normalizedCampaignTypeName = normalizeForMatching(campaignType.name);
      
      
      // Check for exact match or if the use case maps to this campaign type
      if (isUseCaseMatch(campaignUseCase, campaignType.name)) {
        
        // Extract active required keys
        const activeKeys = campaignType.requiredKeys
          .filter((key: any) => key.isActive)
          .map((key: any) => key.name);
        
        requiredFields.push(...activeKeys);
      }
    }
  }

  // Remove duplicates and return
  const uniqueFields = [...new Set(requiredFields)];
  return uniqueFields;
}

/**
 * Normalize strings for consistent matching
 */
function normalizeForMatching(str: string): string {
  return str.toLowerCase().replace(/[_-]/g, '');
}

/**
 * Check if a use case matches a campaign type name using the same transformation logic
 * as getDynamicUseCases to ensure consistency with API-driven data
 */
function isUseCaseMatch(useCase: string, campaignTypeName: string): boolean {
  
  // Transform campaign type name to use case value using the same logic as getDynamicUseCases
  // This ensures consistency between the UI use case values and the matching logic
  const transformedCampaignTypeValue = campaignTypeName.replace(/[_\s]/g, '-').toLowerCase();
  
  // Normalize both values for comparison
  const normalizedUseCase = normalizeForMatching(useCase);
  const normalizedCampaignType = normalizeForMatching(transformedCampaignTypeValue);
  
  
  // Check for exact match after normalization
  if (normalizedCampaignType === normalizedUseCase) {
    return true;
  }
  
  // Check if original use case matches transformed campaign type directly
  if (useCase.toLowerCase() === transformedCampaignTypeValue) {
    return true;
  }
  
  // Check for partial matches (contains relationship)
  if (normalizedCampaignType.includes(normalizedUseCase) || normalizedUseCase.includes(normalizedCampaignType)) {
    return true;
  }
    return false;
}
