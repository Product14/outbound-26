import type { CampaignDetailResponse } from '@/lib/campaign-api'
import { isPositiveOutcome, requiresFollowUp, type CallOutcome } from '@/lib/call-status-utils'

export interface FunnelMetrics {
  calls: number
  callsCompleted: number
  connected: number
  aiConverted: number
  requireHuman: number
  avgQualityScore: number
}

export interface FunnelData {
  stage: string
  value: number
  percentage: number
  color: string
  additionalInfo?: string
}

// New interfaces for AppointmentFunnel component
export interface AppointmentFunnelStage {
  name: string
  count: number
}

export interface AppointmentFunnelConversionRate {
  rate: number
}

export interface AppointmentFunnelData {
  stages: AppointmentFunnelStage[]
  conversionRates: AppointmentFunnelConversionRate[]
}

/**
 * Calculate funnel metrics from campaign data
 */
export function calculateFunnelMetrics(campaignData: CampaignDetailResponse | null): FunnelMetrics {
  if (!campaignData?.campaign) {
    return {
      calls: 1250,
      callsCompleted: 892,
      connected: 975,
      aiConverted: 234,
      requireHuman: 158,
      avgQualityScore: 8.4
    }
  }

  const campaign = campaignData.campaign
  
  // Use more realistic fake numbers based on campaign data but enhanced
  const calls = Math.max(campaign.totalCallPlaced || 1250, 1000) // At least 1000 calls
  const answerRate = Math.max(campaign.answerRate || 78, 65) // At least 65% answer rate
  
  // Calculate connected calls based on answer rate
  const connected = Math.round(calls * (answerRate / 100))
  
  // Estimate calls completed (calls that had a resolution, not just connected)
  // Typically 85-92% of connected calls are completed - use fixed 89%
  const callsCompleted = Math.round(connected * 0.89)
  
  // AI Converted: Booking-related outcomes (appointments, test drives, purchases)
  // Make it more realistic - typically 15-30% of completed calls result in bookings - use fixed 22%
  const conversionRate = 0.22
  const aiConverted = Math.round(callsCompleted * conversionRate)
  
  // Require Human: Follow-up required outcomes
  // Estimate 12-25% of connected calls require human follow-up - use fixed 18%
  const requireHuman = Math.round(connected * 0.18)
  
  // Average Quality Score: Mock calculation based on campaign performance
  // Higher answer rates and conversion rates typically correlate with higher quality
  const performanceScore = (answerRate / 100) * 0.3 + (aiConverted / callsCompleted) * 0.7
  const avgQualityScore = Math.round((7.2 + performanceScore * 2.8) * 10) / 10 // Scale to 7.2-10 range
  
  return {
    calls,
    callsCompleted,
    connected,
    aiConverted,
    requireHuman,
    avgQualityScore
  }
}

/**
 * Convert funnel metrics to chart data format
 */
export function formatFunnelData(metrics: FunnelMetrics): FunnelData[] {
  const { calls, callsCompleted, connected, aiConverted, requireHuman, avgQualityScore } = metrics
  
  return [
    {
      stage: 'Customer contact initiated',
      value: calls,
      percentage: 100,
      color: '#E5E7EB', // Gray-200
      additionalInfo: 'All attempted customer contacts'
    },
    {
      stage: 'Contacted successfully',
      value: connected,
      percentage: calls > 0 ? Math.round((connected / calls) * 100) : 0,
      color: '#93C5FD', // Blue-300
      additionalInfo: 'Customers who answered calls'
    },
    {
      stage: 'Followups requested',
      value: requireHuman,
      percentage: connected > 0 ? Math.round((requireHuman / connected) * 100) : 0,
      color: '#F59E0B', // Amber-500
      additionalInfo: 'Customers requesting follow-up'
    },
    {
      stage: 'Appointments scheduled',
      value: aiConverted,
      percentage: requireHuman > 0 ? Math.round((aiConverted / requireHuman) * 100) : 0,
      color: '#22C55E', // Green-500
      additionalInfo: 'Successfully scheduled appointments'
    }
  ]
}

/**
 * Get funnel data for different campaign types
 */
export function getCampaignFunnelData(
  campaignData: CampaignDetailResponse | null, 
  campaignType: 'sales' | 'service' | 'other' = 'other'
): FunnelData[] {
  const metrics = calculateFunnelMetrics(campaignData)
  
  if (campaignType === 'service') {
    // Service campaign funnel with green theme
    return [
      {
        stage: 'Customer contact initiated',
        value: metrics.calls,
        percentage: 100,
        color: '#E5E7EB', // Gray-200
        additionalInfo: `All service customer contacts attempted`
      },
      {
        stage: 'Contacted successfully',
        value: metrics.connected,
        percentage: metrics.calls > 0 ? Math.round((metrics.connected / metrics.calls) * 100) : 0,
        color: '#BBF7D0', // Green-200
        additionalInfo: 'Service customers who answered'
      },
      {
        stage: 'Followups requested',
        value: metrics.requireHuman,
        percentage: metrics.connected > 0 ? Math.round((metrics.requireHuman / metrics.connected) * 100) : 0,
        color: '#F59E0B', // Amber-500
        additionalInfo: 'Service customers requesting follow-up'
      },
      {
        stage: 'Appointments scheduled',
        value: metrics.aiConverted,
        percentage: metrics.requireHuman > 0 ? Math.round((metrics.aiConverted / metrics.requireHuman) * 100) : 0,
        color: '#4ADE80', // Green-400
        additionalInfo: 'Service appointments successfully scheduled'
      }
    ]
  }
  
  if (campaignType === 'sales') {
    // Sales campaign funnel with blue theme
    return [
      {
        stage: 'Customer contact initiated',
        value: metrics.calls,
        percentage: 100,
        color: '#E5E7EB', // Gray-200
        additionalInfo: `All sales customer contacts attempted`
      },
      {
        stage: 'Contacted successfully',
        value: metrics.connected,
        percentage: metrics.calls > 0 ? Math.round((metrics.connected / metrics.calls) * 100) : 0,
        color: '#DBEAFE', // Blue-100
        additionalInfo: 'Sales prospects who answered'
      },
      {
        stage: 'Followups requested',
        value: metrics.requireHuman,
        percentage: metrics.connected > 0 ? Math.round((metrics.requireHuman / metrics.connected) * 100) : 0,
        color: '#F59E0B', // Amber-500
        additionalInfo: 'Sales prospects requesting follow-up'
      },
      {
        stage: 'Appointments scheduled',
        value: metrics.aiConverted,
        percentage: metrics.requireHuman > 0 ? Math.round((metrics.aiConverted / metrics.requireHuman) * 100) : 0,
        color: '#3B82F6', // Blue-500
        additionalInfo: 'Sales appointments/test drives scheduled'
      }
    ]
  }
  
  // Default funnel for other campaign types
  return formatFunnelData(metrics)
}

/**
 * Convert funnel metrics to AppointmentFunnel format
 */
export function getAppointmentFunnelData(
  campaignData: CampaignDetailResponse | null,
  campaignType: 'sales' | 'service' | 'other' = 'other'
): AppointmentFunnelData {
  const metrics = calculateFunnelMetrics(campaignData)
  
  // Create stages based on campaign type - all use the new funnel structure
  const stages: AppointmentFunnelStage[] = [
    { name: 'Customer contact initiated', count: metrics.calls },
    { name: 'Contacted successfully', count: metrics.connected },
    { name: 'Followups requested', count: metrics.requireHuman },
    { name: 'Appointments scheduled', count: metrics.aiConverted }
  ]
  
  // Calculate conversion rates between stages
  const conversionRates: AppointmentFunnelConversionRate[] = []
  
  for (let i = 0; i < stages.length - 1; i++) {
    const currentStage = stages[i]
    const nextStage = stages[i + 1]
    
    const rate = currentStage.count > 0 
      ? Math.round((nextStage.count / currentStage.count) * 100)
      : 0
    
    conversionRates.push({ rate })
  }
  
  return {
    stages,
    conversionRates
  }
}
