'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, AlertCircle, Clock, MessageSquare, PhoneCall, Zap, GripVertical, CalendarPlus, Pencil, X, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { CampaignData } from '@/types/campaign-setup'

interface StepMessageScheduleProps {
  campaignData: CampaignData
  setCampaignData: (updater: (prev: CampaignData) => CampaignData) => void
}

const VARIABLES = [
  '{first_name}', '{last_name}', '{vehicle}', '{dealership}', '{offer}', '{salesperson}',
]

function SegmentIndicator({ chars }: { chars: number }) {
  const segments = chars === 0 ? 0 : Math.ceil(chars / 160)
  const cls =
    chars === 0 ? 'text-[#9CA3AF]' :
    chars <= 160 ? 'text-[#10B981]' :
    chars <= 320 ? 'text-[#CA8A04]' :
    chars <= 480 ? 'text-[#F97316]' :
                   'text-[#EF4444]'
  return (
    <span className={`text-xs font-medium ${cls}`}>
      {chars} / 480 chars · {segments} segment{segments === 1 ? '' : 's'}
    </span>
  )
}

export default function StepMessageSchedule({
  campaignData,
  setCampaignData,
}: StepMessageScheduleProps) {
  const schedule = campaignData.messageSchedule || []
  // Track focused textarea index for variable insertion
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)

  const channelMode = campaignData.channelMode || 'both'
  const smsEnabled = channelMode !== 'call'

  const updateDay = (idx: number, patch: Partial<{ body: string; sendTime: string }>) => {
    setCampaignData((prev) => {
      const next = [...(prev.messageSchedule || [])]
      next[idx] = { ...next[idx], ...patch }
      return { ...prev, messageSchedule: next }
    })
  }

  const addDay = () => {
    setCampaignData((prev) => {
      const list = prev.messageSchedule || []
      if (list.length >= 21) return prev
      return {
        ...prev,
        messageSchedule: [
          ...list,
          { day: list.length + 1, body: '', sendTime: '11:00' },
        ],
      }
    })
  }

  const setChannelMode = (mode: 'sms' | 'call' | 'both') => {
    setCampaignData((prev) => ({ ...prev, channelMode: mode }))
  }

  const updateScript = (key: 'callOpenerScript' | 'callFinalAttemptScript' | 'recapSmsBody', value: string) => {
    setCampaignData((prev) => ({ ...prev, [key]: value }))
  }

  const scripts: CallScripts = {
    callOpener: campaignData.callOpenerScript,
    callFinalAttempt: campaignData.callFinalAttemptScript,
    recapSms: campaignData.recapSmsBody,
  }

  const removeDay = (idx: number) => {
    if (idx === 0) return // Day 1 required
    setCampaignData((prev) => {
      const list = (prev.messageSchedule || []).filter((_, i) => i !== idx)
      const renumbered = list.map((m, i) => ({ ...m, day: i + 1 }))
      return { ...prev, messageSchedule: renumbered }
    })
  }

  const insertVariable = (variable: string) => {
    if (focusedIdx === null) return
    setCampaignData((prev) => {
      const list = [...(prev.messageSchedule || [])]
      const msg = list[focusedIdx]
      list[focusedIdx] = { ...msg, body: msg.body + variable }
      return { ...prev, messageSchedule: list }
    })
  }

  // Channel chip helper
  const channelChip = (
    <div className="flex items-center gap-2">
      {channelMode === 'sms' && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#D1FAE5] text-[#065F46]">
          <MessageSquare className="h-3 w-3" /> SMS
        </span>
      )}
      {channelMode === 'call' && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#DBEAFE] text-[#1D4ED8]">
          <PhoneCall className="h-3 w-3" /> Call
        </span>
      )}
      {channelMode === 'both' && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EDE9FE] text-[#6D28D9]">
          <Zap className="h-3 w-3" /> SMS + Call
        </span>
      )}
    </div>
  )

  /* No early return — full UI always renders so channel chips remain clickable */

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h2 className="text-[24px] font-bold text-[#1A1A1A]">Workflow</h2>
          {channelChip}
        </div>
        <button
          type="button"
          onClick={() => setEditorOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all bg-[#4600F2]/10 text-[#4600F2] hover:bg-[#4600F2]/20"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit Workflow
        </button>
      </div>
      <p className="text-[14px] text-[#6B7280] leading-[1.5] mb-6">
        Configure what Vini sends on Day&nbsp;1, Day&nbsp;2, … up to 21 days. Each day&apos;s message only sends if the lead hasn&apos;t replied yet. When they reply, the AI agent takes over the conversation automatically.
      </p>

      {/* Unified Day-by-Day Timeline (read-only) */}
      <WorkflowTimeline
        channelMode={channelMode}
        schedule={schedule}
        scripts={scripts}
      />

      {/* Campaign Offers — below calling script */}
      <CampaignOffers />

      {/* Edit Workflow Modal */}
      <WorkflowEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        schedule={schedule}
        updateDay={updateDay}
        removeDay={removeDay}
        addDay={addDay}
        setFocusedIdx={setFocusedIdx}
        channelMode={channelMode}
        setChannelMode={setChannelMode}
        scripts={scripts}
        updateScript={updateScript}
      />
    </div>
  )
}

// ── Campaign Offers sub-component ─────────────────────────────────────────

// ── Unified Workflow Timeline ──────────────────────────────────────────────

interface DayTouchpoint {
  type: 'sms' | 'call' | 'recap_sms'
  title: string
  timing: string
  body: string
  editable?: boolean
  branches?: { condition: string; color: 'green' | 'red' | 'amber'; script: string }[]
  tip?: string
  segmentInfo?: string
}

interface DayBlock {
  day: number
  title: string
  subtitle: string
  touchpoints: DayTouchpoint[]
}

function smsSeg(body: string) {
  const len = body.length
  return `${len} chars · ${Math.max(1, Math.ceil(len / 160))} segment${Math.ceil(len / 160) > 1 ? 's' : ''}`
}

const DAY_TITLES = ['Kickoff', 'Follow-Up', 'Last Check-In', 'Day 4', 'Day 5', 'Day 6', 'Day 7']
const DEFAULT_CALL_OPENER = '"Hi {first_name}, this is Vini calling from {dealership}. You\'d reached out to us a while back about a car — I just wanted to follow up personally. Is this a good time for a quick call?"'
const DEFAULT_FINAL_ATTEMPT_CALL = '"Hi {first_name}, this is Vini from {dealership} — last quick follow-up! I wanted to make sure you saw the options I sent. Any of them catch your eye?"'
const DEFAULT_RECAP_SMS = 'Hi {first_name}, Vini here. Good speaking with you. I\'ll [send options / check availability / pull numbers] and get back to you by [time] today.\n\nFeel free to reply here if anything comes up.\n\n— Vini'

interface CallScripts {
  callOpener?: string
  callFinalAttempt?: string
  recapSms?: string
}

function getDayBlocks(
  channelMode: string,
  schedule: { day: number; body: string; sendTime: string }[],
  scripts: CallScripts = {},
): DayBlock[] {
  const smsEnabled = channelMode !== 'call'
  const callEnabled = channelMode !== 'sms'

  // Total days = schedule.length when SMS enabled (up to 21), 3 for call-only
  const totalDays = smsEnabled ? Math.max(3, schedule.length) : 3
  const days: DayBlock[] = []

  for (let d = 1; d <= totalDays; d++) {
    const smsMsg = smsEnabled && schedule[d - 1] ? schedule[d - 1] : null
    const title = d <= 3 ? DAY_TITLES[d - 1] : `Follow-Up ${d}`
    const isFirst = d === 1
    const isLast = d === totalDays

    // Subtitle logic
    let subtitle = ''
    if (isFirst) {
      subtitle = smsEnabled && callEnabled ? 'SMS first touch. No call today.' : smsEnabled ? 'SMS first touch.' : 'Call first contact.'
    } else if (isLast) {
      subtitle = 'Last attempt before marking no_response.'
    } else {
      subtitle = 'Only if no reply on previous days.'
    }

    const block: DayBlock = { day: d, title, subtitle, touchpoints: [] }

    // Build SMS touchpoint
    const smsTouchpoint: DayTouchpoint | null = smsMsg ? {
      type: 'sms',
      title: isFirst ? 'SMS #1 — Opening' : `SMS #${smsEnabled ? schedule.slice(0, d).filter(Boolean).length : d} — ${isLast ? 'Last Check-In' : 'Follow-Up'}`,
      timing: `Day ${d} · ${isFirst ? 'First touch' : 'Morning'}`,
      body: smsMsg.body,
      editable: true,
      segmentInfo: smsSeg(smsMsg.body),
      tip: isFirst ? 'One question. No pitch. Just open a door.' : undefined,
    } : null

    // Build Call touchpoint
    let callTouchpoint: DayTouchpoint | null = null
    let recapTouchpoint: DayTouchpoint | null = null
    if (callEnabled) {
      const showCall =
        (!smsEnabled && d === 1) ||               // call-only: day 1
        (smsEnabled && callEnabled && d === 2) ||  // blended: day 2
        (callEnabled && isLast && d >= 3)          // final attempt on last day

      if (showCall) {
        const callNum = d <= 2 ? 1 : 2
        callTouchpoint = {
          type: 'call',
          title: `Call #${callNum} — ${d <= 2 ? 'First Contact' : 'Final Attempt'}`,
          timing: `Day ${d} · ${d <= 2 ? 'Morning' : 'Afternoon'}`,
          body: d <= 2
            ? (scripts.callOpener || DEFAULT_CALL_OPENER)
            : (scripts.callFinalAttempt || DEFAULT_FINAL_ATTEMPT_CALL),
          tip: isLast ? 'Final attempt — mark lead as no_response if not picked.' : `If not picked — no voicemail, no SMS. Come back Day ${d + 1}.`,
        }

        // Recap SMS after call (blended only)
        if (smsEnabled && d === 2) {
          const recapBody = scripts.recapSms || DEFAULT_RECAP_SMS
          recapTouchpoint = {
            type: 'recap_sms',
            title: 'Recap SMS — Only if connected',
            timing: `Day ${d} · Post-call only`,
            body: recapBody,
            tip: 'ONLY send if call was answered. Sets expectation. No call = no SMS.',
            segmentInfo: smsSeg(recapBody),
          }
        }
      }
    }

    // Day 1: SMS first, then call. Day 2+: Call first, then SMS, then recap.
    if (isFirst) {
      if (smsTouchpoint) block.touchpoints.push(smsTouchpoint)
      if (callTouchpoint) block.touchpoints.push(callTouchpoint)
    } else {
      if (callTouchpoint) block.touchpoints.push(callTouchpoint)
      if (smsTouchpoint) block.touchpoints.push(smsTouchpoint)
    }
    if (recapTouchpoint) block.touchpoints.push(recapTouchpoint)

    if (block.touchpoints.length > 0) days.push(block)
  }

  return days
}

const dotColor: Record<string, string> = { green: 'bg-[#22C55E]', red: 'bg-[#EF4444]', amber: 'bg-[#F59E0B]' }
const labelColor: Record<string, string> = { green: 'text-[#15803D]', red: 'text-[#B91C1C]', amber: 'text-[#B45309]' }
const typeBadge: Record<string, { bg: string; text: string; label: string }> = {
  sms:        { bg: 'bg-[#D1FAE5]', text: 'text-[#065F46]', label: 'SMS' },
  call:       { bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]', label: 'CALL' },
  recap_sms:  { bg: 'bg-[#D1FAE5]', text: 'text-[#065F46]', label: 'SMS' },
}

function WorkflowTimeline({
  channelMode,
  schedule,
  scripts,
}: {
  channelMode: string
  schedule: { day: number; body: string; sendTime: string }[]
  scripts?: CallScripts
}) {
  const dayBlocks = getDayBlocks(channelMode, schedule, scripts)

  return (
    <div className="space-y-8">
      {dayBlocks.map((block) => (
        <div key={block.day}>
          {/* Full day block with continuous line */}
          <div className="flex gap-3">
            {/* Left column: circle + line */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-white border-2 border-[#E5E7EB] text-[#1A1A1A] flex items-center justify-center text-sm font-bold">
                {block.day}
              </div>
              <div className="w-0.5 flex-1 bg-[#E5E7EB]" />
            </div>

            {/* Right column: title + touchpoints */}
            <div className="flex-1 min-w-0 pb-2">
              <div className="mb-3 pt-1.5">
                <h3 className="text-[15px] font-bold text-[#1A1A1A]">Day {block.day} — {block.title}</h3>
                <p className="text-[11px] text-[#9CA3AF]">{block.subtitle}</p>
              </div>

              <div className="space-y-3">
            {block.touchpoints.map((tp, tpIdx) => {
              const badge = typeBadge[tp.type]

              return (
                <div
                  key={tpIdx}
                  className="rounded-[12px] border border-[#E5E7EB] bg-white overflow-hidden"
                >
                  {/* Touchpoint header */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#F9FAFB] border-b border-[#E5E7EB]">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                      <span className="text-[13px] font-semibold text-[#1A1A1A]">{tp.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#9CA3AF]">{tp.timing}</span>
                    </div>
                  </div>

                  <div className="px-4 py-3">
                    {/* Opener tag for Call cards */}
                    {tp.branches && (
                      <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.12em] mb-2">
                        Opener
                      </p>
                    )}

                    <p className="text-sm text-[#374151] leading-relaxed">
                      {tp.body}
                    </p>

                    {/* Segment info */}
                    {tp.segmentInfo && (
                      <p className="mt-1.5 text-xs font-medium text-[#10B981]">{tp.segmentInfo}</p>
                    )}

                    {/* Call branches removed — clean view */}

                    {/* Tip */}
                    {tp.tip && (
                      <div className="mt-2 rounded-[8px] bg-[#FFFBEB] border border-[#FDE68A] px-3 py-2 flex items-center gap-2">
                        <span className="text-xs">💡</span>
                        <p className="text-[11px] text-[#92400E]">{tp.tip}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
              </div>
            </div>
          </div>
        </div>
      ))}


      {/* Compliance note */}
      {channelMode !== 'call' && (
        <div className="rounded-[10px] bg-[#FFFBEB] border border-[#FDE68A] px-4 py-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-[#92400E] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#92400E] leading-relaxed">
            <strong>Compliance:</strong> Day 1 message must identify the dealership and include the &ldquo;Reply STOP to opt out&rdquo; footer — Vini will auto-append if missing.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Workflow Editor Modal ─────────────────────────────────────────────────

function WorkflowEditorModal({
  open,
  onClose,
  schedule,
  updateDay,
  removeDay,
  addDay,
  setFocusedIdx,
  channelMode,
  setChannelMode,
  scripts,
  updateScript,
}: {
  open: boolean
  onClose: () => void
  schedule: { day: number; body: string; sendTime: string }[]
  updateDay: (idx: number, patch: Partial<{ body: string; sendTime: string }>) => void
  removeDay: (idx: number) => void
  addDay: () => void
  setFocusedIdx: (idx: number | null) => void
  channelMode: 'sms' | 'call' | 'both'
  setChannelMode: (mode: 'sms' | 'call' | 'both') => void
  scripts: CallScripts
  updateScript: (key: 'callOpenerScript' | 'callFinalAttemptScript' | 'recapSmsBody', value: string) => void
}) {
  const channelOptions: Array<{ value: 'sms' | 'call' | 'both'; label: string; icon: typeof MessageSquare; iconColor: string; bg: string; border: string }> = [
    { value: 'sms',  label: 'SMS Only',  icon: MessageSquare, iconColor: 'text-[#10B981]', bg: 'bg-[#ECFDF5]', border: 'border-[#10B981]' },
    { value: 'call', label: 'Call Only', icon: PhoneCall,     iconColor: 'text-[#3B82F6]', bg: 'bg-[#EFF6FF]', border: 'border-[#3B82F6]' },
    { value: 'both', label: 'SMS + Call', icon: Zap,           iconColor: 'text-[#7C3AED]', bg: 'bg-[#F5F3FF]', border: 'border-[#7C3AED]' },
  ]

  // Per-day chips: matches the workflow timeline logic outside the modal.
  // SMS mode → every day = SMS
  // Call mode → every day = CALL
  // SMS + Call mode → Day 1 = SMS; Day 2 = CALL + SMS; last day = CALL + SMS; everything else = SMS
  const getDayChips = (day: number): Array<'sms' | 'call'> => {
    if (channelMode === 'sms') return ['sms']
    if (channelMode === 'call') return ['call']
    const totalDays = schedule.length
    const isLast = day === totalDays && day >= 3
    if (day === 1) return ['sms']
    if (day === 2 || isLast) return ['call', 'sms']
    return ['sms']
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 bg-[#F9FAFB]">
        <DialogHeader className="px-6 py-5 border-b border-gray-100 flex-shrink-0 bg-white rounded-t-lg">
          <DialogTitle className="text-[18px] font-bold text-[#1A1A1A]">
            Edit Workflow
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#6B7280] mt-1">
            Choose your channel and customize the SMS body and send time for each day. Day 1 is required and cannot be removed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Channel Selector */}
          <div>
            <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide mb-2 block">
              Channel
            </label>
            <div className="grid grid-cols-3 gap-2">
              {channelOptions.map((opt) => {
                const Icon = opt.icon
                const isActive = channelMode === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setChannelMode(opt.value)}
                    className={`relative flex items-center gap-2 px-3 py-2.5 rounded-[10px] border-2 transition-all text-sm font-medium ${
                      isActive
                        ? `${opt.border} ${opt.bg} text-[#1A1A1A]`
                        : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1D5DB]'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? opt.iconColor : 'text-[#9CA3AF]'}`} />
                    <span>{opt.label}</span>
                    {isActive && (
                      <Check className="h-3.5 w-3.5 ml-auto text-[#4600F2]" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Per-day editor */}
          <div className="space-y-4">
          {channelMode === 'call' ? (
            // Call Only — show 2 Call cards (First Contact + Final Attempt). No SMS schedule.
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#4600F2]/10 text-[#4600F2] text-xs font-bold">1</span>
                  <span className="text-[13px] font-semibold text-[#1A1A1A]">Day 1</span>
                </div>
                <div className="rounded-[12px] border border-[#E5E7EB] bg-white">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#EFF6FF] border-b border-[#DBEAFE] rounded-t-[12px]">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-[#DBEAFE] text-[#1D4ED8]">CALL</span>
                      <span className="text-[13px] font-semibold text-[#1A1A1A]">#1 — First Contact</span>
                    </div>
                    <span className="text-[11px] text-[#9CA3AF]">Morning</span>
                  </div>
                  <div className="px-4 py-3">
                    <Textarea
                      value={scripts.callOpener || DEFAULT_CALL_OPENER}
                      onChange={(e) => updateScript('callOpenerScript', e.target.value)}
                      rows={3}
                      className="text-sm"
                      placeholder="Enter the call opener script..."
                    />
                    <p className="mt-1.5 text-[11px] text-[#6B7280]">Spoken script — read by the AI agent on the call.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#4600F2]/10 text-[#4600F2] text-xs font-bold">3</span>
                  <span className="text-[13px] font-semibold text-[#1A1A1A]">Day 3</span>
                </div>
                <div className="rounded-[12px] border border-[#E5E7EB] bg-white">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#EFF6FF] border-b border-[#DBEAFE] rounded-t-[12px]">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-[#DBEAFE] text-[#1D4ED8]">CALL</span>
                      <span className="text-[13px] font-semibold text-[#1A1A1A]">#2 — Final Attempt</span>
                    </div>
                    <span className="text-[11px] text-[#9CA3AF]">Afternoon</span>
                  </div>
                  <div className="px-4 py-3">
                    <Textarea
                      value={scripts.callFinalAttempt || DEFAULT_FINAL_ATTEMPT_CALL}
                      onChange={(e) => updateScript('callFinalAttemptScript', e.target.value)}
                      rows={3}
                      className="text-sm"
                      placeholder="Enter the final attempt call script..."
                    />
                    <p className="mt-1.5 text-[11px] text-[#6B7280]">Last call attempt before marking the lead as no-response.</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
          {schedule.map((msg, idx) => {
            const chars = msg.body.length
            const segments = Math.max(1, Math.ceil(chars / 160))
            const segCls =
              chars === 0 ? 'text-[#9CA3AF]' :
              chars <= 160 ? 'text-[#10B981]' :
              chars <= 320 ? 'text-[#CA8A04]' :
              chars <= 480 ? 'text-[#F97316]' :
                             'text-[#EF4444]'
            const totalDays = schedule.length
            const isLastDay = msg.day === totalDays && msg.day >= 3
            const showCall = channelMode === 'both' && (msg.day === 2 || isLastDay)
            const showRecap = channelMode === 'both' && msg.day === 2
            const callBody = isLastDay && msg.day >= 3
              ? (scripts.callFinalAttempt || DEFAULT_FINAL_ATTEMPT_CALL)
              : (scripts.callOpener || DEFAULT_CALL_OPENER)
            const callKey: 'callOpenerScript' | 'callFinalAttemptScript' = (isLastDay && msg.day >= 3) ? 'callFinalAttemptScript' : 'callOpenerScript'
            const recapBody = scripts.recapSms || DEFAULT_RECAP_SMS
            const recapChars = recapBody.length
            const recapSegs = Math.max(1, Math.ceil(recapChars / 160))

            return (
              <div key={idx} className="space-y-2">
                {/* Day header */}
                <div className="flex items-center gap-2 px-1">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#4600F2]/10 text-[#4600F2] text-xs font-bold">
                    {msg.day}
                  </span>
                  <span className="text-[13px] font-semibold text-[#1A1A1A]">Day {msg.day}</span>
                </div>

                {/* Call card (Day 2 First Contact, or Final Attempt on last day) */}
                {showCall && (
                  <div className="rounded-[12px] border border-[#E5E7EB] bg-white">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#EFF6FF] border-b border-[#DBEAFE] rounded-t-[12px]">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-[#DBEAFE] text-[#1D4ED8]">CALL</span>
                        <span className="text-[13px] font-semibold text-[#1A1A1A]">
                          {isLastDay && msg.day >= 3 ? `#2 — Final Attempt` : `#1 — First Contact`}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#9CA3AF]">{isLastDay && msg.day >= 3 ? 'Afternoon' : 'Morning'}</span>
                    </div>
                    <div className="px-4 py-3">
                      <Textarea
                        value={callBody}
                        onChange={(e) => updateScript(callKey, e.target.value)}
                        rows={3}
                        className="text-sm"
                        placeholder="Enter the call opener script..."
                      />
                      <p className="mt-1.5 text-[11px] text-[#6B7280]">Spoken script — read by the AI agent on the call.</p>
                    </div>
                  </div>
                )}

                {/* SMS card */}
                <div className="rounded-[12px] border border-[#E5E7EB] bg-white">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#F9FAFB] border-b border-[#E5E7EB] rounded-t-[12px]">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-[#D1FAE5] text-[#065F46]">SMS</span>
                      <span className="text-[13px] font-semibold text-[#1A1A1A]">
                        {msg.day === 1 ? '#1 — Opening' : `Day ${msg.day} message`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-[#9CA3AF]" />
                      <Input
                        type="time"
                        value={msg.sendTime}
                        onChange={(e) => updateDay(idx, { sendTime: e.target.value })}
                        className="h-7 w-[110px] text-xs"
                      />
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => removeDay(idx)}
                          className="p-1 rounded text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
                          title="Remove day"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <Textarea
                      value={msg.body}
                      onChange={(e) => updateDay(idx, { body: e.target.value })}
                      onFocus={() => setFocusedIdx(idx)}
                      rows={3}
                      className="text-sm"
                      placeholder="Enter the SMS body for this day..."
                    />
                    <p className={`mt-1.5 text-xs font-medium ${segCls}`}>
                      {chars} / 480 chars · {segments} segment{segments === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                {/* Recap SMS card (only Day 2 of SMS+Call) */}
                {showRecap && (
                  <div className="rounded-[12px] border border-[#E5E7EB] bg-white">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#ECFDF5] border-b border-[#D1FAE5] rounded-t-[12px]">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-[#D1FAE5] text-[#065F46]">SMS</span>
                        <span className="text-[13px] font-semibold text-[#1A1A1A]">Recap — Only if connected</span>
                      </div>
                      <span className="text-[11px] text-[#9CA3AF]">Post-call only</span>
                    </div>
                    <div className="px-4 py-3">
                      <Textarea
                        value={recapBody}
                        onChange={(e) => updateScript('recapSmsBody', e.target.value)}
                        rows={3}
                        className="text-sm"
                        placeholder="Recap message sent after a connected call..."
                      />
                      <p className="mt-1.5 text-xs font-medium text-[#10B981]">
                        {recapChars} / 480 chars · {recapSegs} segment{recapSegs === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

            {schedule.length < 21 && (
              <button
                type="button"
                onClick={addDay}
                className="w-full rounded-[12px] border-2 border-dashed border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] hover:border-[#4600F2]/40 transition-all py-4 flex items-center justify-center gap-2 text-sm font-medium text-[#6B7280] hover:text-[#4600F2]"
              >
                <Plus className="h-4 w-4" />
                Add Day {schedule.length + 1}
              </button>
            )}
            </>
          )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-white rounded-b-lg">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-[#6B7280]">
              {channelMode === 'call'
                ? '2 call attempts configured'
                : `${schedule.length} of 21 days configured`}
            </span>
            <Button onClick={onClose} className="bg-[#4600F2] hover:bg-[#3800c2] text-white">
              <Check className="h-4 w-4 mr-1.5" />
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CampaignOffers() {
  const [offers, setOffers] = useState<string[]>([])
  const [draft, setDraft] = useState('')

  const addOffer = () => {
    const text = draft.trim()
    if (!text || offers.length >= 10) return
    setOffers((prev) => [...prev, text])
    setDraft('')
  }

  const removeOffer = (idx: number) => {
    setOffers((prev) => prev.filter((_, i) => i !== idx))
  }

  const moveOffer = (from: number, to: number) => {
    if (to < 0 || to >= offers.length) return
    setOffers((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  return (
    <div className="mt-6 rounded-[12px] border border-[#E5E7EB] bg-white">
      <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] px-5 py-4 rounded-t-[12px]">
        <h3 className="text-[16px] font-semibold text-[#1A1A1A]">Campaign Offers</h3>
        <p className="text-[13px] text-[#6B7280] mt-1">
          Add up to 10 offers for your campaign. Drag to reorder.
        </p>
      </div>
      <div className="p-5 space-y-4">
        {/* Add new offer */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#F3F4F6] text-[#9CA3AF] flex items-center justify-center text-xs font-bold flex-shrink-0">
            {offers.length + 1}
          </div>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOffer() } }}
            placeholder="Enter new offer text..."
            className="flex-1 h-10 text-[14px] border-[#E5E7EB]"
          />
          <Button
            type="button"
            onClick={addOffer}
            disabled={!draft.trim() || offers.length >= 10}
            className="bg-[#A78BFA] hover:bg-[#8B5CF6] text-white text-sm font-medium h-10 px-4 disabled:opacity-40"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add
          </Button>
        </div>

        {/* Offer list */}
        {offers.length === 0 ? (
          <p className="text-center text-sm text-[#9CA3AF] py-2">
            No offers added yet. Add your first offer above.
          </p>
        ) : (
          <div className="space-y-2">
            {offers.map((offer, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-[10px] border border-[#E5E7EB] bg-white group hover:border-[#CBD5E1] transition-colors"
              >
                <button
                  type="button"
                  className="text-[#D1D5DB] hover:text-[#6B7280] cursor-grab active:cursor-grabbing flex-shrink-0"
                  onMouseDown={() => {}}
                  title="Drag to reorder"
                >
                  <GripVertical className="h-4 w-4" />
                </button>
                <div className="w-6 h-6 rounded-full bg-[#EDE9FE] text-[#6D28D9] flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <span className="flex-1 text-sm text-[#1A1A1A] truncate">{offer}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => moveOffer(idx, idx - 1)}
                    disabled={idx === 0}
                    className="p-1 rounded hover:bg-[#F3F4F6] text-[#6B7280] disabled:opacity-30"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveOffer(idx, idx + 1)}
                    disabled={idx === offers.length - 1}
                    className="p-1 rounded hover:bg-[#F3F4F6] text-[#6B7280] disabled:opacity-30"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeOffer(idx)}
                    className="p-1 rounded hover:bg-[#FEF2F2] text-[#991B1B]"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {offers.length >= 10 && (
          <p className="text-xs text-[#6B7280]">Maximum of 10 offers reached.</p>
        )}
      </div>
    </div>
  )
}
