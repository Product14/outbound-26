import { configs } from '@/configs';
import { fetchCampaignTypes, type CampaignTypesResponse } from './campaign-api';

export interface Agent {
  id: string;
  enterpriseId: string;
  teamId: string;
  agentId: string;
  name: string;
  description: string;
  imageUrl: string;
  type: string;
  agentCallType: string;
  colorTheme: string;
  available: boolean;
  order: number;
  squadId: string;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  totalCalls: number;
  lastCallDate: string | null;
  age: number;
  city: string;
  languageName: string;
}

export interface AgentListResponse {
  success: boolean;
  agents: Agent[];
}

/**
 * Convert use case to snake_case format required by the agent API using dynamic campaign types data
 * This reverses the UI transformation and applies proper snake_case conversion
 */
async function convertUseCaseToSnakeCase(useCase: string): Promise<string> {
  try {
    // Fetch campaign types to get the original names
    const campaignTypesResponse = await fetchCampaignTypes();
    
    if (campaignTypesResponse.success && campaignTypesResponse.data) {
      // Look for the original campaign type name that matches this use case
      for (const group of campaignTypesResponse.data) {
        if (group.campaignTypes) {
          for (const campaignType of group.campaignTypes) {
            // Check if this campaign type transforms to the current use case
            const transformedValue = campaignType.name.replace(/[_\s]/g, '-').toLowerCase();
            
            if (transformedValue === useCase.toLowerCase()) {
              // Found the original name, now convert it to snake_case
              const snakeCaseValue = campaignType.name
                .replace(/([a-z])([A-Z])/g, '$1_$2')  // Convert camelCase to snake_case
                .replace(/[_\s]/g, '_')  // Ensure consistent underscores
                .toLowerCase();
              
              return snakeCaseValue;
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn('Failed to fetch campaign types for use case conversion, falling back to manual conversion:', error);
  }
  
  // Fallback: Handle standard camelCase and kebab-case conversions
  const fallbackValue = useCase
    .replace(/-/g, '_')  // Convert kebab-case to snake_case
    .replace(/([a-z])([A-Z])/g, '$1_$2')  // Convert camelCase to snake_case
    .toLowerCase();
  
  console.log(`🔄 Fallback conversion: "${useCase}" -> "${fallbackValue}"`);
  return fallbackValue;
}

export async function fetchAgentList(
  enterpriseId: string, 
  teamId: string, 
  agentUseCase?: string,
  agentType?: string,
  agentCallType?: string
): Promise<Agent[]> {
  try {
    // Build query parameters, only including defined values
    const params = new URLSearchParams();
    params.append('enterpriseId', enterpriseId);
    params.append('teamId', teamId);
    
    // Convert agentUseCase to snake_case format specifically for this API
    if (agentUseCase) {
      const convertedUseCase = await convertUseCaseToSnakeCase(agentUseCase);
      params.append('agentUseCase', convertedUseCase);
    }
    if (agentType) params.append('agentType', agentType);
    if (agentCallType) params.append('agentCallType', agentCallType);
    
    // Use internal API route to avoid CORS issues
    const url = `/api/fetch-agent-list?${params.toString()}`;
        
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
    }

    const agents: Agent[] = await response.json();
    return agents;
  } catch (error) {
    console.error('Error fetching agent list:', error);
    throw error;
  }
}
