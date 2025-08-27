import { configs } from '@/configs';

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
    
    if (agentUseCase) params.append('agentUseCase', agentUseCase);
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
