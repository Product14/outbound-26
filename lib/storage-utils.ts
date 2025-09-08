// Local storage utility functions for campaign data persistence

export interface StoredCampaignData {
  campaignId?: string;
  campaignName: string;
  useCase: string;
  subUseCase: string;
  selectedAgent: string;
  teamAgentMappingId: string;
  enterpriseId: string;
  teamId: string;
  requiredKeys?: string[];
  keyMapping?: Record<string, string>;
  uploadedData?: any[];
  createdAt: string;
}

const CAMPAIGN_STORAGE_KEY = 'outbound_campaign_data';

export function storeCampaignData(data: Partial<StoredCampaignData>): void {
  try {
    const existingData = getCampaignData();
    const updatedData: StoredCampaignData = {
      campaignName: '',
      useCase: '',
      subUseCase: '',
      selectedAgent: '',
      teamAgentMappingId: '',
      enterpriseId: '',
      teamId: '',
      ...existingData,
      ...data,
      createdAt: existingData?.createdAt || new Date().toISOString()
    };
    
    localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(updatedData));
  } catch (error) {
    console.error('Error storing campaign data:', error);
  }
}

export function getCampaignData(): StoredCampaignData | null {
  try {
    const stored = localStorage.getItem(CAMPAIGN_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error retrieving campaign data:', error);
    return null;
  }
}

export function clearCampaignData(): void {
  try {
    localStorage.removeItem(CAMPAIGN_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing campaign data:', error);
  }
}

export function updateCampaignId(campaignId: string): void {
  storeCampaignData({ campaignId });
}

export function updateKeyMapping(requiredKeys: string[], keyMapping: Record<string, string>): void {
  storeCampaignData({ requiredKeys, keyMapping });
}

export function updateUploadedData(uploadedData: any[]): void {
  storeCampaignData({ uploadedData });
}
