import { configs } from '@/configs';

// Internal Customer interface for UI state management
export interface Customer {
  name: string;
  mobile: string;
  customerDetails?: {
    customerFullName?: string;
    contactPhoneNumber?: string;
    vin?: string;
    recallDescription?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleYear?: string;
    partsAvailabilityFlag?: string;
    loanerEligibility?: string;
    symptom?: string;
    riskDetails?: string;
    remedySteps?: string;
  };
  // Additional fields for new sales use cases
  leadSource?: string;
  interestLevel?: string;
  vehicleInterest?: string;
  previousPrice?: string;
  newPrice?: string;
  newVehicleDetails?: string;
  formType?: string;
  abandonmentTime?: string;
}

// External API Customer interface - flatter structure expected by Spyne API
export interface ApiCustomer {
  name: string;
  mobile: string;
  // Service use case fields
  vin?: string;
  recallDescription?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  partsAvailabilityFlag?: boolean;
  loanerEligibility?: boolean;
  symptom?: string;
  riskDetails?: string;
  remedySteps?: string;
}

export interface LaunchCampaignPayload {
  name: string;
  campaignType: string;
  campaignUseCase: string;
  teamAgentMappingId: string;
  enterpriseId: string;
  teamId: string;
  customers: ApiCustomer[];
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
  uploadedData?: Array<{
    CustomerFullName?: string;
    'Customer Name'?: string;
    name?: string;
    ContactPhoneNumber?: string;
    Phone?: string;
    mobile?: string;
    VIN?: string;
    vin?: string;
    RecallDescription?: string;
    recallDescription?: string;
    VehicleMake?: string;
    vehicleMake?: string;
    VehicleModel?: string;
    vehicleModel?: string;
    VehicleYear?: string;
    vehicleYear?: string;
    PartsAvailabilityFlag?: string | boolean;
    partsAvailabilityFlag?: string | boolean;
    LoanerEligibility?: string | boolean;
    loanerEligibility?: string | boolean;
    Symptom?: string;
    symptom?: string;
    RiskDetails?: string;
    riskDetails?: string;
    RemedySteps?: string;
    remedySteps?: string;
    LeadSource?: string;
    leadSource?: string;
    InterestLevel?: string;
    interestLevel?: string;
    VehicleInterest?: string;
    vehicleInterest?: string;
    PreviousPrice?: string;
    previousPrice?: string;
    NewPrice?: string;
    newPrice?: string;
    NewVehicleDetails?: string;
    newVehicleDetails?: string;
    FormType?: string;
    formType?: string;
    AbandonmentTime?: string;
    abandonmentTime?: string;
  }>;
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
    'service-appointment-booking': 'service_appointment',
    'customer-satisfaction-followup': 'customer_satisfaction',
    'hot-lead-speed-contact': 'hot_lead_speed_contact',
    'price-drop-alert': 'price_drop_alert',
    'new-arrival-alert': 'new_arrival_alert',
    'abandoned-callback': 'abandoned_callback'
  };
  
  const campaignUseCase = useCaseMapping[campaignData.subUseCase] || campaignData.subUseCase;
  
  // Transform uploaded data to API customers format (flatter structure)
  const customers: ApiCustomer[] = campaignData.uploadedData?.map((row) => {
    const customer: ApiCustomer = {
      name: row.CustomerFullName || row['Customer Name'] || row.name || '',
      mobile: row.ContactPhoneNumber || row['Phone'] || row.mobile || ''
    };

    // Add service-related fields if they exist
    if (row.VIN || row.vin) {
      customer.vin = row.VIN || row.vin || '';
    }
    if (row.RecallDescription || row.recallDescription) {
      customer.recallDescription = row.RecallDescription || row.recallDescription || '';
    }
    if (row.VehicleMake || row.vehicleMake) {
      customer.vehicleMake = row.VehicleMake || row.vehicleMake || '';
    }
    if (row.VehicleModel || row.vehicleModel) {
      customer.vehicleModel = row.VehicleModel || row.vehicleModel || '';
    }
    if (row.VehicleYear || row.vehicleYear) {
      customer.vehicleYear = row.VehicleYear || row.vehicleYear || '';
    }
    if (row.PartsAvailabilityFlag || row.partsAvailabilityFlag) {
      customer.partsAvailabilityFlag = (row.PartsAvailabilityFlag?.toString() || row.partsAvailabilityFlag?.toString()) === 'true';
    }
    if (row.LoanerEligibility || row.loanerEligibility) {
      customer.loanerEligibility = (row.LoanerEligibility?.toString() || row.loanerEligibility?.toString()) === 'true';
    }
    if (row.Symptom || row.symptom) {
      customer.symptom = row.Symptom || row.symptom || '';
    }
    if (row.RiskDetails || row.riskDetails) {
      customer.riskDetails = row.RiskDetails || row.riskDetails || '';
    }
    if (row.RemedySteps || row.remedySteps) {
      customer.remedySteps = row.RemedySteps || row.remedySteps || '';
    }

    return customer;
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
    console.log('Fetching campaigns from internal API:', `/api/fetch-campaign-list?enterpriseId=${enterpriseId}&teamId=${teamId}`);
    const response = await fetch(`/api/fetch-campaign-list?enterpriseId=${enterpriseId}&teamId=${teamId}`);

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
    console.log('Fetching campaign details from internal API:', `/api/fetch-campaign-details?campaignId=${campaignId}`);
    const response = await fetch(`/api/fetch-campaign-details?campaignId=${campaignId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching campaign details:', error);
    throw error;
  }
}
