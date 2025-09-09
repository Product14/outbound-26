'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Phone, Calendar, TrendingUp, RefreshCw, CheckCircle, Timer, Target } from 'lucide-react'
import { PerformanceTimeChart } from '@/components/charts/PerformanceTimeChart'
import { generateTopPerformingVehicles, generateTopPerformingServices, generatePerformanceTimeData } from '@/lib/call-status-utils'
import type { CampaignDetailResponse } from '@/lib/campaign-api'

interface AnalyticsTabProps {
  isServiceCampaign: boolean
  campaignData: CampaignDetailResponse | null
  serviceStats: any
  calculatedStats: any
  activeTab: string
  onTabChange: (tab: string) => void
}

export function AnalyticsTab({
  isServiceCampaign,
  campaignData,
  serviceStats,
  calculatedStats,
  activeTab,
  onTabChange
}: AnalyticsTabProps) {
  if (!campaignData) return null

  if (isServiceCampaign) {
    return (
      <div className="space-y-6">
        {/* Tab Switcher */}
        <div className="flex items-center">
          <Tabs value={activeTab} onValueChange={onTabChange} className="flex-1">
            <TabsList className="h-auto p-0 bg-transparent border-0 rounded-none justify-start">
              {/* Analytics Tab - Commented out for now */}
              {/* <TabsTrigger 
                value="analytics" 
                className="flex items-center gap-2 py-3 text-base font-medium bg-transparent border-0 rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#4600F2] data-[state=active]:border-b-2 data-[state=active]:border-[#4600F2] data-[state=active]:font-semibold text-gray-500 hover:text-gray-700 transition-colors mr-10"
              >
                Analytics
              </TabsTrigger> */}
              <TabsTrigger 
                value="live-calls" 
                className="flex items-center gap-2 py-3 text-base font-medium bg-transparent border-0 rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#4600F2] data-[state=active]:border-b-2 data-[state=active]:border-[#4600F2] data-[state=active]:font-semibold text-gray-500 hover:text-gray-700 transition-colors mr-10"
              >
                Live Calls & Queue
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
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
                  <div className="p-2 bg-[#F0F4FF] rounded-[8px] flex-shrink-0">
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
                  <div className="p-2 bg-[#F0FDF4] rounded-[8px] flex-shrink-0">
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
                  <div className="p-2 bg-[#FEFCE8] rounded-[8px] flex-shrink-0">
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
                  <div className="p-2 bg-[#EFF6FF] rounded-[8px] flex-shrink-0">
                    <RefreshCw className="h-5 w-5 text-[#3B82F6]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Follow-ups Requested</h3>
                    <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                      {serviceStats?.followUpRequested ?? 0}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                  <div className="p-2 bg-[#F0FDF4] rounded-[8px] flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-[#22C55E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Answer Rate (Service)</h3>
                    <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                      {serviceStats?.serviceAnswerRate ?? campaignData?.campaign.answerRate ?? 0}%
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                  <div className="p-2 bg-[#FDF2F8] rounded-[8px] flex-shrink-0">
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
                          <Phone className="h-5 w-5" />
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
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-semibold">Contacted successfully</span>
                        </div>
                        <div className="text-[20px] font-bold">{serviceStats?.callsAnswered ?? Math.round((campaignData?.campaign.totalCallPlaced ?? 0) * 0.6)}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Followups requested */}
                  <div>
                    <div className="bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] text-[#92400E] p-4 rounded-[12px] shadow-sm border border-[#F59E0B]" style={{width: '70%'}}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <RefreshCw className="h-5 w-5" />
                          <span className="font-semibold">Followups requested</span>
                        </div>
                        <div className="text-[20px] font-bold">{serviceStats?.followUpRequested ?? 0}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Appointments scheduled */}
                  <div>
                    <div className="bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] text-[#92400E] p-4 rounded-[12px] shadow-sm border border-[#FDE68A]" style={{width: '55%'}}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5" />
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
            data={generatePerformanceTimeData()} 
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
                {generateTopPerformingServices(serviceStats?.serviceAppointmentCount ?? campaignData?.campaign.appointmentScheduled ?? 0).map((service: any, index: number) => (
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
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 4. Follow-up Metrics (Service) */}
        <Card className="border-0 bg-white rounded-[16px]">
          <CardHeader className="pb-4">
            <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">
              Follow-up Metrics (Service)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                <div className="p-2 bg-[#EFF6FF] rounded-[8px] flex-shrink-0">
                  <RefreshCw className="h-5 w-5 text-[#3B82F6]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Total Follow-ups Requested (Service)</h3>
                  <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                    {serviceStats?.followUpRequested ?? 0}
                  </p>
                  <p className="text-[#6B7280] text-xs mt-1">Number of follow-up requests made for service-related calls</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                <div className="p-2 bg-[#F0FDF4] rounded-[8px] flex-shrink-0">
                  <Target className="h-5 w-5 text-[#22C55E]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Follow-up Success Rate (Service)</h3>
                  <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                    {serviceStats?.followUpSuccessRate ?? 0}%
                  </p>
                  <p className="text-[#6B7280] text-xs mt-1">Percentage of follow-up calls that resulted in confirmed service appointments</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  } else {
    // Sales Campaign Analytics
    return (
      <div className="space-y-6">
        {/* Tab Switcher */}
        <div className="flex items-center">
          <Tabs value={activeTab} onValueChange={onTabChange} className="flex-1">
            <TabsList className="h-auto p-0 bg-transparent border-0 rounded-none justify-start">
              {/* Analytics Tab - Commented out for now */}
              {/* <TabsTrigger 
                value="analytics" 
                className="flex items-center gap-2 py-3 text-base font-medium bg-transparent border-0 rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#4600F2] data-[state=active]:border-b-2 data-[state=active]:border-[#4600F2] data-[state=active]:font-semibold text-gray-500 hover:text-gray-700 transition-colors mr-10"
              >
                Analytics
              </TabsTrigger> */}
              <TabsTrigger 
                value="live-calls" 
                className="flex items-center gap-2 py-3 text-base font-medium bg-transparent border-0 rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#4600F2] data-[state=active]:border-b-2 data-[state=active]:border-[#4600F2] data-[state=active]:font-semibold text-gray-500 hover:text-gray-700 transition-colors mr-10"
              >
                Live Calls & Queue
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
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
                  <div className="p-2 bg-[#F0F4FF] rounded-[8px] flex-shrink-0">
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
                  <div className="p-2 bg-[#F0FDF4] rounded-[8px] flex-shrink-0">
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
                  <div className="p-2 bg-[#FEFCE8] rounded-[8px] flex-shrink-0">
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
                  <div className="p-2 bg-[#EFF6FF] rounded-[8px] flex-shrink-0">
                    <RefreshCw className="h-5 w-5 text-[#3B82F6]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Follow-ups Requested</h3>
                    <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                      {calculatedStats?.followUpRequested ?? 0}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                  <div className="p-2 bg-[#F0FDF4] rounded-[8px] flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-[#22C55E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Answer Rate (Sales)</h3>
                    <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                      {calculatedStats?.answerRate ?? campaignData?.campaign.answerRate ?? 0}%
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                  <div className="p-2 bg-[#FDF2F8] rounded-[8px] flex-shrink-0">
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
                          <Phone className="h-5 w-5" />
                          <span className="font-semibold">Customer contact initiated</span>
                        </div>
                        <div className="text-[20px] font-bold">{calculatedStats?.callsMade ?? campaignData?.campaign.totalCallPlaced ?? 0}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contacted successfully */}
                  <div>
                    <div className="bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0] text-[#065F46] p-4 rounded-[12px] shadow-sm border border-[#A7F3D0]" style={{width: '85%'}}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-semibold">Contacted successfully</span>
                        </div>
                        <div className="text-[20px] font-bold">{calculatedStats?.callsAnswered ?? Math.round((campaignData?.campaign.totalCallPlaced ?? 0) * 0.6)}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Followups requested */}
                  <div>
                    <div className="bg-gradient-to-r from-[#DBEAFE] to-[#BFDBFE] text-[#1E3A8A] p-4 rounded-[12px] shadow-sm border border-[#BFDBFE]" style={{width: '70%'}}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <RefreshCw className="h-5 w-5" />
                          <span className="font-semibold">Followups requested</span>
                        </div>
                        <div className="text-[20px] font-bold">{calculatedStats?.followUpRequested ?? 0}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Appointments scheduled */}
                  <div>
                    <div className="bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] text-[#92400E] p-4 rounded-[12px] shadow-sm border border-[#FDE68A]" style={{width: '55%'}}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5" />
                          <span className="font-semibold">Appointments scheduled</span>
                        </div>
                        <div className="text-[20px] font-bold">{calculatedStats?.appointmentCount ?? campaignData?.campaign.appointmentScheduled ?? 0}</div>
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
            data={generatePerformanceTimeData()} 
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
                {generateTopPerformingVehicles(calculatedStats?.appointmentCount ?? campaignData?.campaign.appointmentScheduled ?? 0).map((vehicle, index) => (
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
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
}
