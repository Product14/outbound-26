'use client'

import { useState, useRef } from 'react'
import { LiveActivityTable } from '@/components/live-activity-table'
import { LiveActivityFilters } from '@/components/live-activity-filters'
import { downloadCampaignCSV } from '@/lib/csv-utils'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, ChevronDown, Loader2 } from 'lucide-react'
import { MetricsGrid } from '@/components/ui/metrics-grid'
import AppointmentFunnel from '@/components/ui/appointment-funnel'
import { getAppointmentFunnelData } from '@/lib/funnel-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Info, Voicemail, PhoneOff, Clock, PhoneMissed, Send, CheckCircle2, TrendingUp, BarChart2, CalendarCheck, PhoneForwarded, UserMinus, MessageSquare, Phone } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { SmsOverviewData } from '@/lib/outbound-local-data'

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
  authKey?: string
  refreshTrigger?: number
  smsData?: SmsOverviewData
  onFunnelModeChange?: (mode: 'sms' | 'call') => void
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
  campaignMetrics,
  authKey,
  refreshTrigger,
  smsData,
  onFunnelModeChange
}: LiveCallsTabProps) {
  // Funnel mode toggle: SMS (default) or Call
  const [funnelMode, setFunnelMode] = useState<'sms' | 'call'>(smsData ? 'sms' : 'call')

  const handleFunnelModeChange = (mode: 'sms' | 'call') => {
    setFunnelMode(mode)
    onFunnelModeChange?.(mode)
  }

  // Local state for all filters
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '')
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter || ['all'])
  const [connectionFilter, setConnectionFilter] = useState(initialConnectionFilter || ['all'])
  // New filter states
  const [callTypeFilter, setCallTypeFilter] = useState('all')
  const [campaignFilter, setCampaignFilter] = useState('all')
  const [outcomeFilter, setOutcomeFilter] = useState('all')
  const [queryFilter, setQueryFilter] = useState('all')
  const [timePeriodFilter, setTimePeriodFilter] = useState('30')

  // We'll get the total results from the LiveActivityTable
  const [totalResults, setTotalResults] = useState(0)
  const [isLoadingResults, setIsLoadingResults] = useState(false)
  const [isDownloadingCSV, setIsDownloadingCSV] = useState(false)
  
  // Ref to access LiveActivityTable's search function
  const tableRef = useRef<any>(null)

  return (
    <div className="space-y-0 px-6 pt-6">
      {/* Tab Header with Countdown Timer */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Calls & Analytics</h2>
        </div>
        <div className="flex items-center gap-3">
          {/* Funnel Mode Selector */}
          {smsData && (
            <Select value={funnelMode} onValueChange={(v) => handleFunnelModeChange(v as 'sms' | 'call')}>
              <SelectTrigger className="w-[160px] h-9 text-sm border-gray-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sms">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
                    SMS Metrics
                  </span>
                </SelectItem>
                <SelectItem value="call">
                  <span className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-indigo-500" />
                    Call Metrics
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-sm"
              >
                <Download className="h-4 w-4" />
                Download
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={async () => {
                  if (campaignId && !isDownloadingCSV) {
                    try {
                      setIsDownloadingCSV(true)
                      await downloadCampaignCSV(campaignId, authKey)
                    } catch (error) {
                      console.error('Failed to download CSV:', error)
                    } finally {
                      setIsDownloadingCSV(false)
                    }
                  }
                }}
                className={`flex items-center gap-2 ${isDownloadingCSV ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                disabled={isDownloadingCSV}
              >
                {isDownloadingCSV ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
                <div className="flex flex-col">
                  <span className="font-medium flex items-center gap-2">
                    Download CSV
                    {isDownloadingCSV && (
                      <span className="text-xs text-gray-500">Preparing...</span>
                    )}
                  </span>
                  <span className="text-xs text-gray-500">All campaign data</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── SMS View ── */}
      {funnelMode === 'sms' && smsData ? (
        <div className="space-y-6 mb-6">
          {/* SMS Funnel — first, full width, same AppointmentFunnel component as Call view */}
          <Card className="rounded-[16px] border-0 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">SMS Funnel</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-52">
                <AppointmentFunnel
                  data={{
                    stages: [
                      { name: 'Enrolled', count: smsData.funnel.enrolled },
                      { name: 'SMS Delivered', count: smsData.funnel.delivered },
                      { name: 'Replied', count: smsData.funnel.replied },
                      { name: 'Escalated \u2192 Call', count: smsData.funnel.escalated },
                      { name: 'Appt Booked', count: smsData.funnel.booked },
                    ],
                    conversionRates: [
                      { rate: smsData.funnel.enrolled > 0 ? Math.round((smsData.funnel.delivered / smsData.funnel.enrolled) * 100) : 0 },
                      { rate: smsData.funnel.delivered > 0 ? Math.round((smsData.funnel.replied / smsData.funnel.delivered) * 100) : 0 },
                      { rate: smsData.funnel.replied > 0 ? Math.round((smsData.funnel.escalated / smsData.funnel.replied) * 100) : 0 },
                      { rate: smsData.funnel.escalated > 0 ? Math.round((smsData.funnel.booked / smsData.funnel.escalated) * 100) : 0 },
                    ],
                  }}
                  cardBackgroundColor="#ECFDF5"
                  graphColor="#22C55E"
                  conversionChipColor="#BBF7D0"
                />
              </div>
            </CardContent>
          </Card>

        </div>
      ) : (
        /* ── Call View ── */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          {/* Campaign Funnel */}
          <Card className="border-0 bg-white rounded-[16px]">
            <CardHeader className="pb-4">
              <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">Campaign Funnel</CardTitle>
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
              <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">Campaign Metrics</CardTitle>
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
                        <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Voice Mail %</h3>
                        <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                          {campaignMetrics.voicemailPercentage?.count || 0} ({campaignMetrics.voicemailPercentage?.percentage || 0}%)
                        </p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><Info className="h-4 w-4" /></button>
                        </TooltipTrigger>
                        <TooltipContent><p>Percentage of calls that went to voicemail</p></TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Call Failed % */}
                    <div className="relative flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                      <div className="p-2 bg-[#FEE2E2] rounded-[8px] flex-shrink-0">
                        <PhoneOff className="h-4 w-4 text-[#EF4444]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Call Failed %</h3>
                        <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                          {campaignMetrics.callFailedPercentage?.count || 0} ({campaignMetrics.callFailedPercentage?.percentage || 0}%)
                        </p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><Info className="h-4 w-4" /></button>
                        </TooltipTrigger>
                        <TooltipContent><p>Percentage of calls that failed to connect</p></TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Avg. Call Duration */}
                    <div className="relative flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                      <div className="p-2 bg-[#D1FAE5] rounded-[8px] flex-shrink-0">
                        <Clock className="h-4 w-4 text-[#10B981]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Avg. Call Duration</h3>
                        <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                          {campaignMetrics.avgCallDuration?.duration || '0:00'}
                        </p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><Info className="h-4 w-4" /></button>
                        </TooltipTrigger>
                        <TooltipContent><p>Average duration of connected calls</p></TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Call Rejected % */}
                    <div className="relative flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                      <div className="p-2 bg-[#E0E7FF] rounded-[8px] flex-shrink-0">
                        <PhoneMissed className="h-4 w-4 text-[#6366F1]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Call Rejected %</h3>
                        <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                          {campaignMetrics.callRejectedPercentage?.count || 0} ({campaignMetrics.callRejectedPercentage?.percentage || 0}%)
                        </p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><Info className="h-4 w-4" /></button>
                        </TooltipTrigger>
                        <TooltipContent><p>Percentage of calls that were rejected by customers</p></TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </TooltipProvider>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Controls - Above the table */}
      <div className="mb-6">
        <LiveActivityFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          connectionFilter={connectionFilter}
          setConnectionFilter={setConnectionFilter}
          callTypeFilter={callTypeFilter}
          setCallTypeFilter={setCallTypeFilter}
          campaignFilter={campaignFilter}
          setCampaignFilter={setCampaignFilter}
          outcomeFilter={outcomeFilter}
          setOutcomeFilter={setOutcomeFilter}
          queryFilter={queryFilter}
          setQueryFilter={setQueryFilter}
          timePeriodFilter={timePeriodFilter}
          setTimePeriodFilter={setTimePeriodFilter}
          onPauseCampaign={onPauseCampaign}
          campaignRunning={campaignRunning}
          totalResults={totalResults}
          activeTab={activeTab}
          onTabChange={onTabChange}
          hideSearchAndConnection={false}
          showAllFilters={showFilters}
          setShowAllFilters={() => onToggleFilters?.()}
          onSearchAPI={(searchTerm) => tableRef.current?.performAPISearch?.(searchTerm)}
          agentType={isSalesCampaign ? 'Sales' : 'Service'}
          isSearching={false} // We'll get this from the table if needed
        />
      </div>

      {/* Main Content Area - Full Width (Modal is positioned absolutely) */}
      <div className="w-full">
        {/* Results Count */}
        <div className="mb-4 px-1">
          {isLoadingResults ? (
            <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <span className="text-sm text-gray-700 font-semibold">
              {totalResults || 0} {totalResults === 1 ? 'result' : 'results'} found
            </span>
          )}
        </div>
        
        {/* Live Activity Feed */}
        <LiveActivityTable 
          ref={tableRef}
          isCallDetailsOpen={isCallDetailsOpen}
          onCallSelect={onCallSelect}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          connectionFilter={connectionFilter}
          callTypeFilter={callTypeFilter}
          campaignFilter={campaignFilter}
          outcomeFilter={outcomeFilter}
          queryFilter={queryFilter}
          timePeriodFilter={timePeriodFilter}
          campaignId={campaignId}
          onFilteredCountChange={setTotalResults}
          onLoadingChange={setIsLoadingResults}
          refreshTrigger={refreshTrigger}
          authKey={authKey}
        />
      </div>
    </div>
  )
}
