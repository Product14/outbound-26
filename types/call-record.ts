import { CallOutcome } from '@/lib/call-status-utils'

export interface CallRecord {
  call_id: string
  dealership_id: string
  started_at: string
  ended_at: string
  direction: "inbound" | "outbound"
  domain: "sales" | "service"
  callType?: string // Original call type from API (e.g., "inboundPhoneCall", "webCall")
  campaign_id: string | null
  customer: {
    name: string | null
    phone: string
    email: string | null
  }
  vehicle: {
    vin: string | null
    stock_id: string | null
    year: number
    make: string | null
    model: string | null
    trim: string | null
    delivery_type: "self_drive" | "pickup" | null
  }
  primary_intent: string
  intents: Array<{
    label: string
    confidence: number
  }>
  outcome: CallOutcome
  appointment?: {
    type: "test_drive" | "service" | null
    starts_at: string | null
    ends_at: string | null
    location: string | null
    advisor: string | null
    status: "scheduled" | "rescheduled" | "cancelled" | null
  } | null
  sentiment: {
    label: "positive" | "neutral" | "negative" | "angry"
    score: number
  }
  ai_score: number
  containment: boolean
  summary: string
  notes: string
  report?: {
    useCase?: string
    title: string
    summary?: string[] // Key Highlights array from Spyne API
    queryResolved?: string
    actionItems?: string[]
    // Spyne top-level Outcome inside report
    Outcome?: string
    service?: {
      serviceIntent?: string
      serviceRequested?: {
        value?: string
        vehicleName?: string
        services?: string[]
      }
    }
    overview?: {
      overall?: {
        customerIntent: string
        sentiment: string
        aiResponseQuality?: {
          score: string
        }
      }
      callOutcome?: string
    }
  }
  follow_up: {
    needed: boolean
    reason: string | null
    due_at: string | null
    assignee: string | null
  }
  metrics: {
    duration_sec: number
    hold_sec: number
    silence_sec: number
  }
  recording_url: string | null
  voice_recording_url?: string | null
  transcript_url: string | null
  transcript?: TranscriptEntry[]
  smsThread?: SmsMessage[]
  tags: string[]
  agentInfo?: {
    agentName: string
    agentType: string
  }
  agentConfig?: {
    agentName: string
  }
}

export interface TranscriptEntry {
  speaker: string
  text: string
  timestamp: number // in seconds
  duration?: number
}

export interface SmsMessage {
  sender: 'agent' | 'lead'
  text: string
  timestamp: string
  status?: 'Delivered' | 'Read' | 'Sent' | 'AI'
  day?: number
  dateLabel?: string
  preBanner?: {
    variant: 'eod' | 'escalation' | 'callAttempted'
    text: string
  }
  postCall?: {
    duration: string
    outcome: string
    startedAt: string
  }
  voicemail?: {
    duration: string
    startedAt: string
    description?: string
  }
  standaloneCall?: {
    duration: string
    startedAt: string
    description?: string
  }
}
