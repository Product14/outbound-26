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
import { Info, Voicemail, PhoneOff, Clock, PhoneMissed, Send, CheckCircle2, TrendingUp, BarChart2, CalendarCheck, PhoneForwarded, UserMinus, MessageSquare, Phone, Layers } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { SmsOverviewData, AnalyticsExtrasData } from '@/lib/outbound-local-data'
import { AnalyticsSummary, type MetricFilter } from '@/components/campaign/analytics-summary'

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
  onFunnelModeChange?: (mode: 'sms' | 'call' | 'all') => void
  extrasData?: AnalyticsExtrasData | null
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
  onFunnelModeChange,
  extrasData,
}: LiveCallsTabProps) {
  // Funnel mode toggle: SMS (default), Call, or Common (both)
  const [funnelMode, setFunnelMode] = useState<'sms' | 'call' | 'all'>(smsData ? 'sms' : 'call')

  const handleFunnelModeChange = (mode: 'sms' | 'call' | 'all') => {
    setFunnelMode(mode)
    onFunnelModeChange?.(mode)
  }

  // KPI-tile metric filter (Opted Out / Exited / Failed Calls). null = no metric filter.
  const [metricFilter, setMetricFilter] = useState<MetricFilter>(null)

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

  // Translate the KPI metric filter into the table's statusFilter array.
  // When the user clicks a KPI tile, override the existing status filter.
  const effectiveStatusFilter = (() => {
    if (metricFilter === 'optedOut') return ['opted-out']
    if (metricFilter === 'exited') return ['customer-ended']
    if (metricFilter === 'failedCalls') return ['failed']
    return statusFilter
  })()

  return (
    <div className="space-y-0 px-6 pt-6">
      {/* Analytics summary header — full filter bar + KPI grid + insights */}
      {extrasData && (
        <div className="mb-6">
          <AnalyticsSummary
            extrasData={extrasData}
            smsData={smsData}
            analyticsData={analyticsData}
            level="campaign"
            activeMetricFilter={metricFilter}
            onMetricFilter={setMetricFilter}
          />
        </div>
      )}
      {/* Tab Header with Countdown Timer */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Calls & Analytics</h2>
        </div>
        <div className="flex items-center gap-3">
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
        {/* Results Count + active metric filter chip */}
        <div className="mb-4 flex items-center justify-between px-1">
          {isLoadingResults ? (
            <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <span className="text-sm text-gray-700 font-semibold">
              {totalResults || 0} {totalResults === 1 ? 'result' : 'results'} found
            </span>
          )}
          {metricFilter && (
            <button
              type="button"
              onClick={() => setMetricFilter(null)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#4600F2]/30 bg-[#EFEBFF] px-2.5 py-1 text-xs font-semibold text-[#4600F2] hover:bg-[#E2DAFE]"
            >
              Filtered: {metricFilter === 'optedOut' ? 'Opted out' : metricFilter === 'exited' ? 'Exited' : 'Failed calls'}
              <span className="text-[10px]">✕</span>
            </button>
          )}
        </div>
        
        {/* Live Activity Feed */}
        <LiveActivityTable
          ref={tableRef}
          isCallDetailsOpen={isCallDetailsOpen}
          onCallSelect={onCallSelect}
          searchTerm={searchTerm}
          statusFilter={effectiveStatusFilter}
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
