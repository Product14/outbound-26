'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft,
  MessageSquare,
  BarChart2,
  CalendarCheck,
  Trophy,
  Clock,
  UserMinus,
  DollarSign,
  TrendingUp,
  Info,
  PhoneCall,
  Zap,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getMockReportsData, type CampaignChannel } from '@/lib/outbound-local-data'
import { buildUrlWithParams } from '@/lib/url-utils'

function KpiCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  delta,
  tooltip,
}: {
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  label: string
  value: string | number
  delta?: string
  tooltip: string
}) {
  return (
    <div className="relative flex items-start space-x-3 rounded-[12px] border border-black/10 bg-white p-4">
      <div className={`flex-shrink-0 rounded-[8px] p-2 ${iconBg}`}>
        <div className={iconColor}>{icon}</div>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="mb-2 text-sm font-semibold leading-[1.4] text-[#6B7280]">{label}</h3>
        <p className="text-[22px] font-bold leading-[1.4] text-[#1A1A1A]">{value}</p>
        {delta && <p className="mt-1 text-xs font-medium text-[#6B7280]">{delta}</p>}
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
            <Info className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

function ChannelBadge({ channel }: { channel: CampaignChannel }) {
  if (channel === 'SMS+Call')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EDE9FE] text-[#6D28D9]">
        <Zap className="h-3 w-3" /> SMS + Call
      </span>
    )
  if (channel === 'SMS')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#D1FAE5] text-[#065F46]">
        <MessageSquare className="h-3 w-3" /> SMS
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#DBEAFE] text-[#1D4ED8]">
      <PhoneCall className="h-3 w-3" /> Call
    </span>
  )
}

export default function ReportsPage() {
  const data = useMemo(() => getMockReportsData(), [])
  const { kpis, campaignsBreakdown, optOutTrend } = data

  const maxOptOut = Math.max(...optOutTrend.map((p) => p.rate), 1)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <div className="page-container">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={buildUrlWithParams('/results')}
            className="flex items-center text-[#6B7280] hover:text-[#1A1A1A] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-page-heading text-text-primary">Reports</h1>
            <p className="text-subheading text-text-secondary">
              Aggregate SMS performance across all campaigns over the last 30 days
            </p>
          </div>
        </div>

        {/* KPI Grid */}
        <TooltipProvider>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <KpiCard icon={<BarChart2 className="h-4 w-4" />} iconBg="bg-[#EDE9FE]" iconColor="text-[#7C3AED]"
              label={kpis.totalCampaigns.label}      value={kpis.totalCampaigns.value}      delta={kpis.totalCampaigns.delta}
              tooltip="Total number of SMS campaigns active or completed in the period" />
            <KpiCard icon={<MessageSquare className="h-4 w-4" />} iconBg="bg-[#ECFDF5]" iconColor="text-[#10B981]"
              label={kpis.totalMessagesSent.label}   value={kpis.totalMessagesSent.value}   delta={kpis.totalMessagesSent.delta}
              tooltip="Total outbound SMS messages sent across every campaign" />
            <KpiCard icon={<TrendingUp className="h-4 w-4" />} iconBg="bg-[#FEF9C3]" iconColor="text-[#CA8A04]"
              label={kpis.overallReplyRate.label}    value={kpis.overallReplyRate.value}    delta={kpis.overallReplyRate.delta}
              tooltip="Leads who replied at least once / Total recipients, aggregated" />
            <KpiCard icon={<CalendarCheck className="h-4 w-4" />} iconBg="bg-[#EDE9FE]" iconColor="text-[#7C3AED]"
              label={kpis.overallBookingRate.label}  value={kpis.overallBookingRate.value}  delta={kpis.overallBookingRate.delta}
              tooltip="Appointments booked / Leads who replied, aggregated" />
            <KpiCard icon={<Trophy className="h-4 w-4" />} iconBg="bg-[#FEF3C7]" iconColor="text-[#D97706]"
              label={kpis.topCampaign.label}         value={kpis.topCampaign.value}         delta={kpis.topCampaign.delta}
              tooltip="Campaign with the highest booking rate in the period" />
            <KpiCard icon={<Clock className="h-4 w-4" />} iconBg="bg-[#FEF3C7]" iconColor="text-[#D97706]"
              label={kpis.avgDaysToReply.label}      value={kpis.avgDaysToReply.value}      delta={kpis.avgDaysToReply.delta}
              tooltip="On average, how many days into the sequence do leads first reply" />
            <KpiCard icon={<UserMinus className="h-4 w-4" />} iconBg="bg-[#F3F4F6]" iconColor="text-[#6B7280]"
              label={kpis.optOutTrend.label}         value={kpis.optOutTrend.value}         delta={kpis.optOutTrend.delta}
              tooltip="30-day rolling opt-out rate across all campaigns" />
            <KpiCard icon={<DollarSign className="h-4 w-4" />} iconBg="bg-[#D1FAE5]" iconColor="text-[#059669]"
              label={kpis.costPerAppointment.label}  value={kpis.costPerAppointment.value}  delta={kpis.costPerAppointment.delta}
              tooltip="Total SMS + call cost divided by appointments booked" />
          </div>
        </TooltipProvider>

        {/* Breakdown + Trend */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          {/* Breakdown table */}
          <Card className="rounded-[16px] border-0 bg-white xl:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">Campaigns Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Campaign</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Channel</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Messages</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Reply</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Book</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Appts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignsBreakdown.map((row) => (
                      <tr key={row.campaignId} className="border-b border-gray-50">
                        <td className="px-4 py-3">
                          <Link
                            href={buildUrlWithParams(`/results/${row.campaignId}`)}
                            className="text-[#1A1A1A] hover:text-[#4600F2] font-medium"
                          >
                            {row.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3"><ChannelBadge channel={row.channel} /></td>
                        <td className="px-4 py-3 text-right font-medium">{row.messagesSent.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{row.replyRate}%</td>
                        <td className="px-4 py-3 text-right">{row.bookingRate}%</td>
                        <td className="px-4 py-3 text-right font-semibold">{row.appointments}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Opt-out trend */}
          <Card className="rounded-[16px] border-0 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">Opt-Out Trend</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-[#6B7280] mb-4">Rolling 7-day opt-out rate (%)</p>
              <div className="flex items-end gap-3 h-40">
                {optOutTrend.map((p) => {
                  const h = Math.max(10, (p.rate / maxOptOut) * 100)
                  return (
                    <div key={p.date} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-gray-100 rounded-t flex items-end" style={{ height: '100%' }}>
                        <div
                          className="w-full rounded-t bg-[#F87171]/80"
                          style={{ height: `${h}%` }}
                          title={`${p.rate}%`}
                        />
                      </div>
                      <div className="text-[10px] text-[#6B7280] whitespace-nowrap">{p.date}</div>
                      <div className="text-[11px] font-semibold text-[#1A1A1A]">{p.rate}%</div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
