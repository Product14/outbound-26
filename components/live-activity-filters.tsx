"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select"
import { SERVICE_OUTCOMES, SALES_OUTCOMES, SMS_OUTCOMES } from "@/lib/call-status-utils"
import { 
  Search, 
  Filter, 
  X, 
  Timer,
  List,
  PhoneCall,
  Voicemail,
  Phone,
  BarChart3,
  Target,
  MessageSquare,
  Activity,
  Calendar,
  Loader2
} from "lucide-react"

interface LiveActivityFiltersProps {
  searchTerm: string
  setSearchTerm: (value: string) => void
  statusFilter: string[]
  setStatusFilter: (value: string[]) => void
  connectionFilter: string[]
  setConnectionFilter: (value: string[]) => void
  // New filter props
  callTypeFilter?: string
  setCallTypeFilter?: (value: string) => void
  campaignFilter?: string
  setCampaignFilter?: (value: string) => void
  outcomeFilter?: string
  setOutcomeFilter?: (value: string) => void
  queryFilter?: string
  setQueryFilter?: (value: string) => void
  onPauseCampaign?: () => void
  campaignRunning?: boolean
  totalResults?: number
  // Tab-related props
  activeTab: string
  onTabChange: (tab: string) => void
  // New prop to hide search and connection filter (handled by TabsNavigation)
  hideSearchAndConnection?: boolean
  // External control of filter visibility
  showAllFilters?: boolean
  setShowAllFilters?: (show: boolean) => void
  // Search-related props
  onSearchAPI?: (searchTerm: string) => void
  isSearching?: boolean
  // Agent type for dynamic outcome filtering
  agentType?: 'Sales' | 'Service' | string
}

export function LiveActivityFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  connectionFilter,
  setConnectionFilter,
  callTypeFilter = "all",
  setCallTypeFilter,
  campaignFilter = "all",
  setCampaignFilter,
  outcomeFilter = "all",
  setOutcomeFilter,
  queryFilter = "all",
  setQueryFilter,
  onPauseCampaign,
  campaignRunning = true,
  totalResults = 0,
  activeTab,
  onTabChange,
  hideSearchAndConnection = false,
  showAllFilters: externalShowAllFilters,
  setShowAllFilters: externalSetShowAllFilters,
  onSearchAPI,
  isSearching = false,
  agentType
}: LiveActivityFiltersProps) {
  const [internalShowAllFilters, setInternalShowAllFilters] = useState(false)
  const [compactFilters, setCompactFilters] = useState(false)
  const [internalSearchTerm, setInternalSearchTerm] = useState(searchTerm)
  const [isTyping, setIsTyping] = useState(false)
  const filtersRowRef = useRef<HTMLDivElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Use external state if provided, otherwise use internal state
  const showAllFilters = externalShowAllFilters !== undefined ? externalShowAllFilters : internalShowAllFilters
  const setShowAllFilters = externalSetShowAllFilters || setInternalShowAllFilters

  // Debounced search implementation
  const debouncedSearch = useCallback((searchValue: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    setIsTyping(true)

    debounceTimeoutRef.current = setTimeout(() => {
      setSearchTerm(searchValue)
      setIsTyping(false)
      
      // Trigger API search if callback provided and search term is not empty
      if (onSearchAPI && searchValue.trim()) {
        onSearchAPI(searchValue.trim())
      }
    }, 500) // 500ms debounce
  }, [setSearchTerm, onSearchAPI])

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInternalSearchTerm(value)
    debouncedSearch(value)
  }

  // Sync internal search term with external prop
  useEffect(() => {
    setInternalSearchTerm(searchTerm)
  }, [searchTerm])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  // Check if filters should be compact based on screen size
  useEffect(() => {
    const updateCompact = () => {
      const el = filtersRowRef.current
      if (!el) return
      const isOverflowing = el.scrollWidth > el.clientWidth
      const shouldCompact = isOverflowing || window.innerWidth < 1024
      setCompactFilters(shouldCompact)
    }

    updateCompact()
    const onResize = () => updateCompact()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // Connection status options for multi-select - only API supported values
  const connectionOptions: MultiSelectOption[] = [
    { value: 'all', label: 'All Connections', icon: <List className="h-4 w-4 text-gray-500" /> },
    { value: 'connected', label: 'Connected', icon: <PhoneCall className="h-4 w-4 text-green-600" /> },
    { value: 'live', label: 'Live', icon: <div className="w-4 h-4 flex items-center justify-center"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div></div> },
    { value: 'queue', label: 'Queue', icon: <Timer className="h-4 w-4 text-blue-600" /> },
    { value: 'failed', label: 'Failed', icon: <X className="h-4 w-4 text-red-600" /> },
    { value: 'voicemail', label: 'Voicemail', icon: <Voicemail className="h-4 w-4 text-yellow-600" /> },
    { value: 'did-not-answer', label: 'Did Not Answer', icon: <Phone className="h-4 w-4 text-orange-600" /> },
    { value: 'customer-ended', label: 'Customer Ended', icon: <X className="h-4 w-4 text-red-500" /> },
    { value: 'customer-busy', label: 'Customer Busy', icon: <Timer className="h-4 w-4 text-yellow-500" /> }
  ];

  // Count active filters
  const activeFiltersCount = [
    searchTerm.trim() !== "",
    statusFilter.length > 1 || (statusFilter.length === 1 && statusFilter[0] !== "all"),
    connectionFilter.length > 1 || (connectionFilter.length === 1 && connectionFilter[0] !== "all"),
    callTypeFilter !== "all",
    campaignFilter !== "all", 
    outcomeFilter !== "all",
    queryFilter !== "all"
  ].filter(Boolean).length

  // Helper function to format status display names
  const formatStatusName = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'QUEUED': 'Queued',
      'CALL_COMPLETED': 'Call Completed',
      'CALL_COMPLETED_VOICEMAIL': 'Voicemail',
      'CUSTOMER_BUSY': 'Customer Busy',
      'CALL_FAILED': 'Call Failed',
      'LIVE_CALL': 'Live Call',
      'CALL_IN_PROGRESS': 'In Progress',
      'DO_NOT_CALL': 'Do Not Call',
      'connected': 'Connected',
      'live': 'Live',
      'queue': 'Queue',
      'failed': 'Failed',
      'voicemail': 'Voicemail',
      'not_connected': 'Not Connected',
      'not-connected': 'Not Connected',
      'busy': 'Busy',
      'did-not-answer': 'Did Not Answer',
      'customer-ended': 'Customer Ended',
      'customer-busy': 'Customer Busy'
    }
    return statusMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Get outcomes based on agent type
  const getOutcomeOptions = () => {
    // Check for explicit Service type
    if (agentType === 'Service') {
      return SERVICE_OUTCOMES
    }
    
    // Check for explicit Sales type
    if (agentType === 'Sales') {
      return SALES_OUTCOMES
    }
    
    // Check if agent type contains service-related keywords
    const serviceKeywords = ['service', 'maintenance', 'repair', 'warranty', 'inspection']
    const lowerAgentType = (agentType || '').toLowerCase()
    
    if (serviceKeywords.some(keyword => lowerAgentType.includes(keyword))) {
      return SERVICE_OUTCOMES
    }
    
    return SALES_OUTCOMES
  }

  // Outcome search functionality
  const [outcomeSearchTerm, setOutcomeSearchTerm] = useState('')
  const filteredOutcomes = getOutcomeOptions().filter(outcome =>
    outcome.toLowerCase().includes(outcomeSearchTerm.toLowerCase())
  )
  const filteredSmsOutcomes = SMS_OUTCOMES.filter(outcome =>
    outcome.toLowerCase().includes(outcomeSearchTerm.toLowerCase())
  )

  // Clear all filters
  const clearAllFilters = () => {
    setInternalSearchTerm("")
    setSearchTerm("")
    setStatusFilter(["all"])
    setConnectionFilter(["all"])
    setCallTypeFilter?.("all")
    setCampaignFilter?.("all")
    setOutcomeFilter?.("all")
    setQueryFilter?.("all")
    
    // Clear any pending debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
  }

  // If hiding search and connection, don't render the top section at all
  if (hideSearchAndConnection) {
    return null
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      {/* Search Bar and Main Filters on Same Line */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by customer, phone"
            value={internalSearchTerm}
            onChange={handleSearchChange}
            className="flex h-10 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2 pl-10 pr-20 text-sm shadow-sm transition-all duration-200 ease-out focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
          />
          
          {/* Typing/Search indicators */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {isTyping && (
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Typing...</span>
              </div>
            )}
            {isSearching && !isTyping && (
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Searching...</span>
              </div>
            )}
            {internalSearchTerm && !isTyping && !isSearching && (
              <button
                onClick={() => {
                  setInternalSearchTerm("")
                  setSearchTerm("")
                  if (debounceTimeoutRef.current) {
                    clearTimeout(debounceTimeoutRef.current)
                  }
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Outcomes Filter */}
        <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
          <SelectTrigger className="flex w-auto min-w-[170px] items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm transition-all duration-150 ease-out hover:bg-gray-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none h-10">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-500" />
              <SelectValue placeholder="All Outcomes" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-[400px] p-0">
            {/* Search input for outcomes - Fixed at top */}
            <div className="sticky top-0 z-50 bg-white border-b border-gray-100 p-3 rounded-t-lg shadow-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search outcomes..."
                  value={outcomeSearchTerm}
                  onChange={(e) => setOutcomeSearchTerm(e.target.value)}
                  className="pl-9 pr-8 h-9 text-sm border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 bg-gray-50 focus:bg-white transition-colors"
                />
                {outcomeSearchTerm && (
                  <button
                    onClick={() => setOutcomeSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Scrollable content area */}
            <div className="max-h-[320px] overflow-y-auto">
              <SelectItem value="all">All Outcomes</SelectItem>

              {/* Call outcomes group */}
              {filteredOutcomes.length > 0 && (
                <>
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-white">
                    Call Outcomes
                  </div>
                  {filteredOutcomes.map((outcome) => (
                    <SelectItem key={outcome} value={outcome}>
                      {outcome}
                    </SelectItem>
                  ))}
                </>
              )}

              {/* SMS outcomes group */}
              {filteredSmsOutcomes.length > 0 && (
                <>
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-white border-t border-gray-100 mt-1">
                    SMS Outcomes
                  </div>
                  {filteredSmsOutcomes.map((outcome) => (
                    <SelectItem key={outcome} value={outcome}>
                      {outcome}
                    </SelectItem>
                  ))}
                </>
              )}

              {filteredOutcomes.length === 0 && filteredSmsOutcomes.length === 0 && (
                <div className="px-4 py-6 text-sm text-gray-500 text-center">
                  No outcomes found
                </div>
              )}
            </div>
          </SelectContent>
        </Select>


        {/* Statuses Filter (Connection Status) */}
        <Select value={connectionFilter[0]} onValueChange={(value) => setConnectionFilter([value])}>
          <SelectTrigger className="flex w-auto min-w-[170px] items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm transition-all duration-150 ease-out hover:bg-gray-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none h-10">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-500" />
              <SelectValue placeholder="All Statuses" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="connected">Connected</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="queue">Queue</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="voicemail">Voicemail</SelectItem>
            <SelectItem value="did-not-answer">Did Not Answer</SelectItem>
            <SelectItem value="customer-ended">Customer Ended</SelectItem>
            <SelectItem value="customer-busy">Customer Busy</SelectItem>
          </SelectContent>
        </Select>
      </div>


      {/* Applied Filters (Dismissible Chips) */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {searchTerm && searchTerm.trim() !== "" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium border-blue-600 text-blue-600 bg-blue-50">
              <span>Search: "{searchTerm}"</span>
              <button
                onClick={() => {
                  setInternalSearchTerm("")
                  setSearchTerm("")
                  if (debounceTimeoutRef.current) {
                    clearTimeout(debounceTimeoutRef.current)
                  }
                }}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors text-blue-600"
              >
                ×
              </button>
            </div>
          )}

          {callTypeFilter !== "all" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium border-blue-600 text-blue-600 bg-blue-50">
              <span>Call Type: {callTypeFilter}</span>
              <button
                onClick={() => setCallTypeFilter?.("all")}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors text-blue-600"
              >
                ×
              </button>
            </div>
          )}

          {campaignFilter !== "all" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium border-blue-600 text-blue-600 bg-blue-50">
              <span>Campaign: {campaignFilter.replace("_", " ")}</span>
              <button
                onClick={() => setCampaignFilter?.("all")}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors text-blue-600"
              >
                ×
              </button>
            </div>
          )}

          {outcomeFilter !== "all" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium border-blue-600 text-blue-600 bg-blue-50">
              <span>Outcome: {outcomeFilter.replace("_", " ")}</span>
              <button
                onClick={() => setOutcomeFilter?.("all")}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors text-blue-600"
              >
                ×
              </button>
            </div>
          )}

          {queryFilter !== "all" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium border-blue-600 text-blue-600 bg-blue-50">
              <span>Query: {queryFilter}</span>
              <button
                onClick={() => setQueryFilter?.("all")}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors text-blue-600"
              >
                ×
              </button>
            </div>
          )}
          
          {(statusFilter.length > 1 || (statusFilter.length === 1 && statusFilter[0] !== "all")) && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium border-blue-600 text-blue-600 bg-blue-50">
              <span>
                Status: {statusFilter.length === 1 
                  ? formatStatusName(statusFilter[0]) 
                  : statusFilter.length <= 3 
                    ? statusFilter.map(s => formatStatusName(s)).join(', ')
                    : `${statusFilter.length} selected`
                }
              </span>
              <button
                onClick={() => setStatusFilter(["all"])}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors text-blue-600"
              >
                ×
              </button>
            </div>
          )}

          {(connectionFilter.length > 1 || (connectionFilter.length === 1 && connectionFilter[0] !== "all")) && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium border-purple-600 text-purple-600 bg-purple-50">
              <span>
                Connection: {connectionFilter.length === 1 
                  ? formatStatusName(connectionFilter[0]) 
                  : connectionFilter.length <= 3 
                    ? connectionFilter.map(s => formatStatusName(s)).join(', ')
                    : `${connectionFilter.length} selected`
                }
              </span>
              <button
                onClick={() => setConnectionFilter(["all"])}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-purple-100 transition-colors text-purple-600"
              >
                ×
              </button>
            </div>
          )}
          
          {/* Clear All Filters Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-8 px-3 text-gray-600 hover:text-gray-900 flex-shrink-0"
          >
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}