import { useState, useEffect } from 'react'
import { extractUrlParams } from '@/lib/url-utils'
import {
  getMockEndCallReport,
  OUTBOUND_USE_LOCAL_DATA,
} from '@/lib/outbound-local-data'

// Helper functions for data processing
function calculateCallDuration(startTime: string, endTime: string): number {
  try {
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()
    return Math.round((end - start) / 1000) // Return duration in seconds
  } catch (error) {
    return 0
  }
}

function processTranscript(messages: any[]): Array<{
  speaker: string
  text: string
  timestamp: number
  duration?: number
}> {
  if (!messages || !Array.isArray(messages)) return []
  
  return messages
    .filter(msg => msg.message && msg.message.trim().length > 0)
    .map(msg => ({
      speaker: msg.role === 'bot' ? 'Agent' : 'Customer',
      text: msg.message,
      timestamp: Math.round(msg.secondsFromStart || 0),
      duration: msg.duration ? Math.round(msg.duration / 1000) : undefined
    }))
}

// Types for the actual Spyne API response
export interface SpyneApiResponse {
  _id: string
  callId: string
  __v: number
  agentId: string
  callDetails: {
    assistantId: string | null
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
        name?: string
        mobile?: string
      }
      successEvaluation: string
    }
    messages: Array<{
      role: string
      time: number
      source: string
      endTime: number
      message: string
      duration: number
      secondsFromStart: number
      issueCount: number
    }>
    formattedMessages: Array<{
      content: string
      secondsFromStart: number
      role?: string
      time?: number
      endTime?: number
      message?: string
      duration?: number
    }>
    name: string | null
    email: string | null
    mobile: string
    transcript: string
  }
  campaignId: string
  createdAt: string
  enterpriseId: string
  isActive: boolean
  leadId: string
  note: string
  outboundTaskId: string
  report: {
    title: string
    Name: string
    Mobile: string
    Email: string
    useCase: string
    inOutType: string
    summary: string[]
    customerSummary: string[]
    customerSummarySMS: string
    SummarySMS: string
    actionItems: string[]
    spam: string
    qualified: string
    appointmentPitched: string
    followUps: {
      reason: string
      intent: string
      isFollowUp: boolean
    }
    callRageQuit: string
    Outcome: string
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
      callbackScheduled: string
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
        services: string[]
      }
      serviceIntent: string
      urgency: string
      partsAvailable: string
      pickupAndDropService: string
    }
    call_type: string
    aiScore: {
      totalScore: number
      breakdown: any
    }
  }
  teamAgentMappingId: string
  teamId: string
  updatedAt: string
  entityFlowStatus: string
}

// Processed data interface for the component
export interface EndCallReportData {
  callId: string
  status: string
  duration: number
  transcript: Array<{
    speaker: string
    text: string
    timestamp: number
    duration?: number
  }>
  summary: string
  outcome: string
  sentiment: {
    score: number
    label: string
  }
  customerInfo: {
    name: string
    phone: string
    email?: string
  }
  agentInfo: {
    name: string
    id: string
  }
  recordingUrl?: string
  aiScore?: number
  actionItems?: string[]
  appointmentDetails?: {
    type: string
    status: string
    scheduledAt?: string
    location?: string
  }
  metrics: {
    talkTime: number
    holdTime: number
    silenceTime: number
  }
  analysis?: {
    highlights: string[]
    nextActions: string[]
    customerSatisfaction: number
  }
}

interface UseEndCallReportReturn {
  reportData: EndCallReportData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  retry: () => Promise<void>
}

export function useEndCallReport(callId: string | null): UseEndCallReportReturn {
  const [reportData, setReportData] = useState<EndCallReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEndCallReport = async () => {
    if (!callId) {
      setReportData(null)
      return
    }


    setLoading(true)
    setError(null)

    try {
      if (OUTBOUND_USE_LOCAL_DATA) {
        setReportData(getMockEndCallReport(callId))
        return
      }

      // Get URL parameters for authentication
      const urlParams = extractUrlParams()
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      // Add Authorization header if authKey is available
      if (urlParams.auth_key) {
        headers['Authorization'] = urlParams.auth_key.startsWith('Bearer ') ? urlParams.auth_key : `Bearer ${urlParams.auth_key}`
      }
      
      const apiUrl = `/api/fetch-end-call-report?callId=${encodeURIComponent(callId)}`
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers,
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch end call report: ${response.status} ${response.statusText}`)
      }

      const rawData: SpyneApiResponse = await response.json()
      
      // Validate the raw data structure
      if (!rawData || !rawData.callId) {
        throw new Error('Invalid response data structure')
      }
      
      // Transform the API response to match our component interface
      const processedData: EndCallReportData = {
        callId: rawData.callId,
        status: rawData.callDetails.status,
        duration: calculateCallDuration(rawData.callDetails.startedAt, rawData.callDetails.endedAt),
        transcript: processTranscript(rawData.callDetails.messages),
        summary: rawData.callDetails.analysis.summary || 'No summary available',
        outcome: rawData.report.Outcome || '--',
        sentiment: {
          score: rawData.report.overview.overall.sentimentScore || 0,
          label: rawData.report.overview.overall.sentiment || 'neutral'
        },
        customerInfo: {
          name: rawData.callDetails.name || rawData.report.Name || 'Unknown',
          phone: rawData.callDetails.mobile || rawData.report.Mobile || 'No phone',
          email: rawData.callDetails.email || rawData.report.Email || undefined
        },
        agentInfo: {
          name: rawData.callDetails.agentInfo?.agentName || 'AI Agent',
          id: rawData.agentId
        },
        recordingUrl: rawData.callDetails.recordingUrl,
        aiScore: parseFloat(rawData.report.overview.overall.aiResponseQuality?.score || '0') || undefined,
        actionItems: rawData.report.actionItems || [],
        appointmentDetails: {
          type: rawData.report.overview.appointmentType || 'Not specified',
          status: rawData.report.overview.appointmentScheduled || 'No status',
          scheduledAt: undefined, // Not available in this API response
          location: undefined // Not available in this API response
        },
        metrics: {
          talkTime: calculateCallDuration(rawData.callDetails.startedAt, rawData.callDetails.endedAt),
          holdTime: 0, // Not available in this API response
          silenceTime: 0 // Not available in this API response
        },
        analysis: {
          highlights: rawData.report.summary || [],
          nextActions: rawData.report.actionItems || [],
          customerSatisfaction: rawData.report.overview.overall.sentimentScore || 0
        }
      }
      
      setReportData(processedData)

    } catch (err) {
      // API unavailable — use mock data so the drawer still renders
      const mockReport: EndCallReportData = {
        callId: callId || 'mock',
        status: 'completed',
        duration: 204,
        transcript: [
          { speaker: 'Agent', text: 'Hello, this is AI Agent calling. May I speak with the customer?', timestamp: 0, duration: 3 },
          { speaker: 'Customer', text: 'Yes, speaking.', timestamp: 3, duration: 2 },
          { speaker: 'Agent', text: 'I\'m reaching out about your upcoming appointment. Are you still available?', timestamp: 5, duration: 4 },
          { speaker: 'Customer', text: 'Yes, that works for me.', timestamp: 9, duration: 2 },
        ],
        summary: 'Customer confirmed their appointment and was satisfied with the interaction.',
        outcome: 'Appointment Confirmed',
        sentiment: { score: 8, label: 'positive' },
        customerInfo: { name: 'Customer', phone: '+1-555-0000' },
        agentInfo: { name: 'AI Agent', id: 'mock-agent' },
        recordingUrl: undefined,
        aiScore: 8,
        actionItems: ['Send appointment confirmation email', 'Prepare notes for follow-up'],
        appointmentDetails: { type: 'Service', status: 'Scheduled', scheduledAt: undefined, location: undefined },
        metrics: { talkTime: 204, holdTime: 0, silenceTime: 15 },
        analysis: {
          highlights: ['Customer confirmed appointment', 'Positive sentiment throughout call'],
          nextActions: ['Send confirmation', 'Follow up 24h before appointment'],
          customerSatisfaction: 8,
        },
      }
      setReportData(mockReport)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEndCallReport()
  }, [callId])

  return {
    reportData,
    loading,
    error,
    refetch: fetchEndCallReport,
    retry: fetchEndCallReport
  }
}
