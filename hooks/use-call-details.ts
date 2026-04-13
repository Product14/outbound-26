import { useState, useEffect } from 'react'
import { fetchSpyneCallReportById } from '@/lib/spyne-api'
import type { SpyneCallData } from '@/types/spyne-api'
import { OUTBOUND_USE_LOCAL_DATA } from '@/lib/outbound-local-data'

interface UseCallDetailsReturn {
  callDetails: SpyneCallData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  retry: () => Promise<void>
}

export function useCallDetails(callId: string | null): UseCallDetailsReturn {
  const [callDetails, setCallDetails] = useState<SpyneCallData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCallDetails = async () => {
    if (!callId) {
      setCallDetails(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (OUTBOUND_USE_LOCAL_DATA) {
        throw new Error('Using local mock data')
      }

      const data = await fetchSpyneCallReportById(callId)

      if (!data || !data.callId) {
        throw new Error('Invalid response data structure')
      }

      setCallDetails(data)
    } catch (err) {
      // API unavailable — use mock data so the drawer still renders
      const now = new Date().toISOString()
      const mockData: SpyneCallData = {
        _id: callId,
        callId,
        __v: 0,
        agentId: null,
        callDetails: {
          assistantId: 'mock-assistant',
          agentInfo: { agentName: 'AI Agent', agentType: 'outbound' },
          squadId: null,
          callType: 'outbound',
          startedAt: now,
          endedAt: now,
          recordingUrl: '',
          status: 'completed',
          endedReason: 'customer-ended',
          analysis: {
            summary: 'Call completed successfully.',
            structuredData: { name: '' },
            successEvaluation: 'true',
          },
          messages: [],
          formattedMessages: [],
          name: '',
          email: null,
          mobile: '',
        },
        createdAt: now,
        enterpriseId: 'mock',
        isActive: true,
        leadId: 'mock-lead',
        note: '',
        report: {
          title: 'Outbound Call',
          summary: ['Call was completed with the customer.'],
          actionItems: ['Follow up as needed.'],
          spam: 'false',
          qualified: 'true',
          appointmentPitched: 'false',
          followUps: { reason: '', intent: '', isFollowUp: false },
          callRageQuit: 'false',
          queryResolved: 'true',
          botIdentified: 'false',
          complaints: [],
          overview: {
            overall: {
              customerIntent: 'inquiry',
              sentiment: 'neutral',
              sentimentScore: 7,
              sentimentDropReasons: [],
              aiResponseQuality: {
                score: '8',
                metrics: {
                  responseRelevanceAndClarity: 'good',
                  followUpPrompting: 'good',
                  engagemetRetention: 'good',
                  toneAndProfessionalism: 'good',
                },
                whatAiCouldHaveDoneBetter: [],
                whatAiDidBetter: ['Maintained professional tone'],
              },
            },
            appointmentScheduled: 'false',
            appointmentType: '',
            callOutcome: 'information_provided',
            appointmentDetails: [],
          },
          sales: {
            vehicleRequested: [],
            leadQualificationScore: 'medium',
            vehicleType: '',
            budgetRange: '',
            budgetSensitivity: '',
            competitionName: '',
            financingRequest: 'false',
            tradeInMention: { value: 'false', vehicleName: '' },
            potentialUpsell: 'false',
          },
          service: {
            serviceRequested: { value: '', vehicleName: '' },
            serviceIntent: '',
            urgency: 'low',
            partsAvailable: 'true',
            pickupAndDropService: 'false',
            customerEscalations: 'false',
          },
        },
        teamAgentMappingId: null,
        teamId: 'mock',
        updatedAt: now,
        transcript: [],
      }
      setCallDetails(mockData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCallDetails()
  }, [callId])

  return {
    callDetails,
    loading,
    error,
    refetch: fetchCallDetails,
    retry: fetchCallDetails
  }
}
