'use client'

import { useState, useRef } from 'react'
import { LiveActivityTable } from '@/components/live-activity-table'
import { LiveActivityFilters } from '@/components/live-activity-filters'
import { RefreshCountdown } from '@/components/ui/refresh-countdown'
import { MetricsGrid } from '@/components/ui/metrics-grid'
import AppointmentFunnel from '@/components/ui/appointment-funnel'
import { getAppointmentFunnelData } from '@/lib/funnel-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Info, Voicemail, PhoneOff, Clock, PhoneMissed } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface LiveCallsTabProps {
  isCallDetailsOpen: boolean
  onCallSelect: (call: any) => void
  searchTerm?: string
  statusFilter?: string[]
  connectionFilter?: string[]
  onPauseCampaign?: () => void
  campaignRunning?: boolean
  activeTab: string
  onTabChange: (tab: string) => void
  onToggleFilters?: () => void
  showFilters?: boolean
  campaignId?: string
  totalLeads?: number
  campaignData?: any
  isSalesCampaign?: boolean
  analyticsData?: any
  campaignMetrics?: any
}

export function LiveCallsTab({
  isCallDetailsOpen,
  onCallSelect,
  searchTerm: initialSearchTerm,
  statusFilter: initialStatusFilter,
  connectionFilter: initialConnectionFilter,
  onPauseCampaign,
  campaignRunning = true,
  activeTab,
  onTabChange,
  onToggleFilters,
  showFilters = false,
  campaignId,
  totalLeads,
  campaignData,
  isSalesCampaign,
  analyticsData,
  campaignMetrics
}: LiveCallsTabProps) {
  // Local state for all filters
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '')
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter || ['all'])
  const [connectionFilter, setConnectionFilter] = useState(initialConnectionFilter || ['all'])
  const [outcomeFilter, setOutcomeFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [agentFilter, setAgentFilter] = useState('all')
  const [callReasonFilter, setCallReasonFilter] = useState('all')

  // We'll get the total results from the LiveActivityTable
  const [totalResults, setTotalResults] = useState(0)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  return (
    <div className="space-y-0 px-6 pt-6">
      {/* Tab Header with Countdown Timer */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Calls & Analytics</h2>
          <span className="text-sm text-gray-500">
            {totalLeads || 0} {totalLeads === 1 ? 'customer' : 'customers'} total
          </span>
        </div>
        <RefreshCountdown 
          onRefresh={() => {
            // Trigger refresh by updating the refresh trigger
            setRefreshTrigger(prev => prev + 1)
          }}
          className="text-sm"
        />
      </div>

      {/* Filter Controls - Hidden search and connection filter */}
      <LiveActivityFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        connectionFilter={connectionFilter}
        setConnectionFilter={setConnectionFilter}
        outcomeFilter={outcomeFilter}
        setOutcomeFilter={setOutcomeFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        agentFilter={agentFilter}
        setAgentFilter={setAgentFilter}
        callReasonFilter={callReasonFilter}
        setCallReasonFilter={setCallReasonFilter}
        onPauseCampaign={onPauseCampaign}
        campaignRunning={campaignRunning}
        totalResults={totalResults}
        activeTab={activeTab}
        onTabChange={onTabChange}
        hideSearchAndConnection={true}
        showAllFilters={showFilters}
        setShowAllFilters={() => onToggleFilters?.()}
      />

      {/* Campaign Funnel and Metrics Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Campaign Funnel */}
        <Card className="border-0 bg-white rounded-[16px]">
          <CardHeader className="pb-4">
            <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">
              Campaign Funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-52">
              <AppointmentFunnel
                data={getAppointmentFunnelData(
                  campaignData,
                  isSalesCampaign ? 'sales' : 'service',
                  analyticsData
                )}
                cardBackgroundColor={isSalesCampaign ? '#DBEAFE' : '#DCFCE7'}
                graphColor={isSalesCampaign ? '#3B82F6' : '#22C55E'}
                conversionChipColor={isSalesCampaign ? '#93C5FD' : '#86EFAC'}
              />
            </div>
          </CardContent>
        </Card>

        {/* Campaign Metrics */}
        <Card className="border-0 bg-white rounded-[16px]">
          <CardHeader className="pb-4">
            <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">
              Campaign Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {campaignMetrics && (
              <TooltipProvider>
                <div className="grid grid-cols-2 gap-4">
                  {/* Voice Mail % */}
                  <div className="relative flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                    <div className="p-2 bg-[#FEF3C7] rounded-[8px] flex-shrink-0">
                      <Voicemail className="h-4 w-4 text-[#F59E0B]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Voice Mail %</h3>
                      </div>
                      <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                        {campaignMetrics.voicemailPercentage?.percentage || 0}%
                      </p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
                          <Info className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Percentage of calls that went to voicemail</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Call Failed % */}
                  <div className="relative flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                    <div className="p-2 bg-[#FEE2E2] rounded-[8px] flex-shrink-0">
                      <PhoneOff className="h-4 w-4 text-[#EF4444]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Call Failed %</h3>
                      </div>
                      <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                        {campaignMetrics.callFailedPercentage?.percentage || 0}%
                      </p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
                          <Info className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Percentage of calls that failed to connect</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Avg. Call Duration */}
                  <div className="relative flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                    <div className="p-2 bg-[#D1FAE5] rounded-[8px] flex-shrink-0">
                      <Clock className="h-4 w-4 text-[#10B981]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Avg. Call Duration</h3>
                      </div>
                      <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                        {campaignMetrics.avgCallDuration?.duration || '0:00'}
                      </p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
                          <Info className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Average duration of completed calls</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Call Rejected % */}
                  <div className="relative flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                    <div className="p-2 bg-[#E0E7FF] rounded-[8px] flex-shrink-0">
                      <PhoneMissed className="h-4 w-4 text-[#6366F1]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Call Rejected %</h3>
                      </div>
                      <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                        {campaignMetrics.callRejectedPercentage?.percentage || 0}%
                      </p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
                          <Info className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Percentage of calls that were rejected by customers</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </TooltipProvider>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area - Full Width (Modal is positioned absolutely) */}
      <div className="w-full pt-6">
        {/* Live Activity Feed */}
        <LiveActivityTable 
          isCallDetailsOpen={isCallDetailsOpen}
          onCallSelect={onCallSelect}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          connectionFilter={connectionFilter}
          outcomeFilter={outcomeFilter}
          priorityFilter={priorityFilter}
          agentFilter={agentFilter}
          callReasonFilter={callReasonFilter}
          campaignId={campaignId}
          onFilteredCountChange={setTotalResults}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </div>
  )
}