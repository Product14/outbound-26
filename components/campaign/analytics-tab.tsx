'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, Calendar, TrendingUp, RefreshCw, CheckCircle, Timer, MessageSquare, PhoneCall, Clock, Users, ArrowUpRight, ArrowDownRight, Minus, Send, BarChart2, PhoneForwarded, CalendarCheck, UserMinus } from 'lucide-react'
import { PerformanceTimeChart } from '@/components/charts/PerformanceTimeChart'
import type { CampaignDetailResponse } from '@/lib/campaign-api'
import type { CampaignAnalyticsResponse } from '@/lib/metrics-utils'
import type { AnalyticsExtrasData, SmsOverviewData } from '@/lib/outbound-local-data'

interface AnalyticsTabProps {
  isServiceCampaign: boolean
  campaignData: CampaignDetailResponse | null
  serviceStats: any
  calculatedStats: any
  activeTab: string
  onTabChange: (tab: string) => void
  analyticsData?: CampaignAnalyticsResponse | null
  extrasData?: AnalyticsExtrasData | null
  mode?: 'overview' | 'analytics'
  smsData?: SmsOverviewData
}

export function AnalyticsTab({
  isServiceCampaign,
  campaignData,
  serviceStats,
  calculatedStats,
  activeTab,
  onTabChange,
  analyticsData,
  extrasData,
  mode = 'overview',
  smsData,
}: AnalyticsTabProps) {
  if (!campaignData) return null

  // Function to get top performing vehicles from API data only
  const getTopPerformingVehicles = () => {
    if (analyticsData?.topPerformingVehicles && analyticsData.topPerformingVehicles.length > 0) {
      // Use real API data
      return analyticsData.topPerformingVehicles.map((vehicle, index) => ({
        vehicle: vehicle.vehicleName,
        appointments: vehicle.appointmentsCount,
        percentage: vehicle.conversionRate
      }))
    }
    // Return empty array if no real data available
    return []
  }

  // ── Analytics Extras helpers ─────────────────────────────────────────────
  const heatmapMaxVal = extrasData
    ? Math.max(...extrasData.heatmap.flat(), 1)
    : 1

  // ── Detailed metrics computed from campaign data ──────────────────────────
  const totalCalls = calculatedStats?.callsMade ?? serviceStats?.serviceCallsMade ?? campaignData?.campaign.totalCallPlaced ?? 0
  const answered = calculatedStats?.callsAnswered ?? serviceStats?.callsAnswered ?? Math.round(totalCalls * 0.6)
  const appointments = calculatedStats?.appointmentCount ?? serviceStats?.serviceAppointmentCount ?? campaignData?.campaign.appointmentScheduled ?? 0
  const conversionRate = calculatedStats?.salesConversionRate ?? serviceStats?.serviceConversionRate ?? (totalCalls > 0 ? Math.round((appointments / totalCalls) * 100) : 0)
  const answerRate = calculatedStats?.answerRate ?? serviceStats?.serviceAnswerRate ?? campaignData?.campaign.answerRate ?? 0
  const avgDuration = calculatedStats?.avgCallDuration ?? serviceStats?.serviceAvgCallDuration ?? '2:45'

  const detailedMetrics = [
    { label: 'Total Calls', value: totalCalls.toLocaleString(), icon: Phone, color: '#4600F2', bg: '#F0F4FF', trend: '+12%', trendUp: true },
    { label: 'Calls Answered', value: answered.toLocaleString(), icon: CheckCircle, color: '#22C55E', bg: '#F0FDF4', trend: `${answerRate}%`, trendUp: true },
    { label: 'Appointments Set', value: appointments.toLocaleString(), icon: Calendar, color: '#F59E0B', bg: '#FFFBEB', trend: `${conversionRate}% conv.`, trendUp: true },
    { label: 'Avg Call Duration', value: avgDuration, icon: Clock, color: '#8B5CF6', bg: '#F5F3FF', trend: null, trendUp: null },
    { label: 'Contact Rate', value: `${answerRate}%`, icon: Users, color: '#6366F1', bg: '#EEF2FF', trend: `${answered} of ${totalCalls}`, trendUp: true },
  ]

  // ── GitHub-style heatmap color function ──────────────────────────────────
  const getGithubHeatmapColor = (val: number, maxVal: number) => {
    if (val === 0) return '#ebedf0'
    const t = val / maxVal
    if (t < 0.2) return '#9be9a8'
    if (t < 0.4) return '#40c463'
    if (t < 0.7) return '#30a14e'
    return '#216e39'
  }

  // Three extra sections (shared by both service + sales)
  const ExtrasSection = extrasData ? (
    <>
      {/* Detailed Metrics Grid */}
      <Card className="border-0 bg-white rounded-[16px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">
            Detailed Metrics
          </CardTitle>
          <p className="text-sm text-[#6B7280] mt-0.5">Comprehensive breakdown of campaign performance indicators</p>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {detailedMetrics.map((m) => (
              <div key={m.label} className="p-3.5 rounded-[12px] border border-[#F0F0F0] hover:border-[#E0E0E0] transition-colors">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: m.bg }}>
                    <m.icon className="h-3.5 w-3.5" style={{ color: m.color }} />
                  </div>
                  <span className="text-[11px] font-medium text-[#6B7280] leading-tight">{m.label}</span>
                </div>
                <div className="text-[20px] font-bold text-[#1A1A1A] leading-none">{m.value}</div>
                {m.trend && (
                  <div className="flex items-center gap-1 mt-1.5">
                    {m.trendUp === true && <ArrowUpRight className="h-3 w-3 text-[#22C55E]" />}
                    {m.trendUp === false && <ArrowDownRight className="h-3 w-3 text-[#EF4444]" />}
                    {m.trendUp === null && <Minus className="h-3 w-3 text-[#9CA3AF]" />}
                    <span className={`text-[11px] font-medium ${
                      m.trendUp === true ? 'text-[#22C55E]' : m.trendUp === false ? 'text-[#EF4444]' : 'text-[#9CA3AF]'
                    }`}>
                      {m.trend}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Objection Breakdown */}
      <Card className="border-0 bg-white rounded-[16px]">
        <CardHeader className="pb-4">
          <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">
            Objection Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {extrasData.objections.map((obj) => (
              <div key={obj.label} className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: obj.color + '20' }}
                >
                  <span className="text-sm font-bold" style={{ color: obj.color }}>
                    {obj.count}
                  </span>
                </div>
                <span className="flex-1 text-sm text-[#1A1A1A]">{obj.label}</span>
                <div className="flex items-center gap-2 w-36 flex-shrink-0">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${obj.resolutionRate}%`, backgroundColor: obj.color }}
                    />
                  </div>
                  <span className="text-xs text-[#6B7280] w-14 text-right">
                    {obj.resolutionRate}% res.
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Channel Comparison */}
      <Card className="border-0 bg-white rounded-[16px]">
        <CardHeader className="pb-4">
          <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">
            Channel Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wide w-1/3">
                    Metric
                  </th>
                  <th className="text-center py-2 px-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wide w-1/3">
                    <div className="flex items-center justify-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-[#10B981]" />
                      SMS
                    </div>
                  </th>
                  <th className="text-center py-2 px-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wide w-1/3">
                    <div className="flex items-center justify-center gap-1.5">
                      <PhoneCall className="h-3.5 w-3.5 text-[#3B82F6]" />
                      Call
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {extrasData.channelComparison.map((row, i) => (
                  <tr
                    key={row.metric}
                    className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-[#FAFAFA]'}`}
                  >
                    <td className="py-3 pr-4 text-sm font-medium text-[#1A1A1A]">
                      {row.metric}
                    </td>
                    <td
                      className={`py-3 px-4 text-center text-sm font-semibold rounded-l ${
                        row.smsHighlight
                          ? 'text-[#065F46] bg-[#D1FAE5]'
                          : 'text-[#1A1A1A]'
                      }`}
                    >
                      {row.sms}
                    </td>
                    <td
                      className={`py-3 px-4 text-center text-sm font-semibold rounded-r ${
                        row.callHighlight
                          ? 'text-[#1E40AF] bg-[#DBEAFE]'
                          : 'text-[#1A1A1A]'
                      }`}
                    >
                      {row.call}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {extrasData.channelFootnote && (
              <p className="mt-3 text-xs text-[#9CA3AF]">{extrasData.channelFootnote}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Multi-Day Reply Effectiveness */}
      {smsData?.dailyStats && smsData.dailyStats.length > 0 && (
        <Card className="border-0 bg-white rounded-[16px]">
          <CardHeader className="pb-4">
            <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">
              Multi-Day Reply Effectiveness
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {smsData.dailyStats.map((day) => {
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
      )}
    </>
  ) : null

  // ── SMS Analytics section (metrics, outcome distribution, multi-day) ────
  const SmsAnalyticsSection = smsData ? (
    <>
      {/* SMS Top Metrics */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <div className="relative flex items-start space-x-3 rounded-[12px] border border-black/10 bg-white p-4">
          <div className="flex-shrink-0 rounded-[8px] p-2 bg-[#ECFDF5]">
            <Send className="h-4 w-4 text-[#10B981]" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">SMS Sent</h3>
            <p className="text-[22px] font-bold leading-tight text-[#1A1A1A]">{smsData.metrics.smsSent.value.toLocaleString()}</p>
            <p className="mt-1 text-xs text-[#6B7280]">{smsData.metrics.smsSent.delta}</p>
          </div>
        </div>

        <div className="relative flex items-start space-x-3 rounded-[12px] border border-black/10 bg-white p-4">
          <div className="flex-shrink-0 rounded-[8px] p-2 bg-[#FEF9C3]">
            <BarChart2 className="h-4 w-4 text-[#CA8A04]" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Reply Rate</h3>
            <p className="text-[22px] font-bold leading-tight text-[#1A1A1A]">{smsData.metrics.replyRate.value}</p>
            <p className="mt-1 text-xs text-[#6B7280]">{smsData.metrics.replyRate.delta}</p>
          </div>
        </div>

        <div className="relative flex items-start space-x-3 rounded-[12px] border border-black/10 bg-white p-4">
          <div className="flex-shrink-0 rounded-[8px] p-2 bg-[#FEE2E2]">
            <PhoneForwarded className="h-4 w-4 text-[#EF4444]" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Escalated</h3>
            <p className="text-[22px] font-bold leading-tight text-[#1A1A1A]">{smsData.metrics.escalatedToCall.value}</p>
            <p className="mt-1 text-xs text-[#6B7280]">{smsData.metrics.escalatedToCall.delta}</p>
          </div>
        </div>

        <div className="relative flex items-start space-x-3 rounded-[12px] border border-black/10 bg-white p-4">
          <div className="flex-shrink-0 rounded-[8px] p-2 bg-[#EDE9FE]">
            <CalendarCheck className="h-4 w-4 text-[#7C3AED]" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Appts Booked</h3>
            <p className="text-[22px] font-bold leading-tight text-[#1A1A1A]">{smsData.metrics.appointmentsBooked.value}</p>
            <p className="mt-1 text-xs text-[#6B7280]">{smsData.metrics.appointmentsBooked.delta}</p>
          </div>
        </div>

        <div className="relative flex items-start space-x-3 rounded-[12px] border border-black/10 bg-white p-4">
          <div className="flex-shrink-0 rounded-[8px] p-2 bg-[#F3F4F6]">
            <UserMinus className="h-4 w-4 text-[#6B7280]" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Opt-Out Rate</h3>
            <p className="text-[22px] font-bold leading-tight text-[#1A1A1A]">{smsData.metrics.optOutRate.value}</p>
            <p className="mt-1 text-xs text-[#6B7280]">{smsData.metrics.optOutRate.delta}</p>
          </div>
        </div>
      </div>

      {/* Outcome Distribution + Reply Rate Heatmap + Multi-Day — single row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Outcome Distribution */}
        <Card className="rounded-[16px] border-0 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">Outcome Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {smsData.outcomeDistribution.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-sm text-[#6B7280] flex-1 min-w-0">{item.label}</span>
                  <span className="text-sm font-bold text-[#1A1A1A] w-10 text-right">{item.count}</span>
                  <div className="w-20 h-6 bg-gray-100 rounded overflow-hidden flex-shrink-0 relative">
                    <div
                      className="h-full rounded"
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                    />
                  </div>
                  <span className="text-sm font-medium text-[#6B7280] w-10 text-right flex-shrink-0">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reply Rate Heatmap */}
        {extrasData ? (
          <Card className="rounded-[16px] border-0 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">Reply Rate Heatmap</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <div className="inline-flex gap-[3px]">
                  <div className="flex flex-col gap-[3px] pr-1.5 justify-start">
                    {extrasData.heatmapDays.map((day, i) => (
                      <div key={i} className="h-[15px] flex items-center justify-end">
                        <span className="text-[10px] font-medium text-[#6B7280] leading-none">{day}</span>
                      </div>
                    ))}
                  </div>
                  {extrasData.heatmapHours.map((hour, hi) => (
                    <div key={hi} className="flex flex-col gap-[3px]">
                      {extrasData.heatmap.map((row, di) => {
                        const val = row[hi]
                        return (
                          <div
                            key={di}
                            className="w-[15px] h-[15px] rounded-[2px] relative group cursor-default"
                            style={{ backgroundColor: getGithubHeatmapColor(val, heatmapMaxVal) }}
                          >
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-[#1b1f23] text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 font-medium shadow-lg">
                              {val}% — {extrasData.heatmapDays[di]} {hour}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-[#1b1f23]" />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
                <div className="flex mt-1.5" style={{ paddingLeft: 20 }}>
                  {extrasData.heatmapHours.map((h, i) => (
                    <span key={i} className="text-[9px] text-[#6B7280] font-medium" style={{ width: 18, textAlign: 'center' }}>
                      {i % 2 === 0 ? h : ''}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 mt-4">
                  <span className="text-[10px] text-[#6B7280] mr-0.5">Less</span>
                  {['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'].map((color, i) => (
                    <div key={i} className="w-[11px] h-[11px] rounded-[2px]" style={{ backgroundColor: color }} />
                  ))}
                  <span className="text-[10px] text-[#6B7280] ml-0.5">More</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Multi-Day Reply Effectiveness */}
        <Card className="rounded-[16px] border-0 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">Multi-Day Reply Effectiveness</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {smsData.dailyStats.map((day) => {
                const isPositive = day.replyRate >= 0
                const barWidth = Math.min(Math.abs(day.replyRate) / 35 * 100, 100)
                return (
                  <div key={day.day} className="rounded-[12px] border border-black/10 bg-white p-4 space-y-3">
                    <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Day {day.day}</p>
                    <div>
                      <p className="text-[20px] font-bold text-[#1A1A1A]">{day.sent.toLocaleString()} sent</p>
                      <p className={`text-sm font-medium mt-0.5 ${isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                        {day.replies} replies &middot; {isPositive ? '' : '-'}{Math.abs(day.replyRate).toFixed(1)}%
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${barWidth}%`, backgroundColor: isPositive ? '#22C55E' : '#EF4444' }}
                        />
                      </div>
                      <p className="text-xs text-[#6B7280]">Cumulative: {day.cumulativeRate.toFixed(1)}%</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  ) : null

  if (mode === 'analytics') {
    return <div className="space-y-6">{ExtrasSection}{SmsAnalyticsSection}</div>
  }

  if (isServiceCampaign) {
    return (
      <div className="space-y-6">
        {/* 1. Service Campaign Overview and Service Funnel - Horizontal Layout */}
        <div className="grid grid-cols-2 gap-6">
          {/* Campaign Overview - 2x2 Grid */}
          <Card className="border-0 bg-white rounded-[16px]">
            <CardHeader className="pb-4">
              <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">
                Service Campaign Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                  <div className="p-2 bg-[#F0F4FF] rounded-[8px] flex-shrink-0 hidden min-[1100px]:block">
                    <Phone className="h-5 w-5 text-[#4600F2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Total Service Calls Made</h3>
                    <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                      {serviceStats?.serviceCallsMade ?? campaignData?.campaign.totalCallPlaced ?? 0}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                  <div className="p-2 bg-[#F0FDF4] rounded-[8px] flex-shrink-0 hidden min-[1100px]:block">
                    <Calendar className="h-5 w-5 text-[#22C55E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Total Service Appointments Set</h3>
                    <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                      {serviceStats?.serviceAppointmentCount ?? campaignData?.campaign.appointmentScheduled ?? 0}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                  <div className="p-2 bg-[#FEFCE8] rounded-[8px] flex-shrink-0 hidden min-[1100px]:block">
                    <TrendingUp className="h-5 w-5 text-[#F59E0B]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Service Conversion Rate</h3>
                    <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                      {serviceStats?.serviceConversionRate ?? 0}%
                    </p>
                  </div>
                </div>
                
                
                <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                  <div className="p-2 bg-[#F0FDF4] rounded-[8px] flex-shrink-0 hidden min-[1100px]:block">
                    <CheckCircle className="h-5 w-5 text-[#22C55E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Answer Rate (Service)</h3>
                    <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                      {(serviceStats?.serviceAnswerRate ?? campaignData?.campaign.answerRate ?? 0)}%
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                  <div className="p-2 bg-[#FDF2F8] rounded-[8px] flex-shrink-0 hidden min-[1100px]:block">
                    <Timer className="h-5 w-5 text-[#EC4899]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Avg Call Duration (Service)</h3>
                    <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                      {serviceStats?.serviceAvgCallDuration ?? '2:45'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Funnel */}
          <Card className="border-0 bg-white rounded-[16px]">
            <CardHeader className="pb-4">
              <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">
                Service Funnel
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="relative">
                {/* Service funnel stages with visual widths representing conversion */}
                <div className="space-y-4">
                  {/* Customer contact initiated */}
                  <div>
                    <div className="bg-gradient-to-r from-[#E0E7FF] to-[#C7D2FE] text-[#3730A3] p-4 rounded-[12px] shadow-sm border border-[#C7D2FE]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 hidden min-[1100px]:block" />
                          <span className="font-semibold">Customer contact initiated</span>
                        </div>
                        <div className="text-[20px] font-bold">{serviceStats?.serviceCallsMade ?? campaignData?.campaign.totalCallPlaced ?? 0}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contacted successfully */}
                  <div>
                    <div className="bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0] text-[#065F46] p-4 rounded-[12px] shadow-sm border border-[#A7F3D0]" style={{width: '85%'}}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 hidden min-[1100px]:block" />
                          <span className="font-semibold">Contacted successfully</span>
                        </div>
                        <div className="text-[20px] font-bold">{serviceStats?.callsAnswered ?? Math.round((campaignData?.campaign.totalCallPlaced ?? 0) * 0.6)}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Followups requested */}
                  {/* <div>
                    <div className="bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] text-[#92400E] p-4 rounded-[12px] shadow-sm border border-[#F59E0B]" style={{width: '70%'}}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <RefreshCw className="h-5 w-5 hidden min-[1100px]:block" />
                          <span className="font-semibold">Followups requested</span>
                        </div>
                        <div className="text-[20px] font-bold">{serviceStats?.followUpRequested ?? 0}</div>
                      </div>
                    </div>
                  </div> */}
                  
                  {/* Appointments scheduled */}
                  <div>
                    <div className="bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] text-[#92400E] p-4 rounded-[12px] shadow-sm border border-[#FDE68A]" style={{width: '55%'}}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 hidden min-[1100px]:block" />
                          <span className="font-semibold">Appointments scheduled</span>
                        </div>
                        <div className="text-[20px] font-bold">{serviceStats?.serviceAppointmentCount ?? campaignData?.campaign.appointmentScheduled ?? 0}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Service funnel summary */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white border border-black/10 rounded-[12px]">
                    <h3 className="text-[#6B7280] font-semibold text-sm mb-1">Answer Rate</h3>
                    <p className="text-[#065F46] text-[18px] font-bold">{serviceStats?.serviceAnswerRate ?? Math.round((Math.round((campaignData?.campaign.totalCallPlaced ?? 0) * 0.6) / (campaignData?.campaign.totalCallPlaced ?? 1)) * 100)}%</p>
                  </div>
                  
                  <div className="p-3 bg-white border border-black/10 rounded-[12px]">
                    <h3 className="text-[#6B7280] font-semibold text-sm mb-1">Overall Conversion</h3>
                    <p className="text-[#92400E] text-[18px] font-bold">{serviceStats?.serviceConversionRate ?? 0}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3. Best Performance Time and Top Performing Services */}
        <div className="grid grid-cols-2 gap-6">
          <PerformanceTimeChart 
            data={analyticsData?.performanceByTime && analyticsData.performanceByTime.length > 0 
              ? analyticsData.performanceByTime.map(item => ({
                  hour: item.hour,
                  calls: item.totalCalls,
                  appointments: item.successfulCalls,
                  successRate: item.successRate
                }))
              : []
            } 
            title="Best Campaign Performance Time"
          />

          <Card className="border-0 bg-white rounded-[16px]">
            <CardHeader className="pb-4">
              <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">
                Top Performing Services
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {(analyticsData?.topPerformingServices || []).length > 0 ? (
                  (analyticsData?.topPerformingServices || []).slice(0, 5).map((service: any, index: number) => (
                    <div key={service.service} className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-[8px]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#F0F4FF] rounded-full flex items-center justify-center text-[#4600F2] font-bold text-sm">
                          {index + 1}
                        </div>
                        <span className="font-medium text-[#1A1A1A]">{service.service}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-[16px] font-bold text-[#1A1A1A]">{service.appointments}</div>
                        <div className="text-xs text-[#6B7280]">appointments</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    <div className="text-center">
                      <p className="text-sm">No service data available</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {ExtrasSection}
        {SmsAnalyticsSection}

      </div>
    )
  } else {
    // Sales Campaign Analytics
    return (
      <div className="space-y-6">
        {/* 1. Sales Campaign Overview and Sales Funnel - Horizontal Layout */}
        <div className="grid grid-cols-2 gap-6">
          {/* Campaign Overview - 2x2 Grid */}
          <Card className="border-0 bg-white rounded-[16px]">
            <CardHeader className="pb-4">
              <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">
                Campaign Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                  <div className="p-2 bg-[#F0F4FF] rounded-[8px] flex-shrink-0 hidden min-[1100px]:block">
                    <Phone className="h-5 w-5 text-[#4600F2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Total Sales Calls Made</h3>
                    <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                      {calculatedStats?.callsMade ?? campaignData?.campaign.totalCallPlaced ?? 0}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                  <div className="p-2 bg-[#F0FDF4] rounded-[8px] flex-shrink-0 hidden min-[1100px]:block">
                    <Calendar className="h-5 w-5 text-[#22C55E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Total Appointments Set</h3>
                    <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                      {calculatedStats?.appointmentCount ?? campaignData?.campaign.appointmentScheduled ?? 0}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                  <div className="p-2 bg-[#FEFCE8] rounded-[8px] flex-shrink-0 hidden min-[1100px]:block">
                    <TrendingUp className="h-5 w-5 text-[#F59E0B]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Sales Conversion Rate</h3>
                    <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                      {calculatedStats?.salesConversionRate ?? 0}%
                    </p>
                  </div>
                </div>
                
                
                <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                  <div className="p-2 bg-[#F0FDF4] rounded-[8px] flex-shrink-0 hidden min-[1100px]:block">
                    <CheckCircle className="h-5 w-5 text-[#22C55E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Answer Rate (Sales)</h3>
                    <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                      {(calculatedStats?.answerRate ?? campaignData?.campaign.answerRate ?? 0)}%
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                  <div className="p-2 bg-[#FDF2F8] rounded-[8px] flex-shrink-0 hidden min-[1100px]:block">
                    <Timer className="h-5 w-5 text-[#EC4899]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Avg Call Duration (Sales)</h3>
                    <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                      {calculatedStats?.avgCallDuration ?? '2:45'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales Funnel */}
          <Card className="border-0 bg-white rounded-[16px]">
            <CardHeader className="pb-4">
              <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">
                Sales Funnel
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="relative">
                {/* Funnel stages with visual widths representing conversion */}
                <div className="space-y-4">
                  {/* Customer contact initiated */}
                  <div>
                    <div className="bg-gradient-to-r from-[#E0E7FF] to-[#C7D2FE] text-[#3730A3] p-4 rounded-[12px] shadow-sm border border-[#C7D2FE]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 hidden min-[1100px]:block" />
                          <span className="font-semibold">Customer contact initiated</span>
                        </div>
                        <div className="text-[20px] font-bold">{analyticsData?.overview?.totalCallsInitiated ?? calculatedStats?.callsMade ?? campaignData?.campaign.totalCallPlaced ?? 0}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contacted successfully */}
                  <div>
                    <div className="bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0] text-[#065F46] p-4 rounded-[12px] shadow-sm border border-[#A7F3D0]" style={{width: '85%'}}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 hidden min-[1100px]:block" />
                          <span className="font-semibold">Contacted successfully</span>
                        </div>
                        <div className="text-[20px] font-bold">{analyticsData?.overview?.totalConnectedCalls ?? calculatedStats?.callsAnswered ?? Math.round((campaignData?.campaign.totalCallPlaced ?? 0) * 0.6)}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Followups requested */}
                  {/* <div>
                    <div className="bg-gradient-to-r from-[#DBEAFE] to-[#BFDBFE] text-[#1E3A8A] p-4 rounded-[12px] shadow-sm border border-[#BFDBFE]" style={{width: '70%'}}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <RefreshCw className="h-5 w-5 hidden min-[1100px]:block" />
                          <span className="font-semibold">Followups requested</span>
                        </div>
                        <div className="text-[20px] font-bold">{calculatedStats?.followUpRequested ?? 0}</div>
                      </div>
                    </div>
                  </div> */}
                  
                  {/* Appointments scheduled */}
                  <div>
                    <div className="bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] text-[#92400E] p-4 rounded-[12px] shadow-sm border border-[#FDE68A]" style={{width: '55%'}}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 hidden min-[1100px]:block" />
                          <span className="font-semibold">Appointments scheduled</span>
                        </div>
                        <div className="text-[20px] font-bold">{analyticsData?.overview?.totalAppointments ?? calculatedStats?.appointmentCount ?? campaignData?.campaign.appointmentScheduled ?? 0}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3. Best Campaign Performance Time and Top Performing Vehicles */}
        <div className="grid grid-cols-2 gap-6">
          <PerformanceTimeChart 
            data={analyticsData?.performanceByTime && analyticsData.performanceByTime.length > 0 
              ? analyticsData.performanceByTime.map(item => ({
                  hour: item.hour,
                  calls: item.totalCalls,
                  appointments: item.successfulCalls,
                  successRate: item.successRate
                }))
              : []
            } 
            title="Best Campaign Performance Time"
          />

          <Card className="border-0 bg-white rounded-[16px] h-[320px] flex flex-col">
            <CardHeader className="pb-4 flex-shrink-0">
              <CardTitle className="text-sm font-semibold text-[#1A1A1A]">
                Top Performing Vehicles
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex-1 overflow-hidden">
              <div className="space-y-2 overflow-y-auto h-full pr-2">
                {getTopPerformingVehicles().length > 0 ? (
                  getTopPerformingVehicles().map((vehicle, index) => (
                    <div key={vehicle.vehicle} className="flex items-center justify-between p-2 border border-[#E5E7EB] rounded-[8px]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-[#F0F4FF] rounded-full flex items-center justify-center text-[#4600F2] font-bold text-xs">
                          {index + 1}
                        </div>
                        <span className="font-medium text-[#1A1A1A]">{vehicle.vehicle}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-[16px] font-bold text-[#1A1A1A]">{vehicle.appointments}</div>
                        <div className="text-xs text-[#6B7280]">{vehicle.percentage}%</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center py-8 text-gray-500 h-full">
                    <div className="text-center">
                      <p className="text-sm">No vehicle data available</p>
                      <p className="text-xs mt-1">Data will appear once appointments are scheduled</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {ExtrasSection}
        {SmsAnalyticsSection}
      </div>
    )
  }
}
