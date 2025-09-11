import type { CallRecord } from '@/types/call-record'

// API Response types for analytics
export interface CampaignAnalyticsResponse {
  campaignId: string
  campaignType: string
  campaignName: string
  overview: {
    totalLeads: number
    totalLeadsCalled: number
    totalCallsMade: number
    totalAppointments: number
    callbacksRequested: number
    callsAnswered: number
    avgCallDuration: string
  }
  performanceByTime: Array<{
    hour: string
    totalCalls: number
    successfulCalls: number
    successRate: number
  }>
  topPerformingVehicles: Array<{
    vehicleName: string
    appointmentsCount: number
    conversionRate: number
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
    percentage: number
  }
  avgCallDuration: {
    duration: string
  }
  callFailedPercentage: {
    percentage: number
  }
  percentageOfFollowups: {
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
      voicemailPercentage: { percentage: 0 },
      avgCallDuration: { duration: '0:00' },
      callFailedPercentage: { percentage: 0 },
      percentageOfFollowups: { percentage: 0 }
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
    voicemailPercentage: { percentage: voicemailPercentage },
    avgCallDuration: { duration: avgCallDuration },
    callFailedPercentage: { percentage: callFailedPercentage },
    percentageOfFollowups: { percentage: percentageOfFollowups }
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

  return {
    totalCallsMade: { count: totalCalls },
    totalCustomersContacted: { count: customersContacted },
    totalAppointmentsSet: { count: appointmentsSet },
    answerRate: { percentage: Math.round(answerRate) },
    voicemailPercentage: { percentage: Math.round(voicemailRate) },
    avgCallDuration: { duration: avgCallDuration },
    callFailedPercentage: { percentage: Math.round(callFailedRate) },
    percentageOfFollowups: { percentage: Math.round(followupRate) }
  }
}

/**
 * Calculate campaign metrics from real API analytics data
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
      voicemailPercentage: { percentage: 0 },
      avgCallDuration: { duration: '0:00' },
      callFailedPercentage: { percentage: 0 },
      percentageOfFollowups: { percentage: 0 }
    }
  }

  const overview = analyticsData.overview

  // Total Calls Made = totalLeads from analytics API
  const totalCallsMade = overview.totalLeads || 0

  // Total Contacted = show "--" since not available in API
  const totalCustomersContacted = 0 // Will show as "--"

  // Total Appointments = totalAppointments from analytics API
  const totalAppointments = overview.totalAppointments || 0

  // Answer Rate = callsAnswered from analytics API
  const callsAnswered = overview.callsAnswered || 0
  const answerRate = totalCallsMade > 0 ? Math.round((callsAnswered / totalCallsMade) * 100) : 0

  // Voice Mail % = calculate from completed calls data
  let voicemailPercentage = 0
  if (completedCallsData?.completedTasks) {
    const voicemailCalls = completedCallsData.completedTasks.filter(task => 
      task.errorReason === 'customer-voicemail' || 
      task.errorReason === 'voicemail'
    ).length
    const totalCompletedCalls = completedCallsData.completedTasks.length
    voicemailPercentage = totalCompletedCalls > 0 ? Math.round((voicemailCalls / totalCompletedCalls) * 100) : 0
  }

  // Avg. Call Duration = avgCallDuration from analytics API
  const avgCallDuration = overview.avgCallDuration || '0:00'

  // Call failed % = calculate from completed calls data where status is CALL_FAILED
  let callFailedPercentage = 0
  if (completedCallsData?.completedTasks) {
    const failedCalls = completedCallsData.completedTasks.filter(task => 
      task.status === 'CALL_FAILED'
    ).length
    const totalCompletedCalls = completedCallsData.completedTasks.length
    callFailedPercentage = totalCompletedCalls > 0 ? Math.round((failedCalls / totalCompletedCalls) * 100) : 0
  }

  // % of followups = callbacksRequested from analytics API
  const callbacksRequested = overview.callbacksRequested || 0
  const percentageOfFollowups = totalCallsMade > 0 ? Math.round((callbacksRequested / totalCallsMade) * 100) : 0

  return {
    totalCallsMade: { count: totalCallsMade },
    totalCustomersContacted: { count: totalCustomersContacted }, // Will show as "--"
    totalAppointmentsSet: { count: totalAppointments },
    answerRate: { percentage: answerRate },
    voicemailPercentage: { percentage: voicemailPercentage },
    avgCallDuration: { duration: avgCallDuration },
    callFailedPercentage: { percentage: callFailedPercentage },
    percentageOfFollowups: { percentage: percentageOfFollowups }
  }
}
