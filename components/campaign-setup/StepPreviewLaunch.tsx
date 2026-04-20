'use client'

import { useState } from 'react'
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
  X,
} from 'lucide-react'
import type { CampaignData, ConflictedLead } from '@/types/campaign-setup'

interface StepPreviewLaunchProps {
  campaignData: CampaignData
  onRemoveConflicts?: (conflicted: ConflictedLead[]) => void
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

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export default function StepPreviewLaunch({ campaignData, onRemoveConflicts }: StepPreviewLaunchProps) {
  const mode = campaignData.channelMode || 'both'
  const smsEnabled = mode !== 'call'
  const callEnabled = mode !== 'sms'
  const schedule = campaignData.messageSchedule || []
  const isRecurring = campaignData.vinSolutionsSettings?.enableRecurringLeads ?? false

  const activeEscalations = campaignData.escalationRules
    ? Object.values(campaignData.escalationRules).filter(Boolean).length
    : 6

  // Cross-campaign conflict detection
  const exemptUseCases = ['birthday', 'anniversary']
  const isExempt = exemptUseCases.includes(campaignData.subUseCase)

  const conflictedLeads: ConflictedLead[] = []
  if (!isExempt && campaignData.activeCampaigns && campaignData.uploadedData) {
    const newLeadPhones = new Set(
      campaignData.uploadedData.map((row) =>
        normalizePhone(String(row.phone ?? row.Phone ?? row.mobile ?? row.Mobile ?? ''))
      )
    )
    for (const activeCampaign of campaignData.activeCampaigns) {
      if (activeCampaign.status !== 'running' && activeCampaign.status !== 'paused') continue
      for (const lead of activeCampaign.leads) {
        const normalized = normalizePhone(lead.phone)
        if (normalized && newLeadPhones.has(normalized)) {
          conflictedLeads.push({
            phone: lead.phone,
            name: lead.name,
            conflictingCampaignName: activeCampaign.name,
            conflictingCampaignId: activeCampaign.campaignId,
          })
        }
      }
    }
  }

  // Modal state
  const [modalOpen, setModalOpen] = useState(conflictedLeads.length > 0)
  const [modalScreen, setModalScreen] = useState<'list' | 'warning'>('list')
  const [conflictsResolved, setConflictsResolved] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const handleRemoveConflicts = () => {
    onRemoveConflicts?.(conflictedLeads)
    setModalOpen(false)
    setConflictsResolved(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setModalScreen('list')
  }

  const handleContinueAnyway = () => setModalScreen('warning')

  const handleConfirmAndContinue = () => {
    setModalOpen(false)
    setModalScreen('list')
  }

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

      {/* ── Conflict Modal ── */}
      {modalOpen && conflictedLeads.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={handleCloseModal} />

          {/* Modal panel */}
          <div className="relative bg-white rounded-[16px] shadow-2xl w-full max-w-xl overflow-hidden">

            {/* ── Screen 1: Conflict list ── */}
            {modalScreen === 'list' && (
              <>
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#FEE2E2] flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="h-4 w-4 text-[#DC2626]" />
                    </div>
                    <h2 className="text-[15px] font-bold text-[#111827]">
                      {conflictedLeads.length} contact{conflictedLeads.length > 1 ? 's' : ''} already enrolled in active campaigns
                    </h2>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="w-7 h-7 rounded-full hover:bg-[#F3F4F6] flex items-center justify-center text-[#6B7280] hover:text-[#1A1A1A] transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="px-6 pb-4 text-[13px] text-[#B91C1C] leading-relaxed">
                  These leads are currently active in another campaign. Contacting them again may be disruptive.
                  You can remove them from this campaign or keep them and proceed anyway.
                </p>

                <div className="mx-6 mb-5 rounded-[10px] border border-[#FECACA] overflow-hidden">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="bg-[#FEE2E2]">
                        <th className="text-left px-4 py-2.5 text-[#991B1B] font-semibold">Name</th>
                        <th className="text-left px-4 py-2.5 text-[#991B1B] font-semibold">Phone</th>
                        <th className="text-left px-4 py-2.5 text-[#991B1B] font-semibold">Conflicting Campaign</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conflictedLeads.map((lead, i) => (
                        <tr
                          key={`${lead.phone}-${lead.conflictingCampaignId}-${i}`}
                          className={i % 2 === 0 ? 'bg-white' : 'bg-[#FFF5F5]'}
                        >
                          <td className="px-4 py-2.5 text-[#1A1A1A] font-medium">{lead.name}</td>
                          <td className="px-4 py-2.5 text-[#6B7280]">{lead.phone}</td>
                          <td className="px-4 py-2.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEE2E2] text-[#DC2626]">
                              {lead.conflictingCampaignName}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between gap-2 px-6 pb-6">
                  <button
                    onClick={handleContinueAnyway}
                    className="px-4 py-2.5 rounded-[10px] border border-[#E5E7EB] text-[#374151] text-[13px] font-semibold hover:bg-[#F3F4F6] transition-colors"
                  >
                    Continue anyway
                  </button>
                  <button
                    onClick={handleRemoveConflicts}
                    className="px-5 py-2.5 rounded-[10px] bg-[#DC2626] text-white text-[13px] font-semibold hover:bg-[#B91C1C] transition-colors"
                  >
                    Remove {conflictedLeads.length} conflicted contact{conflictedLeads.length > 1 ? 's' : ''}
                  </button>
                </div>
              </>
            )}

            {/* ── Screen 2: Warning before continuing ── */}
            {modalScreen === 'warning' && (
              <>
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="h-4 w-4 text-[#D97706]" />
                    </div>
                    <h2 className="text-[15px] font-bold text-[#111827]">
                      Before you continue — here's what could happen
                    </h2>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="w-7 h-7 rounded-full hover:bg-[#F3F4F6] flex items-center justify-center text-[#6B7280] hover:text-[#1A1A1A] transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="px-6 pb-5 space-y-3">
                  {[
                    {
                      title: 'Leads receive multiple outreach attempts',
                      desc: `${conflictedLeads.length} contact${conflictedLeads.length > 1 ? 's' : ''} will be contacted by both this campaign and an existing active one simultaneously.`,
                    },
                    {
                      title: 'Higher opt-out risk',
                      desc: 'Repeated contact from the same dealership increases the chance leads reply STOP, permanently removing them from future campaigns.',
                    },
                    {
                      title: 'Degraded lead experience',
                      desc: 'Multiple concurrent outreach threads create confusion and reduce the chance of a positive response or appointment.',
                    },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3 rounded-[10px] bg-[#FFFBEB] border border-[#FDE68A] px-4 py-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] flex-shrink-0 mt-1.5" />
                      <div>
                        <p className="text-[13px] font-semibold text-[#92400E]">{item.title}</p>
                        <p className="text-[12px] text-[#92400E] mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Don't show again checkbox */}
                <div className="px-6 pb-5">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={dontShowAgain}
                      onChange={(e) => setDontShowAgain(e.target.checked)}
                      className="w-4 h-4 rounded border-[#D1D5DB] text-[#DC2626] accent-[#DC2626] cursor-pointer"
                    />
                    <span className="text-[13px] text-[#6B7280]">Don't show this warning again</span>
                  </label>
                </div>

                <div className="flex items-center justify-between gap-2 px-6 pb-6">
                  <button
                    onClick={() => setModalScreen('list')}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] border border-[#E5E7EB] text-[#374151] text-[13px] font-semibold hover:bg-[#F3F4F6] transition-colors"
                  >
                    <ArrowUpRight className="h-4 w-4 rotate-180" />
                    Back
                  </button>
                  <button
                    onClick={handleConfirmAndContinue}
                    className="px-5 py-2.5 rounded-[10px] bg-[#1A1A1A] text-white text-[13px] font-semibold hover:bg-[#374151] transition-colors"
                  >
                    Confirm & Continue
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      <h2 className="text-[24px] font-bold text-[#1A1A1A] mb-2">Preview &amp; Launch</h2>
      <p className="text-[14px] text-[#6B7280] leading-[1.5] mb-6">
        Review your full campaign configuration before launching.
      </p>

      {/* ── Conflict banner (visible after modal is closed without resolving) ── */}
      {conflictedLeads.length > 0 && !modalOpen && !conflictsResolved && (
        <div className="rounded-[12px] border border-[#FECACA] bg-[#FFF5F5] px-4 py-3 mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle className="h-4 w-4 text-[#DC2626] flex-shrink-0" />
            <p className="text-[13px] text-[#991B1B] font-medium truncate">
              <span className="font-bold">{conflictedLeads.length} contact{conflictedLeads.length > 1 ? 's' : ''}</span> enrolled in active campaigns may receive duplicate outreach.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex-shrink-0 px-3 py-1.5 rounded-[8px] border border-[#FECACA] text-[#DC2626] text-[12px] font-semibold hover:bg-[#FEE2E2] transition-colors whitespace-nowrap"
          >
            View conflicts
          </button>
        </div>
      )}

      {/* ── Config warnings ── */}
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

      {/* ── 1. Channel & Details ── */}
      <SectionCard
        icon={<CheckCircle2 className="h-4 w-4" />}
        iconColor="text-[#10B981]"
        title="Channel & Details"
      >
        <Row label="Campaign name" value={campaignData.campaignName || '—'} />
        <Row label="Use case" value={campaignData.subUseCase || '—'} />
        <Row label="Channel" value={<ChannelPill mode={mode} />} />
        <Row
          label="Mode"
          value={
            isRecurring ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#EDE9FE] text-[#6D28D9]">
                Recurring
              </span>
            ) : (
              'One-time'
            )
          }
        />
        {isRecurring && (
          <>
            <Row label="Frequency" value={(campaignData as any).recurringFrequency || 'weekly'} />
            <Row label="Lead age filter" value={`${campaignData.vinSolutionsSettings?.leadAgeDays ?? 10}+ days`} />
          </>
        )}
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
        {isRecurring ? (
          <>
            <Row
              label="Mode"
              value={
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#EDE9FE] text-[#6D28D9]">
                  Recurring — {(campaignData as any).recurringFrequency || 'weekly'}
                </span>
              }
            />
            <Row label="Lead age filter" value={`${campaignData.vinSolutionsSettings?.leadAgeDays ?? 10}+ days since last contact`} />
          </>
        ) : (
          <>
            <Row
              label="Launch"
              value={
                campaignData.schedule === 'now'
                  ? 'Start immediately'
                  : `${campaignData.scheduledDate || '—'} at ${campaignData.scheduledTime || '—'}`
              }
            />
          </>
        )}
        <Row
          label="Quiet hours"
          value={`${campaignData.smsQuietStart || '09:00'} – ${campaignData.smsQuietEnd || '21:00'}`}
        />
      </SectionCard>

      {/* ── Launch hint ── */}
      <div className="rounded-[10px] bg-[#F5F3FF] border border-[#DDD6FE] px-4 py-3 flex items-start gap-2">
        <Users className="h-4 w-4 text-[#6D28D9] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[#6D28D9] leading-relaxed">
          {isRecurring ? (
            <>
              When you click <strong>Activate Recurring</strong>, Vini will automatically pull leads
              aged <strong>{campaignData.vinSolutionsSettings?.leadAgeDays ?? 10}+ days</strong> from
              your CRM <strong>{(campaignData as any).recurringFrequency || 'weekly'}</strong> and
              run the configured workflow sequence for each batch.
            </>
          ) : (
            <>
              When you click <strong>Launch Campaign</strong>, the first-touch message will be sent to all{' '}
              <strong>{campaignData.totalRecords.toLocaleString()}</strong> leads at their configured send
              time in the lead&apos;s local timezone.
            </>
          )}
        </p>
      </div>
    </div>
  )
}
