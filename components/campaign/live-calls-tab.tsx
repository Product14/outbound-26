'use client'

import { useState } from 'react'
import { LiveActivityTable } from '@/components/live-activity-table'
import { LiveActivityFilters } from '@/components/live-activity-filters'

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
  showFilters = false
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

  return (
    <div className="space-y-0 px-6 pt-6">
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

      {/* Main Content Area - Full Width (Modal is positioned absolutely) */}
      <div className="w-full">
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
          onFilteredCountChange={setTotalResults}
        />
      </div>
    </div>
  )
}