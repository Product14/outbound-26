"use client"

import { useState, useEffect, useCallback, useRef, useMemo, forwardRef, useImperativeHandle } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CircularProgress } from "@/components/ui/circular-progress"
import { AIScoreBreakdown } from "@/components/ai-score-breakdown"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SmartPagination } from "@/components/ui/smart-pagination"
import { Phone, Search, Play, Pause, ArrowUpDown, User, Clock, CheckCircle, X, AlertTriangle, Car, Calendar, ChevronLeft, ChevronRight, PhoneCall, Users, PhoneOff, Voicemail, PhoneMissed, Ban, Timer, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RefreshCountdown } from "@/components/ui/refresh-countdown"
import type { CallRecord as AICallRecord } from "@/types/call-record"

// API Response types for Campaign Status
interface CampaignTask {
  outboundTaskId: string
  callId: string // Add callId field from API response
  status: string
  connectionStatus: string
  leadId: string
  leadName: string
  phoneNumber: string
  email: string
  vehicleName?: string
  vehicleIdentificationNumber: {
    vin: string
  }
  serviceName?: string
  isCallback: boolean
  retryCount: number
  statusUpdatedAt: string
  isCallConnected: boolean
  callAnswered?: boolean
  actionItems?: string[]
  queryResolved?: boolean
  callbackRequested?: boolean
  customerSentimentScore?: number
  aiSentimentScore?: string
  aiQuality?: string // AI Quality score from API response
  appointmentScheduled?: boolean
  callDuration?: string // Legacy field name for backward compatibility
  duration?: string // Actual field name from API response
  nextVisibleAt?: string // Next call time for queued calls
  outcome?: string
}

interface campaignStatusResponse {
  campaignId: string
  campaignName: string
  campaignType: string
  status: string
  totalLeads: number
  agentName: string
  enterpriseId: string
  teamId: string
  schedule: {
    startTime: string
    endTime: string
    startDate: string
    endDate: string
  }
  createdAt: string
  totalLiveCalls: number
  totalConnectedCalls: number
  totalQueuedCalls: number
  totalCompletedCalls: number
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  tasks: CampaignTask[]
  instanceTime: string
}

interface CallRecord {
  id: string
  call_id: string // Add call_id for API compatibility
  customer: {
    name: string
    avatar?: string
    phone: string
  }
  timestamp: {
    date: string
    time: string
    duration: string
  }
  callStatus: string // Use actual API values
  callAgainIn?: number // hours
  connectionStatus: string // Use actual API values
  outcome: string // Use actual API values
  nextVisibleAt?: string // Next call time for queued calls
  callReason: string // Use actual API values
  vehicleInfo?: {
    make: string
    model: string
    year: number
  }
  priority: string // Use actual API values
  agent: {
    name: string
    avatar?: string
  }
  qualityScore: number // Use 0 when no score from API
  retryCount: number // Number of retry attempts for this call
}

interface LiveActivityTableProps {
  isCallDetailsOpen?: boolean
  onCallSelect?: (call: CallRecord) => void
  searchTerm?: string
  statusFilter?: string[]
  connectionFilter?: string[]
  callTypeFilter?: string
  campaignFilter?: string
  outcomeFilter?: string
  queryFilter?: string
  campaignId?: string
  onFilteredCountChange?: (count: number) => void
  onLoadingChange?: (isLoading: boolean) => void
  refreshTrigger?: number // Add this to trigger refresh from parent
  authKey?: string // Add auth_key support
}

export const LiveActivityTable = forwardRef<{ 
  performAPISearch: (query: string) => Promise<void>
  exportAllData: () => Promise<void>
}, LiveActivityTableProps>(function LiveActivityTable({ 
  isCallDetailsOpen = false, 
  onCallSelect, 
  searchTerm = "", 
  statusFilter = ["all"],
  connectionFilter = ["all"],
  callTypeFilter = "all",
  campaignFilter = "all", 
  outcomeFilter = "all",
  queryFilter = "all",
  campaignId,
  onFilteredCountChange,
  onLoadingChange,
  refreshTrigger,
  authKey
}: LiveActivityTableProps, ref) {
  const [sortField, setSortField] = useState<keyof CallRecord>("timestamp")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [aiScoreBreakdownOpen, setAiScoreBreakdownOpen] = useState(false)
  const [selectedCallForBreakdown, setSelectedCallForBreakdown] = useState<AICallRecord | null>(null)

  // Handle transitions to prevent click issues
  useEffect(() => {
    setIsTransitioning(true)
    const timeout = setTimeout(() => {
      setIsTransitioning(false)
    }, 350) // Slightly longer than CSS transition

    return () => clearTimeout(timeout)
  }, [isCallDetailsOpen])

  // State for API data
  const [callRecords, setCallRecords] = useState<CallRecord[]>([])
  const [isLoadingCalls, setIsLoadingCalls] = useState(false)
  const [callsError, setCallsError] = useState<string | null>(null)
  const [totalRecords, setTotalRecords] = useState(0)
  
  // Search mode state
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  
  // Track last API call to prevent duplicates
  const lastApiCallRef = useRef<string>('')

  // Utility function to format next call time for queued calls
  const formatNextCallTime = (nextVisibleAt: string | undefined): string => {
    if (!nextVisibleAt) return ""
    
    try {
      const nextTime = new Date(nextVisibleAt)
      const now = new Date()
      const diffMs = nextTime.getTime() - now.getTime()
      
      // If the time has passed or is very close (within 1 minute), show "Now"
      if (diffMs <= 60000) {
        return "Now"
      }
      
      // Calculate time difference
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMinutes / 60)
      const diffDays = Math.floor(diffHours / 24)
      
      if (diffDays > 0) {
        return `${diffDays}d ${diffHours % 24}h`
      } else if (diffHours > 0) {
        return `${diffHours}h ${diffMinutes % 60}m`
      } else {
        return `${diffMinutes}m`
      }
    } catch (error) {
      console.error('Error parsing nextVisibleAt:', error)
      return "Unknown"
    }
  }

  // Utility function to parse and format call duration from API
  const parseCallDuration = (callDuration: string | number | undefined, status: string, connectionStatus: string, outcome?: string): string => {
    // Debug: Log the input to see what we're parsing
    if (callDuration !== undefined && callDuration !== null) {
    }
    
    // PRIORITY: Always try to show actual duration first if available
    let durationInSeconds = 0
    
    if (callDuration !== undefined && callDuration !== null) {
      if (typeof callDuration === 'string') {
        // Handle time format like "2:30" (minutes:seconds)
        if (callDuration.includes(':')) {
          const [minutes, seconds] = callDuration.split(':').map(Number)
          if (!isNaN(minutes) && !isNaN(seconds)) {
            durationInSeconds = (minutes * 60) + seconds
          }
        } else {
          // Parse as number string
          const numValue = parseFloat(callDuration)
          if (!isNaN(numValue)) {
            // Determine if it's likely milliseconds or seconds based on magnitude
            durationInSeconds = numValue > 1000 ? Math.floor(numValue / 1000) : Math.floor(numValue)
          }
        }
      } else if (typeof callDuration === 'number') {
        // Determine if it's likely milliseconds or seconds based on magnitude
        durationInSeconds = callDuration > 1000 ? Math.floor(callDuration / 1000) : Math.floor(callDuration)
      }
    }
    
    // If we have a valid parsed duration, always show it regardless of status
    if (durationInSeconds > 0) {
      const minutes = Math.floor(durationInSeconds / 60)
      const seconds = durationInSeconds % 60
      return `${minutes}min ${seconds}sec`
    }
    
    // If duration is explicitly 0, show it as such
    if (durationInSeconds === 0 && callDuration !== undefined && callDuration !== null) {
      return "0min 0sec"
    }

    // Only show status messages when no duration data is available at all
    
    // Queue status means call hasn't started yet
    if (connectionStatus === 'queue' || status === 'QUEUED') {
      return "--"
    }
    
    // Live calls are ongoing
    if (connectionStatus === 'live' || status === 'LIVE') {
      return "--"
    }
    
    // Failed calls with no duration data
    if (connectionStatus === 'failed' || 
        connectionStatus === 'not connected' || 
        connectionStatus === 'not_connected' ||
        status === 'CALL_FAILED' ||
        status === 'failed') {
      return "--"
    }
    
    // Voicemail calls with no duration data
    if (connectionStatus === 'voicemail') {
      return "--"
    }
    
    // Connected calls with no duration data
    if (connectionStatus === 'connected' || status === 'CALL_CONNECTED') {
      return "--"
    }
    
    // Completed calls with no duration data
    if (status === 'CALL_COMPLETED' && outcome && outcome !== '--') {
      return "--"
    }
    
    // Default case - no duration available
    return "--"
  }

  // Function to transform new API data to CallRecord format
  const transformApiDataToCallRecords = (apiData: campaignStatusResponse): CallRecord[] => {
    return apiData.tasks.map((task) => {
      // Parse date and time from statusUpdatedAt
      const updatedDate = new Date(task.statusUpdatedAt)
      const dateStr = updatedDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
      const timeStr = updatedDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })

      // Use API status value directly for display (this is the main status field)
      const callStatus = task.status || 'Unknown'
      
      // Keep connectionStatus for backward compatibility but prioritize status
      const connectionStatus = task.connectionStatus || 'not_connected'

      // Use outcome from API with proper formatting
      const outcome = formatOutcomeText(task.outcome || '--')

      // Format call duration using utility function - try both field names
      const durationValue = task.duration || task.callDuration // Try 'duration' first, then 'callDuration'
      const duration = parseCallDuration(durationValue, task.status, task.connectionStatus, task.outcome)

     
     

      return {
        id: task.callId, // Keep outboundTaskId as unique identifier
        call_id: task.callId, // Use callId first, fallback to outboundTaskId if needed
        customer: {
          name: task.leadName,
          phone: task.phoneNumber,
          avatar: "/placeholder-user.jpg"
        },
        timestamp: {
          date: dateStr,
          time: timeStr,
          duration: duration
        },
        callStatus,
        connectionStatus,
        outcome,
        nextVisibleAt: task.nextVisibleAt, // Add nextVisibleAt for queue timing
        callReason: "Unknown", // API doesn't provide this field
        priority: "Unknown", // API doesn't provide this field  
        agent: {
          name: apiData.agentName || "AI Agent",
          avatar: "/placeholder-user.jpg"
        },
        // Store agent info in the format expected by other components
        agentInfo: {
          agentName: apiData.agentName || "AI Agent",
          agentType: "AI Agent"
        },
        qualityScore: task.aiQuality ? parseFloat(task.aiQuality) : 0,
        retryCount: task.retryCount || 0 // Map retry count from API
      }
    })
  }

  // Fetch campaign status data (includes all call types: live, queued, completed, failed)
  const fetchcampaignStatus = useCallback(async (
    showLoading = true, 
    currentStatusFilter = statusFilter, 
    page = currentPage, 
    limit = itemsPerPage,
    currentSearchTerm = searchTerm,
    currentConnectionFilter = connectionFilter,
    currentOutcomeFilter = outcomeFilter,
    currentSortField = sortField,
    currentSortDirection = sortDirection
  ) => {
    if (!campaignId) {
      return
    }

    // Create a unique key for this API call to prevent duplicates
    const apiCallKey = JSON.stringify({
      campaignId,
      page,
      limit,
      searchTerm: currentSearchTerm,
      outcomeFilter: currentOutcomeFilter,
      connectionFilter: currentConnectionFilter,
      sortField: currentSortField,
      sortDirection: currentSortDirection,
      showCallbacks: false
    })
    
    // Prevent duplicate API calls
    if (lastApiCallRef.current === apiCallKey) {
      return
    }
    
    lastApiCallRef.current = apiCallKey
    

    if (showLoading) {
      setIsLoadingCalls(true)
    }
    setCallsError(null)
    
    try {
      // Build URL with all filters for server-side filtering and pagination
      let url = `/api/fetch-campaign-status?campaignId=${campaignId}&page=${page}&limit=${limit}&showCallbacks=false`
      
      // Prepare headers for authenticated requests
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      // Add Authorization header if authKey is provided
      if (authKey) {
        headers['Authorization'] = authKey.startsWith('Bearer ') ? authKey : `Bearer ${authKey}`
      }
      
      // Add search query if provided
      if (currentSearchTerm && currentSearchTerm.trim()) {
        url += `&q=${encodeURIComponent(currentSearchTerm.trim())}`
      }
      
      // Combine status and connection filters into connectionStatus parameter
      const allActiveFilters = [
        ...currentStatusFilter.filter(status => status !== 'all'),
        ...currentConnectionFilter.filter(status => status !== 'all')
      ]
      
      // Remove duplicates
      const uniqueActiveFilters = Array.from(new Set(allActiveFilters))
      
      if (uniqueActiveFilters.length > 0) {
        // Filter values now match API values exactly: connected, live, queue, failed, voicemail, did-not-answer, customer-ended, customer-busy
        const apiConnectionStatus = uniqueActiveFilters.filter(status => 
          ['connected', 'live', 'queue', 'failed', 'voicemail', 'did-not-answer', 'customer-ended', 'customer-busy'].includes(status)
        )
        
        if (apiConnectionStatus.length > 0) {
          url += `&connectionStatus=${apiConnectionStatus.join(',')}`
        }
      }
      
      // Add outcome filter if not showing all
      if (currentOutcomeFilter && currentOutcomeFilter !== 'all') {
        url += `&outcomes=${encodeURIComponent(currentOutcomeFilter)}`
       
      } else {
      }
      
      // Add sorting parameters
      const sortFieldMapping: { [key: string]: string } = {
        'timestamp': 'statusUpdatedAt',
        'customer': 'leadName', 
        'connectionStatus': 'connectionStatus',
        'qualityScore': 'aiQuality',
        'duration': 'duration'
      }
      
      const apiSortField = sortFieldMapping[currentSortField as string] || 'statusUpdatedAt'
      url += `&sortBy=${apiSortField}`
      url += `&sortOrder=${currentSortDirection}`
      
     
      
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      })
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API request failed:', { status: response.status, statusText: response.statusText, errorText })
        throw new Error(`Failed to fetch campaign status: ${response.status} - ${errorText}`)
      }
      
      const apiData: campaignStatusResponse = await response.json()
      
      if (apiData.tasks && apiData.tasks.length > 0) {
        
        // Analyze duration and status patterns
        const statusAnalysis = apiData.tasks.slice(0, 10).map(task => ({
          outboundTaskId: task.outboundTaskId,
          status: task.status,
          connectionStatus: task.connectionStatus,
          
          outcome: task.outcome,
          isCallConnected: task.isCallConnected,
          callAnswered: task.callAnswered
        }))
        
        
        // Get unique values to understand the data
        const uniqueStatuses = [...new Set(apiData.tasks.map(t => t.status))]
        const uniqueConnectionStatuses = [...new Set(apiData.tasks.map(t => t.connectionStatus))]
        const uniqueOutcomes = [...new Set(apiData.tasks.map(t => t.outcome).filter(Boolean))]
        const durationTypes = [...new Set(apiData.tasks.map(t => typeof t.callDuration))]
        
       
        // Debug outcome filter specifically
        if (currentOutcomeFilter && currentOutcomeFilter !== 'all') {
          const matchingTasks = apiData.tasks.filter(t => t.outcome === currentOutcomeFilter)
          
        }
      }
      
      
      const transformedData = transformApiDataToCallRecords(apiData)
      setCallRecords(transformedData)
      // Use pagination total for filtered results, fallback to totalLeads for unfiltered
      const hasFilters = Boolean(
        searchTerm?.trim() || 
        (outcomeFilter && outcomeFilter !== 'all') || 
        (connectionFilter && connectionFilter.length > 0 && connectionFilter.some(f => f !== 'all')) || 
        (statusFilter && statusFilter.length > 0 && statusFilter.some(f => f !== 'all'))
      )
      
     
      
      // Prioritize API pagination total when available (especially for search/filtered results)
      // Fall back to totalLeads only when pagination total is not provided
      let finalTotalRecords: number
      
      if (apiData.pagination?.total !== undefined && apiData.pagination.total >= 0) {
        // API provided pagination total - use it (this is the filtered/search result count)
        finalTotalRecords = apiData.pagination.total
      } else if (apiData.totalLeads !== undefined) {
        // No pagination total, use total leads
        finalTotalRecords = apiData.totalLeads
      } else {
        // Fallback to actual data length
        finalTotalRecords = transformedData.length
      }
      
     
      
      setTotalRecords(finalTotalRecords)
    } catch (error) {
      console.error('❌ Error fetching campaign status:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch campaign status'
      setCallsError(errorMessage)
      setCallRecords([]) // Set empty array on error
      lastApiCallRef.current = '' // Clear the duplicate prevention key on error
    } finally {
      if (showLoading) {
        setIsLoadingCalls(false)
      }
    }
  }, [campaignId, authKey]) // Only depend on campaignId and authKey to avoid loops

  // Dedicated search API function for text-based queries
  const performAPISearch = useCallback(async (query: string) => {
    if (!campaignId || !query.trim()) {
      setIsSearchMode(false)
      return
    }

    // When searching, use the main fetch function with search term
    // This ensures consistent filtering and pagination behavior
    setIsSearchMode(true)
    setCurrentPage(1) // Reset to first page for search
    fetchcampaignStatus(true, statusFilter, 1, itemsPerPage, query.trim(), connectionFilter, outcomeFilter, sortField, sortDirection)
  }, [campaignId, fetchcampaignStatus, statusFilter, itemsPerPage, connectionFilter, outcomeFilter, sortField, sortDirection])

  // Function to export all data with current filters
  const exportAllData = useCallback(async () => {
    if (!campaignId) {
      console.error('No campaign ID available for export')
      return
    }

    try {
      // Import the downloadCampaignCSV function
      const { downloadCampaignCSV } = await import('@/lib/csv-utils')
      
      // Export all campaign data with current filters applied
      await downloadCampaignCSV(campaignId, authKey)
    } catch (error) {
      console.error('Failed to export campaign data:', error)
    }
  }, [campaignId, authKey])

  // Expose functions to parent components
  useImperativeHandle(ref, () => ({
    performAPISearch,
    exportAllData
  }), [performAPISearch, exportAllData])

  // Clear search when search term is empty
  useEffect(() => {
    if (!searchTerm || searchTerm.trim() === '') {
      setIsSearchMode(false)
      setSearchError(null)
    } else {
      setIsSearchMode(true)
    }
  }, [searchTerm])

  // Handle refresh trigger from parent
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0 && campaignId) {
      // Use current state values at the time of refresh
      fetchcampaignStatus(false, statusFilter, currentPage, itemsPerPage, searchTerm, connectionFilter, outcomeFilter, sortField, sortDirection)
    }
  }, [refreshTrigger, campaignId, fetchcampaignStatus]) // Include necessary deps but avoid filter loops

  // Initial load and filter changes - consolidated effect
  useEffect(() => {
    if (!campaignId) return
    
   

    // Reset to first page when filters change (except for pagination changes)
    const isFilterChange = !callRecords.length || // Initial load
      searchTerm !== '' || outcomeFilter !== 'all' || 
      connectionFilter.some(f => f !== 'all') || statusFilter.some(f => f !== 'all')
    
    const pageToUse = isFilterChange ? 1 : currentPage
    if (isFilterChange && currentPage !== 1) {
      setCurrentPage(1)
      return // Let the next effect handle the API call with page 1
    }
    
    fetchcampaignStatus(true, statusFilter, pageToUse, itemsPerPage, searchTerm, connectionFilter, outcomeFilter, sortField, sortDirection)
  }, [campaignId, searchTerm, outcomeFilter, connectionFilter, statusFilter, currentPage, itemsPerPage, sortField, sortDirection]) // Remove fetchcampaignStatus from deps to avoid loops

  // Component uses callRecords state populated from the new campaign status API
  // This includes all call types: live, queued, completed, failed calls with real-time updates

  // Server-side filtering: Use the data as-is from API since filtering is done server-side
  const filteredCalls = useMemo(() => {
    // All filtering is done server-side, so we use the call records as-is
    return callRecords
  }, [callRecords])

  // Notify parent of total records count from API
  useEffect(() => {
    if (onFilteredCountChange) {
      onFilteredCountChange(totalRecords)
    }
  }, [totalRecords, onFilteredCountChange])

  // Notify parent of loading state changes
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoadingCalls)
    }
  }, [isLoadingCalls, onLoadingChange])

  // Use API pagination data instead of client-side pagination
  const totalPages = Math.ceil(totalRecords / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalRecords)

  // Server-side sorting: Data comes pre-sorted from API, no client-side sorting needed
  const displayCalls = filteredCalls

  const handleSort = (field: keyof CallRecord) => {
    let newSortDirection: "asc" | "desc" = "desc"
    
    if (sortField === field) {
      newSortDirection = sortDirection === "asc" ? "desc" : "asc"
    } else {
      newSortDirection = "desc" // Default to desc for new fields
    }
    
    // Update sort state
    setSortField(field)
    setSortDirection(newSortDirection)
    
    // Reset to first page and fetch with new sorting
    setCurrentPage(1)
    fetchcampaignStatus(
      true, 
      statusFilter, 
      1, 
      itemsPerPage, 
      searchTerm, 
      connectionFilter, 
      outcomeFilter,
      field,
      newSortDirection
    )
  }

  const getCallStatusBadge = useCallback((callStatus: string, callAgainIn?: number) => {
    switch (callStatus) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
      case "call_again":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
          Call again in {callAgainIn}h
        </Badge>
      case "live":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 animate-pulse">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
          Live
        </Badge>
      case "queue":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Queue</Badge>
      case "scheduled":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
          <Calendar className="w-3 h-3 mr-1" />
          Scheduled
        </Badge>
      case "abandoned":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Abandoned</Badge>
      default:
        return <Badge variant="secondary">{callStatus}</Badge>
    }
  }, [])

  const getStatusBadge = useCallback((status: string, nextVisibleAt?: string) => {
    switch (status) {
      case "QUEUED":
        const nextCallTime = formatNextCallTime(nextVisibleAt)
        return (
          <div className="flex flex-col items-start gap-2">
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
              <Timer className="w-3 h-3 mr-1" />
              Queue
            </Badge>
            {nextCallTime && (
              <div className="text-xs font-semibold text-gray-700">
                Next call in {nextCallTime}
              </div>
            )}
          </div>
        )
      case "CALL_COMPLETED":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <PhoneCall className="w-3 h-3 mr-1" />
          Call Completed
        </Badge>
      case "CALL_COMPLETED_VOICEMAIL":
        const nextCallTimeVoicemail = formatNextCallTime(nextVisibleAt)
        return (
          <div className="flex flex-col items-start gap-2">
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
              <Voicemail className="w-3 h-3 mr-1" />
              Voicemail
            </Badge>
            {nextCallTimeVoicemail && (
              <div className="text-xs font-semibold text-gray-700">
                Next call in {nextCallTimeVoicemail}
              </div>
            )}
          </div>
        )
      case "CUSTOMER_BUSY":
        const nextCallTimeBusy = formatNextCallTime(nextVisibleAt)
        return (
          <div className="flex flex-col items-start gap-2">
            <Badge className="bg-orange-50 text-orange-600 hover:bg-orange-100 hover:border-orange-200 transition-all duration-200">
              <PhoneMissed className="w-3 h-3 mr-1" />
              Customer Busy
            </Badge>
            {nextCallTimeBusy && (
              <div className="text-xs font-semibold text-gray-700">
                Next call in {nextCallTimeBusy}
              </div>
            )}
          </div>
        )
      case "CUSTOMER_DID_NOT_ANSWER":
        const nextCallTimeNoAnswer = formatNextCallTime(nextVisibleAt)
        return (
          <div className="flex flex-col items-start gap-2">
            <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
              <PhoneOff className="w-3 h-3 mr-1" />
              Customer Did Not Answer
            </Badge>
            {nextCallTimeNoAnswer && (
              <div className="text-xs font-semibold text-gray-700">
                Next call in {nextCallTimeNoAnswer}
              </div>
            )}
          </div>
        )
      case "CALL_FAILED":
        const nextCallTimeFailed = formatNextCallTime(nextVisibleAt)
        return (
          <div className="flex flex-col items-start gap-2">
            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
              <X className="w-3 h-3 mr-1" />
              Call Failed
            </Badge>
            {nextCallTimeFailed && (
              <div className="text-xs font-semibold text-gray-700">
                Next call in {nextCallTimeFailed}
              </div>
            )}
          </div>
        )
      case "LIVE_CALL":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 animate-pulse">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
          Live Call
        </Badge>
      case "CALL_IN_PROGRESS":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 animate-pulse">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
          In Progress
        </Badge>
      case "DO_NOT_CALL":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          <Ban className="w-3 h-3 mr-1" />
          Do Not Call
        </Badge>
      // Legacy connectionStatus values for backward compatibility
      case "connected":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <PhoneCall className="w-3 h-3 mr-1" />
          Connected
        </Badge>
      case "live":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 animate-pulse">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
          Live
        </Badge>
      case "queue":
        const nextCallTimeLegacy = formatNextCallTime(nextVisibleAt)
        return (
          <div className="flex flex-col items-start gap-2">
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
              <Timer className="w-3 h-3 mr-1" />
              Queue
            </Badge>
            {nextCallTimeLegacy && (
              <div className="text-xs font-semibold text-gray-700">
                Next call in {nextCallTimeLegacy}
              </div>
            )}
          </div>
        )
      case "failed":
        const nextCallTimeFailedLegacy = formatNextCallTime(nextVisibleAt)
        return (
          <div className="flex flex-col items-start gap-2">
            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
              <X className="w-3 h-3 mr-1" />
              Failed
            </Badge>
            {nextCallTimeFailedLegacy && (
              <div className="text-xs font-semibold text-gray-700">
                Next call in {nextCallTimeFailedLegacy}
              </div>
            )}
          </div>
        )
      case "voicemail":
        const nextCallTimeVoicemailLegacy = formatNextCallTime(nextVisibleAt)
        return (
          <div className="flex flex-col items-start gap-2">
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
              <Voicemail className="w-3 h-3 mr-1" />
              Voicemail
            </Badge>
            {nextCallTimeVoicemailLegacy && (
              <div className="text-xs font-semibold text-gray-700">
                Next call in {nextCallTimeVoicemailLegacy}
              </div>
            )}
          </div>
        )
      case "not_connected":
      case "not-connected":
        const nextCallTimeNotConnected = formatNextCallTime(nextVisibleAt)
        return (
          <div className="flex flex-col items-start gap-2">
            <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
              <PhoneOff className="w-3 h-3 mr-1" />
              Not Connected
            </Badge>
            {nextCallTimeNotConnected && (
              <div className="text-xs font-semibold text-gray-700">
                Next call in {nextCallTimeNotConnected}
              </div>
            )}
          </div>
        )
      case "busy":
        const nextCallTimeBusyLegacy = formatNextCallTime(nextVisibleAt)
        return (
          <div className="flex flex-col items-start gap-2">
            <Badge className="bg-orange-50 text-orange-600 hover:bg-orange-100 hover:border-orange-200 transition-all duration-200">
              <PhoneMissed className="w-3 h-3 mr-1" />
              Busy
            </Badge>
            {nextCallTimeBusyLegacy && (
              <div className="text-xs font-semibold text-gray-700">
                Next call in {nextCallTimeBusyLegacy}
              </div>
            )}
          </div>
        )
      default:
        const nextCallTimeDefault = formatNextCallTime(nextVisibleAt)
        return (
          <div className="flex flex-col items-start gap-2">
            <Badge variant="secondary">{status.replace(/_/g, ' ')}</Badge>
            {nextCallTimeDefault && (
              <div className="text-xs font-semibold text-gray-700">
                Next call in {nextCallTimeDefault}
              </div>
            )}
          </div>
        )
    }
  }, [formatNextCallTime])

  // Helper function to format text to proper case
  const formatOutcomeText = useCallback((text: string) => {
    if (!text || text === "--") return text
    
    // Convert to proper case (first letter of each word capitalized)
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }, [])

  const getOutcomeBadge = useCallback((outcome: string) => {
    // Show plain dash text if outcome is empty, null, or just dashes - no badge
    if (!outcome || outcome.trim().length === 0 || outcome.trim() === '--' || outcome.trim() === '-') {
      return <span className="text-gray-400">--</span>
    }
    
    const originalLabel = outcome
    const formattedLabel = formatOutcomeText(originalLabel)
    const normalized = originalLabel
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")

    // Map many human-readable variants to color classes
    const isServiceAppointment =
      normalized.includes("service") && normalized.includes("appointment")
    const isTestDrive = normalized.includes("test") && normalized.includes("drive")
    const isCallback = normalized.includes("callback") || normalized.includes("call_back")
    const isNotInterested = normalized.includes("not_interested") || normalized.includes("notinterested")
    const isWrongNumber = normalized.includes("wrong") && normalized.includes("number")
    const isInfoProvided = normalized.includes("information_provided") || normalized.includes("info")
    const isTradeIn = normalized.includes("trade") && (normalized.includes("in") || normalized.includes("tradein"))
    const isGeneralSalesInquiry =
      (normalized.includes("sales") && normalized.includes("inquiry")) || normalized.includes("general_sales_inquiry")
    const isVoicemailOutcome = normalized.includes("voicemail") || normalized.includes("voice_mail")
    const isNoOutcome = normalized === "no_outcome" || normalized === "nooutcome" || normalized === "none"

    if (isServiceAppointment) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <Calendar className="w-3 h-3 mr-1" />
          {formattedLabel}
        </Badge>
      )
    }
    if (isTestDrive) {
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          <Car className="w-3 h-3 mr-1" />
          {formattedLabel}
        </Badge>
      )
    }
    if (isCallback) {
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">{formattedLabel}</Badge>
    }
    if (isNotInterested) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{formattedLabel}</Badge>
    }
    if (isWrongNumber) {
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">{formattedLabel}</Badge>
    }
    if (isInfoProvided) {
      return <Badge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-100">{formattedLabel}</Badge>
    }
    if (isTradeIn) {
      return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{formattedLabel}</Badge>
    }
    if (isGeneralSalesInquiry) {
      return <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">{formattedLabel}</Badge>
    }
    if (isVoicemailOutcome) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{formattedLabel}</Badge>
    }
    if (isNoOutcome) {
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{formattedLabel}</Badge>
    }

    return <Badge variant="secondary">{formattedLabel}</Badge>
  }, [formatOutcomeText])

  const getCallReasonBadge = (reason: string) => {
    switch (reason) {
      case "service_reminder":
        return <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">Service Reminder</Badge>
      case "recall_notice":
        return <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Recall Notice
        </Badge>
      case "sales_follow_up":
        return <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Sales Follow-up</Badge>
      case "maintenance_due":
        return <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">Maintenance Due</Badge>
      case "warranty_expiring":
        return <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">Warranty Expiring</Badge>
      case "trade_in_opportunity":
        return <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700">Trade-in Opportunity</Badge>
      case "new_model_announcement":
        return <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">New Model</Badge>
      case "customer_inquiry_follow_up":
        return <Badge variant="outline" className="text-xs bg-cyan-50 text-cyan-700">Inquiry Follow-up</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{reason}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-xs">High</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-xs">Medium</Badge>
      case "low":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 text-xs">Low</Badge>
      default:
        return <Badge variant="secondary" className="text-xs">{priority}</Badge>
    }
  }

  const getAvatarColor = useCallback((name: string) => {
    const colors = [
      "bg-blue-100 text-blue-600",      // Blue
      "bg-green-100 text-green-600",    // Green
      "bg-purple-100 text-purple-600",  // Purple
      "bg-pink-100 text-pink-600",      // Pink
      "bg-indigo-100 text-indigo-600",  // Indigo
      "bg-cyan-100 text-cyan-600",      // Cyan
      "bg-orange-100 text-orange-600",  // Orange
      "bg-teal-100 text-teal-600",      // Teal
      "bg-slate-100 text-slate-600",    // Light gray
      "bg-emerald-100 text-emerald-600", // Emerald
      "bg-violet-100 text-violet-600",  // Violet
      "bg-amber-100 text-amber-600",    // Amber
    ]
    
    // Special case for Michael Torres to avoid red
    if (name === "Michael Torres") {
      return "bg-sky-100 text-sky-600 text-sm"
    }
    
    // Generate a consistent color based on the name
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const colorIndex = hash % colors.length
    
    return `${colors[colorIndex]} text-sm`
  }, [])

  const QualityScoreBar = ({ score, call }: { score: number, call: CallRecord }) => {
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      return // Temporarily disabled to test double modal issue
      // Convert CallRecord to AICallRecord format for AI breakdown
      const callForBreakdown: AICallRecord = {
        call_id: call.id,
        dealership_id: "dealership-001",
        started_at: new Date().toISOString(),
        ended_at: new Date(Date.now() + 180000).toISOString(), // 3 minutes later
        direction: "outbound",
        domain: "sales",
        campaign_id: "campaign-001",
        customer: {
          name: call.customer.name,
          phone: call.customer.phone,
          email: null
        },
        vehicle: {
          vin: null,
          stock_id: null,
          year: call.vehicleInfo?.year || 2023,
          make: call.vehicleInfo?.make || "Honda",
          model: call.vehicleInfo?.model || "Civic",
          trim: null,
          delivery_type: null
        },
        primary_intent: call.callReason.replace(/_/g, ' '),
        intents: [{
          label: call.callReason.replace(/_/g, ' '),
          confidence: 0.9
        }],
        outcome: call.outcome === "service_appointment" ? "Service Appointment Scheduled" :
                call.outcome === "test_drive" ? "Test Drive Scheduled" :
                call.outcome === "callback" ? "Callback Requested" :
                call.outcome === "not_interested" ? "Not Interested" :
                call.outcome === "information_provided" ? "Success" : "Success",
        appointment: {
          type: call.outcome === "service_appointment" ? "service" : call.outcome === "test_drive" ? "test_drive" : null,
          starts_at: call.outcome.includes("appointment") ? new Date(Date.now() + 86400000).toISOString() : null, // tomorrow
          ends_at: call.outcome.includes("appointment") ? new Date(Date.now() + 90000000).toISOString() : null,
          location: call.outcome.includes("appointment") ? "Main Dealership" : null,
          advisor: call.outcome.includes("appointment") ? call.agent.name : null,
          status: call.outcome.includes("appointment") ? "scheduled" : null
        },
        sentiment: {
          label: score >= 8 ? "positive" : score >= 6 ? "neutral" : "negative",
          score: score / 10
        },
        ai_score: score,
        containment: score >= 7,
        summary: `Call with ${call.customer.name} regarding ${call.callReason.replace(/_/g, ' ')}.`,
        notes: "",
        follow_up: {
          needed: false,
          reason: null,
          due_at: null,
          assignee: null
        },
        metrics: {
          duration_sec: 180,
          hold_sec: 10,
          silence_sec: 15
        },
        recording_url: null,
        transcript_url: null,
        tags: []
      }
      setSelectedCallForBreakdown(callForBreakdown)
      setAiScoreBreakdownOpen(true)
    }

    // Check if we should show quality score or dash
    // Show quality score only when status is 'connected' or 'CALL_COMPLETED'
    const shouldShowScore = call.connectionStatus === 'connected' || 
                           call.callStatus === 'CALL_COMPLETED' ||
                           call.connectionStatus === 'CALL_COMPLETED'

    if (!shouldShowScore) {
      return (
        <div className="flex items-center justify-start">
          <div className="text-sm text-gray-500 font-medium">--</div>
        </div>
      )
    }

    return (
      <div className="flex items-center justify-start">
        <button 
          onClick={handleClick}
          className="hover:scale-105 transition-transform cursor-pointer"
        >
          <CircularProgress
            value={score * 10}
            size={32}
            strokeWidth={3}
            className="rounded-full"
          >
            <div className="text-[11px] font-semibold" style={{ 
              color: score >= 9 ? "#065f46" : 
                     score >= 8 ? "#166534" : 
                     score >= 7 ? "#1e40af" : 
                     score >= 6 ? "#92400e" : 
                     score >= 4 ? "#ea580c" : "#dc2626"
            }}>
              {score.toFixed(1)}
            </div>
          </CircularProgress>
        </button>
      </div>
    )
  }

  // Show loading state
  if (isLoadingCalls) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="space-y-4">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              </div>
              <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
            </div>
            
            {/* Table header skeleton */}
            <div className="grid grid-cols-12 gap-4 py-3 border-b border-gray-100">
              <div className="col-span-2">
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
              </div>
              <div className="col-span-2">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
              </div>
              <div className="col-span-1">
                <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
              </div>
              <div className="col-span-1">
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
              </div>
              <div className="col-span-1">
                <div className="h-4 bg-gray-200 rounded w-14 animate-pulse" />
              </div>
              <div className="col-span-1">
                <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
              </div>
              <div className="col-span-1">
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
              </div>
              <div className="col-span-1">
                <div className="h-4 bg-gray-200 rounded w-14 animate-pulse" />
              </div>
              <div className="col-span-1">
                <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
              </div>
            </div>
            
            {/* Call rows skeleton */}
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 py-4 border-b border-gray-50">
                {/* Customer */}
                <div className="col-span-2">
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                  </div>
                </div>
                
                {/* Status */}
                <div className="col-span-1">
                  <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse" />
                </div>
                
                {/* Timestamp */}
                <div className="col-span-1">
                  <div className="h-4 bg-gray-200 rounded w-14 animate-pulse" />
                </div>
                
                {/* Duration */}
                <div className="col-span-1">
                  <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
                </div>
                
                {/* Outcome */}
                <div className="col-span-1">
                  <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse" />
                </div>
                
                {/* Agent */}
                <div className="col-span-1">
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                </div>
                
                {/* Quality Score */}
                <div className="col-span-1">
                  <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (callsError) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <AlertTriangle className="w-8 h-8 text-red-400" />
          <span className="ml-2 text-red-500">Error loading calls: {callsError}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0" data-campaign-container>
      {/* Main Table Content */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Search Mode Indicator */}
        {isSearchMode && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-800">
                <Search className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Search Results for "{searchTerm}" ({filteredCalls.length} found)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsSearchMode(false)
                  // This will trigger the parent component to clear the search term
                  // which will then trigger a new API call without the search parameter
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Search
              </Button>
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <Table className="min-w-[1000px]">
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-900 cursor-pointer whitespace-nowrap min-w-[250px]" onClick={() => handleSort("customer")}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Customer Details
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900 whitespace-nowrap min-w-[160px]">Status</TableHead>
                  <TableHead className="font-semibold text-gray-900 cursor-pointer whitespace-nowrap min-w-[160px]" onClick={() => handleSort("timestamp")}>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Timestamp
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900 whitespace-nowrap min-w-[120px]">Duration</TableHead>
                  <TableHead className="font-semibold text-gray-900 whitespace-nowrap min-w-[160px]">Outcome</TableHead>
                  <TableHead className="font-semibold text-gray-900 whitespace-nowrap min-w-[140px]">Agent</TableHead>
                  <TableHead className="font-semibold text-gray-900 cursor-pointer whitespace-nowrap min-w-[160px]" onClick={() => handleSort("qualityScore")}>
                    <div className="flex items-center gap-2">
                      Quality Score
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayCalls.map((call, index) => (
                  <TableRow 
                    key={call.id} 
                    data-table-row
                  className={`hover:bg-gray-50 transition-colors ${
                    isTransitioning ? 'pointer-events-none' : 
                    (call.callStatus === 'CALL_COMPLETED' || call.callStatus === 'CALL_COMPLETED_VOICEMAIL' || 
                     call.connectionStatus === 'connected' || call.connectionStatus === 'voicemail') ? 'cursor-pointer' : 'cursor-default'
                  }`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (!isTransitioning) {
                      // Only open call drawer for completed calls and voicemail
                      if (call.callStatus !== 'CALL_COMPLETED' && 
                          call.callStatus !== 'CALL_COMPLETED_VOICEMAIL' &&
                          call.connectionStatus !== 'connected' && 
                          call.connectionStatus !== 'voicemail') {
                       
                        return
                      }
                      
                     
                      // Add small delay to ensure single execution
                      setTimeout(() => {
                        onCallSelect?.(call)
                      }, 10)
                    }
                  }}
                  >
                    {/* Customer Details */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className={getAvatarColor(call.customer.name)}>
                            {call.customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">{call.customer.name}</div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 whitespace-nowrap">
                            <span>{call.customer.phone}</span>
                            {call.retryCount > 0 && (
                              <div className="relative group">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs cursor-help ${
                                    call.retryCount >= 3 ? 'bg-red-50 text-red-700 border-red-200' :
                                    call.retryCount >= 2 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                                  }`}
                                >
                                  {call.retryCount}
                                </Badge>
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                  Retry Count
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    {/* Status */}
                    <TableCell>
                      {getStatusBadge(call.callStatus, call.nextVisibleAt)}
                    </TableCell>
                    
                    {/* Timestamp */}
                    <TableCell>
                      <div>
                        <div className="text-sm text-gray-900">{call.timestamp.date}</div>
                        <div className="text-sm text-gray-500">{call.timestamp.time}</div>
                      </div>
                    </TableCell>
                    
                    {/* Duration */}
                    <TableCell>
                      <div className="text-sm text-gray-900">{call.timestamp.duration}</div>
                    </TableCell>
                    
                    {/* Outcome */}
                    <TableCell>
                      {getOutcomeBadge(call.outcome)}
                    </TableCell>
                    
                    {/* Agent */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                            {call.agent.name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-900">{call.agent.name}</span>
                      </div>
                    </TableCell>
                    
                    {/* Quality Score */}
                    <TableCell>
                      <QualityScoreBar score={call.qualityScore} call={call} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        
        {displayCalls.length === 0 && (
          <div className="text-center py-12 px-6">
            <div className="text-gray-400 mb-2">
              {searchError ? (
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
              ) : (
                <Search className="w-12 h-12 mx-auto mb-4" />
              )}
            </div>
            {searchError ? (
              <>
                <h3 className="text-lg font-medium text-red-900 mb-1">Search Error</h3>
                <p className="text-red-600 mb-4">{searchError}</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchError(null)
                    if (searchTerm.trim()) {
                      performAPISearch(searchTerm.trim())
                    }
                  }}
                >
                  Try Again
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {isSearchMode ? 'No search results found' : 'No calls found'}
                </h3>
                <p className="text-gray-500">
                  {isSearchMode 
                    ? `No results found for "${searchTerm}". Try a different search term.`
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
                {isSearchMode && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsSearchMode(false)
                      // This will trigger the parent component to clear the search term
                    }}
                    className="mt-4"
                  >
                    Clear Search
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navbar - Pagination Controls */}
      {filteredCalls.length > 0 && (
        <div className="pt-6" data-pagination-container>
          <SmartPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={totalRecords}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => {
              setCurrentPage(page)
              fetchcampaignStatus(true, statusFilter, page, itemsPerPage, searchTerm, connectionFilter, outcomeFilter, sortField, sortDirection)
            }}
            onItemsPerPageChange={(newItemsPerPage) => {
              setItemsPerPage(newItemsPerPage)
              setCurrentPage(1)
              fetchcampaignStatus(true, statusFilter, 1, newItemsPerPage, searchTerm, connectionFilter, outcomeFilter, sortField, sortDirection)
            }}
            showProgressIndicator={true}
            showGoToPage={true}
            itemsPerPageOptions={[5, 10, 25, 50]}
          />
        </div>
      )}
      
      {/* AI Score Breakdown Modal - Temporarily disabled to test double modal issue */}
      {/* <AIScoreBreakdown
        call={selectedCallForBreakdown}
        open={aiScoreBreakdownOpen}
        onClose={() => {
          setAiScoreBreakdownOpen(false)
          setSelectedCallForBreakdown(null)
        }}
      /> */}
    </div>
  )
})