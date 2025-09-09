"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
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
  statusFilter: string
  setStatusFilter: (value: string) => void
  connectionFilter: string
  setConnectionFilter: (value: string) => void
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
  onTabChange
}: LiveActivityFiltersProps) {
  const [showAllFilters, setShowAllFilters] = useState(false)

  // Count active filters
  const activeFiltersCount = [
    searchTerm.trim() !== "",
    statusFilter !== "all",
    connectionFilter !== "all",
    outcomeFilter !== "all",
    priorityFilter !== "all",
    agentFilter !== "all",
    callReasonFilter !== "all"
  ].filter(Boolean).length

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setConnectionFilter("all")
    setOutcomeFilter("all")
    setPriorityFilter("all")
    setAgentFilter("all")
    setCallReasonFilter("all")
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-52 h-10 border-gray-200 bg-white rounded-lg shadow-sm">
              <SelectValue placeholder="All Connections" />
            </SelectTrigger>
            <SelectContent className="w-52 bg-white border border-gray-200 rounded-xl shadow-lg p-1">
              <SelectItem value="all" className="rounded-lg py-2.5 px-3 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <List className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">All Connections</span>
                </div>
              </SelectItem>
              <SelectItem value="connected" className="rounded-lg py-2.5 px-3 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <PhoneCall className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              </SelectItem>
              <SelectItem value="live" className="rounded-lg py-2.5 px-3 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-sm font-medium">Live</span>
                </div>
              </SelectItem>
              <SelectItem value="queue" className="rounded-lg py-2.5 px-3 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Timer className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Queue</span>
                </div>
              </SelectItem>
              <SelectItem value="not_connected" className="rounded-lg py-2.5 px-3 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <PhoneOff className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Not Connected</span>
                </div>
              </SelectItem>
              <SelectItem value="voice_mail" className="rounded-lg py-2.5 px-3 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Voicemail className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Voice Mail</span>
                </div>
              </SelectItem>
              <SelectItem value="call_failed" className="rounded-lg py-2.5 px-3 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <X className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Call Failed</span>
                </div>
              </SelectItem>
              <SelectItem value="busy" className="rounded-lg py-2.5 px-3 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <PhoneMissed className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Busy</span>
                </div>
              </SelectItem>
              <SelectItem value="do_not_call" className="rounded-lg py-2.5 px-3 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Ban className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Do Not Call</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Extended Filters Row - Collapsible */}
      {showAllFilters && (
        <div className="border-t border-gray-100 pt-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {/* Connection Status Filter */}
            <Select value={connectionFilter} onValueChange={setConnectionFilter}>
              <SelectTrigger className="h-9 border-gray-200">
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-gray-500" />
                  <SelectValue placeholder="Connection" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Connections</SelectItem>
                <SelectItem value="connected">Connected</SelectItem>
                <SelectItem value="voice_mail">Voice Mail</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="not_connected">Not Connected</SelectItem>
                <SelectItem value="call_failed">Call Failed</SelectItem>
                <SelectItem value="do_not_call">Do Not Call</SelectItem>
              </SelectContent>
            </Select>

            {/* Outcome Filter */}
            <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
              <SelectTrigger className="h-9 border-gray-200">
                <div className="flex items-center gap-2">
                  <Target className="h-3 w-3 text-gray-500" />
                  <SelectValue placeholder="Outcome" />
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
              <SelectTrigger className="h-9 border-gray-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-gray-500" />
                  <SelectValue placeholder="Priority" />
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
              <SelectTrigger className="h-9 border-gray-200">
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 text-gray-500" />
                  <SelectValue placeholder="Agent" />
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
              <SelectTrigger className="h-9 border-gray-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-gray-500" />
                  <SelectValue placeholder="Intent" />
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
            
            {statusFilter !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
                Status: {statusFilter.replace("_", " ")}
                <button
                  onClick={() => setStatusFilter("all")}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {connectionFilter !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
                Connection: {connectionFilter.replace("_", " ")}
                <button
                  onClick={() => setConnectionFilter("all")}
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