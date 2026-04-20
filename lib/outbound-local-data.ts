import type {
  CampaignConversationData,
  CampaignDetailResponse,
  CampaignListItem,
  CampaignTypesResponse,
} from '@/lib/campaign-api'
import type { Agent } from '@/lib/agent-api'
import type {
  CampaignAnalyticsResponse,
  CampaignCompletedResponse,
} from '@/lib/metrics-utils'
import type { EndCallReportData } from '@/hooks/use-end-call-report'
import type { ActiveCampaignWithLeads } from '@/types/campaign-setup'

export const OUTBOUND_USE_LOCAL_DATA = true

export interface LocalCampaignStatusTask {
  outboundTaskId: string
  callId: string
  status: string
  connectionStatus: string
  leadId: string
  leadName: string
  phoneNumber: string
  email: string
  vehicleName?: string
  serviceName?: string
  vehicleIdentificationNumber: {
    vin: string
  }
  isCallback: boolean
  retryCount: number
  statusUpdatedAt: string
  isCallConnected: boolean
  callAnswered?: boolean
  appointmentScheduled?: boolean
  duration?: string
  nextVisibleAt?: string
  outcome?: string
  aiQuality?: string
  errorReason?: string
}

export interface LocalCampaignStatusResponse {
  campaignId: string
  campaignName: string
  campaignType: string
  status: string
  totalLeads: number
  agentName: string
  enterpriseId: string
  teamId: string
  schedule: {
    startTime: string
    endTime: string
    startDate: string
    endDate: string
  }
  createdAt: string
  totalLiveCalls: number
  totalConnectedCalls: number
  totalQueuedCalls: number
  totalCompletedCalls: number
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  tasks: LocalCampaignStatusTask[]
  instanceTime: string
}

// ── Analytics Extra Sections ───────────────────────────────────────────────

export interface ObjectionItem {
  label: string
  count: number
  resolutionRate: number
  color: string
}

export interface ChannelComparisonRow {
  metric: string
  sms: string
  call: string
  smsHighlight?: boolean
  callHighlight?: boolean
  footnote?: string
}

export interface AnalyticsExtrasData {
  objections: ObjectionItem[]
  // heatmap: rows = days (Mon–Sun), cols = hours (9a–8p)
  heatmap: number[][]
  heatmapHours: string[]
  heatmapDays: string[]
  channelComparison: ChannelComparisonRow[]
  channelFootnote: string
}

export function getMockAnalyticsExtras(campaignId: string): AnalyticsExtrasData {
  const mode = getCampaignMode(campaignId)

  const salesObjections: ObjectionItem[] = [
    { label: 'Price',           count: 34, resolutionRate: 35, color: '#F59E0B' },
    { label: 'Trade Value',     count: 18, resolutionRate: 44, color: '#3B82F6' },
    { label: 'Payment/Budget',  count: 22, resolutionRate: 32, color: '#8B5CF6' },
    { label: 'Not Ready',       count: 29, resolutionRate: 10, color: '#EF4444' },
    { label: 'Availability',    count: 11, resolutionRate: 36, color: '#10B981' },
  ]

  const serviceObjections: ObjectionItem[] = [
    { label: 'Already Done',    count: 21, resolutionRate: 29, color: '#F59E0B' },
    { label: 'Not Available',   count: 14, resolutionRate: 43, color: '#3B82F6' },
    { label: 'Too Expensive',   count: 17, resolutionRate: 38, color: '#8B5CF6' },
    { label: 'Not My Car',      count: 8,  resolutionRate: 13, color: '#EF4444' },
    { label: 'Will Call Back',  count: 11, resolutionRate: 55, color: '#10B981' },
  ]

  // heatmap[day 0=Mon..6=Sun][hour 0=9a..11=8p]  values = reply rate %
  const salesHeatmap: number[][] = [
    [18, 24, 28, 31, 33, 27, 22, 19, 15, 12, 8,  5 ],  // Mon
    [20, 26, 30, 33, 31, 29, 24, 20, 16, 11, 7,  4 ],  // Tue
    [17, 25, 33, 38, 35, 30, 26, 21, 17, 12, 9,  5 ],  // Wed
    [19, 27, 31, 34, 32, 28, 23, 18, 14, 10, 6,  3 ],  // Thu
    [21, 28, 32, 30, 28, 26, 22, 17, 13, 9,  6,  4 ],  // Fri
    [12, 16, 20, 22, 21, 18, 15, 12, 9,  6,  4,  2 ],  // Sat
    [8,  10, 13, 14, 13, 11, 9,  7,  5,  4,  2,  1 ],  // Sun
  ]

  const serviceHeatmap: number[][] = [
    [22, 28, 32, 29, 26, 24, 20, 17, 13, 9,  6,  3 ],
    [19, 26, 30, 31, 29, 27, 22, 18, 14, 10, 7,  4 ],
    [20, 27, 31, 33, 31, 28, 23, 19, 15, 11, 8,  4 ],
    [18, 25, 29, 30, 28, 26, 21, 17, 13, 9,  6,  3 ],
    [21, 27, 30, 28, 27, 24, 20, 16, 12, 8,  5,  3 ],
    [10, 14, 18, 19, 17, 15, 12, 10, 7,  5,  3,  1 ],
    [7,  9,  11, 12, 11, 9,  7,  5,  4,  3,  1,  1 ],
  ]

  const salesChannelComparison: ChannelComparisonRow[] = [
    { metric: 'Reach rate',          sms: '99%',        call: '46%',        smsHighlight: true },
    { metric: 'Engagement rate',     sms: '42%',        call: '46%*',       footnote: '* of connected calls only' },
    { metric: 'Avg time to engage',  sms: '47 min',     call: 'Instant' },
    { metric: 'Booking rate',        sms: '12%',        call: '15%',        callHighlight: true },
    { metric: 'Cost per touch',      sms: '$0.01–0.03', call: '$0.08–0.15', smsHighlight: true },
  ]

  const serviceChannelComparison: ChannelComparisonRow[] = [
    { metric: 'Reach rate',          sms: '97%',        call: '51%',        smsHighlight: true },
    { metric: 'Engagement rate',     sms: '36%',        call: '51%*',       footnote: '* of connected calls only' },
    { metric: 'Avg time to engage',  sms: '62 min',     call: 'Instant' },
    { metric: 'Booking rate',        sms: '11%',        call: '18%',        callHighlight: true },
    { metric: 'Cost per touch',      sms: '$0.01–0.03', call: '$0.08–0.15', smsHighlight: true },
  ]

  return {
    objections: mode === 'service' ? serviceObjections : salesObjections,
    heatmap: mode === 'service' ? serviceHeatmap : salesHeatmap,
    heatmapHours: ['9a','10a','11a','12p','1p','2p','3p','4p','5p','6p','7p','8p'],
    heatmapDays:  ['M','T','W','T','F','S','S'],
    channelComparison: mode === 'service' ? serviceChannelComparison : salesChannelComparison,
    channelFootnote: '* of connected calls only',
  }
}

// ── Leads Tab ──────────────────────────────────────────────────────────────

export type LeadChannel = 'Both' | 'SMS' | 'Call'
export type LeadSmsStatus = 'Escalated' | 'Replied' | 'Delivered' | 'No Reply' | 'Opted Out'
export type LeadOutcome = 'Active' | 'Interested' | 'Pending' | 'Booked' | 'Terminal'
export type LeadIntentLevel = 'High' | 'Medium' | 'Low'

export interface LeadSmsMessage {
  sender: 'agent' | 'lead'
  text: string
  timestamp: string
  status?: 'Delivered' | 'Read' | 'Sent' | 'AI'
  /** If set and differs from previous message's day, render a DAY separator before this message */
  day?: number
  /** Label to show inside the day separator, e.g. "APR 2" */
  dateLabel?: string
  /** Optional system banner rendered BEFORE this message */
  preBanner?: {
    variant: 'eod' | 'escalation'
    text: string
  }
  /** Optional inline call card rendered AFTER this message (escalated call event) */
  postCall?: {
    duration: string
    outcome: string
    startedAt: string
  }
}

export interface LeadAppointment {
  type: string
  startsAt: string
  status: 'Scheduled' | 'Confirmed' | 'Pending' | 'Canceled'
  location?: string
  advisor?: string
}

export interface LeadRow {
  id: string
  name: string
  vehicle: string
  channel: LeadChannel
  smsStatus: LeadSmsStatus
  day: number
  lastActivity: string
  outcome: LeadOutcome
  conversationSummary: string
  intentLevel: LeadIntentLevel
  intentLabel: string
  statusLine: string
  smsThread: LeadSmsMessage[]
  /** Optional drawer fields — populated for demo leads to render the full layout */
  phone?: string
  email?: string
  highlights?: string[]
  appointment?: LeadAppointment
  actionItems?: string[]
  agentName?: string
  agentInitials?: string
  callDate?: string
  /** Source system / origin */
  leadSource?: string
  /** Assigned salesperson */
  salesperson?: string
  /** Per-lead SMS metrics (PRD §Analytics Per-Lead Metrics) */
  metrics?: LeadMetrics
  /** Session breakdown within the lead's conversation */
  sessions?: LeadSession[]
}

export interface LeadMetrics {
  messagesSent: number
  messagesReceived: number
  firstReplyTime?: string
  dayOfFirstReply?: number
  conversationDuration?: string
  sessionCount: number
  qaScore?: number
  escalated: boolean
}

export interface LeadSession {
  id: string
  sessionNumber: number
  channel: 'SMS' | 'Call'
  day: number
  trigger: 'scheduled_message' | 'customer_reply' | 'voicemail_fallback' | 'escalation_call'
  outcome: 'reply_received' | 'no_reply' | 'appointment_booked' | 'escalated' | 'opted_out' | 'inconclusive'
  startedAt: string
  endedAt?: string
  duration?: string
  messagesOut: number
  messagesIn: number
  qaScore?: number
}

export interface LeadsTabData {
  leads: LeadRow[]
}

// ── SMS Overview ────────────────────────────────────────────────────────────

export interface SmsOverviewData {
  metrics: {
    smsSent: {
      label: string
      value: number
      delta: string
    }
    smsDelivered?: {
      label: string
      value: number
      delta: string
    }
    deliveryRate?: {
      label: string
      value: string
      delta: string
    }
    replyRate: {
      label: string
      value: string
      delta: string
    }
    avgFirstReplyTime?: {
      label: string
      value: string
      delta: string
    }
    appointmentsBooked: {
      label: string
      value: number
      delta: string
    }
    bookingRate?: {
      label: string
      value: string
      delta: string
    }
    escalatedToCall: {
      label: string
      value: number
      delta: string
    }
    escalationRate?: {
      label: string
      value: string
      delta: string
    }
    optOutRate: {
      label: string
      value: string
      count: number
      delta: string
    }
  }
  funnel: {
    enrolled: number
    delivered: number
    replied: number
    escalated: number
    booked: number
  }
  outcomeDistribution: Array<{
    label: string
    count: number
    percentage: number
    color: string
  }>
  dailyStats: Array<{
    day: number
    sent: number
    replies: number
    replyRate: number
    cumulativeRate: number
  }>
}

type CampaignMode = 'sales' | 'service'

const hour = 60 * 60 * 1000
const day = 24 * hour

const now = new Date()

function iso(offsetMs: number) {
  return new Date(now.getTime() + offsetMs).toISOString()
}

const mockCampaignTypes: CampaignTypesResponse = {
  success: true,
  data: [
    {
      _id: 'mock-sales',
      campaignFor: 'Sales',
      campaignTypes: [
        { name: 'sales', description: 'Sales campaign', isActive: true, requiredKeys: [] },
        { name: 'lead_follow_up', description: 'Lead follow up', isActive: true, requiredKeys: [] },
        { name: 'trade_in_follow_up', description: 'Trade-in follow up', isActive: true, requiredKeys: [] },
      ],
      isActive: true,
      createdAt: iso(-40 * day),
      updatedAt: iso(-2 * day),
      __v: 0,
    },
    {
      _id: 'mock-service',
      campaignFor: 'Service',
      campaignTypes: [
        { name: 'service', description: 'Service campaign', isActive: true, requiredKeys: [] },
        { name: 'recall', description: 'Recall campaign', isActive: true, requiredKeys: [] },
        { name: 'service_reminder', description: 'Service reminder', isActive: true, requiredKeys: [] },
      ],
      isActive: true,
      createdAt: iso(-40 * day),
      updatedAt: iso(-2 * day),
      __v: 0,
    },
  ],
}

const mockAgents: Agent[] = [
  {
    id: 'mock-agent-001',
    enterpriseId: 'mock-enterprise',
    teamId: 'mock-team',
    agentId: 'mock-agent-001',
    name: 'Avery Lane',
    description: 'Primary outbound sales agent',
    imageUrl: '',
    type: 'voice',
    agentCallType: 'outbound',
    colorTheme: 'indigo',
    available: true,
    order: 1,
    squadId: 'sales-squad',
    faqs: [],
    totalCalls: 1247,
    lastCallDate: iso(-30 * 60 * 1000),
    age: 4,
    city: 'Miami',
    languageName: 'English',
  },
  {
    id: 'mock-agent-002',
    enterpriseId: 'mock-enterprise',
    teamId: 'mock-team',
    agentId: 'mock-agent-002',
    name: 'Maya Brooks',
    description: 'Primary service retention agent',
    imageUrl: '',
    type: 'voice',
    agentCallType: 'outbound',
    colorTheme: 'emerald',
    available: true,
    order: 2,
    squadId: 'service-squad',
    faqs: [],
    totalCalls: 986,
    lastCallDate: iso(-55 * 60 * 1000),
    age: 3,
    city: 'Miami',
    languageName: 'English',
  },
]

function getCampaignMode(campaignId: string): CampaignMode {
  return campaignId.includes('service') || campaignId.includes('recall') ? 'service' : 'sales'
}

function salesTasks(): LocalCampaignStatusTask[] {
  return [
    {
      outboundTaskId: 'task-1',
      callId: 'call-1',
      status: 'completed',
      connectionStatus: 'connected',
      leadId: 'lead-1',
      leadName: 'Sarah Mitchell',
      phoneNumber: '+1 (305) 555-0174',
      email: 'sarah@example.com',
      vehicleName: '2024 Silverado LT',
      vehicleIdentificationNumber: { vin: 'VIN-SILVERADO-001' },
      isCallback: false,
      retryCount: 0,
      statusUpdatedAt: iso(-10 * 60 * 1000),
      isCallConnected: true,
      callAnswered: true,
      appointmentScheduled: true,
      duration: '4:12',
      outcome: 'appointment_scheduled',
      aiQuality: '8.6',
    },
    {
      outboundTaskId: 'task-2',
      callId: 'call-2',
      status: 'completed',
      connectionStatus: 'connected',
      leadId: 'lead-2',
      leadName: 'James Carter',
      phoneNumber: '+1 (305) 555-0141',
      email: 'james@example.com',
      vehicleName: '2024 Equinox LT',
      vehicleIdentificationNumber: { vin: 'VIN-EQUINOX-002' },
      isCallback: true,
      retryCount: 1,
      statusUpdatedAt: iso(-2 * hour),
      isCallConnected: true,
      callAnswered: true,
      appointmentScheduled: false,
      duration: '3:07',
      outcome: 'callback_requested',
      aiQuality: '7.4',
    },
    {
      outboundTaskId: 'task-3',
      callId: 'call-3',
      status: 'queued',
      connectionStatus: 'queue',
      leadId: 'lead-3',
      leadName: 'Derek Holt',
      phoneNumber: '+1 (305) 555-0218',
      email: 'derek@example.com',
      vehicleName: '2025 Tahoe LT',
      vehicleIdentificationNumber: { vin: 'VIN-TAHOE-003' },
      isCallback: false,
      retryCount: 0,
      statusUpdatedAt: iso(-75 * 60 * 1000),
      isCallConnected: false,
      nextVisibleAt: iso(50 * 60 * 1000),
      outcome: 'follow_up_pending',
      aiQuality: '7.1',
    },
    {
      outboundTaskId: 'task-4',
      callId: 'call-4',
      status: 'completed',
      connectionStatus: 'voicemail',
      leadId: 'lead-4',
      leadName: 'Priya Sharma',
      phoneNumber: '+1 (305) 555-0225',
      email: 'priya@example.com',
      vehicleName: '2024 Traverse RS',
      vehicleIdentificationNumber: { vin: 'VIN-TRAVERSE-004' },
      isCallback: false,
      retryCount: 2,
      statusUpdatedAt: iso(-3 * hour),
      isCallConnected: false,
      callAnswered: false,
      duration: '0:24',
      outcome: 'voicemail',
      aiQuality: '5.6',
    },
    {
      outboundTaskId: 'task-5',
      callId: 'call-5',
      status: 'failed',
      connectionStatus: 'failed',
      leadId: 'lead-5',
      leadName: 'Thomas Webb',
      phoneNumber: '+1 (305) 555-0262',
      email: 'thomas@example.com',
      vehicleName: '2024 Silverado LTZ',
      vehicleIdentificationNumber: { vin: 'VIN-LTZ-005' },
      isCallback: false,
      retryCount: 2,
      statusUpdatedAt: iso(-5 * hour),
      isCallConnected: false,
      callAnswered: false,
      duration: '0:00',
      outcome: 'call_failed',
      aiQuality: '4.1',
      errorReason: 'carrier_block',
    },
  ]
}

function serviceTasks(): LocalCampaignStatusTask[] {
  return [
    {
      outboundTaskId: 'svc-task-1',
      callId: 'svc-call-1',
      status: 'completed',
      connectionStatus: 'connected',
      leadId: 'svc-lead-1',
      leadName: 'Nora Patel',
      phoneNumber: '+1 (305) 555-0401',
      email: 'nora@example.com',
      serviceName: 'Oil Change',
      vehicleName: '2022 Honda CR-V',
      vehicleIdentificationNumber: { vin: 'VIN-SVC-001' },
      isCallback: false,
      retryCount: 0,
      statusUpdatedAt: iso(-25 * 60 * 1000),
      isCallConnected: true,
      callAnswered: true,
      appointmentScheduled: true,
      duration: '2:58',
      outcome: 'service_appointment_scheduled',
      aiQuality: '8.2',
    },
    {
      outboundTaskId: 'svc-task-2',
      callId: 'svc-call-2',
      status: 'completed',
      connectionStatus: 'connected',
      leadId: 'svc-lead-2',
      leadName: 'Carlos Mendez',
      phoneNumber: '+1 (305) 555-0402',
      email: 'carlos@example.com',
      serviceName: 'Brake Inspection',
      vehicleName: '2021 Chevrolet Malibu',
      vehicleIdentificationNumber: { vin: 'VIN-SVC-002' },
      isCallback: true,
      retryCount: 1,
      statusUpdatedAt: iso(-4 * hour),
      isCallConnected: true,
      callAnswered: true,
      appointmentScheduled: false,
      duration: '2:21',
      outcome: 'callback_requested',
      aiQuality: '7.3',
    },
    {
      outboundTaskId: 'svc-task-3',
      callId: 'svc-call-3',
      status: 'queued',
      connectionStatus: 'queue',
      leadId: 'svc-lead-3',
      leadName: 'Olivia Reed',
      phoneNumber: '+1 (305) 555-0403',
      email: 'olivia@example.com',
      serviceName: 'Recall Notice',
      vehicleName: '2023 Chevrolet Trailblazer',
      vehicleIdentificationNumber: { vin: 'VIN-SVC-003' },
      isCallback: false,
      retryCount: 0,
      statusUpdatedAt: iso(-90 * 60 * 1000),
      isCallConnected: false,
      nextVisibleAt: iso(35 * 60 * 1000),
      outcome: 'follow_up_pending',
      aiQuality: '7.0',
    },
    {
      outboundTaskId: 'svc-task-4',
      callId: 'svc-call-4',
      status: 'completed',
      connectionStatus: 'voicemail',
      leadId: 'svc-lead-4',
      leadName: 'Victor Lee',
      phoneNumber: '+1 (305) 555-0404',
      email: 'victor@example.com',
      serviceName: 'Battery Check',
      vehicleName: '2020 Chevrolet Equinox',
      vehicleIdentificationNumber: { vin: 'VIN-SVC-004' },
      isCallback: false,
      retryCount: 1,
      statusUpdatedAt: iso(-6 * hour),
      isCallConnected: false,
      callAnswered: false,
      duration: '0:19',
      outcome: 'voicemail',
      aiQuality: '5.8',
    },
  ]
}

function buildStatusResponse(campaignId: string): LocalCampaignStatusResponse {
  const mode = getCampaignMode(campaignId)
  const tasks = mode === 'service' ? serviceTasks() : salesTasks()
  const totalConnectedCalls = tasks.filter((task) => task.connectionStatus === 'connected').length
  const totalQueuedCalls = tasks.filter((task) => task.connectionStatus === 'queue').length
  const totalCompletedCalls = tasks.filter((task) => task.status === 'completed').length
  const totalLiveCalls = tasks.filter((task) => task.status === 'live').length

  return {
    campaignId,
    campaignName: mode === 'service' ? 'Oil Change Win-Back' : 'Aged Lead Re-Activation',
    campaignType: mode === 'service' ? 'Service' : 'Sales',
    status: mode === 'service' ? 'paused' : 'running',
    totalLeads: mode === 'service' ? 214 : 342,
    agentName: mode === 'service' ? 'Maya Brooks' : 'Avery Lane',
    enterpriseId: 'mock-enterprise',
    teamId: 'mock-team',
    schedule: {
      startTime: '09:00',
      endTime: '18:00',
      startDate: iso(mode === 'service' ? -9 * day : -5 * day),
      endDate: iso(mode === 'service' ? 4 * day : 2 * day),
    },
    createdAt: iso(mode === 'service' ? -12 * day : -7 * day),
    totalLiveCalls,
    totalConnectedCalls,
    totalQueuedCalls,
    totalCompletedCalls,
    pagination: {
      page: 1,
      limit: tasks.length,
      total: tasks.length,
      totalPages: 1,
    },
    tasks,
    instanceTime: iso(0),
  }
}

// ── User-created campaigns (persisted in localStorage) ────────────────────

const USER_CAMPAIGNS_KEY = 'outbound-user-campaigns'

export function getUserCampaigns(): CampaignListItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(USER_CAMPAIGNS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveUserCampaign(campaign: CampaignListItem): void {
  if (typeof window === 'undefined') return
  try {
    const existing = getUserCampaigns()
    // Dedupe by campaignId; newest first
    const next = [campaign, ...existing.filter((c) => c.campaignId !== campaign.campaignId)]
    window.localStorage.setItem(USER_CAMPAIGNS_KEY, JSON.stringify(next))
  } catch (err) {
    console.error('Failed to save user campaign:', err)
  }
}

export function getMockCampaignList(): CampaignListItem[] {
  const userCampaigns = getUserCampaigns()
  return [
    ...userCampaigns,
    {
      campaignId: 'demo-sales-001',
      name: 'Aged Lead Re-Activation',
      campaignType: 'Sales',
      campaignUseCase: 'lead_follow_up',
      campaignStatus: 'running',
      status: 'running',
      totalCallPlaced: 342,
      answerRate: 41,
      appointmentScheduled: 38,
      createdAt: iso(-7 * day),
      startDate: iso(-5 * day),
    },
    {
      campaignId: 'demo-service-002',
      name: 'Oil Change Win-Back',
      campaignType: 'recall',
      campaignUseCase: 'service_reminder',
      campaignStatus: 'paused',
      status: 'paused',
      totalCallPlaced: 214,
      answerRate: 54,
      appointmentScheduled: 27,
      createdAt: iso(-12 * day),
      startDate: iso(-9 * day),
    },
    {
      campaignId: 'demo-sales-003',
      name: 'Weekend Trade-In Push',
      campaignType: 'Sales',
      campaignUseCase: 'trade_in_follow_up',
      campaignStatus: 'completed',
      status: 'completed',
      totalCallPlaced: 518,
      answerRate: 47,
      appointmentScheduled: 66,
      createdAt: iso(-18 * day),
      startDate: iso(-18 * day),
      completedAt: iso(-7 * day),
    },
  ]
}

export function getMockActiveCampaignsWithLeads(): ActiveCampaignWithLeads[] {
  return [
    {
      campaignId: 'demo-sales-001',
      name: 'Aged Lead Re-Activation',
      status: 'running',
      leads: [
        { phone: '3055550174', name: 'James Whitfield' },
        { phone: '7025550192', name: 'Sandra Kelley' },
        { phone: '4155550138', name: 'Marcus Thompson' },
        { phone: '2125550167', name: 'Priya Nair' },
        { phone: '6175550145', name: 'Derek Owens' },
      ],
    },
    {
      campaignId: 'demo-service-002',
      name: 'Oil Change Win-Back',
      status: 'paused',
      leads: [
        { phone: '9495550183', name: 'Carla Mendez' },
        { phone: '3055550174', name: 'James Whitfield' },
        { phone: '8185550129', name: 'Tony Russo' },
      ],
    },
  ]
}

export function getMockCampaignTypes(): CampaignTypesResponse {
  return mockCampaignTypes
}

export function getMockAgents(): Agent[] {
  return mockAgents
}

export function getMockCampaignDetails(campaignId: string): CampaignDetailResponse {
  const mode = getCampaignMode(campaignId)

  return {
    success: true,
    campaign: {
      _id: campaignId,
      campaignId,
      name: mode === 'service' ? 'Oil Change Win-Back' : 'Aged Lead Re-Activation',
      campaignType: mode === 'service' ? 'recall' : 'Sales',
      campaignUseCase: mode === 'service' ? 'service_reminder' : 'lead_follow_up',
      teamAgentMappingId: mode === 'service' ? 'mock-agent-002' : 'mock-agent-001',
      enterpriseId: 'mock-enterprise',
      teamId: 'mock-team',
      status: mode === 'service' ? 'paused' : 'running',
      startDate: iso(mode === 'service' ? -9 * day : -5 * day),
      completedDate: iso(mode === 'service' ? 4 * day : 2 * day),
      createdAt: iso(mode === 'service' ? -12 * day : -7 * day),
      campaignCustomerCreationStatus: 'completed',
      totalCustomers: mode === 'service' ? 214 : 342,
      totalCustomersLeadCreated: mode === 'service' ? 214 : 342,
      totalCustomersLeadFailed: 0,
      __v: 0,
      answerRate: mode === 'service' ? 54 : 41,
      appointmentScheduled: mode === 'service' ? 27 : 38,
      totalCallPlaced: mode === 'service' ? 214 : 247,
    },
    callDetails: [],
  }
}

export function getMockCampaignConversationData(campaignId: string): CampaignConversationData {
  const mode = getCampaignMode(campaignId)

  return {
    _id: campaignId,
    campaignId,
    __v: 0,
    callLimits: {
      dailyContactLimit: mode === 'service' ? 120 : 150,
      hourlyThrottle: mode === 'service' ? 18 : 24,
      maxConcurrentCalls: mode === 'service' ? 4 : 6,
    },
    campaignCustomerCreationStatus: 'completed',
    campaignStatus: mode === 'service' ? 'paused' : 'running',
    campaignType: mode === 'service' ? 'Service' : 'Sales',
    campaignUseCase: mode === 'service' ? 'service_reminder' : 'lead_follow_up',
    communicationChannel: 'voice',
    completedDate: iso(mode === 'service' ? 4 * day : 2 * day),
    complianceSettings: ['DNC_CHECK', 'TCPA_COMPLIANT', 'GDPR_COMPLIANT'],
    createdAt: iso(mode === 'service' ? -12 * day : -7 * day),
    dataPreparationTime: null,
    endDate: iso(mode === 'service' ? 4 * day : 2 * day),
    enterpriseId: 'mock-enterprise',
    escalationTriggers: [],
    handoffSettings: {
      targerType: 'human_agent',
      targetPhone: ['+1-555-000-1234'],
    },
    importSource: 'csv_upload',
    name: mode === 'service' ? 'Oil Change Win-Back' : 'Aged Lead Re-Activation',
    retryLogic: {
      maxAttempts: mode === 'service' ? 2 : 3,
      retryDelay: 3600,
      smsSwitchover: false,
    },
    scheduledTime: [{ start: '09:00', end: '18:00' }],
    startDate: iso(mode === 'service' ? -9 * day : -5 * day),
    status: mode === 'service' ? 'paused' : 'running',
    teamAgentMappingId: mode === 'service' ? 'mock-agent-002' : 'mock-agent-001',
    teamId: 'mock-team',
    totalCustomers: mode === 'service' ? 214 : 342,
    totalCustomersLeadCreated: mode === 'service' ? 214 : 342,
    totalCustomersLeadFailed: 0,
    updatedAt: iso(0),
    voicemailConfig: {
      method: 'send_sms',
      voicemailMessage: 'We tried to reach you. Please call us back at your convenience.',
    },
  }
}

export function getMockCampaignAnalytics(campaignId: string): CampaignAnalyticsResponse {
  const mode = getCampaignMode(campaignId)

  if (mode === 'service') {
    return {
      campaignId,
      campaignType: 'Service',
      campaignName: 'Oil Change Win-Back',
      campaignStatus: 'paused',
      schedule: {
        startTime: '09:00',
        endTime: '18:00',
        startDate: iso(-9 * day),
        endDate: iso(4 * day),
      },
      agentName: 'Maya Brooks',
      createdAt: iso(-12 * day),
      overview: {
        totalLeads: 214,
        totalLeadsCalled: 0,
        totalCallsMade: 186,
        totalCallsInitiated: 186,
        totalConnectedCalls: 101,
        totalCallsFailed: 15,
        totalVoicemailCount: 34,
        totalAppointments: 27,
        callbacksRequested: 12,
        avgCallDuration: '2:41',
      },
      performanceByTime: [
        { hour: '09:00', totalCalls: 15, successfulCalls: 8, successRate: 53 },
        { hour: '10:00', totalCalls: 18, successfulCalls: 10, successRate: 56 },
        { hour: '11:00', totalCalls: 16, successfulCalls: 9, successRate: 56 },
        { hour: '13:00', totalCalls: 21, successfulCalls: 12, successRate: 57 },
        { hour: '14:00', totalCalls: 19, successfulCalls: 11, successRate: 58 },
      ],
      topPerformingServices: [
        { service: 'Oil Change', appointments: 12 },
        { service: 'Brake Inspection', appointments: 8 },
        { service: 'Recall Notice', appointments: 7 },
      ],
    }
  }

  return {
    campaignId,
    campaignType: 'Sales',
    campaignName: 'Aged Lead Re-Activation',
    campaignStatus: 'running',
    schedule: {
      startTime: '09:00',
      endTime: '18:00',
      startDate: iso(-5 * day),
      endDate: iso(2 * day),
    },
    agentName: 'Avery Lane',
    createdAt: iso(-7 * day),
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
}

export function getMockCampaignCompleted(campaignId: string): CampaignCompletedResponse {
  const mode = getCampaignMode(campaignId)

  return {
    campaignId,
    campaignName: mode === 'service' ? 'Oil Change Win-Back' : 'Aged Lead Re-Activation',
    campaignType: mode === 'service' ? 'Service' : 'Sales',
    status: mode === 'service' ? 'paused' : 'running',
    totalLeads: mode === 'service' ? 214 : 342,
    agentName: mode === 'service' ? 'Maya Brooks' : 'Avery Lane',
    enterpriseId: 'mock-enterprise',
    teamId: 'mock-team',
    totalCompletedCalls: mode === 'service' ? 186 : 247,
    completedTasks: [],
    lastUpdated: iso(0),
  }
}

export function getMockCampaignStatus(campaignId: string): LocalCampaignStatusResponse {
  return buildStatusResponse(campaignId)
}

export function getMockEndCallReport(callId: string): EndCallReportData {
  const reports: Record<string, EndCallReportData> = {
    'call-1': {
      callId: 'call-1',
      status: 'completed',
      duration: 252,
      transcript: [
        { speaker: 'Agent', text: 'Hi Sarah, this is Avery from Tropical Chevrolet.', timestamp: 0, duration: 3 },
        { speaker: 'Customer', text: 'Hi, yes this is Sarah.', timestamp: 3, duration: 2 },
        { speaker: 'Agent', text: 'I wanted to follow up on the Silverado and your trade-in.', timestamp: 6, duration: 5 },
        { speaker: 'Customer', text: 'I am interested if the incentives are still available.', timestamp: 12, duration: 4 },
      ],
      summary: 'Customer showed strong interest in the Silverado and agreed to visit the dealership.',
      outcome: 'Appointment Confirmed',
      sentiment: { score: 8, label: 'positive' },
      customerInfo: { name: 'Sarah Mitchell', phone: '+1 (305) 555-0174', email: 'sarah@example.com' },
      agentInfo: { name: 'Avery Lane', id: 'mock-agent-001' },
      recordingUrl: undefined,
      aiScore: 8.6,
      actionItems: ['Send appointment confirmation', 'Prepare trade-in estimate'],
      appointmentDetails: { type: 'Sales Visit', status: 'Scheduled', scheduledAt: iso(day), location: 'Main showroom' },
      metrics: { talkTime: 252, holdTime: 0, silenceTime: 12 },
      analysis: {
        highlights: ['Discussed incentives', 'Trade-in mentioned', 'Appointment agreed'],
        nextActions: ['Text confirmation', 'Notify sales desk'],
        customerSatisfaction: 8,
      },
    },
    'svc-call-1': {
      callId: 'svc-call-1',
      status: 'completed',
      duration: 178,
      transcript: [
        { speaker: 'Agent', text: 'Hi Nora, calling about your maintenance reminder.', timestamp: 0, duration: 3 },
        { speaker: 'Customer', text: 'Yes, I am due for an oil change.', timestamp: 3, duration: 2 },
        { speaker: 'Agent', text: 'We can get you in this Thursday at 10 AM.', timestamp: 5, duration: 4 },
        { speaker: 'Customer', text: 'That works, please book it.', timestamp: 9, duration: 2 },
      ],
      summary: 'Customer accepted the service reminder and scheduled an oil change appointment.',
      outcome: 'Service Appointment Scheduled',
      sentiment: { score: 8, label: 'positive' },
      customerInfo: { name: 'Nora Patel', phone: '+1 (305) 555-0401', email: 'nora@example.com' },
      agentInfo: { name: 'Maya Brooks', id: 'mock-agent-002' },
      recordingUrl: undefined,
      aiScore: 8.2,
      actionItems: ['Send service confirmation', 'Reserve oil change slot'],
      appointmentDetails: { type: 'Service', status: 'Scheduled', scheduledAt: iso(day), location: 'Service bay 2' },
      metrics: { talkTime: 178, holdTime: 0, silenceTime: 9 },
      analysis: {
        highlights: ['Reminder accepted', 'Appointment set'],
        nextActions: ['Send confirmation', 'Prepare advisor notes'],
        customerSatisfaction: 8,
      },
    },
  }

  return (
    reports[callId] || {
      callId,
      status: 'completed',
      duration: 204,
      transcript: [
        { speaker: 'Agent', text: 'Hello, this is your AI agent calling.', timestamp: 0, duration: 3 },
        { speaker: 'Customer', text: 'Yes, I am here.', timestamp: 3, duration: 2 },
        { speaker: 'Agent', text: 'I am following up on your recent inquiry.', timestamp: 5, duration: 4 },
      ],
      summary: 'Call completed successfully using local mock data.',
      outcome: 'Information Provided',
      sentiment: { score: 7, label: 'neutral' },
      customerInfo: { name: 'Customer', phone: '+1-555-0000' },
      agentInfo: { name: 'AI Agent', id: 'mock-agent' },
      recordingUrl: undefined,
      aiScore: 7,
      actionItems: ['Follow up if needed'],
      appointmentDetails: { type: 'General', status: 'Pending' },
      metrics: { talkTime: 204, holdTime: 0, silenceTime: 15 },
      analysis: {
        highlights: ['Mock conversation'],
        nextActions: ['Optional follow-up'],
        customerSatisfaction: 7,
      },
    }
  )
}

export function getMockSmsOverview(campaignId: string): SmsOverviewData {
  const mode = getCampaignMode(campaignId)

  if (mode === 'service') {
    return {
      metrics: {
        smsSent: { label: 'SMS Sent (7D)', value: 1632, delta: '↑ 11% vs last week' },
        smsDelivered: { label: 'SMS Delivered', value: 1586, delta: '97% delivered' },
        deliveryRate: { label: 'Delivery Rate', value: '97%', delta: '↑ 1pt vs last week' },
        replyRate: { label: 'Reply Rate', value: '36%', delta: '↑ 4pts vs last week' },
        avgFirstReplyTime: { label: 'Avg First Reply Time', value: '1h 14m', delta: '↓ 8 min vs last week' },
        appointmentsBooked: { label: 'Appts Booked', value: 24, delta: '↑ 9% vs last week' },
        bookingRate: { label: 'Booking Rate', value: '32%', delta: 'of replied leads' },
        escalatedToCall: { label: 'Escalated to Call', value: 19, delta: '21% of replies' },
        escalationRate: { label: 'Escalation Rate', value: '9%', delta: 'of conversations' },
        optOutRate: { label: 'Opt-Out Rate', value: '1%', count: 4, delta: '4 opted out' },
      },
      funnel: {
        enrolled: 214,
        delivered: 206,
        replied: 74,
        escalated: 19,
        booked: 24,
      },
      outcomeDistribution: [
        { label: 'Appt Booked', count: 24, percentage: 11, color: '#4ADE80' },
        { label: 'Qualified', count: 32, percentage: 15, color: '#60A5FA' },
        { label: 'Replied, Not Interested', count: 28, percentage: 13, color: '#FBBF24' },
        { label: 'No Reply', count: 122, percentage: 57, color: '#D1D5DB' },
        { label: 'Opted Out', count: 4, percentage: 2, color: '#F87171' },
      ],
      dailyStats: [
        { day: 1, sent: 214, replies: 61, replyRate: 28.5, cumulativeRate: 28.5 },
        { day: 2, sent: 162, replies: 19, replyRate: 11.7, cumulativeRate: 37.1 },
        { day: 3, sent: 143, replies: 11, replyRate: 7.7, cumulativeRate: 42.1 },
      ],
    }
  }

  return {
    metrics: {
      smsSent: { label: 'SMS Sent (7D)', value: 2847, delta: '↑ 18% vs last week' },
      smsDelivered: { label: 'SMS Delivered', value: 2791, delta: '98% delivered' },
      deliveryRate: { label: 'Delivery Rate', value: '98%', delta: '↑ 1pt vs last week' },
      replyRate: { label: 'Reply Rate', value: '42%', delta: '↑ 6pts vs last week' },
      avgFirstReplyTime: { label: 'Avg First Reply Time', value: '47m', delta: '↓ 12 min vs last week' },
      appointmentsBooked: { label: 'Appts Booked', value: 61, delta: '↑ 12% vs last week' },
      bookingRate: { label: 'Booking Rate', value: '42%', delta: 'of replied leads' },
      escalatedToCall: { label: 'Escalated to Call', value: 38, delta: '26% of replies' },
      escalationRate: { label: 'Escalation Rate', value: '11%', delta: 'of conversations' },
      optOutRate: { label: 'Opt-Out Rate', value: '2%', count: 7, delta: '7 opted out' },
    },
    funnel: {
      enrolled: 342,
      delivered: 338,
      replied: 144,
      escalated: 38,
      booked: 41,
    },
    outcomeDistribution: [
      { label: 'Appt Booked', count: 41, percentage: 12, color: '#4ADE80' },
      { label: 'Qualified', count: 57, percentage: 17, color: '#60A5FA' },
      { label: 'Replied, Not Interested', count: 46, percentage: 13, color: '#FBBF24' },
      { label: 'No Reply', count: 187, percentage: 55, color: '#D1D5DB' },
      { label: 'Opted Out', count: 7, percentage: 2, color: '#F87171' },
    ],
    dailyStats: [
      { day: 1, sent: 342, replies: 98, replyRate: 28.7, cumulativeRate: 28.7 },
      { day: 2, sent: 244, replies: 31, replyRate: 12.7, cumulativeRate: 37.7 },
      { day: 3, sent: 213, replies: 15, replyRate: 7.0, cumulativeRate: 42.1 },
    ],
  }
}

// ── Leads Tab Mock Data ─────────────────────────────────────────────────────

const salesLeads: LeadRow[] = [
  {
    id: 'lead-1',
    name: 'Sarah Mitchell',
    vehicle: '2024 Silverado LT',
    channel: 'Both',
    smsStatus: 'Escalated',
    day: 2,
    lastActivity: '10m ago',
    outcome: 'Active',
    conversationSummary:
      'Lead replied on Day 2 asking about the Silverado price and trade-in for their 2019 Accord. High purchase intent detected. Escalated to AI call.',
    intentLevel: 'High',
    intentLabel: 'High – pricing + trade-in',
    statusLine: 'Both · Day 2 · ↑ Escalated',
    smsThread: [
      {
        sender: 'agent',
        text: "Hi Sarah, this is Vini from Tropical Chevrolet! I noticed you were looking at the 2024 Silverado a couple weeks ago. Are you still in the market? Reply STOP to opt out.",
        timestamp: '10:00 AM',
        status: 'Delivered',
      },
      {
        sender: 'lead',
        text: "Hey! Yes still interested. What's the best price you can do? I also have a 2019 Accord to trade in.",
        timestamp: '10:14 AM',
      },
      {
        sender: 'agent',
        text: "Great to hear! I'd love to get you a quote. Our sales team will call you shortly to go over pricing and the trade-in value.",
        timestamp: '10:15 AM',
        status: 'Read',
      },
    ],
  },
  {
    id: 'lead-2',
    name: 'James Carter',
    vehicle: '2024 Equinox LT',
    channel: 'SMS',
    smsStatus: 'Replied',
    day: 2,
    lastActivity: '2h ago',
    outcome: 'Interested',
    conversationSummary:
      'Lead responded to Day 1 SMS. Asked about the Equinox LT price and trade-in for his 2019 Civic. Has not committed to an appointment yet. Positive tone — medium-high intent.',
    intentLevel: 'Medium',
    intentLabel: 'Medium-High — trade-in interest',
    statusLine: 'SMS · Day 2 · ↩ Replied',
    phone: '+1 (305) 555-0174',
    email: 'james@example.com',
    highlights: [
      'Discussed incentives',
      'Trade-in mentioned',
      'Appointment agreed',
    ],
    appointment: {
      type: 'Test Drive — 2024 Equinox LT',
      startsAt: 'Apr 15, 2026 at 3:00 PM',
      status: 'Scheduled',
      location: 'Tropical Chevrolet, Miami FL',
      advisor: 'Avery Lane',
    },
    actionItems: [
      'Send financing breakdown with 4.9% APR terms',
      'Prepare trade-in quote for 2019 Honda Civic',
      'Confirm appointment 1 hour prior',
    ],
    agentName: 'Avery Lane',
    agentInitials: 'AV',
    callDate: 'Apr 14, 2026, 5:43 AM',
    leadSource: 'VinSolutions',
    salesperson: 'Mike Reynolds',
    metrics: {
      messagesSent: 4,
      messagesReceived: 2,
      firstReplyTime: '5h 15m',
      dayOfFirstReply: 2,
      conversationDuration: '1d 5h',
      sessionCount: 2,
      qaScore: 87,
      escalated: true,
    },
    sessions: [
      {
        id: 'sess-james-1',
        sessionNumber: 1,
        channel: 'SMS',
        day: 1,
        trigger: 'scheduled_message',
        outcome: 'no_reply',
        startedAt: 'Apr 2, 10:00 AM',
        endedAt: 'Apr 2, 7:00 PM',
        duration: '9h 0m',
        messagesOut: 1,
        messagesIn: 0,
        qaScore: 82,
      },
      {
        id: 'sess-james-2',
        sessionNumber: 2,
        channel: 'SMS',
        day: 2,
        trigger: 'scheduled_message',
        outcome: 'escalated',
        startedAt: 'Apr 3, 2:00 PM',
        endedAt: 'Apr 3, 3:22 PM',
        duration: '1h 22m',
        messagesOut: 3,
        messagesIn: 2,
        qaScore: 92,
      },
    ],
    smsThread: [
      {
        sender: 'agent',
        day: 1,
        dateLabel: 'APR 2',
        text: "Hi Sarah, this is Vini from Tropical Chevrolet! I noticed you were looking at the 2024 Silverado a couple weeks ago. Are you still in the market? Reply STOP to opt out.",
        timestamp: '10:00 AM',
        status: 'Delivered',
      },
      {
        sender: 'agent',
        day: 2,
        dateLabel: 'APR 3',
        preBanner: { variant: 'eod', text: 'EOD — No reply. Day 2 scheduled.' },
        text: "Hey Sarah, just checking in on the Silverado. We have $3,500 in manufacturer incentives running this week! Want to hear more?",
        timestamp: '2:00 PM',
        status: 'Delivered',
      },
      {
        sender: 'lead',
        text: "Maybe. What's the promotion?",
        timestamp: '3:15 PM',
      },
      {
        sender: 'agent',
        text: "Great to hear from you! Right now there's $3,500 in manufacturer incentives on the Silverado LT. Want the full breakdown?",
        timestamp: '3:15 PM',
        status: 'AI',
      },
      {
        sender: 'lead',
        text: "Yes. And I have a 2019 Accord I'd want to trade in.",
        timestamp: '3:22 PM',
      },
      {
        sender: 'agent',
        preBanner: { variant: 'escalation', text: 'Escalation triggered: pricing + trade_in detected' },
        text: "A trade-in is a great way to lower the cost! To give you the best numbers, let me give you a quick call — mind if I ring you now?",
        timestamp: '14:22',
        status: 'AI',
        voicemail: {
          startedAt: '3:24 PM',
          duration: '4m 12s',
          description: "Customer didn't answer; an automated trade-in voicemail was left.",
        },
      },
      {
        sender: 'agent',
        preBanner: { variant: 'callAttempted', text: 'Call attempted • Voicemail left' },
        text: "I just tried calling and left you a quick voicemail. I can also help over text with the trade-in estimate for your 2019 Accord, or we can schedule a better time to talk.",
        timestamp: '14:22',
        status: 'AI',
      },
      {
        sender: 'lead',
        text: "Let's schedule the call for 9:30 PM .",
        timestamp: '14:20',
      },
      {
        sender: 'agent',
        text: "Sure, let me Schedule the Call for you 9:30 PM",
        timestamp: '14:22',
        status: 'AI',
        postCall: {
          duration: '4m 12s',
          outcome: 'Test drive booked for Apr 15, 3:00 PM',
          startedAt: '3:24 PM',
        },
      },
    ],
  },
  {
    id: 'lead-3',
    name: 'Maria Gonzalez',
    vehicle: '2024 Colorado Z71',
    channel: 'SMS',
    smsStatus: 'Delivered',
    day: 1,
    lastActivity: '4h ago',
    outcome: 'Pending',
    conversationSummary:
      'Initial outreach delivered. Lead has not replied yet. Follow-up scheduled for Day 2.',
    intentLevel: 'Low',
    intentLabel: 'Low – no response yet',
    statusLine: 'SMS · Day 1 · ✓ Delivered',
    smsThread: [
      {
        sender: 'agent',
        text: "Hi Maria! This is Vini from Tropical Chevrolet. You recently showed interest in the 2024 Colorado Z71. Can I answer any questions?",
        timestamp: '8:30 AM',
        status: 'Delivered',
      },
    ],
  },
  {
    id: 'lead-4',
    name: 'Derek Holt',
    vehicle: '2025 Tahoe LT',
    channel: 'Both',
    smsStatus: 'Replied',
    day: 1,
    lastActivity: 'Yesterday',
    outcome: 'Booked',
    conversationSummary:
      'Lead replied and confirmed interest in the 2025 Tahoe. Appointment booked for a test drive on Saturday.',
    intentLevel: 'High',
    intentLabel: 'High – ready to buy',
    statusLine: 'Both · Day 1 · ↩ Replied',
    smsThread: [
      {
        sender: 'agent',
        text: "Hi Derek! We saw you were interested in the 2025 Tahoe LT. We have one in stock – want to come in for a test drive?",
        timestamp: '10:00 AM',
        status: 'Read',
      },
      {
        sender: 'lead',
        text: "Yes! Saturday morning works for me.",
        timestamp: '10:45 AM',
      },
      {
        sender: 'agent',
        text: "Perfect! You're all set for Saturday at 10 AM. We'll send a confirmation shortly.",
        timestamp: '10:46 AM',
        status: 'Read',
      },
    ],
  },
  {
    id: 'lead-5',
    name: 'Priya Sharma',
    vehicle: '2024 Traverse RS',
    channel: 'SMS',
    smsStatus: 'No Reply',
    day: 3,
    lastActivity: 'Yesterday',
    outcome: 'Pending',
    conversationSummary:
      'Three outreach messages sent over 3 days. No response received. Lead marked for re-engagement next week.',
    intentLevel: 'Low',
    intentLabel: 'Low – no engagement',
    statusLine: 'SMS · Day 3 · ○ No Reply',
    smsThread: [
      {
        sender: 'agent',
        text: "Hi Priya! The 2024 Traverse RS you were looking at is still available. Want to schedule a visit?",
        timestamp: 'Day 1',
        status: 'Delivered',
      },
      {
        sender: 'agent',
        text: "Hey Priya – just following up! We're running a special this week on the Traverse. Let me know if you have questions.",
        timestamp: 'Day 2',
        status: 'Delivered',
      },
      {
        sender: 'agent',
        text: "Last follow-up from us, Priya. If you'd like to explore options, we're here whenever you're ready.",
        timestamp: 'Day 3',
        status: 'Delivered',
      },
    ],
  },
  {
    id: 'lead-6',
    name: 'Thomas Webb',
    vehicle: '2024 Silverado LTZ',
    channel: 'SMS',
    smsStatus: 'Opted Out',
    day: 1,
    lastActivity: 'Apr 3',
    outcome: 'Terminal',
    conversationSummary:
      'Lead opted out on Day 1 by replying STOP. Contact removed from all future outreach sequences.',
    intentLevel: 'Low',
    intentLabel: 'Low – opted out',
    statusLine: 'SMS · Day 1 · ✕ Opted Out',
    smsThread: [
      {
        sender: 'agent',
        text: "Hi Thomas! This is Vini from Tropical Chevrolet. You recently showed interest in the 2024 Silverado LTZ. Can I share more details?",
        timestamp: '9:00 AM',
        status: 'Delivered',
      },
      {
        sender: 'lead',
        text: "STOP",
        timestamp: '9:04 AM',
      },
    ],
  },
]

const serviceLeads: LeadRow[] = [
  {
    id: 'svc-lead-1',
    name: 'Nora Patel',
    vehicle: '2022 Honda CR-V',
    channel: 'Both',
    smsStatus: 'Escalated',
    day: 2,
    lastActivity: '25m ago',
    outcome: 'Booked',
    conversationSummary:
      'Lead replied asking about oil change availability. Appointment booked for Thursday. Escalated for confirmation call.',
    intentLevel: 'High',
    intentLabel: 'High – appointment intent',
    statusLine: 'Both · Day 2 · ↑ Escalated',
    smsThread: [
      {
        sender: 'agent',
        text: "Hi Nora! Your 2022 CR-V is due for an oil change. We have availability this week – want to book a time?",
        timestamp: '9:00 AM',
        status: 'Delivered',
      },
      {
        sender: 'lead',
        text: "Yes, Thursday morning would be great.",
        timestamp: '9:18 AM',
      },
      {
        sender: 'agent',
        text: "Thursday at 9 AM is confirmed! We'll send a reminder the night before.",
        timestamp: '9:19 AM',
        status: 'Read',
      },
    ],
  },
  {
    id: 'svc-lead-2',
    name: 'Carlos Mendez',
    vehicle: '2021 Chevrolet Malibu',
    channel: 'SMS',
    smsStatus: 'Replied',
    day: 2,
    lastActivity: '4h ago',
    outcome: 'Interested',
    conversationSummary:
      'Lead asked about brake inspection pricing and availability. Requested callback.',
    intentLevel: 'Medium',
    intentLabel: 'Medium – pricing inquiry',
    statusLine: 'SMS · Day 2 · ↩ Replied',
    smsThread: [
      {
        sender: 'agent',
        text: "Hi Carlos! Your Malibu may be due for a brake inspection. Can we schedule a quick check?",
        timestamp: '10:00 AM',
        status: 'Delivered',
      },
      {
        sender: 'lead',
        text: "How much does that cost?",
        timestamp: '2:11 PM',
      },
    ],
  },
  {
    id: 'svc-lead-3',
    name: 'Olivia Reed',
    vehicle: '2023 Chevrolet Trailblazer',
    channel: 'SMS',
    smsStatus: 'Delivered',
    day: 1,
    lastActivity: '90m ago',
    outcome: 'Pending',
    conversationSummary: 'Recall notice sent. Awaiting lead response.',
    intentLevel: 'Low',
    intentLabel: 'Low – no response yet',
    statusLine: 'SMS · Day 1 · ✓ Delivered',
    smsThread: [
      {
        sender: 'agent',
        text: "Hi Olivia! There is an open safety recall on your 2023 Trailblazer. Please contact us to schedule a free repair.",
        timestamp: '8:00 AM',
        status: 'Delivered',
      },
    ],
  },
  {
    id: 'svc-lead-4',
    name: 'Victor Lee',
    vehicle: '2020 Chevrolet Equinox',
    channel: 'SMS',
    smsStatus: 'No Reply',
    day: 2,
    lastActivity: '6h ago',
    outcome: 'Pending',
    conversationSummary: 'Two battery check outreach messages sent. No response received.',
    intentLevel: 'Low',
    intentLabel: 'Low – no engagement',
    statusLine: 'SMS · Day 2 · ○ No Reply',
    smsThread: [
      {
        sender: 'agent',
        text: "Hi Victor! Cold weather can drain car batteries. Want to schedule a free battery check for your Equinox?",
        timestamp: 'Day 1',
        status: 'Delivered',
      },
      {
        sender: 'agent',
        text: "Just a quick reminder, Victor – our free battery check offer ends Friday!",
        timestamp: 'Day 2',
        status: 'Delivered',
      },
    ],
  },
]

export function getMockLeadsData(campaignId: string): LeadsTabData {
  const mode = getCampaignMode(campaignId)
  return { leads: mode === 'service' ? serviceLeads : salesLeads }
}

// ── Campaign Channel ──────────────────────────────────────────────────────

export type CampaignChannel = 'SMS' | 'Call' | 'SMS+Call'

export interface CampaignChannelStats {
  channel: CampaignChannel
  messagesSent: number
  replyRate: number // percentage
}

// Deterministic channel by campaignId — stable across renders
export function getCampaignChannel(campaignId: string): CampaignChannel {
  const hash = [...campaignId].reduce((h, ch) => h + ch.charCodeAt(0), 0)
  const mod = hash % 3
  if (mod === 0) return 'SMS+Call'
  if (mod === 1) return 'SMS'
  return 'Call'
}

export function getCampaignChannelStats(campaignId: string): CampaignChannelStats {
  const channel = getCampaignChannel(campaignId)
  const hash = [...campaignId].reduce((h, ch) => h + ch.charCodeAt(0), 0)
  const messagesSent = channel === 'Call' ? 0 : 500 + (hash % 2400)
  const replyRate = channel === 'Call' ? 0 : 28 + (hash % 20)
  return { channel, messagesSent, replyRate }
}

// ── Errors Tab ────────────────────────────────────────────────────────────

export interface SmsErrorRow {
  id: string
  leadName: string
  phone: string
  reason: 'Invalid Number' | 'Landline Detected' | 'Carrier Blocked' | 'Undelivered' | 'Spam Flagged'
  attemptedAt: string
  campaignDay: number
}

export interface OptOutRow {
  id: string
  leadName: string
  phone: string
  optedOutAt: string
  day: number
  message: string
}

export interface ErrorsData {
  deliveryFailures: SmsErrorRow[]
  optOuts: OptOutRow[]
  spamFlagged: SmsErrorRow[]
  summary: {
    totalFailures: number
    totalOptOuts: number
    totalSpamFlagged: number
  }
}

export function getMockErrorsData(campaignId: string): ErrorsData {
  const mode = getCampaignMode(campaignId)
  const deliveryFailures: SmsErrorRow[] = [
    { id: 'e1', leadName: 'Howard Mills',   phone: '+1 (305) 555-0044', reason: 'Invalid Number',    attemptedAt: 'Apr 12, 10:02 AM', campaignDay: 1 },
    { id: 'e2', leadName: 'Paula Rivera',   phone: '+1 (786) 555-0199', reason: 'Landline Detected', attemptedAt: 'Apr 12, 10:05 AM', campaignDay: 1 },
    { id: 'e3', leadName: 'Gregg Stanton',  phone: '+1 (305) 555-0211', reason: 'Undelivered',       attemptedAt: 'Apr 13, 2:11 PM',  campaignDay: 2 },
    { id: 'e4', leadName: 'Nina Walsh',     phone: '+1 (754) 555-0188', reason: 'Carrier Blocked',   attemptedAt: 'Apr 13, 2:14 PM',  campaignDay: 2 },
  ]
  const optOuts: OptOutRow[] = mode === 'service'
    ? [
        { id: 'o1', leadName: 'Keith Sato',   phone: '+1 (305) 555-0132', optedOutAt: 'Apr 13, 11:24 AM', day: 1, message: 'STOP' },
        { id: 'o2', leadName: 'Ivy Chen',     phone: '+1 (786) 555-0166', optedOutAt: 'Apr 13, 4:01 PM',  day: 2, message: 'Unsubscribe me' },
      ]
    : [
        { id: 'o1', leadName: 'Miles Patton',    phone: '+1 (305) 555-0119', optedOutAt: 'Apr 12, 6:18 PM', day: 1, message: 'STOP' },
        { id: 'o2', leadName: 'Cara Yoshida',    phone: '+1 (786) 555-0140', optedOutAt: 'Apr 13, 9:02 AM', day: 1, message: 'Stop texting me' },
        { id: 'o3', leadName: 'Daniel Brooks',   phone: '+1 (754) 555-0123', optedOutAt: 'Apr 13, 3:45 PM', day: 2, message: 'CANCEL' },
      ]
  const spamFlagged: SmsErrorRow[] = [
    { id: 's1', leadName: 'Reggie Huang', phone: '+1 (305) 555-0077', reason: 'Spam Flagged', attemptedAt: 'Apr 13, 11:30 AM', campaignDay: 2 },
  ]
  return {
    deliveryFailures,
    optOuts,
    spamFlagged,
    summary: {
      totalFailures: deliveryFailures.length,
      totalOptOuts: optOuts.length,
      totalSpamFlagged: spamFlagged.length,
    },
  }
}

// ── Conversations Page ────────────────────────────────────────────────────

export interface ConversationListItem {
  id: string
  leadName: string
  leadPhone: string
  vehicle: string
  campaignId: string
  campaignName: string
  status: 'active' | 'completed' | 'opted_out' | 'booked'
  channel: CampaignChannel
  lastMessagePreview: string
  lastMessageAt: string
  sessionCount: number
  escalated: boolean
}

export function getMockConversationsList(): ConversationListItem[] {
  return [
    {
      id: 'conv-1', leadName: 'James Carter', leadPhone: '+1 (305) 555-0174',
      vehicle: '2024 Equinox LT', campaignId: 'demo-sales-001',
      campaignName: 'Aged Lead Re-Activation', status: 'booked',
      channel: 'SMS+Call',
      lastMessagePreview: 'A trade-in is a great way to lower the cost! To give you the best numbers, let me give you a quick call...',
      lastMessageAt: '2h ago', sessionCount: 2, escalated: true,
    },
    {
      id: 'conv-2', leadName: 'Sarah Mitchell', leadPhone: '+1 (305) 555-0129',
      vehicle: '2024 Silverado LT', campaignId: 'demo-sales-001',
      campaignName: 'Aged Lead Re-Activation', status: 'active',
      channel: 'SMS',
      lastMessagePreview: "Great to hear! I'd love to get you a quote. Our sales team will call you shortly...",
      lastMessageAt: '10m ago', sessionCount: 2, escalated: true,
    },
    {
      id: 'conv-3', leadName: 'Darren Miles', leadPhone: '+1 (786) 555-0210',
      vehicle: '2024 Tahoe RST', campaignId: 'demo-sales-003',
      campaignName: 'Weekend Trade-In Push', status: 'completed',
      channel: 'SMS+Call',
      lastMessagePreview: 'Perfect, see you Saturday at 11!',
      lastMessageAt: '3d ago', sessionCount: 3, escalated: true,
    },
    {
      id: 'conv-4', leadName: 'Keith Sato', leadPhone: '+1 (305) 555-0132',
      vehicle: '2020 Chevrolet Equinox', campaignId: 'demo-service-002',
      campaignName: 'Oil Change Win-Back', status: 'opted_out',
      channel: 'SMS',
      lastMessagePreview: 'STOP',
      lastMessageAt: '1d ago', sessionCount: 1, escalated: false,
    },
    {
      id: 'conv-5', leadName: 'Olivia Martin', leadPhone: '+1 (754) 555-0150',
      vehicle: '2023 Trailblazer', campaignId: 'demo-service-002',
      campaignName: 'Oil Change Win-Back', status: 'active',
      channel: 'SMS',
      lastMessagePreview: 'Hi Olivia! There is an open safety recall on your 2023 Trailblazer...',
      lastMessageAt: '5h ago', sessionCount: 1, escalated: false,
    },
    {
      id: 'conv-6', leadName: 'Victor Lee', leadPhone: '+1 (754) 555-0181',
      vehicle: '2020 Chevrolet Equinox', campaignId: 'demo-service-002',
      campaignName: 'Oil Change Win-Back', status: 'active',
      channel: 'SMS',
      lastMessagePreview: 'Just a quick reminder, Victor – our free battery check offer ends Friday!',
      lastMessageAt: '6h ago', sessionCount: 2, escalated: false,
    },
  ]
}

// ── Reports (aggregate cross-campaign) ────────────────────────────────────

export interface ReportsKpi {
  label: string
  value: string | number
  delta?: string
}

export interface ReportsData {
  kpis: {
    totalCampaigns: ReportsKpi
    totalMessagesSent: ReportsKpi
    overallReplyRate: ReportsKpi
    overallBookingRate: ReportsKpi
    topCampaign: ReportsKpi
    avgDaysToReply: ReportsKpi
    optOutTrend: ReportsKpi
    costPerAppointment: ReportsKpi
  }
  campaignsBreakdown: Array<{
    campaignId: string
    name: string
    channel: CampaignChannel
    messagesSent: number
    replyRate: number
    bookingRate: number
    appointments: number
  }>
  optOutTrend: Array<{ date: string; rate: number }>
}

export function getMockReportsData(): ReportsData {
  return {
    kpis: {
      totalCampaigns:      { label: 'Total SMS Campaigns',  value: 14,        delta: 'last 30 days' },
      totalMessagesSent:   { label: 'Total Messages Sent',  value: '12,483',  delta: '↑ 22% vs last period' },
      overallReplyRate:    { label: 'Overall Reply Rate',   value: '39%',     delta: '↑ 5pts vs last period' },
      overallBookingRate:  { label: 'Overall Booking Rate', value: '14%',     delta: '↑ 2pts vs last period' },
      topCampaign:         { label: 'Top Campaign',         value: 'Aged Lead Re-Activation', delta: '48% reply rate' },
      avgDaysToReply:      { label: 'Avg Days to Reply',    value: '1.6 days', delta: 'across all campaigns' },
      optOutTrend:         { label: 'Opt-Out Trend (30D)',  value: '1.8%',    delta: '↓ 0.2pts rolling' },
      costPerAppointment:  { label: 'Cost per Appointment', value: '$4.12',   delta: '↓ $0.28 vs last period' },
    },
    campaignsBreakdown: [
      { campaignId: 'demo-sales-001',   name: 'Aged Lead Re-Activation', channel: 'SMS+Call', messagesSent: 2847, replyRate: 42, bookingRate: 17, appointments: 61 },
      { campaignId: 'demo-service-002', name: 'Oil Change Win-Back',     channel: 'SMS',      messagesSent: 1632, replyRate: 36, bookingRate: 14, appointments: 24 },
      { campaignId: 'demo-sales-003',   name: 'Weekend Trade-In Push',   channel: 'SMS+Call', messagesSent: 4128, replyRate: 47, bookingRate: 16, appointments: 66 },
      { campaignId: 'demo-sales-004',   name: 'Service Loyalty Ping',    channel: 'SMS',      messagesSent:  915, replyRate: 33, bookingRate: 11, appointments: 11 },
      { campaignId: 'demo-sales-005',   name: 'Spring Lease Renewal',    channel: 'SMS+Call', messagesSent: 2961, replyRate: 41, bookingRate: 13, appointments: 38 },
    ],
    optOutTrend: [
      { date: 'Mar 16', rate: 2.1 }, { date: 'Mar 23', rate: 2.0 }, { date: 'Mar 30', rate: 1.9 },
      { date: 'Apr 06', rate: 1.7 }, { date: 'Apr 13', rate: 1.8 },
    ],
  }
}
