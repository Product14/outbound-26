// Types for Spyne AI API Response
export interface SpyneApiResponse {
  data: SpyneCallData[]
  analytics: SpyneAnalytics
  pagination: SpynePagination
}

export interface SpyneCallData {
  _id: string
  callId: string
  __v: number
  agentId: string | null
  callDetails: {
    assistantId: string
    agentInfo: {
      agentName: string
      agentType: string
    }
    squadId: string | null
    callType: string
    startedAt: string
    endedAt: string
    recordingUrl: string
    status: string
    endedReason: string
    analysis: {
      summary: string
      structuredData: {
        name: string
      }
      successEvaluation: string
    }
    messages: SpyneMessage[]
    formattedMessages: SpyneFormattedMessage[]
    name: string
    email: string | null
    mobile: string
  }
  createdAt: string
  enterpriseId: string
  isActive: boolean
  leadId: string
  note: string
  report: {
    useCase?: string
    title: string
    summary: string[]
    actionItems: string[]
    // Some payloads include top-level Outcome in report
    Outcome?: string
    spam: string
    qualified: string
    appointmentPitched: string
    followUps: {
      reason: string
      intent: string
      isFollowUp: boolean
    }
    callRageQuit: string
    queryResolved: string
    botIdentified: string
    complaints: string[]
    overview: {
      overall: {
        customerIntent: string
        sentiment: string
        sentimentScore: number
        sentimentDropReasons: string[]
        aiResponseQuality: {
          score: string
          metrics: {
            responseRelevanceAndClarity: string
            followUpPrompting: string
            engagemetRetention: string
            toneAndProfessionalism: string
          }
          whatAiCouldHaveDoneBetter: string[]
          whatAiDidBetter: string[]
        }
      }
      appointmentScheduled: string
      appointmentType: string
      callOutcome: string
      appointmentDetails: string[]
    }
    sales: {
      vehicleRequested: Array<{
        vehicleName: string
      }>
      leadQualificationScore: string
      vehicleType: string
      budgetRange: string
      budgetSensitivity: string
      competitionName: string
      financingRequest: string
      tradeInMention: {
        value: string
        vehicleName: string
      }
      potentialUpsell: string
    }
    service: {
      serviceRequested: {
        value: string
        vehicleName: string
        services?: string[]
      }
      serviceIntent: string
      urgency: string
      partsAvailable: string
      pickupAndDropService: string
      customerEscalations: string
    }
  }
  teamAgentMappingId: string | null
  teamId: string
  updatedAt: string
  voiceRecordingUrl?: string
  recordingUrl?: string
  audioUrl?: string
  transcript?: SpyneTranscriptEntry[]
  callDuration?: number // Duration in seconds from the API
}

export interface SpyneMessage {
  role: string // "bot" or "user"
  message: string
  time?: number
  endTime?: number
  duration?: number
  secondsFromStart?: number
}

export interface SpyneFormattedMessage {
  role: string
  content: string
  time?: number
  endTime?: number
  duration?: number
  secondsFromStart?: number
}

export interface SpyneTranscriptEntry {
  speaker: string
  text: string
  timestamp: number // in seconds
  duration?: number
}

export interface SpyneAnalytics {
  totalCalls: number
  appointmentCount: number
  sentimentBreakdown: {
    happy: number
    sad: number
    angry: number
    neutral: number
  }
  avgAiScore: number
  sentimentAnalysis: Array<{
    label: string
    value: number
  }>
  // Agent type totals across the full result set, e.g., { "Service": 67, "Sales": 6 }
  agentTypeCounts?: Record<string, number>
}

export interface SpynePagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// API Parameters
export interface SpyneApiParams {
  enterpriseId: string
  teamId: string
  page?: number
  limit?: number
  // Optional date filtering params for consolidated reports endpoint
  dateRange?: string // e.g., "custom"
  customStartDate?: string // ISO string
  customEndDate?: string // ISO string
  // Backend-driven resolution filter (Spyne expects outcome=yes/no for query resolution)
  outcome?: string // 'yes' | 'no'
  // Agent type filter for Sales/Service tabs
  agentType?: string // 'Sales' | 'Service'
}
