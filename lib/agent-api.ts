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
async function convertUseCaseToSnakeCase(useCase: string, authKey?: string): Promise<string> {
  try {
    // Fetch campaign types to get the original names
    // Only call fetchCampaignTypes if authKey is provided
    if (authKey) {
      const campaignTypesResponse = await fetchCampaignTypes(authKey);
    
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
    }
  } catch (error) {
    console.warn('Failed to fetch campaign types for use case conversion, falling back to manual conversion:', error);
  }
  
  // Fallback: Handle standard camelCase and kebab-case conversions
  let fallbackValue = useCase
    .replace(/-/g, '_')  // Convert kebab-case to snake_case
    .replace(/([a-z])([A-Z])/g, '$1_$2')  // Convert camelCase to snake_case
    .toLowerCase();
  
  // Handle specific cases where words are concatenated without camelCase
  const specificMappings: Record<string, string> = {
    'leadqualification': 'lead_qualification',
    'recallnotification': 'recall_notification',
    'tradeinoffers': 'trade_in_offers',
    'promotionaloffers': 'promotional_offers',
    'testdriveappointments': 'test_drive_appointments'
  };
  
  if (specificMappings[fallbackValue]) {
    fallbackValue = specificMappings[fallbackValue];
  }
  
  return fallbackValue;
}

export async function fetchAgentList(
  enterpriseId: string, 
  teamId: string, 
  agentUseCase?: string,
  agentType?: string,
  agentCallType?: string,
  authKey?: string
): Promise<Agent[]> {
  try {
    
    // Build query parameters, only including defined values
    const params = new URLSearchParams();
    params.append('enterpriseId', enterpriseId);
    params.append('teamId', teamId);
    
    // Convert agentUseCase to snake_case format specifically for this API
    if (agentUseCase) {
      const convertedUseCase = await convertUseCaseToSnakeCase(agentUseCase, authKey);
      params.append('agentUseCase', convertedUseCase);
    }
    if (agentType) params.append('agentType', agentType);
    if (agentCallType) params.append('agentCallType', agentCallType);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Add Authorization header if authKey is provided
    if (authKey) {
      headers['Authorization'] = authKey.startsWith('Bearer ') ? authKey : `Bearer ${authKey}`;
    }
    
    // Use internal API route to avoid CORS issues
    const url = `/api/fetch-agent-list?${params.toString()}`;
        
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage += ` - ${errorData.error || errorData.message || 'Unknown error'}`;
      } catch {
        // If response is not JSON, try to get text
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage += ` - ${errorText.substring(0, 200)}...`; // Limit error text length
          }
        } catch {
          // Ignore if we can't get error details
        }
      }
      throw new Error(errorMessage);
    }

    const agents: Agent[] = await response.json();
    return agents;
  } catch (error) {
    console.error('Error fetching agent list:', error);
    
    // Provide more specific error information
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to the server. Please check your internet connection and try again.');
    }
    
    throw error;
  }
}
