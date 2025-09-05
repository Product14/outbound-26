import { configs } from '@/configs';
import { toCamelCase } from '@/lib/utils';
import { convertTimeSlotsToApiFormat } from '@/lib/time-utils';

// Campaign Types API interfaces
export interface CampaignType {
  name: string;
  description: string;
  isActive: boolean;
  requiredKeys: RequiredKey[];
}

export interface RequiredKey {
  name: string;
  isActive: boolean;
}

export interface CampaignTypeGroup {
  _id: string;
  campaignFor: string;
  campaignTypes: CampaignType[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface CampaignTypesResponse {
  success: boolean;
  data: CampaignTypeGroup[];
}

// Key Mapping API interfaces
export interface KeyMappingRequest {
  requiredKeys: string[];
  availableKeys: string[];
}

export interface KeyMappingResponse {
  [requiredKey: string]: string;
}

// Internal Customer interface for UI state management
export interface Customer {
  name: string;
  mobile: string;
  customerDetails?: Record<string, string | number | boolean>;
  // Allow any additional dynamic fields
  [key: string]: string | number | boolean | Record<string, string | number | boolean> | undefined;
}

// External API Customer interface - only dynamic fields from campaign-types API
export interface ApiCustomer {
  // Only dynamic metadata fields as specified by campaign-types API requiredKeys
  [key: string]: string | number | boolean | undefined;
}

export interface LaunchCampaignPayload {
  isCreated?: boolean;
  name: string;
  campaignType: string;
  campaignUseCase: string;
  teamAgentMappingId: string;
  enterpriseId: string;
  teamId: string;
  campaignId?: string;
  customers: ApiCustomer[];
  communicationChannel?: string;
  startDate?: string;
  endDate?: string;
  scheduledTime?: Array<{
    start: string;
    end: string;
  }>;

  // CRM Import fields
  importSource?: string;
  leadsFilterOptions?: {
    recurringDays?: number;
    dateRange?: {
      startDate: string;
      endDate: string;
      startTime?: string;
      endTime?: string;
    };
  };

  callLimits?: {
    dailyContactLimit: number;
    hourlyThrottle: number;
    maxConcurrentCalls: number;
  };
  retryLogic?: {
    maxAttempts: number;
    retryDelay: number;
    smsSwitchover: boolean;
  };
  complianceSettings?: string[];
  voicemailConfig?: {
    method: string;
    voicemailMessage: string;
  };
  handoffSettings?: {
    targerType: string;
    targetPhone: string[];
  };
  escalationTriggers?: string[];
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
  // Allow any additional dynamic fields from the campaign data
  [key: string]: string | number | boolean | undefined;
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
  scheduledEndDate: string;
  scheduledTime: string;
  dailyTimeSlots?: Array<{
    id: string;
    startTime: string;
    endTime: string;
  }>;
  totalRecords: number;
  // Compliance settings from UI
  compliance?: {
    includeRecordingConsent?: boolean;
    includeSmsOptOut?: boolean;
    doNotCallList?: boolean;
  };
  // Call window settings from UI
  callWindowStart?: string;
  callWindowEnd?: string;
  // Voicemail settings from UI
  voicemailStrategy?: string;
  voicemailMessage?: string;
  // Retry settings from UI
  maxRetryAttempts?: number;
  retryDelayMinutes?: number;
  // Call limits from UI
  maxCallsPerHour?: number;
  maxCallsPerDay?: number;
  maxConcurrentCalls?: number;
  // Handoff settings from UI
  handoffSettings?: {
    target?: string;
    businessHoursStart?: string;
    businessHoursEnd?: string;
  };
  // Escalation triggers from UI
  escalationTriggers?: {
    leadRequestsPerson?: boolean;
    complexFinancing?: boolean;
    pricingNegotiation?: boolean;
    technicalQuestions?: boolean;
  };
  uploadedData?: Array<Record<string, string | number | boolean>>;
}

// Create initial campaign (after agent selection, before customer upload)
export function createInitialCampaignPayload(
  campaignName: string,
  campaignType: string,
  campaignUseCase: string,
  teamAgentMappingId: string,
  enterpriseId: string,
  teamId: string
): LaunchCampaignPayload {
  return {
    isCreated: false, // Only true when final Start Campaign is clicked
    name: campaignName,
    campaignType,
    campaignUseCase,
    teamAgentMappingId,
    enterpriseId,
    teamId,
    customers: [], // Empty initially, will be added later
    communicationChannel: "voice",
    complianceSettings: ["DNC_CHECK", "TCPA_COMPLIANT", "GDPR_COMPLIANT"]
  };
}

export function transformCampaignData(
  campaignData: CampaignData, 
  enterpriseId: string, 
  teamId: string,
  teamAgentMappingId: string = "agent234", // Default value from your API example
  existingCampaignId?: string, // For final launch with existing campaign ID
  keyMapping?: Record<string, string>, // Dynamic field mapping from CSV mapping process
  crmImportData?: {
    selectedUploadOption: string;
    crmSelection: string;
    enableRecurringLeads: boolean;
    leadAgeDays: number;
    vinSolutionsStartDate: string;
    vinSolutionsEndDate: string;
    vinSolutionsStartTime: string;
    vinSolutionsEndTime: string;
  }
): LaunchCampaignPayload {
  // Transform the use case to campaign type
  const campaignType = campaignData.useCase === 'sales' ? 'Sales' : 'Service';
  
  // Transform subUseCase to the required format for campaignUseCase
  // Convert kebab-case back to the original API format (with underscores and proper casing)
  let campaignUseCase = campaignData.subUseCase;
  
  // Convert kebab-case to title case with underscores for API compatibility
  if (campaignUseCase) {
    // First convert kebab-case to title case with spaces
    campaignUseCase = campaignUseCase
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    
    // Then replace spaces with underscores for API format
    campaignUseCase = campaignUseCase.replace(/\s+/g, '_');
  }
  
  // Transform uploaded data to API customers format (flatter structure)
  console.log('🔍 transformCampaignData - uploadedData:', {
    uploadedData: campaignData.uploadedData,
    uploadedDataLength: campaignData.uploadedData?.length,
    sampleRow: campaignData.uploadedData?.[0]
  })
  
  // Log key mapping information
  console.log('🗝️ transformCampaignData - keyMapping:', {
    keyMappingProvided: !!keyMapping,
    keyMappingKeys: keyMapping ? Object.keys(keyMapping) : [],
    keyMapping: keyMapping
  })
  
  if (!keyMapping && campaignData.uploadedData?.[0]) {
    const sampleKeys = Object.keys(campaignData.uploadedData[0]);
    const convertedKeys = sampleKeys.map(key => `${key} → ${toCamelCase(key)}`);
  }
  
  
  const customers: ApiCustomer[] = campaignData.uploadedData?.map((row: Record<string, any>, index) => {
    
    
    // Helper function to format phone number with + sign
    const formatPhoneNumber = (phone: string): string => {
      if (!phone || typeof phone !== 'string') return '';
      const cleanPhone = phone.trim();
      if (cleanPhone.startsWith('+')) {
        return cleanPhone; // Already has + sign
      }
      return `+${cleanPhone}`;
    };
    
    // Transform customer data using dynamic field mapping from CSV mapping process
    const customer: ApiCustomer = {};

    // Use dynamic field mapping from CSV mapping process, or create smart fallback mapping
    const fieldMapping: Record<string, string> = keyMapping || {};
    
    // If no key mapping provided, create smart case conversion mapping
    if (!keyMapping && Object.keys(row).length > 0) {
      Object.keys(row).forEach(key => {
        // Convert PascalCase to camelCase using utility function
        let camelCaseKey = toCamelCase(key);
        
        // Handle special cases for acronyms like VIN
        if (key === 'VIN' || (key === key.toUpperCase() && !key.includes('_') && !key.includes('-') && !key.includes(' '))) {
          // If key is all uppercase and a single word, convert to all lowercase
          camelCaseKey = key.toLowerCase();
        }
        
        fieldMapping[key] = camelCaseKey;
      });
    } else if (keyMapping) {
      
      // Ensure all mapped fields are in camelCase format
      Object.keys(keyMapping).forEach(originalKey => {
        const mappedKey = keyMapping[originalKey];
        if (mappedKey) {
          // Convert to camelCase using utility function
          let camelCaseKey = toCamelCase(mappedKey);
          
          // Handle special cases for acronyms and all-caps single words
          if (mappedKey === mappedKey.toUpperCase() && !mappedKey.includes('_') && !mappedKey.includes('-') && !mappedKey.includes(' ')) {
            // If key is all uppercase and a single word, convert to all lowercase
            camelCaseKey = mappedKey.toLowerCase();
          }
          
          // Always use camelCase version regardless if it changed or not
          fieldMapping[originalKey] = camelCaseKey;
          if (mappedKey !== camelCaseKey) {
          }
        }
      });
    }

    // Process each field with forced API field name conversion
    Object.keys(row).forEach(originalKey => {
      const value = row[originalKey];
      
      // Convert field name using dynamic mapping from CSV mapping process
      // Always ensure the field name is in camelCase format for API compatibility
      const apiFieldName = fieldMapping[originalKey] ? fieldMapping[originalKey] : toCamelCase(originalKey);
      
      
      if (value !== undefined && value !== null && value !== '') {
        // Convert the value appropriately based on its content
        if (typeof value === 'string') {
          const trimmedValue = value.trim();
          if (trimmedValue !== '') {
            // Special handling for phone numbers - add + prefix
            if (apiFieldName.toLowerCase().includes('phone') || apiFieldName.toLowerCase().includes('mobile')) {
              const formattedPhone = formatPhoneNumber(trimmedValue);
              (customer as any)[apiFieldName] = formattedPhone;
            }
            // Check if it's a boolean field
            else if (trimmedValue.toLowerCase() === 'true' || trimmedValue.toLowerCase() === 'false') {
              (customer as any)[apiFieldName] = trimmedValue.toLowerCase() === 'true';
            } else {
              (customer as any)[apiFieldName] = trimmedValue;
            }
          }
        } else if (typeof value === 'boolean') {
          (customer as any)[apiFieldName] = value;
        } else if (typeof value === 'number') {
          (customer as any)[apiFieldName] = value.toString();
        } else {
          // Convert any other type to string safely
          (customer as any)[apiFieldName] = String(value);
        }
      }
    });

    return customer;
  }) || [];

  // Check for duplicate phone numbers to debug API error
  const phoneNumbers = customers.map(c => c.contactPhoneNumber).filter(Boolean);
  const uniquePhoneNumbers = [...new Set(phoneNumbers)];

  if (phoneNumbers.length !== uniquePhoneNumbers.length) {
    const duplicates = phoneNumbers.filter((phone, index) => phoneNumbers.indexOf(phone) !== index);
    console.error('🚨 DUPLICATE PHONE NUMBERS:', duplicates);
  }

  // Build compliance settings based on UI selections
  const complianceSettings: string[] = [];
  if (campaignData.compliance?.doNotCallList) {
    complianceSettings.push("DNC_CHECK");
  }
  if (campaignData.compliance?.includeRecordingConsent) {
    complianceSettings.push("TCPA_COMPLIANT");
  }
  if (campaignData.compliance?.includeSmsOptOut) {
    complianceSettings.push("GDPR_COMPLIANT");
  }
  
  // If no compliance settings selected, use defaults
  if (complianceSettings.length === 0) {
    complianceSettings.push("DNC_CHECK", "TCPA_COMPLIANT", "GDPR_COMPLIANT");
  }

  // Transform quiet hours from UI format to API format
  
  if (campaignData.callWindowStart && campaignData.callWindowEnd) {
    // Convert UI time format (e.g., "09:00", "17:00") to API quiet hours format
    // The API expects quiet hours (when NOT to call), so we need to invert the logic
    const startHour = parseInt(campaignData.callWindowStart.split(':')[0]);
    const endHour = parseInt(campaignData.callWindowEnd.split(':')[0]);
    
    // If call window is 9 AM to 5 PM, quiet hours are 5 PM to 9 AM next day
    
  }

  // Transform escalation triggers from UI boolean format to API string array format
  const escalationTriggers: string[] = [];
  if (campaignData.escalationTriggers?.leadRequestsPerson) {
    escalationTriggers.push("customer_angry");
  }
  if (campaignData.escalationTriggers?.complexFinancing) {
    escalationTriggers.push("technical_issue");
  }
  if (campaignData.escalationTriggers?.pricingNegotiation) {
    escalationTriggers.push("payment_dispute");
  }
  if (campaignData.escalationTriggers?.technicalQuestions) {
    escalationTriggers.push("technical_issue");
  }
  
  // If no escalation triggers selected, use defaults
  if (escalationTriggers.length === 0) {
    escalationTriggers.push("customer_angry", "technical_issue", "payment_dispute");
  }

  // Add call limits if available from UI
  const callLimits: LaunchCampaignPayload['callLimits'] | undefined = 
    (campaignData.maxCallsPerDay || campaignData.maxCallsPerHour || campaignData.maxConcurrentCalls) ? {
      dailyContactLimit: campaignData.maxCallsPerDay || 100,
      hourlyThrottle: campaignData.maxCallsPerHour || 10,
      maxConcurrentCalls: campaignData.maxConcurrentCalls || 5
    } : undefined;

  // Add retry logic if available from UI
  const retryLogic: LaunchCampaignPayload['retryLogic'] | undefined = 
    (campaignData.maxRetryAttempts || campaignData.retryDelayMinutes) ? {
      maxAttempts: campaignData.maxRetryAttempts || 1,
      retryDelay: (campaignData.retryDelayMinutes || 60) * 60, // Convert minutes to seconds
      smsSwitchover: true // Default to true for SMS fallback
    } : undefined;

  // Add handoff settings if available from UI
  const handoffSettings: LaunchCampaignPayload['handoffSettings'] | undefined = 
    campaignData.handoffSettings?.target ? {
      targerType: campaignData.handoffSettings.target === 'round_robin' ? 'human_agent' : 'specific_user',
      targetPhone: ["+1-555-000-1234", "+1-555-000-5678"] // Default phone numbers, could be made configurable
    } : undefined;

  const basePayload: LaunchCampaignPayload = {
    isCreated: true, // Set to true only in final campaign launch
    name: campaignData.campaignName,
    campaignType,
    campaignUseCase,
    teamAgentMappingId,
    enterpriseId: enterpriseId, 
    teamId: teamId, 
    customers,
    communicationChannel: "voice",
    // Always include all optional fields with proper defaults
    complianceSettings: complianceSettings.length > 0 ? complianceSettings : ["DNC_CHECK", "TCPA_COMPLIANT", "GDPR_COMPLIANT"],
    
    callLimits: callLimits || {
      dailyContactLimit: 100,
      hourlyThrottle: 10,
      maxConcurrentCalls: 5
    },
    retryLogic: retryLogic || {
      maxAttempts: 3,
      retryDelay: 3600,
      smsSwitchover: true
    },
    handoffSettings: handoffSettings || {
      targerType: "human_agent",
      targetPhone: ["+1-555-000-1234", "+1-555-000-5678"]
    },
    voicemailConfig: {
      method: campaignData.voicemailStrategy || "leave_message",
      voicemailMessage: campaignData.voicemailMessage || "Hi, this is a follow-up call regarding your recent inquiry. Please call us back at your convenience."
    },
    escalationTriggers: escalationTriggers.length > 0 ? escalationTriggers : ["customer_angry", "technical_issue", "payment_dispute"],
    // Always include start and end dates (with defaults if not provided)
    startDate: "",
    endDate: ""
  };

  // Add CRM import data if provided
  if (crmImportData && crmImportData.selectedUploadOption === 'crm' && crmImportData.crmSelection) {
    // Map CRM selection to import source
    const importSourceMap: Record<string, string> = {
      'vinsolutions': 'vin_solution',
      'others': 'others'
    };
    
    basePayload.importSource = importSourceMap[crmImportData.crmSelection] || crmImportData.crmSelection;
    
    // Add leads filter options based on the filter type
    if (crmImportData.enableRecurringLeads && crmImportData.leadAgeDays > 0) {
      // Recurring lead age filter
      basePayload.leadsFilterOptions = {
        recurringDays: crmImportData.leadAgeDays
      };
    } else if (!crmImportData.enableRecurringLeads && 
               crmImportData.vinSolutionsStartDate && 
               crmImportData.vinSolutionsEndDate) {
      // Date range filter - convert to UTC timestamps
      const startDateTime = crmImportData.vinSolutionsStartTime 
        ? `${crmImportData.vinSolutionsStartDate}T${crmImportData.vinSolutionsStartTime}:00.000Z`
        : `${crmImportData.vinSolutionsStartDate}T00:00:00.000Z`;
      
      const endDateTime = crmImportData.vinSolutionsEndTime 
        ? `${crmImportData.vinSolutionsEndDate}T${crmImportData.vinSolutionsEndTime}:00.000Z`
        : `${crmImportData.vinSolutionsEndDate}T23:59:59.000Z`;
      
      basePayload.leadsFilterOptions = {
        dateRange: {
          startDate: new Date(startDateTime).toISOString(),
          endDate: new Date(endDateTime).toISOString(),
          startTime: crmImportData.vinSolutionsStartTime || undefined,
          endTime: crmImportData.vinSolutionsEndTime || undefined
        }
      };
    }
  }

  // Add campaign ID if it exists (for final launch)
  if (existingCampaignId) {
    basePayload.campaignId = existingCampaignId;
  }

  // Set scheduling information
  if (campaignData.schedule === 'scheduled' && campaignData.scheduledDate && campaignData.scheduledTime) {
    // For scheduled campaigns, use provided date/time
    basePayload.startDate = new Date(`${campaignData.scheduledDate}T${campaignData.scheduledTime}:00.000Z`).toISOString();
    
    // Calculate end date based on provided end date or add 1 month as default
    if (campaignData.scheduledEndDate) {
      basePayload.endDate = new Date(`${campaignData.scheduledEndDate}T23:59:59.000Z`).toISOString();
    } else {
      const endDate = new Date(basePayload.startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      basePayload.endDate = endDate.toISOString();
    }
    
    // Only add scheduledTime for scheduled campaigns
    basePayload.scheduledTime = campaignData.dailyTimeSlots && campaignData.dailyTimeSlots.length > 0 
      ? convertTimeSlotsToApiFormat(campaignData.dailyTimeSlots)
      : [{ start: "09:00", end: "17:00" }]; // Default time slot for scheduled campaigns
  } else {
    // For "Start Now" campaigns, use current date/time
    const now = new Date();
    basePayload.startDate = now.toISOString();
    
    // End date 1 month from now for "Start Now" campaigns
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);
    basePayload.endDate = endDate.toISOString();
    
    // Do NOT include scheduledTime for "Start Now" campaigns
  }

  return basePayload;
}

export async function launchCampaign(payload: LaunchCampaignPayload, authKey?: string): Promise<CampaignApiResponse> {
  try {
    // Build URL with auth_key parameter
    const url = authKey ? `/api/launch-campaign?auth_key=${encodeURIComponent(authKey)}` : '/api/launch-campaign';
    
    const response = await fetch(url, {
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

export async function fetchCampaignList(enterpriseId: string, teamId: string, authKey?: string): Promise<CampaignListResponse> {
  try {
    const params = new URLSearchParams();
    params.append('enterpriseId', enterpriseId);
    params.append('teamId', teamId);
    // Add auth_key parameter
    if (authKey) {
      params.append('auth_key', authKey);
    }
    
    const response = await fetch(`/api/fetch-campaign-list?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching campaign list:', error);
    throw error;
  }
}

export async function fetchCampaignDetails(campaignId: string, authKey?: string): Promise<CampaignDetailResponse> {
  try {
    const params = new URLSearchParams();
    params.append('campaignId', campaignId);
    // Add auth_key parameter
    if (authKey) {
      params.append('auth_key', authKey);
    }
    
    const response = await fetch(`/api/fetch-campaign-details?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
            errorMessage += ` - ${errorText}`;
          }
        } catch {
          // Ignore if we can't get error details
        }
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching campaign details:', error);
    
    // Provide more specific error information
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to the server. Please check your internet connection and try again.');
    }
    
    throw error;
  }
}

export async function fetchCampaignTypes(authKey?: string): Promise<CampaignTypesResponse> {
  try {
    // Build URL with auth_key parameter
    const url = authKey ? `/api/fetch-campaign-types?auth_key=${encodeURIComponent(authKey)}` : '/api/fetch-campaign-types';
    const response = await fetch(url);

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
            errorMessage += ` - ${errorText}`;
          }
        } catch {
          // Ignore if we can't get error details
        }
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching campaign types:', error);
    
    // Provide more specific error information
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to the server. Please check your internet connection and try again.');
    }
    
    throw error;
  }
}

export async function processKeyMapping(requiredKeys: string[], availableKeys: string[], authKey?: string): Promise<KeyMappingResponse> {
  try {
    const payload: KeyMappingRequest = {
      requiredKeys,
      availableKeys
    };

    // Build URL with auth_key parameter
    const url = authKey ? `/api/keys-mapping?auth_key=${encodeURIComponent(authKey)}` : '/api/keys-mapping';

    const response = await fetch(url, {
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
    console.error('Error processing key mapping:', error);
    throw error;
  }
}
