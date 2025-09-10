"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select"
import { 
  Search, 
  Filter, 
  X, 
  User, 
  Phone, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Target,
  Users,
  Calendar,
  PhoneOff,
  Timer,
  List,
  PhoneCall,
  Voicemail,
  PhoneMissed,
  Ban
} from "lucide-react"

interface LiveActivityFiltersProps {
  searchTerm: string
  setSearchTerm: (value: string) => void
  statusFilter: string[]
  setStatusFilter: (value: string[]) => void
  connectionFilter: string[]
  setConnectionFilter: (value: string[]) => void
  outcomeFilter: string
  setOutcomeFilter: (value: string) => void
  priorityFilter: string
  setPriorityFilter: (value: string) => void
  agentFilter: string
  setAgentFilter: (value: string) => void
  callReasonFilter: string
  setCallReasonFilter: (value: string) => void
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
}

export function LiveActivityFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  connectionFilter,
  setConnectionFilter,
  outcomeFilter,
  setOutcomeFilter,
  priorityFilter,
  setPriorityFilter,
  agentFilter,
  setAgentFilter,
  callReasonFilter,
  setCallReasonFilter,
  onPauseCampaign,
  campaignRunning = true,
  totalResults = 0,
  activeTab,
  onTabChange,
  hideSearchAndConnection = false,
  showAllFilters: externalShowAllFilters,
  setShowAllFilters: externalSetShowAllFilters
}: LiveActivityFiltersProps) {
  const [internalShowAllFilters, setInternalShowAllFilters] = useState(false)
  
  // Use external state if provided, otherwise use internal state
  const showAllFilters = externalShowAllFilters !== undefined ? externalShowAllFilters : internalShowAllFilters
  const setShowAllFilters = externalSetShowAllFilters || setInternalShowAllFilters

  // Connection status options for multi-select
  const connectionOptions: MultiSelectOption[] = [
    { value: 'all', label: 'All Connections', icon: <List className="h-4 w-4 text-gray-500" /> },
    { value: 'connected', label: 'Connected', icon: <PhoneCall className="h-4 w-4 text-green-600" /> },
    { value: 'live', label: 'Live', icon: <div className="w-4 h-4 flex items-center justify-center"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div></div> },
    { value: 'queue', label: 'Queue', icon: <Timer className="h-4 w-4 text-blue-600" /> },
    { value: 'not_connected', label: 'Not Connected', icon: <PhoneOff className="h-4 w-4 text-gray-600" /> },
    { value: 'voice_mail', label: 'Voice Mail', icon: <Voicemail className="h-4 w-4 text-yellow-600" /> },
    { value: 'call_failed', label: 'Call Failed', icon: <X className="h-4 w-4 text-red-600" /> },
    { value: 'busy', label: 'Busy', icon: <PhoneMissed className="h-4 w-4 text-orange-600" /> },
    { value: 'do_not_call', label: 'Do Not Call', icon: <Ban className="h-4 w-4 text-red-600" /> }
  ];

  // Count active filters
  const activeFiltersCount = [
    searchTerm.trim() !== "",
    statusFilter.length > 1 || (statusFilter.length === 1 && statusFilter[0] !== "all"),
    connectionFilter.length > 1 || (connectionFilter.length === 1 && connectionFilter[0] !== "all"),
    outcomeFilter !== "all",
    priorityFilter !== "all",
    agentFilter !== "all",
    callReasonFilter !== "all"
  ].filter(Boolean).length

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("")
    setStatusFilter(["all"])
    setConnectionFilter(["all"])
    setOutcomeFilter("all")
    setPriorityFilter("all")
    setAgentFilter("all")
    setCallReasonFilter("all")
  }

  // If hiding search and connection, don't render the top section at all
  if (hideSearchAndConnection) {
    return (
      <div className="mb-3">
        {/* Only show expanded filters if any are active */}
        {showAllFilters && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            {/* Additional Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Outcome Filter */}
              <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                <SelectTrigger className="w-48 h-9 border-gray-200 bg-white rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="All Outcomes" />
                  </div>
                </SelectTrigger>
                <SelectContent className="w-48 bg-white border border-gray-200 rounded-xl shadow-lg p-1">
                  <SelectItem value="all" className="rounded-lg py-2 px-3 hover:bg-gray-50 cursor-pointer">All Outcomes</SelectItem>
                  <SelectItem value="appointment_set" className="rounded-lg py-2 px-3 hover:bg-gray-50 cursor-pointer">Appointment Set</SelectItem>
                  <SelectItem value="info_provided" className="rounded-lg py-2 px-3 hover:bg-gray-50 cursor-pointer">Info Provided</SelectItem>
                  <SelectItem value="callback_requested" className="rounded-lg py-2 px-3 hover:bg-gray-50 cursor-pointer">Callback Requested</SelectItem>
                  <SelectItem value="not_interested" className="rounded-lg py-2 px-3 hover:bg-gray-50 cursor-pointer">Not Interested</SelectItem>
                </SelectContent>
              </Select>

              {/* Priority Filter */}
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-44 h-9 border-gray-200 bg-white rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="All Priority" />
                  </div>
                </SelectTrigger>
                <SelectContent className="w-44 bg-white border border-gray-200 rounded-xl shadow-lg p-1">
                  <SelectItem value="all" className="rounded-lg py-2 px-3 hover:bg-gray-50 cursor-pointer">All Priority</SelectItem>
                  <SelectItem value="high" className="rounded-lg py-2 px-3 hover:bg-gray-50 cursor-pointer">High Priority</SelectItem>
                  <SelectItem value="medium" className="rounded-lg py-2 px-3 hover:bg-gray-50 cursor-pointer">Medium Priority</SelectItem>
                  <SelectItem value="low" className="rounded-lg py-2 px-3 hover:bg-gray-50 cursor-pointer">Low Priority</SelectItem>
                </SelectContent>
              </Select>

              {/* Agent Filter */}
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="w-40 h-9 border-gray-200 bg-white rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="All Agents" />
                  </div>
                </SelectTrigger>
                <SelectContent className="w-40 bg-white border border-gray-200 rounded-xl shadow-lg p-1">
                  <SelectItem value="all" className="rounded-lg py-2 px-3 hover:bg-gray-50 cursor-pointer">All Agents</SelectItem>
                  <SelectItem value="kylie" className="rounded-lg py-2 px-3 hover:bg-gray-50 cursor-pointer">Kylie</SelectItem>
                  <SelectItem value="marcus" className="rounded-lg py-2 px-3 hover:bg-gray-50 cursor-pointer">Marcus</SelectItem>
                  <SelectItem value="mia" className="rounded-lg py-2 px-3 hover:bg-gray-50 cursor-pointer">Mia</SelectItem>
                </SelectContent>
              </Select>

              {/* Call Reason Filter */}
              <Select value={callReasonFilter} onValueChange={setCallReasonFilter}>
                <SelectTrigger className="w-48 h-9 border-gray-200 bg-white rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <List className="h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="All Call Reasons" />
                  </div>
                </SelectTrigger>
                <SelectContent className="w-48 bg-white border border-gray-200 rounded-xl shadow-lg p-1">
                  <SelectItem value="all" className="rounded-lg py-2 px-3 hover:bg-gray-50 cursor-pointer">All Call Reasons</SelectItem>
                  <SelectItem value="vehicle_inquiry" className="rounded-lg py-2 px-3 hover:bg-gray-50 cursor-pointer">Vehicle Inquiry</SelectItem>
                  <SelectItem value="service_appointment" className="rounded-lg py-2 px-3 hover:bg-gray-50 cursor-pointer">Service Appointment</SelectItem>
                  <SelectItem value="test_drive" className="rounded-lg py-2 px-3 hover:bg-gray-50 cursor-pointer">Test Drive</SelectItem>
                  <SelectItem value="pricing_info" className="rounded-lg py-2 px-3 hover:bg-gray-50 cursor-pointer">Pricing Info</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters Button */}
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-9 px-3 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mb-3">
      {/* Top Row: Tabs and Main Actions */}
      <div className="flex items-center justify-between gap-4 mb-2">
        {/* Left Side: Plain Text Heading */}
        <div className="flex items-center">
          <h2 className="text-[18px] font-semibold text-gray-900">Live Calls & Queue</h2>
        </div>

        {/* Right Side: Search and Filters */}
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by customer, phone, or intent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 w-80 h-10 rounded-lg border border-gray-200 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllFilters(!showAllFilters)}
            className="h-10 px-3 border-gray-200 bg-white hover:bg-gray-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {/* Status Filter - Always Visible */}
          <MultiSelect
            options={connectionOptions}
            selected={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Connections"
            className="w-52 h-10 border-gray-200 bg-white rounded-lg shadow-sm"
            maxDisplay={1}
          />
        </div>
      </div>

      {/* Extended Filters Row - Collapsible */}
      {showAllFilters && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2 min-h-[40px]">
            {/* Connection Status Filter */}
            <MultiSelect
              options={connectionOptions}
              selected={connectionFilter}
              onChange={setConnectionFilter}
              placeholder="Connections"
              className="h-9 border-gray-200 bg-white flex-1 whitespace-nowrap"
              maxDisplay={1}
            />

            {/* Outcome Filter */}
            <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
              <SelectTrigger className="h-9 border-gray-200 bg-white flex-1 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Target className="h-3 w-3 text-gray-500" />
                  <SelectValue placeholder="Outcomes" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outcomes</SelectItem>
                <SelectItem value="service_appointment">Service Appointment</SelectItem>
                <SelectItem value="test_drive">Test Drive</SelectItem>
                <SelectItem value="callback">Callback</SelectItem>
                <SelectItem value="not_interested">Not Interested</SelectItem>
                <SelectItem value="information_provided">Info Provided</SelectItem>
                <SelectItem value="trade_in_quote">Trade-in Quote</SelectItem>
                <SelectItem value="wrong_number">Wrong Number</SelectItem>
                <SelectItem value="no_outcome">No Outcome</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-9 border-gray-200 bg-white flex-1 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-gray-500" />
                  <SelectValue placeholder="Priorities" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Agent Filter */}
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="h-9 border-gray-200 bg-white flex-1 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 text-gray-500" />
                  <SelectValue placeholder="Agents" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                <SelectItem value="Kylie">Kylie</SelectItem>
                <SelectItem value="Marcus">Marcus</SelectItem>
                <SelectItem value="Alex">Alex</SelectItem>
                <SelectItem value="Emma">Emma</SelectItem>
              </SelectContent>
            </Select>

            {/* Call Reason Filter */}
            <Select value={callReasonFilter} onValueChange={setCallReasonFilter}>
              <SelectTrigger className="h-9 border-gray-200 bg-white flex-1 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-gray-500" />
                  <SelectValue placeholder="Intents" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Intents</SelectItem>
                <SelectItem value="service_reminder">Service Reminder</SelectItem>
                <SelectItem value="recall_notice">Recall Notice</SelectItem>
                <SelectItem value="sales_follow_up">Sales Follow-up</SelectItem>
                <SelectItem value="maintenance_due">Maintenance Due</SelectItem>
                <SelectItem value="warranty_expiring">Warranty Expiring</SelectItem>
                <SelectItem value="trade_in_opportunity">Trade-in Opportunity</SelectItem>
                <SelectItem value="new_model_announcement">New Model</SelectItem>
                <SelectItem value="customer_inquiry_follow_up">Inquiry Follow-up</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>
      )}

      {/* Active Filters Chips */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            {searchTerm.trim() !== "" && (
              <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
                Search: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm("")}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {(statusFilter.length > 1 || (statusFilter.length === 1 && statusFilter[0] !== "all")) && (
              <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
                Status: {statusFilter.length === 1 ? statusFilter[0].replace("_", " ") : `${statusFilter.length} selected`}
                <button
                  onClick={() => setStatusFilter(["all"])}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {(connectionFilter.length > 1 || (connectionFilter.length === 1 && connectionFilter[0] !== "all")) && (
              <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
                Connection: {connectionFilter.length === 1 ? connectionFilter[0].replace("_", " ") : `${connectionFilter.length} selected`}
                <button
                  onClick={() => setConnectionFilter(["all"])}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {outcomeFilter !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
                Outcome: {outcomeFilter.replace("_", " ")}
                <button
                  onClick={() => setOutcomeFilter("all")}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {priorityFilter !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
                Priority: {priorityFilter}
                <button
                  onClick={() => setPriorityFilter("all")}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {agentFilter !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
                Agent: {agentFilter}
                <button
                  onClick={() => setAgentFilter("all")}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {callReasonFilter !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
                Intent: {callReasonFilter.replace("_", " ")}
                <button
                  onClick={() => setCallReasonFilter("all")}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
          
          {/* Clear All Filters Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-8 px-3 text-gray-600 hover:text-gray-900 flex-shrink-0"
          >
            <X className="h-3 w-3 mr-1" />
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  )
}