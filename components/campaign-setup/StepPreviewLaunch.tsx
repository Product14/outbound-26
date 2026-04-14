'use client'

import {
  MessageSquare,
  PhoneCall,
  Zap,
  Users,
  Clock,
  CheckCircle2,
  FileText,
  Settings,
  Calendar,
  AlertTriangle,
  Volume2,
  Moon,
  Repeat,
  ArrowUpRight,
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

function SectionCard({
  icon,
  iconColor,
  title,
  children,
}: {
  icon: React.ReactNode
  iconColor: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-5 mb-5">
      <div className="flex items-center gap-2 mb-4">
        <div className={iconColor}>{icon}</div>
        <h3 className="text-sm font-semibold text-[#1A1A1A]">{title}</h3>
      </div>
      {children}
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
  const mode = campaignData.channelMode || 'both'
  const smsEnabled = mode !== 'call'
  const callEnabled = mode !== 'sms'
  const schedule = campaignData.messageSchedule || []

  const activeEscalations = campaignData.escalationRules
    ? Object.values(campaignData.escalationRules).filter(Boolean).length
    : 6

  // Detect potential conflicts
  const conflicts: string[] = []
  if (smsEnabled && schedule.length === 0) {
    conflicts.push('SMS channel is enabled but no day messages are configured in the Workflow.')
  }
  if (smsEnabled && schedule.some((m) => !m.body.trim())) {
    conflicts.push('One or more day messages have an empty body — leads on those days will not receive an SMS.')
  }
  if (campaignData.totalRecords === 0) {
    conflicts.push('No leads are enrolled. Upload a CSV or pull from your CRM in the Lead Source step.')
  }
  if (!campaignData.campaignName.trim()) {
    conflicts.push('Campaign name is empty — go back to Channel & Details to set it.')
  }
  if (campaignData.schedule === 'scheduled' && !campaignData.scheduledDate) {
    conflicts.push('Campaign is set to "Schedule for Later" but no start date is selected.')
  }
  if (callEnabled && !campaignData.voicemailStrategy) {
    conflicts.push('Call channel is active but no voicemail strategy is selected.')
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-[24px] font-bold text-[#1A1A1A] mb-2">Preview &amp; Launch</h2>
      <p className="text-[14px] text-[#6B7280] leading-[1.5] mb-6">
        Review your full campaign configuration before launching.
      </p>

      {/* ── 1. Channel & Details ── */}
      <SectionCard
        icon={<CheckCircle2 className="h-4 w-4" />}
        iconColor="text-[#10B981]"
        title="Channel & Details"
      >
        <Row label="Campaign name" value={campaignData.campaignName || '—'} />
        <Row label="Use case" value={campaignData.subUseCase || '—'} />
        <Row label="Channel" value={<ChannelPill mode={mode} />} />
        <Row label="Leads enrolled" value={campaignData.totalRecords.toLocaleString()} />
        {campaignData.fileName && <Row label="File" value={campaignData.fileName} />}
      </SectionCard>

      {/* ── 2. Workflow (message sequence) ── */}
      {smsEnabled && schedule.length > 0 && (
        <SectionCard
          icon={<MessageSquare className="h-4 w-4" />}
          iconColor="text-[#10B981]"
          title={`Workflow (${schedule.length} day${schedule.length > 1 ? 's' : ''})`}
        >
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
        </SectionCard>
      )}

      {/* ── 3. Rules ── */}
      <SectionCard
        icon={<Settings className="h-4 w-4" />}
        iconColor="text-[#7C3AED]"
        title="Rules"
      >
        <Row label="Max retry attempts" value={campaignData.maxRetryAttempts} />
        <Row
          label="Retry delay"
          value={
            campaignData.maxRetryAttempts === 0
              ? 'N/A'
              : campaignData.retryDelayMinutes >= 60
              ? `${campaignData.retryDelayMinutes / 60}h`
              : `${campaignData.retryDelayMinutes}m`
          }
        />
        {callEnabled && (
          <Row
            label="Voicemail strategy"
            value={
              <span className="capitalize">
                {(campaignData.voicemailStrategy || 'leave_message').replace(/_/g, ' ')}
              </span>
            }
          />
        )}
        {mode === 'both' && (
          <Row label="Escalation rules active" value={`${activeEscalations} of 6`} />
        )}
      </SectionCard>

      {/* ── 4. Schedule ── */}
      <SectionCard
        icon={<Calendar className="h-4 w-4" />}
        iconColor="text-[#F59E0B]"
        title="Schedule"
      >
        <Row
          label="Launch"
          value={
            campaignData.schedule === 'now'
              ? 'Start immediately'
              : `${campaignData.scheduledDate || '—'} at ${campaignData.scheduledTime || '—'}`
          }
        />
        {campaignData.scheduledEndDate && (
          <Row label="End date" value={campaignData.scheduledEndDate} />
        )}
        <Row
          label="Quiet hours"
          value={`${campaignData.smsQuietStart || '09:00'} – ${campaignData.smsQuietEnd || '21:00'}`}
        />
        <Row
          label="Recurring"
          value={
            campaignData.vinSolutionsSettings?.enableRecurringLeads
              ? `Yes — ${(campaignData as any).recurringFrequency || 'weekly'}, leads aged ${campaignData.vinSolutionsSettings?.leadAgeDays ?? 10}+ days`
              : 'Off'
          }
        />
      </SectionCard>

      {/* ── 5. Conflicts / Warnings ── */}
      {conflicts.length > 0 && (
        <div className="rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-[#D97706]" />
            <h3 className="text-sm font-semibold text-[#92400E]">
              {conflicts.length} {conflicts.length === 1 ? 'issue' : 'issues'} detected
            </h3>
          </div>
          <ul className="space-y-2">
            {conflicts.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#92400E]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] flex-shrink-0 mt-1.5" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Launch hint ── */}
      <div className="rounded-[10px] bg-[#F5F3FF] border border-[#DDD6FE] px-4 py-3 flex items-start gap-2">
        <Users className="h-4 w-4 text-[#6D28D9] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[#6D28D9] leading-relaxed">
          When you click <strong>Launch Campaign</strong>, the first-touch message will be sent to all{' '}
          <strong>{campaignData.totalRecords.toLocaleString()}</strong> leads at their configured send
          time in the lead&apos;s local timezone.
        </p>
      </div>
    </div>
  )
}
