'use client'

import { useState, useRef, useEffect } from 'react'
import {
  X,
  PhoneCall,
  MessageSquare,
  Pause,
  Zap,
  Clock,
  AlertCircle,
  User,
  Phone,
  Mail,
  FileText,
  Calendar,
  MapPin,
  CheckCircle2,
  Building2,
  UserCheck,
  BarChart2,
  ArrowRight,
  SkipForward,
  Trash2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type {
  LeadsTabData,
  LeadRow,
  LeadChannel,
  LeadSmsStatus,
  LeadOutcome,
  LeadIntentLevel,
} from '@/lib/outbound-local-data'

type LeadDrawerTab = 'highlights' | 'customer' | 'summary' | 'appointment' | 'sms'

interface LeadsTabProps {
  data: LeadsTabData
}

// ── Badge helpers ─────────────────────────────────────────────────────────

function ChannelBadge({ channel }: { channel: LeadChannel }) {
  if (channel === 'Both') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#EDE9FE] text-[#7C3AED]">
        <span className="text-[10px]">⚡</span> Both
      </span>
    )
  }
  if (channel === 'SMS') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#065F46]">
        <MessageSquare className="h-3 w-3" /> SMS
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#1D4ED8]">
      <PhoneCall className="h-3 w-3" /> Call
    </span>
  )
}

function SmsStatusBadge({ status }: { status: LeadSmsStatus }) {
  const styles: Record<LeadSmsStatus, string> = {
    Escalated:  'bg-[#FEF3C7] text-[#92400E]',
    Replied:    'bg-[#DBEAFE] text-[#1E40AF]',
    Delivered:  'bg-[#D1FAE5] text-[#065F46]',
    'No Reply': 'bg-[#F3F4F6] text-[#6B7280]',
    'Opted Out':'bg-[#FEE2E2] text-[#991B1B]',
  }
  const icons: Record<LeadSmsStatus, string> = {
    Escalated:  '↑',
    Replied:    '↩',
    Delivered:  '✓',
    'No Reply': '○',
    'Opted Out':'✕',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status]}`}>
      <span>{icons[status]}</span> {status}
    </span>
  )
}

function OutcomeBadge({ outcome }: { outcome: LeadOutcome }) {
  const styles: Record<LeadOutcome, string> = {
    Active:     'bg-[#D1FAE5] text-[#065F46]',
    Interested: 'bg-[#DBEAFE] text-[#1E40AF]',
    Pending:    'bg-[#F3F4F6] text-[#6B7280]',
    Booked:     'bg-[#EDE9FE] text-[#5B21B6]',
    Terminal:   'bg-[#FEE2E2] text-[#991B1B]',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${styles[outcome]}`}>
      {outcome}
    </span>
  )
}

function IntentBadge({ level }: { level: LeadIntentLevel }) {
  const styles: Record<LeadIntentLevel, string> = {
    High:   'bg-[#FEF3C7] text-[#92400E]',
    Medium: 'bg-[#DBEAFE] text-[#1E40AF]',
    Low:    'bg-[#F3F4F6] text-[#6B7280]',
  }
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-[6px] text-xs font-semibold ${styles[level]}`}>
      {level === 'High' ? '🔥' : level === 'Medium' ? '📊' : '○'}&nbsp;Intent Signal
    </span>
  )
}

// ── Side Drawer ───────────────────────────────────────────────────────────

// ── Intent Signal pill (full-width, colored) ──────────────────────────────

function IntentSignalPill({ level, label }: { level: LeadIntentLevel; label: string }) {
  const styles: Record<LeadIntentLevel, { bg: string; text: string; icon: string }> = {
    High:   { bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]', icon: 'text-[#F59E0B]' },
    Medium: { bg: 'bg-[#DBEAFE]', text: 'text-[#1E40AF]', icon: 'text-[#F59E0B]' },
    Low:    { bg: 'bg-[#F3F4F6]', text: 'text-[#6B7280]', icon: 'text-[#9CA3AF]' },
  }
  const s = styles[level]
  return (
    <div className={`${s.bg} ${s.text} w-full rounded-[10px] px-3.5 py-2.5 flex items-center gap-2`}>
      <span className={`${s.icon} text-sm`}>◆</span>
      <span className="text-sm font-semibold">{label}</span>
    </div>
  )
}

// ── Combined "SMS · Day N" pill ───────────────────────────────────────────

function ChannelDayPill({ channel, day }: { channel: LeadChannel; day: number }) {
  const palette =
    channel === 'Both'
      ? { bg: 'bg-[#EDE9FE]', text: 'text-[#6D28D9]' }
      : channel === 'Call'
      ? { bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]' }
      : { bg: 'bg-[#D1FAE5]', text: 'text-[#065F46]' }

  const icon =
    channel === 'Call' ? (
      <PhoneCall className="h-3.5 w-3.5" />
    ) : (
      <MessageSquare className="h-3.5 w-3.5" />
    )

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${palette.bg} ${palette.text}`}>
      {icon}
      {channel} · Day {day}
    </span>
  )
}

// ── Thread pieces ─────────────────────────────────────────────────────────

function DaySeparator({ day, date }: { day: number; date?: string }) {
  return (
    <div className="flex items-center justify-center py-2">
      <span className="text-[10px] font-semibold tracking-[0.14em] text-[#9CA3AF] uppercase">
        Day {day}{date ? ` · ${date}` : ''}
      </span>
    </div>
  )
}

function SystemBanner({ variant, text }: { variant: 'eod' | 'escalation'; text: string }) {
  if (variant === 'eod') {
    return (
      <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-[8px] bg-[#FEF3C7] border border-[#FDE68A]">
        <Pause className="h-3.5 w-3.5 text-[#92400E]" />
        <span className="text-xs font-mono font-semibold text-[#92400E]">{text}</span>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-[8px] bg-[#F5F3FF] border border-[#DDD6FE]">
      <Zap className="h-3.5 w-3.5 text-[#7C3AED] fill-[#7C3AED]" />
      <span className="text-xs font-medium text-[#6D28D9]">{text}</span>
    </div>
  )
}

// ── Drawer Section Components ─────────────────────────────────────────────

function HighlightsSection({ lead }: { lead: LeadRow }) {
  const items = lead.highlights ?? [
    lead.intentLabel,
    `Engaged on Day ${lead.day} via ${lead.channel}`,
    `Status: ${lead.smsStatus}`,
  ]
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-gray-700/30" />
        Key Highlights
      </h3>
      <div className="bg-gray-50/50 rounded-lg p-5 border border-gray-100">
        <ul className="space-y-4">
          {items.map((h, i) => (
            <li key={i} className="flex gap-4">
              <span className="text-gray-400 font-medium text-sm mt-0.5 flex-shrink-0 w-4">
                {i + 1}.
              </span>
              <span className="text-sm text-gray-700 leading-relaxed">{h}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function CustomerSection({ lead }: { lead: LeadRow }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
        <User className="h-4 w-4 text-gray-700/30" />
        Customer Information
      </h3>
      <div className="border border-gray-200 rounded-lg p-5 bg-white space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-500 mb-1">Customer Name</div>
            <div className="text-sm font-medium text-gray-900">{lead.name}</div>
          </div>
        </div>
        {lead.phone && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <Phone className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-500 mb-1">Phone Number</div>
              <div className="text-sm font-mono text-gray-900">{lead.phone}</div>
            </div>
          </div>
        )}
        {lead.email && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Mail className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-500 mb-1">Email Address</div>
              <div className="text-sm text-gray-900">{lead.email}</div>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <FileText className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-500 mb-1">Vehicle of Interest</div>
            <div className="text-sm text-gray-900">{lead.vehicle}</div>
          </div>
        </div>
        {lead.leadSource && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-500 mb-1">Lead Source</div>
              <div className="text-sm text-gray-900">{lead.leadSource}</div>
            </div>
          </div>
        )}
        {lead.salesperson && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
              <UserCheck className="h-5 w-5 text-pink-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-500 mb-1">Assigned Salesperson</div>
              <div className="text-sm text-gray-900">{lead.salesperson}</div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function MetricsSection({ lead }: { lead: LeadRow }) {
  if (!lead.metrics) return null
  const m = lead.metrics
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
        <BarChart2 className="h-4 w-4 text-gray-700/30" />
        Per-Lead Metrics
      </h3>
      <div className="border border-gray-200 rounded-lg bg-white p-5 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-gray-500 mb-1">Messages Sent</div>
          <div className="text-lg font-semibold text-gray-900">{m.messagesSent}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Messages Received</div>
          <div className="text-lg font-semibold text-gray-900">{m.messagesReceived}</div>
        </div>
        {m.firstReplyTime && (
          <div>
            <div className="text-xs text-gray-500 mb-1">First Reply Time</div>
            <div className="text-lg font-semibold text-gray-900">{m.firstReplyTime}</div>
          </div>
        )}
        {m.dayOfFirstReply !== undefined && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Day of First Reply</div>
            <div className="text-lg font-semibold text-gray-900">Day {m.dayOfFirstReply}</div>
          </div>
        )}
        {m.conversationDuration && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Conversation Duration</div>
            <div className="text-lg font-semibold text-gray-900">{m.conversationDuration}</div>
          </div>
        )}
        <div>
          <div className="text-xs text-gray-500 mb-1">Sessions</div>
          <div className="text-lg font-semibold text-gray-900">{m.sessionCount}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Escalated</div>
          <div className="text-lg font-semibold">
            {m.escalated ? (
              <span className="text-[#7C3AED]">Yes</span>
            ) : (
              <span className="text-gray-500">No</span>
            )}
          </div>
        </div>
      </div>

      {lead.sessions && lead.sessions.length > 0 && (
        <div className="border border-gray-200 rounded-lg bg-white p-5">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Session Breakdown
          </div>
          <div className="space-y-2">
            {lead.sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-[#F3F4F6] text-[#374151] text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {s.sessionNumber}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm text-gray-900">
                      {s.channel} · Day {s.day}
                    </div>
                    <div className="text-[11px] text-gray-500 truncate">
                      {s.startedAt} · {s.duration ?? '—'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#374151] capitalize">
                    {s.outcome.replace(/_/g, ' ')}
                  </span>
                  {s.qaScore !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        s.qaScore >= 85 ? 'bg-[#D1FAE5] text-[#065F46]' :
                        s.qaScore >= 70 ? 'bg-[#DBEAFE] text-[#1E40AF]' :
                        s.qaScore >= 50 ? 'bg-[#FEF3C7] text-[#92400E]' :
                                          'bg-[#FEE2E2] text-[#991B1B]'
                      }`}
                    >
                      QA {s.qaScore}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function SummarySection({ lead }: { lead: LeadRow }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
        <FileText className="h-4 w-4 text-gray-700/30" />
        Summary &amp; Action Items
      </h3>
      <div className="border border-gray-200 rounded-lg p-5 bg-white space-y-4">
        <div>
          <div className="text-xs font-medium text-gray-500 mb-1.5">Call Summary</div>
          <p className="text-sm text-gray-800 leading-relaxed">{lead.conversationSummary}</p>
        </div>
        <div>
          <div className="text-xs font-medium text-gray-500 mb-2">Intent Signal</div>
          <IntentSignalPill level={lead.intentLevel} label={lead.intentLabel} />
        </div>
        <div>
          <div className="text-xs font-medium text-gray-500 mb-2">Status</div>
          <div className="flex items-center gap-2 flex-wrap">
            <ChannelDayPill channel={lead.channel} day={lead.day} />
            <SmsStatusBadge status={lead.smsStatus} />
          </div>
        </div>
        {lead.actionItems && lead.actionItems.length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-500 mb-2">Action Items</div>
            <ul className="space-y-2">
              {lead.actionItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-[#4600F2] flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

function AppointmentSection({ lead }: { lead: LeadRow }) {
  if (!lead.appointment) {
    return (
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-700/30" />
          Appointment
        </h3>
        <div className="border border-gray-200 rounded-lg p-5 bg-white">
          <p className="text-sm text-gray-500">No appointment scheduled yet.</p>
        </div>
      </section>
    )
  }
  const appt = lead.appointment
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-700/30" />
        Appointment
      </h3>
      <div className="border border-gray-200 rounded-lg p-5 bg-white space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-500 mb-1">Type</div>
            <div className="text-sm font-medium text-gray-900">{appt.type}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <Clock className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-500 mb-1">Time</div>
            <div className="text-sm text-gray-900">{appt.startsAt}</div>
          </div>
        </div>
        {appt.location && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-500 mb-1">Location</div>
              <div className="text-sm text-gray-900">{appt.location}</div>
            </div>
          </div>
        )}
        {appt.advisor && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-500 mb-1">Advisor</div>
              <div className="text-sm text-gray-900">{appt.advisor}</div>
            </div>
          </div>
        )}
        <div className="pt-1">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#D1FAE5] text-[#065F46]">
            {appt.status}
          </span>
        </div>
      </div>
    </section>
  )
}

function SmsConversationSection({ lead }: { lead: LeadRow }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-gray-700/30" />
        Conversation
      </h3>
      <div className="space-y-3">
        {lead.smsThread.map((msg, i) => {
          const prev = i > 0 ? lead.smsThread[i - 1] : undefined
          const showDay = msg.day !== undefined && msg.day !== prev?.day
          const isAgent = msg.sender === 'agent'
          return (
            <div key={i} className="space-y-3">
              {showDay && <DaySeparator day={msg.day!} date={msg.dateLabel} />}
              {msg.preBanner && (
                <SystemBanner variant={msg.preBanner.variant} text={msg.preBanner.text} />
              )}
              <div className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[80%]">
                  <div
                    className={`rounded-[14px] px-3.5 py-2.5 ${
                      isAgent
                        ? 'bg-[#DCFCE7] text-[#14532D]'
                        : 'bg-[#F3F4F6] text-[#1A1A1A]'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                  <div
                    className={`mt-1 flex items-center gap-1.5 text-[10px] text-[#9CA3AF] ${
                      isAgent ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.status && (
                      <>
                        <span className="text-[#D1D5DB]">·</span>
                        <span>{msg.status}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {msg.postCall && (
                <div className="flex items-center justify-center">
                  <div className="w-full rounded-[12px] border border-[#C7D2FE] bg-gradient-to-r from-[#EEF2FF] to-[#F5F3FF] px-4 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#4600F2] flex items-center justify-center flex-shrink-0">
                      <PhoneCall className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-[#4338CA] uppercase tracking-wide">
                        Escalated Call
                      </div>
                      <div className="text-sm text-[#1A1A1A] mt-0.5 truncate">
                        {msg.postCall.outcome}
                      </div>
                      <div className="text-[11px] text-[#6366F1] mt-0.5">
                        {msg.postCall.startedAt} · {msg.postCall.duration}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ── Side Drawer ───────────────────────────────────────────────────────────

function LeadDrawer({ lead, onClose }: { lead: LeadRow; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<LeadDrawerTab>('highlights')

  // Refs for scroll-to-section navigation
  const bodyRef = useRef<HTMLDivElement>(null)
  const highlightsRef = useRef<HTMLDivElement>(null)
  const customerRef = useRef<HTMLDivElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const appointmentRef = useRef<HTMLDivElement>(null)
  const smsRef = useRef<HTMLDivElement>(null)
  const tabs: { id: LeadDrawerTab; label: string; ref: React.RefObject<HTMLDivElement | null> }[] = [
    { id: 'highlights',   label: 'Highlights',       ref: highlightsRef  },
    { id: 'customer',     label: 'Customer',         ref: customerRef    },
    { id: 'summary',      label: 'Summary',          ref: summaryRef     },
    { id: 'appointment',  label: 'Appointment',      ref: appointmentRef },
    { id: 'sms',          label: 'Conversation', ref: smsRef         },
  ]

  const scrollToSection = (
    sectionRef: React.RefObject<HTMLDivElement | null>,
    tabId: LeadDrawerTab,
  ) => {
    setActiveTab(tabId)
    if (bodyRef.current && sectionRef.current) {
      const bodyTop = bodyRef.current.getBoundingClientRect().top
      const sectionTop = sectionRef.current.getBoundingClientRect().top
      const offset = sectionTop - bodyTop + bodyRef.current.scrollTop - 8
      bodyRef.current.scrollTo({ top: offset, behavior: 'smooth' })
    }
  }

  // Auto-update active tab as user scrolls through sections
  useEffect(() => {
    const body = bodyRef.current
    if (!body) return

    const onScroll = () => {
      const bodyTop = body.getBoundingClientRect().top
      const threshold = 80 // px from top of body
      let current: LeadDrawerTab = 'highlights'
      for (const t of tabs) {
        const el = t.ref.current
        if (!el) continue
        const top = el.getBoundingClientRect().top - bodyTop
        if (top - threshold <= 0) current = t.id
      }
      setActiveTab((prev) => (prev === current ? prev : current))
    }

    body.addEventListener('scroll', onScroll, { passive: true })
    return () => body.removeEventListener('scroll', onScroll)
    // tabs is stable per render; refs don't trigger re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const agentInitials = lead.agentInitials ?? 'AV'
  const agentName = lead.agentName ?? 'Avery Lane'
  const callDate = lead.callDate ?? 'Apr 14, 2026'

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-[520px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <PhoneCall className="h-5 w-5 text-gray-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[20px] font-bold text-[#1A1A1A] leading-tight">
                Call with {lead.name}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-[#6B7280]">
                <Clock className="h-3.5 w-3.5" />
                <span>{callDate}</span>
                <span className="w-5 h-5 rounded-full bg-[#EDE9FE] text-[#6D28D9] text-[10px] font-bold flex items-center justify-center ml-1">
                  {agentInitials}
                </span>
                <span>{agentName}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs — scroll-to-section anchors */}
        <div className="border-b border-gray-100 bg-white">
          <nav className="flex gap-3 px-6 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => scrollToSection(t.ref, t.id)}
                className={`py-3.5 px-1 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                  activeTab === t.id
                    ? 'border-[#4600F2] text-[#4600F2]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Scrollable body — all sections stacked */}
        <div ref={bodyRef} className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-8">
            <div ref={highlightsRef}>
              <HighlightsSection lead={lead} />
            </div>
            <div ref={customerRef}>
              <CustomerSection lead={lead} />
            </div>
            <div ref={summaryRef}>
              <SummarySection lead={lead} />
            </div>
            <div ref={appointmentRef}>
              <AppointmentSection lead={lead} />
            </div>
            <div ref={smsRef}>
              <SmsConversationSection lead={lead} />
            </div>
          </div>
        </div>

        {/* Footer — fixed at bottom */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white flex-shrink-0">
          <Button variant="outline" className="w-full text-sm font-medium">
            View Full Conversation <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      </div>
    </>
  )
}

// ── Main Tab ──────────────────────────────────────────────────────────────

export function LeadsTab({ data }: LeadsTabProps) {
  const [selected, setSelected] = useState<LeadRow | null>(null)

  return (
    <div className="relative">
      <Card className="border-0 bg-white rounded-[16px]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                    Lead
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                    Channel
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                    SMS Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                    Day
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                    Last Activity
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                    Outcome
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.leads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelected(lead)}
                    className={`border-b border-gray-50 cursor-pointer transition-colors hover:bg-[#F9F9FF] ${
                      selected?.id === lead.id ? 'bg-[#F5F3FF]' : ''
                    }`}
                  >
                    {/* Lead */}
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[#1A1A1A]">{lead.name}</p>
                      <p className="text-xs text-[#6B7280] mt-0.5">{lead.vehicle}</p>
                    </td>
                    {/* Channel */}
                    <td className="px-4 py-4">
                      <ChannelBadge channel={lead.channel} />
                    </td>
                    {/* SMS Status */}
                    <td className="px-4 py-4">
                      <SmsStatusBadge status={lead.smsStatus} />
                    </td>
                    {/* Day */}
                    <td className="px-4 py-4 text-[#1A1A1A] font-medium">
                      Day {lead.day}
                    </td>
                    {/* Last Activity */}
                    <td className="px-4 py-4 text-[#6B7280]">
                      {lead.lastActivity}
                    </td>
                    {/* Outcome */}
                    <td className="px-4 py-4">
                      <OutcomeBadge outcome={lead.outcome} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Slide-in drawer */}
      {selected && (
        <LeadDrawer lead={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
