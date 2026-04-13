'use client'

import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AppointmentFunnel from '@/components/ui/appointment-funnel'
import {
  BarChart2,
  CalendarCheck,
  Info,
  MessageSquare,
  PhoneForwarded,
  UserMinus,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { SmsOverviewData } from '@/lib/outbound-local-data'

interface SmsOverviewTabProps {
  data: SmsOverviewData
}

function SmsMetricCard({
  icon,
  iconBg,
  iconColor,
  title,
  value,
  helper,
  tooltip,
}: {
  icon: ReactNode
  iconBg: string
  iconColor: string
  title: string
  value: string | number
  helper: string
  tooltip: string
}) {
  const positive = helper.trim().startsWith('↑')

  return (
    <div className="relative flex items-start space-x-3 rounded-[12px] border border-black/10 bg-white p-4">
      <div className={`flex-shrink-0 rounded-[8px] p-2 ${iconBg}`}>
        <div className={iconColor}>{icon}</div>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="mb-2 text-sm font-semibold leading-[1.4] text-[#6B7280]">{title}</h3>
        <p className="text-[24px] font-bold leading-[1.4] text-[#1A1A1A]">{value}</p>
        <p className={`mt-1 text-xs font-medium ${positive ? 'text-[#10B981]' : 'text-[#6B7280]'}`}>
          {helper}
        </p>
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

export function SmsOverviewTab({ data }: SmsOverviewTabProps) {
  const { metrics, funnel, outcomeDistribution, dailyStats } = data

  const deliveredRate = funnel.enrolled > 0 ? Math.round((funnel.delivered / funnel.enrolled) * 100) : 0
  const replyRate = funnel.delivered > 0 ? Math.round((funnel.replied / funnel.delivered) * 100) : 0
  const escalationRate = funnel.replied > 0 ? Math.round((funnel.escalated / funnel.replied) * 100) : 0
  const bookedRate = funnel.replied > 0 ? Math.round((funnel.booked / funnel.replied) * 100) : 0

  return (
    <div className="space-y-6">
      {/* ── Top Metrics Row ── */}
      <TooltipProvider>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
          <SmsMetricCard
            icon={<MessageSquare className="h-4 w-4" />}
            iconBg="bg-[#ECFDF5]"
            iconColor="text-[#10B981]"
            title={metrics.smsSent.label}
            value={metrics.smsSent.value.toLocaleString()}
            helper={metrics.smsSent.delta}
            tooltip="Total SMS messages sent in the last 7 days"
          />
          <SmsMetricCard
            icon={<BarChart2 className="h-4 w-4" />}
            iconBg="bg-[#FEF9C3]"
            iconColor="text-[#CA8A04]"
            title={metrics.replyRate.label}
            value={metrics.replyRate.value}
            helper={metrics.replyRate.delta}
            tooltip="Percentage of SMS messages that received a reply"
          />
          <SmsMetricCard
            icon={<CalendarCheck className="h-4 w-4" />}
            iconBg="bg-[#EDE9FE]"
            iconColor="text-[#7C3AED]"
            title={metrics.appointmentsBooked.label}
            value={metrics.appointmentsBooked.value.toLocaleString()}
            helper={metrics.appointmentsBooked.delta}
            tooltip="Total appointments booked through the SMS sequence"
          />
          <SmsMetricCard
            icon={<PhoneForwarded className="h-4 w-4" />}
            iconBg="bg-[#FEE2E2]"
            iconColor="text-[#EF4444]"
            title={metrics.escalatedToCall.label}
            value={metrics.escalatedToCall.value.toLocaleString()}
            helper={metrics.escalatedToCall.delta}
            tooltip="Conversations escalated from SMS to a live call"
          />
          <SmsMetricCard
            icon={<UserMinus className="h-4 w-4" />}
            iconBg="bg-[#F3F4F6]"
            iconColor="text-[#6B7280]"
            title={metrics.optOutRate.label}
            value={metrics.optOutRate.value}
            helper={metrics.optOutRate.delta}
            tooltip="Percentage of leads who opted out of SMS"
          />
        </div>
      </TooltipProvider>

      {/* ── SMS Funnel + Outcome Distribution ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* SMS Funnel */}
        <Card className="rounded-[16px] border-0 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">
              SMS Funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-0">
            <div className="h-52">
              <AppointmentFunnel
                data={{
                  stages: [
                    { name: 'Enrolled', count: funnel.enrolled },
                    { name: 'Delivered', count: funnel.delivered },
                    { name: 'Replied', count: funnel.replied },
                    { name: 'Escalated to call', count: funnel.escalated },
                    { name: 'Appointments booked', count: funnel.booked },
                  ],
                  conversionRates: [
                    { rate: deliveredRate },
                    { rate: replyRate },
                    { rate: escalationRate },
                    { rate: bookedRate },
                  ],
                }}
                cardBackgroundColor="#ECFDF5"
                graphColor="#22C55E"
                conversionChipColor="#BBF7D0"
                textColor="text-[#14532D]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-[12px] border border-black/10 bg-white p-3">
                <h3 className="mb-1 text-sm font-semibold text-[#6B7280]">Delivery Rate</h3>
                <p className="text-[18px] font-bold text-[#14532D]">{deliveredRate}%</p>
              </div>
              <div className="rounded-[12px] border border-black/10 bg-white p-3">
                <h3 className="mb-1 text-sm font-semibold text-[#6B7280]">Reply Conversion</h3>
                <p className="text-[18px] font-bold text-[#14532D]">{replyRate}%</p>
              </div>
              <div className="rounded-[12px] border border-black/10 bg-white p-3">
                <h3 className="mb-1 text-sm font-semibold text-[#6B7280]">Escalation Rate</h3>
                <p className="text-[18px] font-bold text-[#14532D]">{escalationRate}%</p>
              </div>
              <div className="rounded-[12px] border border-black/10 bg-white p-3">
                <h3 className="mb-1 text-sm font-semibold text-[#6B7280]">Booked from Replies</h3>
                <p className="text-[18px] font-bold text-[#14532D]">{bookedRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Outcome Distribution */}
        <Card className="rounded-[16px] border-0 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">
              Outcome Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {outcomeDistribution.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-[#6B7280] flex-1 min-w-0 truncate">{item.label}</span>
                  <span className="text-sm font-semibold text-[#1A1A1A] w-10 text-right">{item.count}</span>
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                    />
                  </div>
                  <span className="text-xs font-medium text-[#6B7280] w-8 text-right flex-shrink-0">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Multi-Day Reply Effectiveness ── */}
      <Card className="rounded-[16px] border-0 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">
            Multi-Day Reply Effectiveness
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {dailyStats.map((day) => {
              const isPositive = day.replyRate >= 0
              const barWidth = Math.min(Math.abs(day.replyRate) / 35 * 100, 100)

              return (
                <div key={day.day} className="rounded-[12px] border border-black/10 bg-white p-4 space-y-3">
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Day {day.day}</p>
                  <div>
                    <p className="text-[20px] font-bold text-[#1A1A1A]">{day.sent.toLocaleString()} sent</p>
                    <p className={`text-sm font-medium mt-0.5 ${isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                      {day.replies} replies · {isPositive ? '' : '-'}{Math.abs(day.replyRate).toFixed(1)}%
                    </p>
                  </div>
                  {/* Bar */}
                  <div className="space-y-1">
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: isPositive ? '#22C55E' : '#EF4444',
                        }}
                      />
                    </div>
                    <p className="text-xs text-[#6B7280]">
                      Cumulative: {day.cumulativeRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
