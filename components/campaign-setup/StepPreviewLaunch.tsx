'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Send,
  MessageSquare,
  PhoneCall,
  Zap,
  Users,
  Clock,
  Bell,
  CheckCircle2,
} from 'lucide-react'
import type { CampaignData } from '@/types/campaign-setup'

interface StepPreviewLaunchProps {
  campaignData: CampaignData
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-[#6B7280]">{label}</span>
      <span className="text-sm font-medium text-[#1A1A1A] text-right max-w-[60%]">{value}</span>
    </div>
  )
}

function ChannelPill({ mode }: { mode?: 'sms' | 'call' | 'both' }) {
  if (mode === 'both')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#EDE9FE] text-[#6D28D9]">
        <Zap className="h-3 w-3" /> SMS + Call
      </span>
    )
  if (mode === 'sms')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#D1FAE5] text-[#065F46]">
        <MessageSquare className="h-3 w-3" /> SMS Only
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#DBEAFE] text-[#1D4ED8]">
      <PhoneCall className="h-3 w-3" /> Call Only
    </span>
  )
}

export default function StepPreviewLaunch({ campaignData }: StepPreviewLaunchProps) {
  const [testPhone, setTestPhone] = useState('')
  const [testSent, setTestSent] = useState(false)
  const mode = campaignData.channelMode || 'both'
  const smsEnabled = mode !== 'call'
  const schedule = campaignData.messageSchedule || []

  const sendTest = () => {
    if (!testPhone) return
    setTestSent(true)
    setTimeout(() => setTestSent(false), 3000)
  }

  const activeEscalations = campaignData.escalationRules
    ? Object.values(campaignData.escalationRules).filter(Boolean).length
    : 6

  return (
    <div className="max-w-3xl">
      <h2 className="text-[24px] font-bold text-[#1A1A1A] mb-2">Preview &amp; Launch</h2>
      <p className="text-[14px] text-[#6B7280] leading-[1.5] mb-6">
        Review everything before launching. Send a test SMS to your own phone to double-check how the first-touch message will look.
      </p>

      {/* Summary */}
      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
          <h3 className="text-sm font-semibold text-[#1A1A1A]">Campaign Summary</h3>
        </div>
        <Row label="Name" value={campaignData.campaignName || '—'} />
        <Row label="Use case" value={campaignData.subUseCase || '—'} />
        <Row label="Channel" value={<ChannelPill mode={mode} />} />
        <Row label="Leads enrolled" value={<span>{campaignData.totalRecords.toLocaleString()}</span>} />
        <Row
          label="Schedule"
          value={
            campaignData.schedule === 'now'
              ? 'Start immediately'
              : `Scheduled ${campaignData.scheduledDate || ''} ${campaignData.scheduledTime || ''}`
          }
        />
      </div>

      {/* SMS Schedule preview */}
      {smsEnabled && schedule.length > 0 && (
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-4 w-4 text-[#10B981]" />
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Message Schedule ({schedule.length} day{schedule.length > 1 ? 's' : ''})</h3>
          </div>
          <div className="space-y-3">
            {schedule.map((m) => (
              <div key={m.day} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#EDE9FE] text-[#6D28D9] flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {m.day}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-[#1A1A1A]">Day {m.day}</span>
                    <span className="text-[11px] text-[#6B7280] flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {m.sendTime}
                    </span>
                  </div>
                  <div className="rounded-[10px] bg-[#F3F4F6] px-3 py-2 text-sm text-[#1A1A1A] whitespace-pre-wrap">
                    {m.body || <span className="italic text-[#9CA3AF]">No message configured</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules summary */}
      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-4 w-4 text-[#7C3AED]" />
          <h3 className="text-sm font-semibold text-[#1A1A1A]">Rules</h3>
        </div>
        {smsEnabled && (
          <Row
            label="SMS quiet hours"
            value={`${campaignData.smsQuietStart || '09:00'} – ${campaignData.smsQuietEnd || '21:00'}`}
          />
        )}
        <Row label="Max retry attempts" value={<span>{campaignData.maxRetryAttempts}</span>} />
        {mode !== 'sms' && (
          <Row label="Voicemail strategy" value={<span className="capitalize">{campaignData.voicemailStrategy.replace(/_/g, ' ')}</span>} />
        )}
        {mode === 'both' && (
          <Row label="Active escalation rules" value={`${activeEscalations} of 6`} />
        )}
      </div>

      {/* Test SMS */}
      {smsEnabled && (
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <Send className="h-4 w-4 text-[#4600F2]" />
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Send a Test SMS</h3>
          </div>
          <p className="text-xs text-[#6B7280] mb-3 leading-relaxed">
            Send the Day&nbsp;1 message to your own phone to double-check copy, formatting, and variable substitution before launching.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label className="sr-only">Phone number</Label>
              <Input
                type="tel"
                placeholder="+1 (305) 555-0100"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="text-sm"
              />
            </div>
            <Button
              onClick={sendTest}
              disabled={!testPhone}
              className="bg-[#4600F2] hover:bg-[#3700C2] text-white text-sm font-medium"
            >
              <Send className="h-4 w-4 mr-2" /> Send Test
            </Button>
          </div>
          {testSent && (
            <p className="text-xs text-[#10B981] font-medium mt-2 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Test SMS queued for {testPhone}
            </p>
          )}
        </div>
      )}

      {/* Launch hint */}
      <div className="mt-5 rounded-[10px] bg-[#F5F3FF] border border-[#DDD6FE] px-4 py-3 flex items-start gap-2">
        <Users className="h-4 w-4 text-[#6D28D9] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[#6D28D9] leading-relaxed">
          When you click <strong>Launch Campaign</strong>, the first-touch message will be sent to all <strong>{campaignData.totalRecords.toLocaleString()}</strong> leads at their configured send time in the lead&apos;s local timezone.
        </p>
      </div>
    </div>
  )
}
