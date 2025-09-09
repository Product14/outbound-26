import type { CallRecord } from '@/types/call-record'

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
