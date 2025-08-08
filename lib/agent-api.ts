export interface Agent {
  id: string;
  enterpriseId: string;
  teamId: string;
  name: string;
  description: string;
  imageUrl: string;
  type: string;
  colorTheme: string;
  available: boolean;
  order: number;
  squadId: string;
  faqs: any[];
  totalCalls: number;
  lastCallDate: string | null;
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
    const url = `https://beta-api.spyne.xyz/conversation/agents/fetch-agent-list?enterpriseId=${enterpriseId}&teamId=${teamId}&agentUseCase=${agentUseCase}&agentType=${agentType}&agentCallType=${agentCallType}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const agents: Agent[] = await response.json();
    return agents;
  } catch (error) {
    console.error('Error fetching agent list:', error);
    throw error;
  }
}
