'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, Calendar, TrendingUp, RefreshCw, CheckCircle, Timer, Target, MessageSquare, PhoneCall } from 'lucide-react'
import { PerformanceTimeChart } from '@/components/charts/PerformanceTimeChart'
import type { CampaignDetailResponse } from '@/lib/campaign-api'
import type { CampaignAnalyticsResponse } from '@/lib/metrics-utils'
import type { AnalyticsExtrasData } from '@/lib/outbound-local-data'

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
  const getHeatmapColor = (val: number, maxVal: number) => {
    if (maxVal === 0) return 'rgba(34,197,94,0.05)'
    const t = val / maxVal
    return `rgba(34,197,94,${(t * 0.75 + 0.05).toFixed(2)})`
  }

  const heatmapMaxVal = extrasData
    ? Math.max(...extrasData.heatmap.flat(), 1)
    : 1

  // Three extra sections (shared by both service + sales)
  const ExtrasSection = extrasData ? (
    <>
      {/* Objection Breakdown + Heatmap */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
                  {/* Count badge */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: obj.color + '20' }}
                  >
                    <span className="text-sm font-bold" style={{ color: obj.color }}>
                      {obj.count}
                    </span>
                  </div>
                  {/* Label */}
                  <span className="flex-1 text-sm text-[#1A1A1A]">{obj.label}</span>
                  {/* Resolution bar */}
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

        {/* Reply Rate Heatmap */}
        <Card className="border-0 bg-white rounded-[16px]">
          <CardHeader className="pb-4">
            <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">
              Reply Rate Heatmap
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-[2px]">
                <thead>
                  <tr>
                    <th className="w-6" />
                    {extrasData.heatmapHours.map((h) => (
                      <th
                        key={h}
                        className="text-[10px] font-medium text-[#9CA3AF] text-center pb-1"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {extrasData.heatmap.map((row, di) => (
                    <tr key={di}>
                      <td className="text-[10px] font-semibold text-[#6B7280] pr-1 text-right">
                        {extrasData.heatmapDays[di]}
                      </td>
                      {row.map((val, hi) => (
                        <td key={hi} className="p-0">
                          <div
                            className="rounded-[3px] flex items-center justify-center"
                            style={{
                              backgroundColor: getHeatmapColor(val, heatmapMaxVal),
                              width: '100%',
                              height: 22,
                            }}
                          >
                            {val >= 28 && (
                              <span className="text-[9px] font-semibold text-[#14532D]">
                                {val}%
                              </span>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Legend */}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[10px] text-[#9CA3AF]">Low</span>
                <div className="flex gap-0.5">
                  {[0.08, 0.2, 0.35, 0.5, 0.65, 0.8].map((t, i) => (
                    <div
                      key={i}
                      className="w-5 h-2.5 rounded-[2px]"
                      style={{ backgroundColor: `rgba(34,197,94,${t})` }}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-[#9CA3AF]">High</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
    </>
  ) : null

  if (mode === 'analytics') {
    return <div className="space-y-6">{ExtrasSection}</div>
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
      </div>
    )
  }
}
