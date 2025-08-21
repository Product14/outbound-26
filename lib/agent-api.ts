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
  agentUseCase: string = 'recall_notification',
  agentType: string = 'Service',
  agentCallType: string = 'outbound'
): Promise<Agent[]> {
  try {
    // Use internal API route to avoid CORS issues
    const url = `/api/fetch-agent-list?enterpriseId=${enterpriseId}&teamId=${teamId}&agentUseCase=${agentUseCase}&agentType=${agentType}&agentCallType=${agentCallType}`;
    
    console.log('Fetching agents from internal API:', url);
    
    const response = await fetch(url);

    console.log('API Response status:', response.status);
    console.log('API Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
    }

    const agents: Agent[] = await response.json();
    console.log('API Response data:', agents);
    return agents;
  } catch (error) {
    console.error('Error fetching agent list:', error);
    throw error;
  }
}
