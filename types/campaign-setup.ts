export interface SubCase {
  value: string;
  label: string;
  requiredFields: string[];
  disabled?: boolean;
  sampleCsv?: string;
}

export interface UseCase {
  label: string;
  color: string;
  disabled?: boolean;
  subCases: SubCase[];
}

export interface UseCases {
  [key: string]: UseCase;
}

export interface CampaignData {
  campaignName: string;
  useCase: string;
  subUseCase: string;
  bcdDetails: string;
  fileName: string;
  schedule: string;
  scheduledDate: string;
  scheduledEndDate: string;
  scheduledTime: string;
  dailyStartTime: string;
  dailyEndTime: string;
  dailyTimeSlots: TimeSlot[];
  totalRecords: number;
  channels: {
    email: boolean;
    sms: boolean;
    voiceAi: boolean;
  };
  scriptTemplate: {
    voiceIntroduction: string;
    corePitch: string;
    objectionHandling: string;
    legalConsent: string;
    optOut: string;
    handoffOffer: string;
  };
  compliance: {
    includeRecordingConsent: boolean;
    includeSmsOptOut: boolean;
  };
  maxRetryAttempts: number;
  retryDelayMinutes: number;
  callWindowStart: string;
  callWindowEnd: string;
  timezone: string;
  doNotCallList: boolean;
  maxCallsPerHour: number;
  maxCallsPerDay: number;
  maxConcurrentCalls: number;
  voicemailStrategy: string;
  busySignalRetry: boolean;
  noAnswerRetry: boolean;
  busyCustomerRetry: boolean;
  smsSwitchOnSecondAttempt: boolean;
  voicemailMessage: string;
  primaryGoal: string;
  secondaryActions: {
    sendInventoryLink: boolean;
    emailQuote: boolean;
    textFinanceLink: boolean;
  };
  // handoffSettings: {
  //   target: string;
  //   businessHoursStart: string;
  //   businessHoursEnd: string;
  // };
  // escalationTriggers: {
  //   leadRequestsPerson: boolean;
  //   complexFinancing: boolean;
  //   pricingNegotiation: boolean;
  //   technicalQuestions: boolean;
  // };
  vinSolutionsSettings?: {
    enableRecurringLeads: boolean;
    leadAgeDays: number;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
  };
  uploadedData?: any[];

  // CRM Import CSV data for download
  csvData?: {
    downloadUrl: string;
    fileName: string;
  };

  /** PRD §Campaign Creation — Channel selection (SMS/Call/Both) */
  channelMode?: 'sms' | 'call' | 'both';
  /** PRD §Message Schedule — per-day outbound SMS body + send time */
  messageSchedule?: Array<{
    day: number;
    body: string;
    sendTime: string; // "HH:MM"
  }>;
  /** Editable Call opener script (used on Day 2 First Contact in SMS+Call mode, or Day 1 in Call-only) */
  callOpenerScript?: string;
  /** Editable Final Attempt call script (used on the last day in SMS+Call mode when day >= 3) */
  callFinalAttemptScript?: string;
  /** Editable Recap SMS sent after a connected call on Day 2 in SMS+Call mode */
  recapSmsBody?: string;
  /** PRD §Step 4 — SMS quiet hours (lead's local timezone) */
  smsQuietStart?: string;
  smsQuietEnd?: string;
  /** PRD §Step 4 — Voicemail → SMS fallback */
  voicemailFallbackSms?: string;
  /** PRD §SMS-to-Call Escalation — intent signal toggles */
  escalationRules?: {
    customerRequestsCall: boolean;
    appointmentReadiness: boolean;
    priceNegotiation: boolean;
    tradeInDiscussion: boolean;
    financingQuestions: boolean;
    urgency: boolean;
  };
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

export interface ValidationErrors {
  campaignName: boolean;
  useCase: boolean;
  subUseCase: boolean;
  agentSelection: boolean;
  fileUpload: boolean;
  scheduledDate: boolean;
  scheduledEndDate: boolean;
  dailyStartTime: boolean;
  dailyEndTime: boolean;
  callWindowStart: boolean;
  callWindowEnd: boolean;
  handoffBusinessHoursStart: boolean;
  handoffBusinessHoursEnd: boolean;
  crmSelection: boolean;
  vinSolutionsDateRange: boolean;
  leadAgeDays: boolean;
  communicationChannels: boolean;
  campaignSummary: boolean;
  scheduleCampaign: boolean;
  voicemailStrategy: boolean;
  retrySettings: boolean;
  retryScenarios: boolean;
}

export interface SetupStep {
  id: number;
  name: string;
  number: string;
}
