'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, AlertCircle, Clock, MessageSquare, PhoneCall, Zap } from 'lucide-react'
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
      if (list.length >= 7) return prev
      return {
        ...prev,
        messageSchedule: [
          ...list,
          { day: list.length + 1, body: '', sendTime: '11:00' },
        ],
      }
    })
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
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-[24px] font-bold text-[#1A1A1A]">Workflow</h2>
        {channelChip}
      </div>
      <p className="text-[14px] text-[#6B7280] leading-[1.5] mb-6">
        Configure what Vini sends on Day&nbsp;1, Day&nbsp;2, … up to 7 days. Each day&apos;s message only sends if the lead hasn&apos;t replied yet. When they reply, the AI agent takes over the conversation automatically.
      </p>

      {/* Template + channel chips — clickable to switch channel */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs font-semibold text-[#6B7280] mr-1">Template</span>
        <button
          type="button"
          onClick={() => setCampaignData((prev) => ({ ...prev, channelMode: 'sms' }))}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            channelMode === 'sms'
              ? 'bg-[#D1FAE5] text-[#065F46] ring-2 ring-[#065F46]/40 shadow-sm'
              : 'bg-white text-[#9CA3AF] border border-[#E5E7EB] hover:bg-[#D1FAE5]/60 hover:text-[#065F46]'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" /> SMS
        </button>
        <button
          type="button"
          onClick={() => setCampaignData((prev) => ({ ...prev, channelMode: 'call' }))}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            channelMode === 'call'
              ? 'bg-[#DBEAFE] text-[#1D4ED8] ring-2 ring-[#1D4ED8]/40 shadow-sm'
              : 'bg-white text-[#9CA3AF] border border-[#E5E7EB] hover:bg-[#DBEAFE]/60 hover:text-[#1D4ED8]'
          }`}
        >
          <PhoneCall className="h-3.5 w-3.5" /> Call
        </button>
        <button
          type="button"
          onClick={() => setCampaignData((prev) => ({ ...prev, channelMode: 'both' }))}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            channelMode === 'both'
              ? 'bg-[#EDE9FE] text-[#6D28D9] ring-2 ring-[#6D28D9]/40 shadow-sm'
              : 'bg-white text-[#9CA3AF] border border-[#E5E7EB] hover:bg-[#EDE9FE]/60 hover:text-[#6D28D9]'
          }`}
        >
          <Zap className="h-3.5 w-3.5" /> SMS + Call
        </button>
      </div>

      {!smsEnabled && (
        <div className="rounded-[12px] border border-[#E5E7EB] bg-[#F9FAFB] p-5 mb-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-[#6B7280] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[#374151] leading-relaxed">
            <strong>Call Only</strong> is selected. SMS day-by-day messaging is disabled. Switch to <strong>SMS</strong> or <strong>SMS + Call</strong> above to configure messages.
          </div>
        </div>
      )}

      {smsEnabled && (<>
      <div className="space-y-4">
        {schedule.map((msg, idx) => (
          <div
            key={idx}
            className="rounded-[12px] border border-[#E5E7EB] bg-white p-5"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#EDE9FE] text-[#6D28D9] flex items-center justify-center font-bold text-sm flex-shrink-0">
                {msg.day}
              </div>
              <div className="flex-1">
                <Label className="text-sm font-semibold text-[#1A1A1A]">
                  Day {msg.day}{idx === 0 ? ' (required)' : ' (optional)'}
                </Label>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  {idx === 0
                    ? 'First-touch message — auto-appends opt-out footer if missing.'
                    : 'Sends on Day ' + msg.day + ' only if the lead has not replied to earlier messages.'}
                </p>
              </div>
              {idx > 0 && (
                <button
                  type="button"
                  onClick={() => removeDay(idx)}
                  className="p-1.5 rounded-md text-[#991B1B] hover:bg-[#FEF2F2] transition-colors flex-shrink-0"
                  title="Remove day"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <Textarea
              value={msg.body}
              onChange={(e) => updateDay(idx, { body: e.target.value })}
              onFocus={() => setFocusedIdx(idx)}
              rows={3}
              placeholder="Write your Day 1 message…"
              className="text-sm"
            />

            <div className="mt-2 flex items-center justify-between gap-4 flex-wrap">
              <SegmentIndicator chars={msg.body.length} />
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-[#6B7280]" />
                <Label className="text-xs text-[#6B7280]">Send at</Label>
                <Input
                  type="time"
                  value={msg.sendTime}
                  onChange={(e) => updateDay(idx, { sendTime: e.target.value })}
                  className="h-8 w-28 text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add day */}
      {schedule.length < 7 && (
        <Button
          type="button"
          variant="outline"
          onClick={addDay}
          className="mt-4 text-sm font-medium w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Day {schedule.length + 1}
        </Button>
      )}

      {/* Compliance note */}
      <div className="mt-6 rounded-[10px] bg-[#FFFBEB] border border-[#FDE68A] px-4 py-3 flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-[#92400E] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[#92400E] leading-relaxed">
          <strong>Compliance:</strong> Day 1 message must identify the dealership and include the &ldquo;Reply STOP to opt out&rdquo; footer — Vini will auto-append if missing.
        </p>
      </div>
      </>)}
    </div>
  )
}
