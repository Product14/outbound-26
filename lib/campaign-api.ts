export interface Customer {
  name: string;
  mobile: string;
  vin: string;
  recallDescription: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  partsAvailabilityFlag: boolean | string;
  loanerEligibility: boolean | string;
  symptom: string;
  riskDetails: string;
  remedySteps: string;
}

export interface LaunchCampaignPayload {
  name: string;
  campaignType: string;
  campaignUseCase: string;
  teamAgentMappingId: string;
  enterpriseId: string;
  teamId: string;
  customers: Customer[];
}

export interface CampaignApiResponse {
  success: boolean;
  campaignId: string;
  message: string;
  campaign: {
    campaignId: string;
    name: string;
    campaignType: string;
    campaignUseCase: string;
    teamAgentMappingId: string;
    enterpriseId: string;
    teamId: string;
    status: string;
    startDate: string;
    completedDate: string;
    campaignCustomerCreationStatus: string;
    totalCustomers: number;
    totalCustomersLeadCreated: number;
    totalCustomersLeadFailed: number;
    _id: string;
    __v: number;
  };
}

export interface CampaignListItem {
  campaignId: string;
  name: string;
  campaignType: string;
  campaignUseCase?: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  completedAt?: string;
  status: string;
  totalCallPlaced: number;
  answerRate: number;
  appointmentScheduled: number;
}

export interface CampaignListResponse {
  success: boolean;
  campaigns: CampaignListItem[];
}

export interface CallDetail {
  _id: string;
  customerName: string;
  customerNumber: string;
  vin: string;
  recallDescription: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  partsAvailabilityFlag: boolean;
  loanerEligibility: boolean;
  symptom: string;
  riskDetails: string;
  remedySteps: string;
  vehicle: string;
}

export interface CampaignDetail {
  _id: string;
  campaignId: string;
  name: string;
  campaignType: string;
  campaignUseCase: string;
  teamAgentMappingId: string;
  enterpriseId: string;
  teamId: string;
  status: string;
  startDate: string;
  completedDate: string;
  campaignCustomerCreationStatus: string;
  totalCustomers: number;
  totalCustomersLeadCreated: number;
  totalCustomersLeadFailed: number;
  __v: number;
  answerRate: number;
  appointmentScheduled: number;
  totalCallPlaced: number;
}

export interface CampaignDetailResponse {
  success: boolean;
  campaign: CampaignDetail;
  callDetails: CallDetail[];
}

export interface CampaignData {
  campaignName: string;
  useCase: string;
  subUseCase: string;
  fileName: string;
  schedule: string;
  scheduledDate: string;
  scheduledTime: string;
  totalRecords: number;
  uploadedData?: any[];
}

export function transformCampaignData(
  campaignData: CampaignData, 
  enterpriseId: string, 
  teamId: string,
  teamAgentMappingId: string = "agent234" // Default value from your API example
): LaunchCampaignPayload {
  // Transform the use case to campaign type
  const campaignType = campaignData.useCase === 'sales' ? 'Sales' : 'Service';
  
  // Transform subUseCase to the required format for campaignUseCase
  const useCaseMapping: { [key: string]: string } = {
    'recall-notification': 'recall_notificaiton', // Note: keeping the typo as in API example
    'maintenance-reminder': 'maintenance',
    'warranty-expiration': 'warranty',
    'seasonal-service': 'seasonal',
    'follow-up-leads': 'followup',
    'inventory-promotion': 'promotion',
    'trade-in-offers': 'tradein'
  };
  
  const campaignUseCase = useCaseMapping[campaignData.subUseCase] || campaignData.subUseCase;
  
  // Transform uploaded data to customers format
  const customers: Customer[] = campaignData.uploadedData?.map((row: any) => {
    // Convert string "TRUE"/"FALSE" to boolean for flags
    const convertToBoolean = (value: string | boolean): boolean => {
      if (typeof value === 'boolean') return value;
      return value?.toString().toUpperCase() === 'TRUE';
    };

    return {
      name: row.CustomerFullName || row['Customer Name'] || row.name || '',
      mobile: row.ContactPhoneNumber || row['Phone'] || row.mobile || '',
      vin: row.VIN || row.vin || '',
      recallDescription: row.RecallDescription || row.recallDescription || '',
      vehicleMake: row.VehicleMake || row.vehicleMake || '',
      vehicleModel: row.VehicleModel || row.vehicleModel || '',
      vehicleYear: row.VehicleYear || row.vehicleYear || '',
      partsAvailabilityFlag: convertToBoolean(row.PartsAvailabilityFlag || row.partsAvailabilityFlag || false),
      loanerEligibility: convertToBoolean(row.LoanerEligibility || row.loanerEligibility || false),
      symptom: row.Symptom || row.symptom || '',
      riskDetails: row.RiskDetails || row.riskDetails || '',
      remedySteps: row.RemedySteps || row.remedySteps || ''
    };
  }) || [];

  return {
    name: campaignData.campaignName,
    campaignType,
    campaignUseCase,
    teamAgentMappingId,
    enterpriseId: enterpriseId, 
    teamId: teamId, 
    customers
  };
}

export async function launchCampaign(payload: LaunchCampaignPayload): Promise<CampaignApiResponse> {
  try {
    const response = await fetch('/api/launch-campaign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error launching campaign:', error);
    throw error;
  }
}

export async function fetchCampaignList(enterpriseId: string, teamId: string): Promise<CampaignListResponse> {
  try {
    const response = await fetch(`https://api.spyne.ai/conversation/campaign/list?enterpriseId=${enterpriseId}&teamId=${teamId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching campaign list:', error);
    throw error;
  }
}

export async function fetchCampaignDetails(campaignId: string): Promise<CampaignDetailResponse> {
  try {
    const response = await fetch(`https://api.spyne.ai/conversation/campaign/details/${campaignId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching campaign details:', error);
    throw error;
  }
}
