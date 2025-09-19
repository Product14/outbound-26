"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select"
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
  timePeriodFilter?: string
  setTimePeriodFilter?: (value: string) => void
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
  timePeriodFilter = "30",
  setTimePeriodFilter,
  onPauseCampaign,
  campaignRunning = true,
  totalResults = 0,
  activeTab,
  onTabChange,
  hideSearchAndConnection = false,
  showAllFilters: externalShowAllFilters,
  setShowAllFilters: externalSetShowAllFilters,
  onSearchAPI,
  isSearching = false
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
    { value: 'voicemail', label: 'Voicemail', icon: <Voicemail className="h-4 w-4 text-yellow-600" /> }
  ];

  // Count active filters
  const activeFiltersCount = [
    searchTerm.trim() !== "",
    statusFilter.length > 1 || (statusFilter.length === 1 && statusFilter[0] !== "all"),
    connectionFilter.length > 1 || (connectionFilter.length === 1 && connectionFilter[0] !== "all"),
    callTypeFilter !== "all",
    campaignFilter !== "all", 
    outcomeFilter !== "all",
    queryFilter !== "all",
    timePeriodFilter !== "30"
  ].filter(Boolean).length

  // Clear all filters
  const clearAllFilters = () => {
    console.log('Clearing all filters...')
    setInternalSearchTerm("")
    setSearchTerm("")
    setStatusFilter(["all"])
    setConnectionFilter(["all"])
    setCallTypeFilter?.("all")
    setCampaignFilter?.("all")
    setOutcomeFilter?.("all")
    setQueryFilter?.("all")
    setTimePeriodFilter?.("30")
    
    // Clear any pending debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    console.log('All filters cleared')
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
            className="pl-10 pr-20 h-12 rounded-lg border border-gray-300 bg-white text-sm w-full focus:border-blue-500 focus:ring-1 focus:ring-blue-200 shadow-sm"
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
          <SelectTrigger className="w-auto min-w-[140px] h-12 px-4 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 shadow-sm">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-500" />
              <SelectValue placeholder="All Outcomes" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
            <SelectItem value="all">All Outcomes</SelectItem>
            <SelectItem value="Appointment for Purchase Discussion">Appointment for Purchase Discussion</SelectItem>
            <SelectItem value="Cancel Test Drive">Cancel Test Drive</SelectItem>
            <SelectItem value="Check Order/Delivery Status">Check Order/Delivery Status</SelectItem>
            <SelectItem value="Check Recall Status">Check Recall Status</SelectItem>
            <SelectItem value="Complaint Registered">Complaint Registered</SelectItem>
            <SelectItem value="Drop-off/Pickup Info Shared">Drop-off/Pickup Info Shared</SelectItem>
            <SelectItem value="Extended Warranty/Protection Plan Inquiry">Extended Warranty/Protection Plan Inquiry</SelectItem>
            <SelectItem value="Financing/Leasing Inquiry">Financing/Leasing Inquiry</SelectItem>
            <SelectItem value="General Information Shared">General Information Shared</SelectItem>
            <SelectItem value="General Sales Inquiry">General Sales Inquiry</SelectItem>
            <SelectItem value="General Service Inquiry">General Service Inquiry</SelectItem>
            <SelectItem value="Inventory/Brochure Request">Inventory/Brochure Request</SelectItem>
            <SelectItem value="Operating Hours/Location Inquiry">Operating Hours/Location Inquiry</SelectItem>
            <SelectItem value="Parts Availability Shared">Parts Availability Shared</SelectItem>
            <SelectItem value="Promotions/Incentives Inquiry">Promotions/Incentives Inquiry</SelectItem>
            <SelectItem value="Recall Check Completed">Recall Check Completed</SelectItem>
            <SelectItem value="Repair Status Shared">Repair Status Shared</SelectItem>
            <SelectItem value="Request Vehicle Information">Request Vehicle Information</SelectItem>
            <SelectItem value="Request Price/Quote">Request Price/Quote</SelectItem>
            <SelectItem value="Request service history">Request service history</SelectItem>
            <SelectItem value="Reschedule Test Drive">Reschedule Test Drive</SelectItem>
            <SelectItem value="Safety Recall">Safety Recall</SelectItem>
            <SelectItem value="Salesperson/Manager Request">Salesperson/Manager Request</SelectItem>
            <SelectItem value="Schedule PDI before purchase">Schedule PDI before purchase</SelectItem>
            <SelectItem value="Schedule Recall">Schedule Recall</SelectItem>
            <SelectItem value="Schedule recall">Schedule recall</SelectItem>
            <SelectItem value="Schedule Service Appointment">Schedule Service Appointment</SelectItem>
            <SelectItem value="Schedule Test Drive">Schedule Test Drive</SelectItem>
            <SelectItem value="Service Appointment Booked">Service Appointment Booked</SelectItem>
            <SelectItem value="Service Appointment Rescheduled">Service Appointment Rescheduled</SelectItem>
            <SelectItem value="Service History Shared">Service History Shared</SelectItem>
            <SelectItem value="Service Pricing Shared">Service Pricing Shared</SelectItem>
            <SelectItem value="Trade-in Inquiry">Trade-in Inquiry</SelectItem>
            <SelectItem value="Transferred to Human">Transferred to Human</SelectItem>
            <SelectItem value="Vehicle Availability Inquiry">Vehicle Availability Inquiry</SelectItem>
            <SelectItem value="Warranty Info Shared">Warranty Info Shared</SelectItem>
            <SelectItem value="No Availability">No Availability</SelectItem>
            <SelectItem value="No Intent">No Intent</SelectItem>
          </SelectContent>
        </Select>


        {/* Statuses Filter (Connection Status) */}
        <Select value={connectionFilter[0]} onValueChange={(value) => setConnectionFilter([value])}>
          <SelectTrigger className="w-auto min-w-[130px] h-12 px-4 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 shadow-sm">
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
          </SelectContent>
        </Select>

        {/* Time Period Filter */}
        <Select value={timePeriodFilter} onValueChange={setTimePeriodFilter}>
          <SelectTrigger className="w-auto min-w-[130px] h-12 px-4 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 shadow-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <SelectValue placeholder="Last 30 Days" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
            <SelectItem value="1">Today</SelectItem>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
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
          
          {(connectionFilter.length > 1 || (connectionFilter.length === 1 && connectionFilter[0] !== "all")) && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium border-blue-600 text-blue-600 bg-blue-50">
              <span>Status: {connectionFilter.length === 1 ? connectionFilter[0].replace("_", " ") : `${connectionFilter.length} selected`}</span>
              <button
                onClick={() => setConnectionFilter(["all"])}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors text-blue-600"
              >
                ×
              </button>
            </div>
          )}

          {timePeriodFilter !== "30" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium border-blue-600 text-blue-600 bg-blue-50">
              <span>Period: {timePeriodFilter === "1" ? "Today" : timePeriodFilter === "7" ? "Last 7 Days" : timePeriodFilter === "90" ? "Last 90 Days" : `${timePeriodFilter} Days`}</span>
              <button
                onClick={() => setTimePeriodFilter?.("30")}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors text-blue-600"
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