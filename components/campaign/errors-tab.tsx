'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, PhoneOff, ShieldAlert, UserMinus } from 'lucide-react'
import type { ErrorsData, SmsErrorRow, OptOutRow } from '@/lib/outbound-local-data'

interface ErrorsTabProps {
  data: ErrorsData
}

function ReasonPill({ reason }: { reason: SmsErrorRow['reason'] }) {
  const styles: Record<SmsErrorRow['reason'], string> = {
    'Invalid Number':     'bg-[#FEE2E2] text-[#991B1B]',
    'Landline Detected':  'bg-[#FEF3C7] text-[#92400E]',
    'Carrier Blocked':    'bg-[#E0E7FF] text-[#3730A3]',
    'Undelivered':        'bg-[#F3F4F6] text-[#374151]',
    'Spam Flagged':       'bg-[#FEE2E2] text-[#991B1B]',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${styles[reason]}`}>
      {reason}
    </span>
  )
}

function SummaryCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
}: {
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  label: string
  value: number
}) {
  return (
    <div className="flex items-start gap-3 rounded-[12px] border border-black/10 bg-white p-4">
      <div className={`flex-shrink-0 rounded-[8px] p-2 ${iconBg}`}>
        <div className={iconColor}>{icon}</div>
      </div>
      <div>
        <div className="text-sm font-semibold text-[#6B7280]">{label}</div>
        <div className="text-[24px] font-bold text-[#1A1A1A] leading-tight mt-1">{value}</div>
      </div>
    </div>
  )
}

export function ErrorsTab({ data }: ErrorsTabProps) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          icon={<AlertCircle className="h-4 w-4" />}
          iconBg="bg-[#FEE2E2]"
          iconColor="text-[#EF4444]"
          label="Delivery Failures"
          value={data.summary.totalFailures}
        />
        <SummaryCard
          icon={<UserMinus className="h-4 w-4" />}
          iconBg="bg-[#F3F4F6]"
          iconColor="text-[#6B7280]"
          label="Opt-Outs"
          value={data.summary.totalOptOuts}
        />
        <SummaryCard
          icon={<ShieldAlert className="h-4 w-4" />}
          iconBg="bg-[#FEF3C7]"
          iconColor="text-[#CA8A04]"
          label="Spam Flagged"
          value={data.summary.totalSpamFlagged}
        />
      </div>

      {/* Delivery Failures */}
      <Card className="rounded-[16px] border-0 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-[18px] font-semibold text-[#1A1A1A] flex items-center gap-2">
            <PhoneOff className="h-4 w-4 text-[#EF4444]" />
            Delivery Failures
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {data.deliveryFailures.length === 0 ? (
            <p className="text-sm text-gray-500">No delivery failures.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Lead</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Phone</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Reason</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Day</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Attempted</th>
                  </tr>
                </thead>
                <tbody>
                  {data.deliveryFailures.map((row) => (
                    <tr key={row.id} className="border-b border-gray-50">
                      <td className="px-4 py-3 font-medium text-[#1A1A1A]">{row.leadName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#374151]">{row.phone}</td>
                      <td className="px-4 py-3"><ReasonPill reason={row.reason} /></td>
                      <td className="px-4 py-3 text-[#374151]">Day {row.campaignDay}</td>
                      <td className="px-4 py-3 text-[#6B7280]">{row.attemptedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Opt-Outs */}
      <Card className="rounded-[16px] border-0 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-[18px] font-semibold text-[#1A1A1A] flex items-center gap-2">
            <UserMinus className="h-4 w-4 text-[#6B7280]" />
            Opt-Out Log
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {data.optOuts.length === 0 ? (
            <p className="text-sm text-gray-500">No opt-outs yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Lead</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Phone</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Day</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Message</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Opted Out At</th>
                  </tr>
                </thead>
                <tbody>
                  {data.optOuts.map((row: OptOutRow) => (
                    <tr key={row.id} className="border-b border-gray-50">
                      <td className="px-4 py-3 font-medium text-[#1A1A1A]">{row.leadName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#374151]">{row.phone}</td>
                      <td className="px-4 py-3 text-[#374151]">Day {row.day}</td>
                      <td className="px-4 py-3 text-[#374151] italic">&ldquo;{row.message}&rdquo;</td>
                      <td className="px-4 py-3 text-[#6B7280]">{row.optedOutAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spam Flagged */}
      <Card className="rounded-[16px] border-0 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-[18px] font-semibold text-[#1A1A1A] flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-[#CA8A04]" />
            Spam-Flagged Numbers
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {data.spamFlagged.length === 0 ? (
            <p className="text-sm text-gray-500">No spam-flagged numbers.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Lead</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Phone</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Reason</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Flagged At</th>
                  </tr>
                </thead>
                <tbody>
                  {data.spamFlagged.map((row) => (
                    <tr key={row.id} className="border-b border-gray-50">
                      <td className="px-4 py-3 font-medium text-[#1A1A1A]">{row.leadName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#374151]">{row.phone}</td>
                      <td className="px-4 py-3"><ReasonPill reason={row.reason} /></td>
                      <td className="px-4 py-3 text-[#6B7280]">{row.attemptedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
