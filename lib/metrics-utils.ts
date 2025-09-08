import type { CallRecord } from '@/types/call-record'

export interface CampaignMetrics {
  voicemailRate: {
    count: number
    percentage: number
  }
  callFailedRate: {
    count: number
    percentage: number
  }
  positiveFollowupRate: {
    count: number
    percentage: number
  }
  avgAiQualityScore: number
}

/**
 * Calculates campaign metrics from call records
 */
export function calculateCampaignMetrics(calls: CallRecord[]): CampaignMetrics {
  if (!calls || calls.length === 0) {
    return {
      voicemailRate: { count: 0, percentage: 0 },
      callFailedRate: { count: 0, percentage: 0 },
      positiveFollowupRate: { count: 0, percentage: 0 },
      avgAiQualityScore: 0
    }
  }

  const totalCalls = calls.length

  // Calculate voicemail calls
  const voicemailCalls = calls.filter(call => 
    call.outcome === 'No Answer' ||
    (call.report?.overview?.callOutcome?.toLowerCase().includes('voicemail'))
  ).length

  // Calculate failed calls
  const failedCalls = calls.filter(call => 
    call.outcome === 'Call Aborted' ||
    (call.report?.overview?.callOutcome?.toLowerCase().includes('failed')) ||
    (call.report?.overview?.callOutcome?.toLowerCase().includes('busy')) ||
    (call.report?.overview?.callOutcome?.toLowerCase().includes('disconnected'))
  ).length

  // Calculate positive followup calls
  const positiveFollowupCalls = calls.filter(call => {
    // Check if followup is needed and has positive sentiment
    const hasPositiveFollowup = call.follow_up?.needed && 
      (call.sentiment.label === 'positive' || call.sentiment.score > 0.6)
    
    return hasPositiveFollowup
  }).length

  // Calculate average AI quality score
  const aiScores = calls
    .map(call => call.ai_score)
    .filter(score => score > 0)
  
  const avgAiQualityScore = aiScores.length > 0 
    ? Math.round((aiScores.reduce((sum, score) => sum + score, 0) / aiScores.length) * 10) / 10
    : 0

  return {
    voicemailRate: {
      count: voicemailCalls,
      percentage: Math.round((voicemailCalls / totalCalls) * 100)
    },
    callFailedRate: {
      count: failedCalls,
      percentage: Math.round((failedCalls / totalCalls) * 100)
    },
    positiveFollowupRate: {
      count: positiveFollowupCalls,
      percentage: Math.round((positiveFollowupCalls / totalCalls) * 100)
    },
    avgAiQualityScore
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

  // Mock percentages based on typical campaign performance with some variation
  const baseVoicemailRate = campaignType === 'sales' ? 35 : 28
  const baseCallFailedRate = campaignType === 'sales' ? 15 : 12
  const basePositiveFollowupRate = campaignType === 'sales' ? 25 : 32
  const baseAvgQualityScore = campaignType === 'sales' ? 7.8 : 8.2

  // Add some realistic variation (+/- 3 percentage points)
  const voicemailRate = Math.max(5, Math.min(50, baseVoicemailRate + (Math.random() * 6 - 3)))
  const callFailedRate = Math.max(5, Math.min(25, baseCallFailedRate + (Math.random() * 4 - 2)))
  const positiveFollowupRate = Math.max(10, Math.min(40, basePositiveFollowupRate + (Math.random() * 6 - 3)))
  const avgQualityScore = Math.max(6.0, Math.min(10.0, baseAvgQualityScore + (Math.random() * 1.0 - 0.5)))

  return {
    voicemailRate: {
      count: Math.round((voicemailRate / 100) * totalCalls),
      percentage: Math.round(voicemailRate)
    },
    callFailedRate: {
      count: Math.round((callFailedRate / 100) * totalCalls),
      percentage: Math.round(callFailedRate)
    },
    positiveFollowupRate: {
      count: Math.round((positiveFollowupRate / 100) * totalCalls),
      percentage: Math.round(positiveFollowupRate)
    },
    avgAiQualityScore: Math.round(avgQualityScore * 10) / 10
  }
}
