'use client'

import { useState } from 'react'
import { X, PhoneCall, MessageSquare, Pause, Zap } from 'lucide-react'
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

// ── Side Drawer ───────────────────────────────────────────────────────────

function LeadDrawer({ lead, onClose }: { lead: LeadRow; onClose: () => void }) {
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-[440px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold text-[#1A1A1A] leading-tight">{lead.name}</h2>
            <p className="text-xs text-[#6B7280] mt-1">
              {lead.vehicle} <span className="mx-1 text-[#D1D5DB]">·</span> Lead Enrichment
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Conversation Summary */}
          <section>
            <h3 className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.14em] mb-2">
              Conversation Summary
            </h3>
            <div className="rounded-[10px] bg-[#F9FAFB] border border-[#E5E7EB] px-3.5 py-3">
              <p className="text-sm text-[#374151] leading-relaxed">{lead.conversationSummary}</p>
            </div>
          </section>

          {/* Intent Signal */}
          <section>
            <h3 className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.14em] mb-2">
              Intent Signal
            </h3>
            <IntentSignalPill level={lead.intentLevel} label={lead.intentLabel} />
          </section>

          {/* Status */}
          <section>
            <h3 className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.14em] mb-2">
              Status
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <ChannelDayPill channel={lead.channel} day={lead.day} />
              <SmsStatusBadge status={lead.smsStatus} />
            </div>
          </section>

          {/* SMS Thread */}
          <section>
            <h3 className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.14em] mb-3">
              SMS Thread
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
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-gray-100 space-y-2">
          <Button variant="outline" className="w-full text-sm font-medium">
            View Full Conversation →
          </Button>
          <Button className="w-full text-sm font-medium bg-[#4600F2] hover:bg-[#3700C2] text-white">
            <PhoneCall className="h-4 w-4 mr-2" /> Escalate to Call
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
