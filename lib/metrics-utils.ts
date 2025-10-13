import type { CallRecord } from '@/types/call-record'

// API Response types for analytics - Updated to match new backend structure
export interface CampaignAnalyticsResponse {
  campaignId: string
  campaignType: string
  campaignName: string
  campaignStatus: string // Campaign status from analytics API
  schedule: {
    startTime: string
    endTime: string
    startDate: string
    endDate: string
  }
  agentName: string
  createdAt: string
  // Newer shape: top-level aggregate fields
  totalLeads?: number
  totalLeadsContacted?: number
  totalCallsMade?: number
  totalCallsInitiated?: number
  totalConnectedCalls?: number
  totalCallsFailed?: number
  totalVoicemailCount?: number
  totalAppointments?: number
  callbacksRequested?: number
  avgCallDuration?: string
  // Raw tasks for derivation when overview is absent
  tasks?: Array<{
    status?: string
    connectionStatus?: string
    errorReason?: string
    duration?: string
    outcome?: string
    appointmentScheduled?: boolean
  }>
  overview: {
    totalLeads: number
    totalLeadsCalled: number
    totalCallsMade: number
    totalCallsInitiated: number
    totalConnectedCalls: number
    totalCallsFailed: number
    totalVoicemailCount: number
    totalAppointments: number
    callbacksRequested: number
    avgCallDuration: string
  }
  performanceByTime: Array<{
    hour: string
    totalCalls: number
    successfulCalls: number
    successRate: number
  }>
  topPerformingVehicles?: Array<{
    vehicleName: string
    appointmentsCount: number
    conversionRate: number
  }>
  topPerformingServices?: Array<{
    service: string
    appointments: number
  }>
}

// Interface for completed calls data (to calculate call failed %)
export interface CompletedTask {
  outboundTaskId: string
  status: string
  leadId: string
  leadName: string
  phoneNumber: string
  email: string
  vehicleName: string
  vehicleIdentificationNumber: {
    vin: string
    stock: string
    registration: string
  }
  serviceName: string
  retryCount: number
  errorReason: string
  completedAt: string
  outcome: string
  actionItems: string[]
  queryResolved: string
  callbackRequested: boolean
  customerSentimentScore: number
  aiSentimentScore: string
}

export interface CampaignCompletedResponse {
  campaignId: string
  campaignName: string
  campaignType: string
  status: string
  totalLeads: number
  agentName: string
  enterpriseId: string
  teamId: string
  totalCompletedCalls: number
  completedTasks: CompletedTask[]
  lastUpdated: string
}

export interface CampaignMetrics {
  totalCallsMade: {
    count: number
  }
  totalCustomersContacted: {
    count: number
  }
  totalAppointmentsSet: {
    count: number
  }
  answerRate: {
    percentage: number
  }
  voicemailPercentage: {
    count: number
    percentage: number
  }
  avgCallDuration: {
    duration: string
  }
  callFailedPercentage: {
    count: number
    percentage: number
  }
  callRejectedPercentage?: {
    count: number
    percentage: number
  }
  percentageOfFollowups: {
    count: number
    percentage: number
  }
}

/**
 * Calculates campaign metrics from call records
 */
export function calculateCampaignMetrics(calls: CallRecord[]): CampaignMetrics {
  if (!calls || calls.length === 0) {
    return {
      totalCallsMade: { count: 0 },
      totalCustomersContacted: { count: 0 },
      totalAppointmentsSet: { count: 0 },
      answerRate: { percentage: 0 },
      voicemailPercentage: { count: 0, percentage: 0 },
      avgCallDuration: { duration: '0:00' },
      callFailedPercentage: { count: 0, percentage: 0 },
      percentageOfFollowups: { count: 0, percentage: 0 }
    }
  }

  const totalCalls = calls.length

  // Calculate customers contacted (calls that were answered)
  const customersContacted = calls.filter(call => 
    call.outcome !== 'No Answer' &&
    call.outcome !== 'Call Aborted' &&
    !call.outcome.toLowerCase().includes('voicemail') &&
    !call.outcome.toLowerCase().includes('failed') &&
    !call.outcome.toLowerCase().includes('busy')
  ).length

  // Calculate appointments set
  const appointmentsSet = calls.filter(call => 
    call.appointment?.status === 'scheduled' ||
    call.outcome.toLowerCase().includes('appointment') ||
    call.outcome.toLowerCase().includes('scheduled')
  ).length

  // Calculate answer rate
  const answerRate = totalCalls > 0 ? Math.round((customersContacted / totalCalls) * 100) : 0

  // Calculate voicemail calls
  const voicemailCalls = calls.filter(call => 
    call.outcome === 'No Answer' ||
    call.outcome.toLowerCase().includes('voicemail')
  ).length
  const voicemailPercentage = totalCalls > 0 ? Math.round((voicemailCalls / totalCalls) * 100) : 0

  // Calculate average call duration
  const callDurations = calls
    .map(call => call.metrics?.duration_sec || 0)
    .filter(duration => duration > 0)
  
  const avgDurationSec = callDurations.length > 0 
    ? Math.round(callDurations.reduce((sum, duration) => sum + duration, 0) / callDurations.length)
    : 0
  
  const avgCallDuration = `${Math.floor(avgDurationSec / 60)}:${(avgDurationSec % 60).toString().padStart(2, '0')}`

  // Calculate failed calls
  const failedCalls = calls.filter(call => 
    call.outcome === 'Call Aborted' ||
    call.outcome.toLowerCase().includes('failed') ||
    call.outcome.toLowerCase().includes('busy') ||
    call.outcome.toLowerCase().includes('disconnected')
  ).length
  const callFailedPercentage = totalCalls > 0 ? Math.round((failedCalls / totalCalls) * 100) : 0

  // Calculate followup calls
  const followupCalls = calls.filter(call => call.follow_up?.needed).length
  const percentageOfFollowups = totalCalls > 0 ? Math.round((followupCalls / totalCalls) * 100) : 0

  return {
    totalCallsMade: { count: totalCalls },
    totalCustomersContacted: { count: customersContacted },
    totalAppointmentsSet: { count: appointmentsSet },
    answerRate: { percentage: answerRate },
    voicemailPercentage: { count: voicemailCalls, percentage: voicemailPercentage },
    avgCallDuration: { duration: avgCallDuration },
    callFailedPercentage: { count: failedCalls, percentage: callFailedPercentage },
    percentageOfFollowups: { count: followupCalls, percentage: percentageOfFollowups }
  }
}

/**
 * Calculates metrics from mock data when no real call data is available
 */
export function calculateMockCampaignMetrics(totalCalls: number, campaignType: 'sales' | 'service' = 'sales'): CampaignMetrics {
  // If no calls, return default values with some dummy data for display
  if (totalCalls === 0) {
    totalCalls = campaignType === 'sales' ? 150 : 200
  }

  // Mock percentages based on typical campaign performance
  const baseAnswerRate = campaignType === 'sales' ? 65 : 72
  const baseVoicemailRate = campaignType === 'sales' ? 24 : 18
  const baseCallFailedRate = campaignType === 'sales' ? 8 : 6
  const baseFollowupRate = campaignType === 'sales' ? 17 : 24
  const baseAvgDurationMin = campaignType === 'sales' ? 3.2 : 2.8

  // Use fixed values for consistency
  const answerRate = baseAnswerRate
  const voicemailRate = baseVoicemailRate
  const callFailedRate = baseCallFailedRate
  const followupRate = baseFollowupRate
  const avgDurationMin = baseAvgDurationMin

  const customersContacted = Math.round((answerRate / 100) * totalCalls)
  const appointmentsSet = Math.round(customersContacted * (campaignType === 'sales' ? 0.35 : 0.42))
  const avgDurationSec = Math.round(avgDurationMin * 60)
  const avgCallDuration = `${Math.floor(avgDurationSec / 60)}:${(avgDurationSec % 60).toString().padStart(2, '0')}`
  
  const voicemailCount = Math.round((voicemailRate / 100) * totalCalls)
  const failedCount = Math.round((callFailedRate / 100) * totalCalls)
  const followupCount = Math.round((followupRate / 100) * totalCalls)

  return {
    totalCallsMade: { count: totalCalls },
    totalCustomersContacted: { count: customersContacted },
    totalAppointmentsSet: { count: appointmentsSet },
    answerRate: { percentage: Math.round(answerRate) },
    voicemailPercentage: { count: voicemailCount, percentage: Math.round(voicemailRate) },
    avgCallDuration: { duration: avgCallDuration },
    callFailedPercentage: { count: failedCount, percentage: Math.round(callFailedRate) },
    percentageOfFollowups: { count: followupCount, percentage: Math.round(followupRate) }
  }
}

/**
 * Calculate campaign metrics from real API analytics data - Updated for new backend structure
 */
export function calculateCampaignMetricsFromAPI(
  analyticsData: CampaignAnalyticsResponse | null, 
  completedCallsData: CampaignCompletedResponse | null
): CampaignMetrics {
  if (!analyticsData) {
    return {
      totalCallsMade: { count: 0 },
      totalCustomersContacted: { count: 0 },
      totalAppointmentsSet: { count: 0 },
      answerRate: { percentage: 0 },
      voicemailPercentage: { count: 0, percentage: 0 },
      avgCallDuration: { duration: '0:00' },
      callFailedPercentage: { count: 0, percentage: 0 },
      callRejectedPercentage: { count: 0, percentage: 0 },
      percentageOfFollowups: { count: 0, percentage: 0 }
    }
  }

  // Prefer overview when present; else derive from top-level fields and tasks
  const ov = analyticsData.overview
  const totalLeads = ov?.totalLeads ?? analyticsData.totalLeads ?? 0
  const totalCustomersContacted = ov?.totalConnectedCalls ?? analyticsData.totalLeadsContacted ?? analyticsData.totalConnectedCalls ?? 0
  const totalAppointments = ov?.totalAppointments ?? analyticsData.totalAppointments ?? (() => {
    const tasks = analyticsData.tasks || []
    return tasks.filter(t => t.appointmentScheduled || (t.outcome || '').toLowerCase().includes('appointment')).length
  })()
  const totalCallsMade = ov?.totalCallsMade ?? analyticsData.totalCallsMade ?? analyticsData.totalCallsInitiated ?? 0

  // Derive voicemail / failed / not picked when not provided
  const tasks = analyticsData.tasks || []
  const voicemailCount = ov?.totalVoicemailCount ?? analyticsData.totalVoicemailCount ?? tasks.filter(t => t.errorReason === 'voicemail').length
  const callsNotPicked = (ov as any)?.totalCallsNotPicked ?? (tasks.filter(t => t.errorReason === 'customer-did-not-answer' || t.errorReason === 'customer-busy').length)
  const callsFailed = ov?.totalCallsFailed ?? analyticsData.totalCallsFailed ?? tasks.filter(t => {
    if (!t.errorReason) return false
    // Treat non-voicemail and non-not-picked error reasons as failed
    return t.errorReason !== 'voicemail' && t.errorReason !== 'customer-did-not-answer' && t.errorReason !== 'customer-busy'
  }).length

  // Avg call duration: prefer provided, else compute from tasks (MM:SS)
  const avgCallDuration = ov?.avgCallDuration ?? analyticsData.avgCallDuration ?? (() => {
    const durations = tasks
      .map(t => t.duration)
      .filter((d): d is string => typeof d === 'string' && /\d+:\d{2}/.test(d))
      .map(d => {
        const [m, s] = d.split(':').map(x => parseInt(x, 10) || 0)
        return m * 60 + s
      })
    if (durations.length === 0) return '0:00'
    const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    const m = Math.floor(avg / 60)
    const s = (avg % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  })()

  // Percentages use totalLeads as denominator
  const answerRate = totalLeads > 0 ? Math.round((totalCustomersContacted / totalLeads) * 100) : 0
  const voicemailPercentage = totalLeads > 0 ? Math.round((voicemailCount / totalLeads) * 100) : 0
  const callFailedPercentage = totalLeads > 0 ? Math.round((callsFailed / totalLeads) * 100) : 0
  const callRejectedPercentage = totalLeads > 0 ? Math.round((callsNotPicked / totalLeads) * 100) : 0
  const callbacksRequested = ov?.callbacksRequested ?? analyticsData.callbacksRequested ?? 0
  const percentageOfFollowups = totalLeads > 0 ? Math.round((callbacksRequested / totalLeads) * 100) : 0

  return {
    totalCallsMade: { count: totalCallsMade },
    totalCustomersContacted: { count: totalCustomersContacted },
    totalAppointmentsSet: { count: totalAppointments },
    answerRate: { percentage: answerRate },
    voicemailPercentage: { count: voicemailCount, percentage: voicemailPercentage },
    avgCallDuration: { duration: avgCallDuration },
    callFailedPercentage: { count: callsFailed, percentage: callFailedPercentage },
    callRejectedPercentage: { count: callsNotPicked, percentage: callRejectedPercentage },
    percentageOfFollowups: { count: callbacksRequested, percentage: percentageOfFollowups }
  }
}
