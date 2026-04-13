import type { CampaignDetailResponse, CampaignListItem } from '@/lib/campaign-api'
import type { CampaignAnalyticsResponse, CampaignCompletedResponse } from '@/lib/metrics-utils'

export interface CampaignStatusTask {
  outboundTaskId: string
  callId?: string
  status?: string
  connectionStatus?: string
  leadId?: string
  leadName?: string
  phoneNumber?: string
  email?: string
  vehicleName?: string
  serviceName?: string
  isCallback?: boolean
  retryCount?: number
  statusUpdatedAt?: string
  isCallConnected?: boolean
  appointmentScheduled?: boolean
  aiQuality?: string | number
  duration?: string
  callDuration?: string
  outcome?: string
  nextVisibleAt?: string
  errorReason?: string
}

export interface CampaignStatusResponse {
  campaignId: string
  campaignName: string
  campaignType: string
  status: string
  totalLeads: number
  agentName?: string
  createdAt?: string
  totalLiveCalls?: number
  totalConnectedCalls?: number
  totalQueuedCalls?: number
  totalCompletedCalls?: number
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  tasks: CampaignStatusTask[]
}

export interface CampaignAggregateStats {
  totalCampaigns: number
  activeCampaigns: number
  totalCalls: number
  totalAppointments: number
  averageAnswerRate: number
}

export function getCampaignKind(campaignType?: string) {
  const normalized = (campaignType || '').toLowerCase()
  if (
    normalized.includes('recall') ||
    normalized.includes('service') ||
    normalized.includes('maintenance') ||
    normalized.includes('repair')
  ) {
    return 'Service'
  }

  return 'Sales'
}

export function getStatusMeta(status?: string) {
  const normalized = (status || 'unknown').toLowerCase()

  if (['running', 'active', 'in_progress'].includes(normalized)) {
    return {
      label: 'Active',
      chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    }
  }

  if (['paused'].includes(normalized)) {
    return {
      label: 'Paused',
      chip: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
    }
  }

  if (['scheduled', 'queue', 'queued'].includes(normalized)) {
    return {
      label: 'Scheduled',
      chip: 'bg-sky-50 text-sky-700 border-sky-200',
      dot: 'bg-sky-500',
    }
  }

  if (['completed', 'stopped', 'done'].includes(normalized)) {
    return {
      label: 'Completed',
      chip: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    }
  }

  if (['failed', 'error'].includes(normalized)) {
    return {
      label: 'Needs Attention',
      chip: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
    }
  }

  return {
    label: toTitleCase(normalized.replace(/_/g, ' ')) || 'Unknown',
    chip: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  }
}

export function getConnectionMeta(connectionStatus?: string) {
  const normalized = (connectionStatus || 'unknown').toLowerCase()

  if (normalized === 'connected') {
    return { label: 'Connected', tone: 'emerald' as const }
  }
  if (normalized === 'live') {
    return { label: 'Live', tone: 'sky' as const }
  }
  if (normalized === 'queue') {
    return { label: 'Queued', tone: 'amber' as const }
  }
  if (normalized === 'voicemail') {
    return { label: 'Voicemail', tone: 'violet' as const }
  }
  if (normalized === 'customer-busy') {
    return { label: 'Busy', tone: 'amber' as const }
  }
  if (normalized === 'customer-ended') {
    return { label: 'Ended', tone: 'slate' as const }
  }
  if (normalized === 'did-not-answer') {
    return { label: 'No Answer', tone: 'slate' as const }
  }
  if (normalized === 'failed') {
    return { label: 'Failed', tone: 'rose' as const }
  }

  return { label: toTitleCase(normalized.replace(/-/g, ' ')) || 'Unknown', tone: 'slate' as const }
}

export function getConnectionToneClasses(tone: 'emerald' | 'sky' | 'amber' | 'violet' | 'rose' | 'slate') {
  const map = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    sky: 'bg-sky-50 text-sky-700 border-sky-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  }

  return map[tone]
}

export function aggregateCampaignStats(campaigns: CampaignListItem[]): CampaignAggregateStats {
  const totalCampaigns = campaigns.length
  const activeCampaigns = campaigns.filter((campaign) =>
    ['running', 'active', 'in_progress'].includes(
      (campaign.campaignStatus || campaign.status || '').toLowerCase(),
    ),
  ).length

  const totalCalls = campaigns.reduce((sum, campaign) => sum + (campaign.totalCallPlaced || 0), 0)
  const totalAppointments = campaigns.reduce(
    (sum, campaign) => sum + (campaign.appointmentScheduled || 0),
    0,
  )

  const campaignsWithRates = campaigns.filter((campaign) => typeof campaign.answerRate === 'number')
  const averageAnswerRate = campaignsWithRates.length
    ? Math.round(
        campaignsWithRates.reduce((sum, campaign) => sum + (campaign.answerRate || 0), 0) /
          campaignsWithRates.length,
      )
    : 0

  return {
    totalCampaigns,
    activeCampaigns,
    totalCalls,
    totalAppointments,
    averageAnswerRate,
  }
}

export function formatNumber(value?: number | null) {
  return new Intl.NumberFormat('en-US').format(value || 0)
}

export function formatPercent(value?: number | null) {
  return `${Math.round(value || 0)}%`
}

export function formatDate(value?: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return 'Not available'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  })
}

export function formatDateTime(value?: string | null) {
  if (!value) return 'Not available'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDuration(raw?: string | number | null) {
  if (raw === null || raw === undefined || raw === '') return '--'

  if (typeof raw === 'number') {
    const minutes = Math.floor(raw / 60)
    const seconds = raw % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (/^\d+:\d{2}$/.test(raw)) {
    return raw
  }

  const numeric = Number(raw)
  if (Number.isFinite(numeric) && numeric >= 0) {
    const seconds = numeric > 1000 ? Math.round(numeric / 1000) : Math.round(numeric)
    const minutes = Math.floor(seconds / 60)
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  return raw
}

export function toTitleCase(value: string) {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function formatOutcome(value?: string | null) {
  if (!value) return 'No recorded outcome'
  return toTitleCase(value)
}

export function parseQualityScore(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return 0
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) return 0
  return parsed <= 10 ? Math.round(parsed * 10) : Math.round(parsed)
}

export function deriveOutcomeBreakdown(tasks: CampaignStatusTask[]) {
  const buckets = new Map<string, number>()

  tasks.forEach((task) => {
    const label =
      task.appointmentScheduled
        ? 'Appointment Scheduled'
        : formatOutcome(task.outcome || task.connectionStatus || 'Unclassified')
    buckets.set(label, (buckets.get(label) || 0) + 1)
  })

  return Array.from(buckets.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}

export function deriveQualityDistribution(tasks: CampaignStatusTask[]) {
  const distribution = {
    excellent: 0,
    good: 0,
    review: 0,
    poor: 0,
  }

  tasks.forEach((task) => {
    const score = parseQualityScore(task.aiQuality)
    if (score >= 85) {
      distribution.excellent += 1
    } else if (score >= 70) {
      distribution.good += 1
    } else if (score >= 50) {
      distribution.review += 1
    } else {
      distribution.poor += 1
    }
  })

  return distribution
}

export function deriveFlaggedTasks(tasks: CampaignStatusTask[]) {
  return tasks
    .map((task) => {
      const score = parseQualityScore(task.aiQuality)
      const connection = (task.connectionStatus || '').toLowerCase()
      const appointment = Boolean(task.appointmentScheduled)

      let reason = 'Manual review'
      if (score > 0 && score < 50) {
        reason = 'Low AI quality'
      } else if (connection === 'failed') {
        reason = 'Call failed'
      } else if (connection === 'voicemail') {
        reason = 'Voicemail only'
      } else if (appointment) {
        reason = 'Appointment scheduled'
      }

      return {
        task,
        score,
        reason,
      }
    })
    .sort((a, b) => a.score - b.score)
}

export function deriveErrorTasks(tasks: CampaignStatusTask[]) {
  return tasks.filter((task) => {
    const connection = (task.connectionStatus || '').toLowerCase()
    return ['failed', 'voicemail', 'did-not-answer', 'customer-busy', 'customer-ended'].includes(connection)
  })
}

export function deriveTopPerformanceItems(analyticsData?: CampaignAnalyticsResponse | null) {
  if (!analyticsData) return []

  if (analyticsData.topPerformingVehicles?.length) {
    return analyticsData.topPerformingVehicles.map((vehicle) => ({
      label: vehicle.vehicleName,
      value: vehicle.appointmentsCount,
      secondary: `${vehicle.conversionRate}% conversion`,
    }))
  }

  if (analyticsData.topPerformingServices?.length) {
    return analyticsData.topPerformingServices.map((service) => ({
      label: service.service,
      value: service.appointments,
      secondary: `${service.appointments} appointments`,
    }))
  }

  return []
}

export function deriveOverviewMetrics(args: {
  campaignData: CampaignDetailResponse | null
  analyticsData: CampaignAnalyticsResponse | null
  completedData: CampaignCompletedResponse | null
}) {
  const { campaignData, analyticsData, completedData } = args
  const overview = analyticsData?.overview

  const totalLeads =
    overview?.totalLeads ??
    analyticsData?.totalLeads ??
    completedData?.totalLeads ??
    campaignData?.campaign?.totalCustomers ??
    0

  const totalCalls =
    overview?.totalCallsMade ??
    analyticsData?.totalCallsMade ??
    analyticsData?.totalCallsInitiated ??
    completedData?.totalCompletedCalls ??
    campaignData?.campaign?.totalCallPlaced ??
    0

  const connected =
    overview?.totalConnectedCalls ??
    analyticsData?.totalConnectedCalls ??
    0

  const appointments =
    overview?.totalAppointments ??
    analyticsData?.totalAppointments ??
    campaignData?.campaign?.appointmentScheduled ??
    0

  const voicemails =
    overview?.totalVoicemailCount ??
    analyticsData?.totalVoicemailCount ??
    0

  const failed =
    overview?.totalCallsFailed ??
    analyticsData?.totalCallsFailed ??
    0

  const callbacks =
    overview?.callbacksRequested ??
    analyticsData?.callbacksRequested ??
    0

  const avgDuration =
    overview?.avgCallDuration ??
    analyticsData?.avgCallDuration ??
    '0:00'

  const answerRate = totalLeads > 0 ? Math.round((connected / totalLeads) * 100) : 0

  return {
    totalLeads,
    totalCalls,
    connected,
    appointments,
    voicemails,
    failed,
    callbacks,
    avgDuration,
    answerRate,
  }
}
