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
 * @returns Object containing required fields and key mapping
 */
export async function integrateCsvWithApis(
  campaignUseCase: string,
  csvHeaders: string[]
): Promise<ApiIntegrationResult> {
  try {
    console.log('🚀 Starting API integration for campaign use case:', campaignUseCase);
    console.log('📄 CSV headers:', csvHeaders);
    console.log('🎯 Use case type:', typeof campaignUseCase);

    // Step 1: Fetch campaign types to get required fields
    const campaignTypesResponse: CampaignTypesResponse = await fetchCampaignTypes();
    
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

    console.log('Required fields from API:', requiredFields);

    // Step 3: Call key mapping API to get intelligent mapping
    const keyMappingResponse: KeyMappingResponse = await processKeyMapping(requiredFields, csvHeaders);
    
    // Step 4: Generate fallback mapping suggestions for unmapped fields
    const fallbackMappings = generateMappingSuggestions(csvHeaders, requiredFields);
    
    // Combine API mapping with fallback suggestions
    const combinedMapping = { ...fallbackMappings, ...keyMappingResponse };

    console.log('Final key mapping result:', combinedMapping);

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

  console.log('Extracting required fields for use case:', campaignUseCase);
  console.log('Available campaign type groups:', campaignTypeGroups);

  for (const group of campaignTypeGroups) {
    if (!group.campaignTypes) continue;

    console.log('Checking campaign types in group:', group.campaignTypes.map((ct: any) => ct.name));

    for (const campaignType of group.campaignTypes) {
      if (!campaignType.requiredKeys) continue;

      // Convert both use case and campaign type name to consistent format for matching
      const normalizedUseCaseName = normalizeForMatching(campaignUseCase);
      const normalizedCampaignTypeName = normalizeForMatching(campaignType.name);
      
      console.log(`Comparing: "${normalizedUseCaseName}" with "${normalizedCampaignTypeName}"`);
      
      // Check for exact match or if the use case maps to this campaign type
      if (isUseCaseMatch(campaignUseCase, campaignType.name)) {
        console.log(`✅ Found match: ${campaignType.name} for use case: ${campaignUseCase}`);
        
        // Extract active required keys
        const activeKeys = campaignType.requiredKeys
          .filter((key: any) => key.isActive)
          .map((key: any) => key.name);
        
        console.log('Required keys for this campaign type:', activeKeys);
        requiredFields.push(...activeKeys);
      }
    }
  }

  // Remove duplicates and return
  const uniqueFields = [...new Set(requiredFields)];
  console.log('Final required fields:', uniqueFields);
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
  console.log(`🔍 Checking use case mapping for: "${useCase}" against campaign type: "${campaignTypeName}"`);
  
  // Transform campaign type name to use case value using the same logic as getDynamicUseCases
  // This ensures consistency between the UI use case values and the matching logic
  const transformedCampaignTypeValue = campaignTypeName.replace(/[_\s]/g, '-').toLowerCase();
  
  // Normalize both values for comparison
  const normalizedUseCase = normalizeForMatching(useCase);
  const normalizedCampaignType = normalizeForMatching(transformedCampaignTypeValue);
  
  console.log(`Transformed campaign type: "${transformedCampaignTypeValue}"`);
  console.log(`Normalized use case: "${normalizedUseCase}"`);
  console.log(`Normalized campaign type: "${normalizedCampaignType}"`);
  
  // Check for exact match after normalization
  if (normalizedCampaignType === normalizedUseCase) {
    console.log(`✅ Exact match found`);
    return true;
  }
  
  // Check if original use case matches transformed campaign type directly
  if (useCase.toLowerCase() === transformedCampaignTypeValue) {
    console.log(`✅ Direct match found`);
    return true;
  }
  
  // Check for partial matches (contains relationship)
  if (normalizedCampaignType.includes(normalizedUseCase) || normalizedUseCase.includes(normalizedCampaignType)) {
    console.log(`✅ Partial match found`);
    return true;
  }
  
  console.log(`❌ No match found`);
  return false;
}
