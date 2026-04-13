'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Pause,
  PhoneCall,
  Play,
  RefreshCw,
  Search,
  Square,
} from 'lucide-react'
import {
  fetchCampaignConversationData,
  fetchCampaignDetails,
  type CampaignConversationData,
  type CampaignDetailResponse,
} from '@/lib/campaign-api'
import {
  type CampaignAnalyticsResponse,
  type CampaignCompletedResponse,
} from '@/lib/metrics-utils'
import {
  deriveErrorTasks,
  deriveFlaggedTasks,
  deriveOutcomeBreakdown,
  deriveOverviewMetrics,
  deriveQualityDistribution,
  deriveTopPerformanceItems,
  formatDate,
  formatDateTime,
  formatDuration,
  formatNumber,
  formatOutcome,
  formatPercent,
  getCampaignKind,
  getConnectionMeta,
  getConnectionToneClasses,
  getStatusMeta,
  parseQualityScore,
  type CampaignStatusResponse,
  type CampaignStatusTask,
} from '@/lib/outbound-dashboard'
import { buildUrlWithParams, extractUrlParams } from '@/lib/url-utils'
import { OutboundShell } from '@/components/outbound/outbound-shell'
import { useEndCallReport } from '@/hooks/use-end-call-report'

const allowedTabs = ['overview', 'leads', 'conversations', 'analytics', 'qa', 'errors', 'settings'] as const
type ActiveTab = (typeof allowedTabs)[number]

const fallbackStatusData: CampaignStatusResponse = {
  campaignId: 'demo-campaign',
  campaignName: 'Aged Lead Re-Activation',
  campaignType: 'Sales',
  status: 'running',
  totalLeads: 4,
  agentName: 'Avery Lane',
  tasks: [
    {
      outboundTaskId: 'task-1',
      callId: 'call-1',
      status: 'completed',
      connectionStatus: 'connected',
      leadId: 'lead-1',
      leadName: 'Sarah Mitchell',
      phoneNumber: '+1 (305) 555-0174',
      vehicleName: '2024 Silverado LT',
      retryCount: 0,
      statusUpdatedAt: new Date().toISOString(),
      appointmentScheduled: true,
      aiQuality: '8.6',
      duration: '4:12',
      outcome: 'appointment_scheduled',
    },
    {
      outboundTaskId: 'task-2',
      callId: 'call-2',
      status: 'completed',
      connectionStatus: 'voicemail',
      leadId: 'lead-2',
      leadName: 'James Carter',
      phoneNumber: '+1 (305) 555-0141',
      vehicleName: '2024 Equinox LT',
      retryCount: 1,
      statusUpdatedAt: new Date(Date.now() - 7200000).toISOString(),
      aiQuality: '6.2',
      duration: '0:28',
      outcome: 'voicemail',
    },
    {
      outboundTaskId: 'task-3',
      callId: 'call-3',
      status: 'queued',
      connectionStatus: 'queue',
      leadId: 'lead-3',
      leadName: 'Derek Holt',
      phoneNumber: '+1 (305) 555-0218',
      vehicleName: '2025 Tahoe LT',
      retryCount: 0,
      statusUpdatedAt: new Date(Date.now() - 3600000).toISOString(),
      nextVisibleAt: new Date(Date.now() + 3600000).toISOString(),
      aiQuality: '7.1',
      outcome: 'callback_requested',
    },
    {
      outboundTaskId: 'task-4',
      callId: 'call-4',
      status: 'failed',
      connectionStatus: 'failed',
      leadId: 'lead-4',
      leadName: 'Priya Sharma',
      phoneNumber: '+1 (305) 555-0225',
      vehicleName: '2024 Traverse RS',
      retryCount: 2,
      statusUpdatedAt: new Date(Date.now() - 10800000).toISOString(),
      aiQuality: '4.4',
      outcome: 'call_failed',
      errorReason: 'carrier_block',
    },
  ],
}

const fallbackAnalyticsData: CampaignAnalyticsResponse = {
  campaignId: 'demo-campaign',
  campaignType: 'Sales',
  campaignName: 'Aged Lead Re-Activation',
  campaignStatus: 'running',
  schedule: {
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
  },
  agentName: 'Avery Lane',
  createdAt: new Date().toISOString(),
  overview: {
    totalLeads: 342,
    totalLeadsCalled: 0,
    totalCallsMade: 247,
    totalCallsInitiated: 247,
    totalConnectedCalls: 129,
    totalCallsFailed: 21,
    totalVoicemailCount: 42,
    totalAppointments: 38,
    callbacksRequested: 17,
    avgCallDuration: '3:18',
  },
  performanceByTime: [
    { hour: '09:00', totalCalls: 18, successfulCalls: 7, successRate: 39 },
    { hour: '10:00', totalCalls: 24, successfulCalls: 12, successRate: 50 },
    { hour: '11:00', totalCalls: 22, successfulCalls: 10, successRate: 45 },
    { hour: '13:00', totalCalls: 26, successfulCalls: 14, successRate: 54 },
    { hour: '14:00', totalCalls: 30, successfulCalls: 17, successRate: 57 },
    { hour: '15:00', totalCalls: 28, successfulCalls: 13, successRate: 46 },
  ],
  topPerformingVehicles: [
    { vehicleName: '2024 Silverado LT', appointmentsCount: 14, conversionRate: 18 },
    { vehicleName: '2024 Equinox LT', appointmentsCount: 11, conversionRate: 15 },
    { vehicleName: '2025 Tahoe LT', appointmentsCount: 9, conversionRate: 12 },
  ],
}

const fallbackCompletedData: CampaignCompletedResponse = {
  campaignId: 'demo-campaign',
  campaignName: 'Aged Lead Re-Activation',
  campaignType: 'Sales',
  status: 'running',
  totalLeads: 342,
  agentName: 'Avery Lane',
  enterpriseId: 'demo',
  teamId: 'demo',
  totalCompletedCalls: 247,
  completedTasks: [],
  lastUpdated: new Date().toISOString(),
}

const fallbackCampaignDetail: CampaignDetailResponse = {
  success: true,
  campaign: {
    _id: 'demo-campaign',
    campaignId: 'demo-campaign',
    name: 'Aged Lead Re-Activation',
    campaignType: 'Sales',
    campaignUseCase: 'lead_follow_up',
    teamAgentMappingId: 'demo-agent',
    enterpriseId: 'demo',
    teamId: 'demo',
    status: 'running',
    startDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    completedDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    campaignCustomerCreationStatus: 'completed',
    totalCustomers: 342,
    totalCustomersLeadCreated: 342,
    totalCustomersLeadFailed: 0,
    __v: 0,
    answerRate: 41,
    appointmentScheduled: 38,
    totalCallPlaced: 247,
  },
  callDetails: [],
}

const fallbackConversationData: CampaignConversationData = {
  _id: 'demo-campaign',
  campaignId: 'demo-campaign',
  __v: 0,
  callLimits: {
    dailyContactLimit: 150,
    hourlyThrottle: 24,
    maxConcurrentCalls: 6,
  },
  campaignCustomerCreationStatus: 'completed',
  campaignStatus: 'running',
  campaignType: 'Sales',
  campaignUseCase: 'lead_follow_up',
  communicationChannel: 'voice',
  completedDate: new Date(Date.now() + 2 * 86400000).toISOString(),
  complianceSettings: ['DNC_CHECK', 'TCPA_COMPLIANT', 'GDPR_COMPLIANT'],
  createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  dataPreparationTime: null,
  endDate: new Date(Date.now() + 2 * 86400000).toISOString(),
  enterpriseId: 'demo',
  escalationTriggers: [],
  handoffSettings: {
    targerType: 'human_agent',
    targetPhone: ['+1-555-000-1234'],
  },
  importSource: 'csv_upload',
  name: 'Aged Lead Re-Activation',
  retryLogic: {
    maxAttempts: 3,
    retryDelay: 3600,
    smsSwitchover: false,
  },
  scheduledTime: [{ start: '09:00', end: '18:00' }],
  startDate: new Date(Date.now() - 5 * 86400000).toISOString(),
  status: 'running',
  teamAgentMappingId: 'demo-agent',
  teamId: 'demo',
  totalCustomers: 342,
  totalCustomersLeadCreated: 342,
  totalCustomersLeadFailed: 0,
  updatedAt: new Date().toISOString(),
  voicemailConfig: {
    method: 'send_sms',
    voicemailMessage: 'We tried to reach you about your recent interest. Give us a call back.',
  },
}

export function CampaignDetailPage({ campaignId }: { campaignId: string }) {
  const router = useRouter()
  const urlParams = extractUrlParams()
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [campaignData, setCampaignData] = useState<CampaignDetailResponse | null>(null)
  const [conversationData, setConversationData] = useState<CampaignConversationData | null>(null)
  const [analyticsData, setAnalyticsData] = useState<CampaignAnalyticsResponse | null>(null)
  const [completedData, setCompletedData] = useState<CampaignCompletedResponse | null>(null)
  const [statusData, setStatusData] = useState<CampaignStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingFallbackData, setUsingFallbackData] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    const nextTab = urlParams.tab
    if (nextTab && allowedTabs.includes(nextTab as ActiveTab)) {
      setActiveTab(nextTab as ActiveTab)
    }
  }, [urlParams.tab])

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setLoading(true)
      setError(null)

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (urlParams.auth_key) {
        headers['Authorization'] = urlParams.auth_key.startsWith('Bearer ')
          ? urlParams.auth_key
          : `Bearer ${urlParams.auth_key}`
      }

      try {
        if (!urlParams.auth_key) {
          if (!cancelled) {
            setCampaignData(fallbackCampaignDetail)
            setConversationData(fallbackConversationData)
            setAnalyticsData(fallbackAnalyticsData)
            setCompletedData(fallbackCompletedData)
            setStatusData(fallbackStatusData)
            setUsingFallbackData(true)
          }
          return
        }

        const results = await Promise.allSettled([
          fetchCampaignDetails(campaignId, urlParams.auth_key),
          fetchCampaignConversationData(campaignId, urlParams.auth_key),
          fetch(`/api/fetch-campaign-analytics?campaignId=${campaignId}`, { headers }).then((response) => {
            if (!response.ok) throw new Error('Failed to fetch analytics')
            return response.json()
          }),
          fetch(`/api/fetch-campaign-status?campaignId=${campaignId}&page=1&limit=200`, { headers }).then(
            (response) => {
              if (!response.ok) throw new Error('Failed to fetch campaign status')
              return response.json()
            },
          ),
        ])

        if (cancelled) return

        const detailResult = results[0]
        if (detailResult.status !== 'fulfilled') {
          throw detailResult.reason
        }

        setCampaignData(detailResult.value)
        setConversationData(
          results[1].status === 'fulfilled' ? results[1].value : fallbackConversationData,
        )
        setAnalyticsData(
          results[2].status === 'fulfilled' ? results[2].value : fallbackAnalyticsData,
        )
        setStatusData(results[3].status === 'fulfilled' ? results[3].value : fallbackStatusData)
        setCompletedData(fallbackCompletedData)
        setUsingFallbackData(
          results[1].status !== 'fulfilled' ||
            results[2].status !== 'fulfilled' ||
            results[3].status !== 'fulfilled',
        )
      } catch (err) {
        if (!cancelled) {
          setCampaignData(fallbackCampaignDetail)
          setConversationData(fallbackConversationData)
          setAnalyticsData(fallbackAnalyticsData)
          setCompletedData(fallbackCompletedData)
          setStatusData(fallbackStatusData)
          setUsingFallbackData(true)
          setError(err instanceof Error ? err.message : 'Failed to load campaign dashboard')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadDashboard()
    return () => {
      cancelled = true
    }
  }, [campaignId, urlParams.auth_key])

  const tasks = useMemo(() => {
    return [...(statusData?.tasks || [])].sort((left, right) => {
      const leftTime = new Date(left.statusUpdatedAt || 0).getTime()
      const rightTime = new Date(right.statusUpdatedAt || 0).getTime()
      return rightTime - leftTime
    })
  }, [statusData?.tasks])

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks

    const term = searchQuery.toLowerCase()
    return tasks.filter((task) => {
      return [task.leadName, task.phoneNumber, task.vehicleName, task.serviceName, task.outcome]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    })
  }, [searchQuery, tasks])

  useEffect(() => {
    if (!filteredTasks.length) {
      setSelectedTaskId(null)
      return
    }

    setSelectedTaskId((current) => {
      if (current && filteredTasks.some((task) => (task.callId || task.outboundTaskId) === current)) {
        return current
      }
      return filteredTasks[0].callId || filteredTasks[0].outboundTaskId || null
    })
  }, [filteredTasks])

  const selectedTask =
    filteredTasks.find((task) => (task.callId || task.outboundTaskId) === selectedTaskId) ||
    filteredTasks[0] ||
    null

  const { reportData, loading: reportLoading } = useEndCallReport(selectedTask?.callId || null)

  const overviewMetrics = useMemo(
    () =>
      deriveOverviewMetrics({
        campaignData,
        analyticsData,
        completedData,
      }),
    [analyticsData, campaignData, completedData],
  )

  const campaignStatus = getStatusMeta(
    conversationData?.campaignStatus || campaignData?.campaign?.status || statusData?.status,
  )
  const campaignKind = getCampaignKind(campaignData?.campaign?.campaignType || statusData?.campaignType)
  const outcomeBreakdown = useMemo(() => deriveOutcomeBreakdown(tasks).slice(0, 6), [tasks])
  const qaDistribution = useMemo(() => deriveQualityDistribution(tasks), [tasks])
  const flaggedTasks = useMemo(() => deriveFlaggedTasks(tasks).slice(0, 8), [tasks])
  const errorTasks = useMemo(() => deriveErrorTasks(tasks), [tasks])
  const topPerformanceItems = useMemo(
    () => deriveTopPerformanceItems(analyticsData).slice(0, 5),
    [analyticsData],
  )

  const performanceByTime = analyticsData?.performanceByTime || []
  const maxCallsByTime = Math.max(...performanceByTime.map((item) => item.totalCalls), 1)
  const totalScoredCalls =
    qaDistribution.excellent + qaDistribution.good + qaDistribution.review + qaDistribution.poor

  const updateCampaignStatus = async (nextStatus: 'running' | 'paused' | 'stopped') => {
    if (!urlParams.auth_key) return

    setUpdatingStatus(true)
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Authorization: urlParams.auth_key.startsWith('Bearer ')
          ? urlParams.auth_key
          : `Bearer ${urlParams.auth_key}`,
      }

      const response = await fetch('/api/update-campaign-status', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          campaignId,
          campaignStatus: nextStatus,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update campaign status')
      }

      setConversationData((current) =>
        current
          ? {
              ...current,
              campaignStatus: nextStatus,
              status: nextStatus,
            }
          : current,
      )
      setCampaignData((current) =>
        current
          ? {
              ...current,
              campaign: {
                ...current.campaign,
                status: nextStatus,
              },
            }
          : current,
      )
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleTabChange = (nextTab: ActiveTab) => {
    setActiveTab(nextTab)
    router.replace(buildUrlWithParams(`/results/${campaignId}`, { tab: nextTab }), { scroll: false })
  }

  if (loading) {
    return (
      <OutboundShell>
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 rounded-full border border-[#d9dfd4] bg-white px-5 py-3 text-sm text-[#5f6a60] shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading campaign dashboard
          </div>
        </div>
      </OutboundShell>
    )
  }

  if (!campaignData) {
    return (
      <OutboundShell>
        <div className="px-6 py-16 sm:px-8 lg:px-10">
          <div className="rounded-[32px] border border-[#efd1d1] bg-white p-8 text-center shadow-sm">
            <AlertCircle className="mx-auto h-10 w-10 text-rose-500" />
            <h1 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[#17211b]">
              Campaign data is unavailable
            </h1>
            <p className="mt-2 text-sm text-[#667165]">
              The detail endpoint did not return campaign metadata, so the dashboard cannot be rendered.
            </p>
          </div>
        </div>
      </OutboundShell>
    )
  }

  const funnelStages = [
    { label: 'Lead pool', count: overviewMetrics.totalLeads, tone: 'bg-slate-200 text-slate-700' },
    { label: 'Calls attempted', count: overviewMetrics.totalCalls, tone: 'bg-sky-100 text-sky-700' },
    { label: 'Connected', count: overviewMetrics.connected, tone: 'bg-emerald-100 text-emerald-700' },
    { label: 'Appointments', count: overviewMetrics.appointments, tone: 'bg-amber-100 text-amber-700' },
    { label: 'Callbacks', count: overviewMetrics.callbacks, tone: 'bg-violet-100 text-violet-700' },
  ]

  const funnelMax = Math.max(...funnelStages.map((stage) => stage.count), 1)

  return (
    <OutboundShell>
      <div className="min-h-screen">
        <div className="border-b border-[#d9dfd4] bg-[#f8faf5] px-5 py-5 sm:px-7 lg:px-10">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <Link
                href={buildUrlWithParams('/results')}
                className="inline-flex items-center gap-2 text-sm font-medium text-[#5f6a60] transition hover:text-[#17211b]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to campaigns
              </Link>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#eff6ef] px-3 py-1 text-xs font-medium text-[#2f7a45]">
                  {campaignKind}
                </span>
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${campaignStatus.chip}`}
                >
                  <span className={`h-2 w-2 rounded-full ${campaignStatus.dot}`} />
                  {campaignStatus.label}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#5f6a60] ring-1 ring-[#d9dfd4]">
                  {formatNumber(overviewMetrics.totalLeads)} leads
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#17211b]">
                {campaignData.campaign.name}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-[#667165]">
                This dashboard follows the structure of your HTML reference, but every metric is
                aligned with the current Outbound AI analytics model: leads, calls, connections,
                appointments, callbacks, QA scores, and delivery failures.
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#5f6a60]">
                <span>Started {formatDate(campaignData.campaign.startDate || conversationData?.startDate)}</span>
                <span>Updated {formatDateTime(conversationData?.updatedAt || analyticsData?.createdAt)}</span>
                <span>Agent {statusData?.agentName || analyticsData?.agentName || 'Assigned at runtime'}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {usingFallbackData ? (
                <div className="rounded-full border border-[#eadfb1] bg-[#fff9e8] px-3 py-2 text-xs font-medium text-[#7a6220]">
                  Partial fallback data
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => updateCampaignStatus('running')}
                disabled={updatingStatus}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#d9dfd4] bg-white px-4 py-2.5 text-sm font-medium text-[#17211b] transition hover:border-[#2f7a45] hover:text-[#2f7a45] disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                Resume
              </button>
              <button
                type="button"
                onClick={() => updateCampaignStatus('paused')}
                disabled={updatingStatus}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#d9dfd4] bg-white px-4 py-2.5 text-sm font-medium text-[#17211b] transition hover:border-[#d29f2f] hover:text-[#8c6500] disabled:opacity-50"
              >
                <Pause className="h-4 w-4" />
                Pause
              </button>
              <button
                type="button"
                onClick={() => updateCampaignStatus('stopped')}
                disabled={updatingStatus}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#8c2f39] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#7d2530] disabled:opacity-50"
              >
                <Square className="h-4 w-4" />
                Stop
              </button>
            </div>
          </div>
        </div>

        <div className="border-b border-[#d9dfd4] bg-white px-5 sm:px-7 lg:px-10">
          <div className="flex flex-wrap gap-1 py-2">
            {allowedTabs.map((tab) => {
              const active = tab === activeTab
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleTabChange(tab)}
                  className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
                    active ? 'bg-[#2f7a45] text-white' : 'text-[#5f6a60] hover:bg-[#eef2e9]'
                  }`}
                >
                  {tab}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-6 px-5 py-6 sm:px-7 lg:px-10">
          {error ? (
            <div className="rounded-3xl border border-[#eadfb1] bg-[#fff9e8] px-4 py-3 text-sm text-[#7a6220]">
              Some live endpoints did not respond, so this view is blending live fields with local
              fallback data. {error}
            </div>
          ) : null}

          {activeTab === 'overview' ? (
            <>
              <section className="grid gap-4 xl:grid-cols-5">
                <MetricCard label="Lead Pool" value={formatNumber(overviewMetrics.totalLeads)} sublabel="Campaign audience" />
                <MetricCard label="Calls Attempted" value={formatNumber(overviewMetrics.totalCalls)} sublabel="Outbound attempts placed" accent="sky" />
                <MetricCard label="Connected" value={formatNumber(overviewMetrics.connected)} sublabel={formatPercent(overviewMetrics.answerRate)} accent="emerald" />
                <MetricCard label="Appointments" value={formatNumber(overviewMetrics.appointments)} sublabel="Booked from campaign" accent="amber" />
                <MetricCard label="Avg Duration" value={overviewMetrics.avgDuration} sublabel="Connected conversations" accent="violet" />
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <CardShell title="Conversion funnel" subtitle="Counts mapped to the current outbound call lifecycle">
                  <div className="space-y-4">
                    {funnelStages.map((stage) => (
                      <div key={stage.label} className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)_70px] sm:items-center">
                        <div className="text-sm font-medium text-[#4f5a50]">{stage.label}</div>
                        <div className="h-10 overflow-hidden rounded-2xl bg-[#f1f4ee]">
                          <div
                            className={`flex h-full items-center rounded-2xl px-4 text-sm font-semibold ${stage.tone}`}
                            style={{ width: `${Math.max((stage.count / funnelMax) * 100, 6)}%` }}
                          >
                            {formatNumber(stage.count)}
                          </div>
                        </div>
                        <div className="text-right text-sm font-semibold text-[#17211b]">
                          {formatNumber(stage.count)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardShell>

                <CardShell title="Outcome distribution" subtitle="Grouped from call status outcomes">
                  <div className="space-y-3">
                    {outcomeBreakdown.map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className="w-40 text-sm text-[#4f5a50]">{item.label}</div>
                        <div className="h-8 flex-1 overflow-hidden rounded-full bg-[#f1f4ee]">
                          <div
                            className="flex h-full items-center rounded-full bg-[#dff1e4] px-3 text-sm font-medium text-[#2f7a45]"
                            style={{
                              width: `${Math.max(
                                (item.count / Math.max(outcomeBreakdown[0]?.count || 1, 1)) * 100,
                                10,
                              )}%`,
                            }}
                          >
                            {formatNumber(item.count)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardShell>
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <CardShell title="Hourly performance" subtitle="Live analytics by hour from the campaign analytics endpoint">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-6">
                    {performanceByTime.map((item) => (
                      <div key={item.hour} className="flex flex-col items-center gap-3 rounded-3xl border border-[#eef1ea] bg-[#f8faf5] p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#788275]">
                          {item.hour}
                        </div>
                        <div className="flex h-32 items-end">
                          <div
                            className="w-12 rounded-t-[18px] bg-[#dff1e4]"
                            style={{ height: `${Math.max((item.totalCalls / maxCallsByTime) * 100, 8)}%` }}
                          />
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold tracking-[-0.03em] text-[#17211b]">
                            {formatNumber(item.totalCalls)}
                          </div>
                          <div className="text-xs text-[#667165]">{item.successRate}% success</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardShell>

                <CardShell title="Top performers" subtitle="Highest-converting vehicles or services from the analytics payload">
                  <div className="space-y-3">
                    {topPerformanceItems.length ? (
                      topPerformanceItems.map((item, index) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between rounded-3xl border border-[#eef1ea] bg-[#f8faf5] px-4 py-3"
                        >
                          <div>
                            <div className="text-sm font-semibold text-[#17211b]">
                              {index + 1}. {item.label}
                            </div>
                            <div className="text-xs text-[#667165]">{item.secondary}</div>
                          </div>
                          <div className="text-lg font-semibold tracking-[-0.03em] text-[#2f7a45]">
                            {formatNumber(item.value)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <EmptyBlock message="No top-performing vehicle or service data was returned for this campaign." />
                    )}
                  </div>
                </CardShell>
              </section>
            </>
          ) : null}

          {activeTab === 'leads' ? (
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <CardShell title="Lead activity" subtitle="Recent lead-level call outcomes for this campaign">
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
                <div className="mt-4 space-y-3">
                  {filteredTasks.length ? (
                    filteredTasks.map((task) => {
                      const taskId = task.callId || task.outboundTaskId || ''
                      const selected = taskId === selectedTaskId
                      const connection = getConnectionMeta(task.connectionStatus)

                      return (
                        <button
                          key={taskId}
                          type="button"
                          onClick={() => setSelectedTaskId(taskId)}
                          className={`flex w-full flex-col gap-3 rounded-[24px] border p-4 text-left transition ${
                            selected
                              ? 'border-[#2f7a45] bg-[#f5fbf6] shadow-sm'
                              : 'border-[#eef1ea] bg-[#f8faf5] hover:border-[#d9dfd4]'
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-[#17211b]">
                                {task.leadName || 'Unknown lead'}
                              </div>
                              <div className="mt-1 text-xs text-[#667165]">
                                {task.vehicleName || task.serviceName || 'No vehicle or service label'}
                              </div>
                            </div>
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getConnectionToneClasses(connection.tone)}`}
                            >
                              {connection.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-xs text-[#667165]">
                            <span>{task.phoneNumber || 'No phone number'}</span>
                            <span>{formatOutcome(task.outcome)}</span>
                            <span>{formatDateTime(task.statusUpdatedAt)}</span>
                            <span>Retry {task.retryCount || 0}</span>
                          </div>
                        </button>
                      )
                    })
                  ) : (
                    <EmptyBlock message="No lead activity matched the current search." />
                  )}
                </div>
              </CardShell>

              <LeadInspector selectedTask={selectedTask} reportData={reportData} reportLoading={reportLoading} />
            </div>
          ) : null}

          {activeTab === 'conversations' ? (
            <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
              <CardShell title="Conversation roster" subtitle="Select a lead to inspect the latest call transcript">
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
                <div className="mt-4 space-y-2">
                  {filteredTasks.length ? (
                    filteredTasks.map((task) => {
                      const taskId = task.callId || task.outboundTaskId || ''
                      const selected = taskId === selectedTaskId

                      return (
                        <button
                          key={taskId}
                          type="button"
                          onClick={() => setSelectedTaskId(taskId)}
                          className={`w-full rounded-[22px] border px-4 py-3 text-left transition ${
                            selected
                              ? 'border-[#2f7a45] bg-[#f5fbf6]'
                              : 'border-[#eef1ea] bg-[#f8faf5] hover:border-[#d9dfd4]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-[#17211b]">
                                {task.leadName || 'Unknown lead'}
                              </div>
                              <div className="mt-1 text-xs text-[#667165]">
                                {task.vehicleName || task.serviceName || 'No context label'}
                              </div>
                            </div>
                            <div className="text-xs text-[#667165]">
                              {formatDate(task.statusUpdatedAt, { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                          <div className="mt-3 text-sm text-[#4f5a50]">{formatOutcome(task.outcome)}</div>
                        </button>
                      )
                    })
                  ) : (
                    <EmptyBlock message="No conversation records matched the current search." />
                  )}
                </div>
              </CardShell>

              <CardShell
                title={selectedTask?.leadName || 'Conversation detail'}
                subtitle={selectedTask?.phoneNumber || 'Select a lead to inspect transcript detail'}
              >
                {selectedTask ? (
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-[#eff6ef] px-3 py-1 text-xs font-medium text-[#2f7a45]">
                        {selectedTask.vehicleName || selectedTask.serviceName || 'Campaign interaction'}
                      </span>
                      <span className="rounded-full bg-[#eef3ff] px-3 py-1 text-xs font-medium text-[#3558b8]">
                        {formatOutcome(selectedTask.outcome)}
                      </span>
                      <span className="rounded-full bg-[#f6f2ff] px-3 py-1 text-xs font-medium text-[#6f4aa8]">
                        AI score {parseQualityScore(selectedTask.aiQuality)}
                      </span>
                    </div>

                    <div className="rounded-[24px] border border-[#eef1ea] bg-[#f8faf5] p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#788275]">
                        Summary
                      </div>
                      <p className="mt-2 text-sm leading-7 text-[#314036]">
                        {reportData?.summary ||
                          'A detailed end-call summary was not returned, so the conversation panel is showing the latest campaign-status record for this lead.'}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#788275]">
                        Transcript
                      </div>
                      {reportLoading ? (
                        <div className="flex items-center gap-3 rounded-[24px] border border-[#eef1ea] bg-[#f8faf5] px-4 py-4 text-sm text-[#5f6a60]">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Loading transcript
                        </div>
                      ) : reportData?.transcript?.length ? (
                        reportData.transcript.map((message, index) => {
                          const agentMessage = message.speaker.toLowerCase() === 'agent'
                          return (
                            <div
                              key={`${message.timestamp}-${index}`}
                              className={`flex ${agentMessage ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-[22px] px-4 py-3 text-sm leading-6 ${
                                  agentMessage
                                    ? 'bg-[#2f7a45] text-white'
                                    : 'border border-[#e1e7dc] bg-white text-[#17211b]'
                                }`}
                              >
                                <div>{message.text}</div>
                                <div
                                  className={`mt-2 text-[11px] ${agentMessage ? 'text-white/70' : 'text-[#7a8578]'}`}
                                >
                                  {message.speaker} · {formatDuration(message.timestamp)}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <EmptyBlock message="No transcript messages were returned for this call." />
                      )}
                    </div>
                  </div>
                ) : (
                  <EmptyBlock message="Pick a conversation to inspect transcript detail." />
                )}
              </CardShell>
            </div>
          ) : null}

          {activeTab === 'analytics' ? (
            <section className="grid gap-6 xl:grid-cols-2">
              <CardShell title="Connection mix" subtitle="Derived from the current campaign-status task list">
                <div className="space-y-3">
                  {deriveOutcomeBreakdown(
                    tasks.map((task) => ({
                      ...task,
                      outcome: task.connectionStatus,
                    })),
                  )
                    .slice(0, 6)
                    .map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className="w-40 text-sm text-[#4f5a50]">{item.label}</div>
                        <div className="h-8 flex-1 overflow-hidden rounded-full bg-[#f1f4ee]">
                          <div
                            className="flex h-full items-center rounded-full bg-[#eef3ff] px-3 text-sm font-medium text-[#3558b8]"
                            style={{
                              width: `${Math.max(
                                (item.count / Math.max(tasks.length, 1)) * 100,
                                10,
                              )}%`,
                            }}
                          >
                            {formatNumber(item.count)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardShell>

              <CardShell title="Campaign benchmarks" subtitle="Current overview metrics pulled from the analytics payload">
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoTile label="Callbacks requested" value={formatNumber(overviewMetrics.callbacks)} />
                  <InfoTile label="Voicemails" value={formatNumber(overviewMetrics.voicemails)} />
                  <InfoTile label="Failed calls" value={formatNumber(overviewMetrics.failed)} />
                  <InfoTile label="Connected rate" value={formatPercent(overviewMetrics.answerRate)} />
                </div>
              </CardShell>
            </section>
          ) : null}

          {activeTab === 'qa' ? (
            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <CardShell title="AI quality distribution" subtitle="Scores are normalized to a 0-100 scale">
                <div className="space-y-4">
                  <DistributionRow label="Excellent" count={qaDistribution.excellent} total={totalScoredCalls} tone="emerald" />
                  <DistributionRow label="Good" count={qaDistribution.good} total={totalScoredCalls} tone="sky" />
                  <DistributionRow label="Needs review" count={qaDistribution.review} total={totalScoredCalls} tone="amber" />
                  <DistributionRow label="Poor" count={qaDistribution.poor} total={totalScoredCalls} tone="rose" />
                </div>
              </CardShell>

              <CardShell title="Review queue" subtitle="Flagged interactions based on low score or notable outcomes">
                <div className="space-y-3">
                  {flaggedTasks.length ? (
                    flaggedTasks.map(({ task, score, reason }) => (
                      <div
                        key={task.callId || task.outboundTaskId}
                        className="rounded-[24px] border border-[#eef1ea] bg-[#f8faf5] px-4 py-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-[#17211b]">
                              {task.leadName || 'Unknown lead'}
                            </div>
                            <div className="mt-1 text-xs text-[#667165]">
                              {reason} · {formatOutcome(task.outcome)}
                            </div>
                          </div>
                          <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#17211b] ring-1 ring-[#d9dfd4]">
                            {score}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyBlock message="No QA review items were generated from the current task list." />
                  )}
                </div>
              </CardShell>
            </section>
          ) : null}

          {activeTab === 'errors' ? (
            <CardShell title="Delivery and connection issues" subtitle="Problem calls grouped from the current campaign-status data">
              <div className="space-y-3">
                {errorTasks.length ? (
                  errorTasks.map((task) => {
                    const connection = getConnectionMeta(task.connectionStatus)
                    return (
                      <div
                        key={task.callId || task.outboundTaskId}
                        className="grid gap-3 rounded-[24px] border border-[#eef1ea] bg-[#f8faf5] px-4 py-4 md:grid-cols-[1.1fr_0.7fr_0.7fr_0.9fr]"
                      >
                        <div>
                          <div className="text-sm font-semibold text-[#17211b]">
                            {task.phoneNumber || 'Unknown number'}
                          </div>
                          <div className="mt-1 text-xs text-[#667165]">
                            {task.leadName || 'Unknown lead'} · {formatDateTime(task.statusUpdatedAt)}
                          </div>
                        </div>
                        <div className="text-sm text-[#4f5a50]">{connection.label}</div>
                        <div className="text-sm text-[#4f5a50]">
                          {task.errorReason ? formatOutcome(task.errorReason) : formatOutcome(task.outcome)}
                        </div>
                        <div className="text-sm font-medium text-[#17211b]">
                          Retry {task.retryCount || 0}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <EmptyBlock message="No error-state calls were returned for this campaign." />
                )}
              </div>
            </CardShell>
          ) : null}

          {activeTab === 'settings' ? (
            <section className="grid gap-6 xl:grid-cols-2">
              <CardShell title="Campaign configuration" subtitle="Current delivery settings from the conversation campaign payload">
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoTile label="Channel" value={conversationData?.communicationChannel || 'voice'} />
                  <InfoTile
                    label="Quiet window"
                    value={
                      conversationData?.scheduledTime?.[0]
                        ? `${conversationData.scheduledTime[0].start} - ${conversationData.scheduledTime[0].end}`
                        : 'Not configured'
                    }
                  />
                  <InfoTile label="Retry attempts" value={String(conversationData?.retryLogic?.maxAttempts ?? 0)} />
                  <InfoTile
                    label="Retry delay"
                    value={`${Math.round((conversationData?.retryLogic?.retryDelay || 0) / 60)} min`}
                  />
                  <InfoTile
                    label="Daily contact limit"
                    value={String(conversationData?.callLimits?.dailyContactLimit ?? 0)}
                  />
                  <InfoTile
                    label="Concurrent calls"
                    value={String(conversationData?.callLimits?.maxConcurrentCalls ?? 0)}
                  />
                </div>
              </CardShell>

              <CardShell title="Compliance and voicemail" subtitle="Current campaign safeguards and voicemail behavior">
                <div className="space-y-4">
                  <div className="rounded-[24px] border border-[#eef1ea] bg-[#f8faf5] p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#788275]">
                      Compliance
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(conversationData?.complianceSettings || []).map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#17211b] ring-1 ring-[#d9dfd4]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[24px] border border-[#eef1ea] bg-[#f8faf5] p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#788275]">
                      Voicemail strategy
                    </div>
                    <div className="mt-2 text-sm font-semibold text-[#17211b]">
                      {conversationData?.voicemailConfig?.method || 'Not configured'}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[#4f5a50]">
                      {conversationData?.voicemailConfig?.voicemailMessage || 'No voicemail copy configured.'}
                    </p>
                  </div>
                </div>
              </CardShell>
            </section>
          ) : null}
        </div>
      </div>
    </OutboundShell>
  )
}

function CardShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[32px] border border-[#d9dfd4] bg-white p-5 shadow-sm shadow-[#cad3c1]/30 sm:p-6">
      <div className="mb-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#788275]">
          {title}
        </div>
        {subtitle ? <p className="mt-2 text-sm text-[#667165]">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  )
}

function MetricCard({
  label,
  value,
  sublabel,
  accent = 'slate',
}: {
  label: string
  value: string
  sublabel: string
  accent?: 'slate' | 'sky' | 'emerald' | 'amber' | 'violet'
}) {
  const accentStyles = {
    slate: 'from-slate-100 to-white',
    sky: 'from-sky-100 to-white',
    emerald: 'from-emerald-100 to-white',
    amber: 'from-amber-100 to-white',
    violet: 'from-violet-100 to-white',
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-[#d9dfd4] bg-white shadow-sm shadow-[#cad3c1]/30">
      <div className={`h-1.5 bg-gradient-to-r ${accentStyles[accent]}`} />
      <div className="space-y-2 p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#788275]">
          {label}
        </div>
        <div className="text-3xl font-semibold tracking-[-0.05em] text-[#17211b]">{value}</div>
        <div className="text-sm text-[#667165]">{sublabel}</div>
      </div>
    </div>
  )
}

function SearchBar({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#788275]" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search leads, vehicles, phones, or outcomes"
        className="h-12 w-full rounded-2xl border border-[#d9dfd4] bg-[#f8faf5] pl-11 pr-4 text-sm text-[#17211b] outline-none transition focus:border-[#2f7a45] focus:bg-white"
      />
    </div>
  )
}

function LeadInspector({
  selectedTask,
  reportData,
  reportLoading,
}: {
  selectedTask: CampaignStatusTask | null
  reportData: ReturnType<typeof useEndCallReport>['reportData']
  reportLoading: boolean
}) {
  if (!selectedTask) {
    return (
      <CardShell title="Lead inspector" subtitle="Select a lead from the activity list to inspect details">
        <EmptyBlock message="Pick a lead to view summary, QA context, and next steps." />
      </CardShell>
    )
  }

  const connection = getConnectionMeta(selectedTask.connectionStatus)

  return (
    <CardShell title={selectedTask.leadName || 'Lead inspector'} subtitle={selectedTask.phoneNumber || 'No phone number'}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getConnectionToneClasses(connection.tone)}`}
          >
            {connection.label}
          </span>
          <span className="rounded-full bg-[#eef3ff] px-3 py-1 text-xs font-medium text-[#3558b8]">
            {formatOutcome(selectedTask.outcome)}
          </span>
          <span className="rounded-full bg-[#f6f2ff] px-3 py-1 text-xs font-medium text-[#6f4aa8]">
            AI {parseQualityScore(selectedTask.aiQuality)}
          </span>
        </div>

        <div className="rounded-[24px] border border-[#eef1ea] bg-[#f8faf5] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#788275]">
            Summary
          </div>
          <p className="mt-2 text-sm leading-7 text-[#314036]">
            {reportLoading
              ? 'Loading end-call report...'
              : reportData?.summary ||
                'No detailed end-call report was returned, so this panel is showing the latest campaign-status record for the lead.'}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InfoTile label="Vehicle / service" value={selectedTask.vehicleName || selectedTask.serviceName || 'Not tagged'} />
          <InfoTile label="Last activity" value={formatDateTime(selectedTask.statusUpdatedAt)} />
          <InfoTile label="Duration" value={formatDuration(selectedTask.duration || selectedTask.callDuration)} />
          <InfoTile label="Retries" value={String(selectedTask.retryCount || 0)} />
        </div>

        <div className="rounded-[24px] border border-[#eef1ea] bg-[#f8faf5] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#788275]">
            Next actions
          </div>
          <div className="mt-3 space-y-2">
            {(reportData?.actionItems?.length ? reportData.actionItems : ['Monitor follow-up outcome', 'Review transcript context if escalation is needed']).map(
              (item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-[#314036]">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#2f7a45]" />
                  <span>{item}</span>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </CardShell>
  )
}

function DistributionRow({
  label,
  count,
  total,
  tone,
}: {
  label: string
  count: number
  total: number
  tone: 'emerald' | 'sky' | 'amber' | 'rose'
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0
  const toneClasses = {
    emerald: 'bg-emerald-100 text-emerald-700',
    sky: 'bg-sky-100 text-sky-700',
    amber: 'bg-amber-100 text-amber-700',
    rose: 'bg-rose-100 text-rose-700',
  }

  return (
    <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)_48px] sm:items-center">
      <div className="text-sm font-medium text-[#4f5a50]">{label}</div>
      <div className="h-8 overflow-hidden rounded-full bg-[#f1f4ee]">
        <div
          className={`flex h-full items-center rounded-full px-3 text-sm font-semibold ${toneClasses[tone]}`}
          style={{ width: `${Math.max(percentage, 8)}%` }}
        >
          {formatNumber(count)}
        </div>
      </div>
      <div className="text-right text-sm font-semibold text-[#17211b]">{percentage}%</div>
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-[#eef1ea] bg-[#f8faf5] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#788275]">
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#17211b]">{value}</div>
    </div>
  )
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#d9dfd4] bg-[#f8faf5] px-4 py-10 text-center text-sm text-[#667165]">
      {message}
    </div>
  )
}
