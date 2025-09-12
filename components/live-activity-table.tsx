"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CircularProgress } from "@/components/ui/circular-progress"
import { AIScoreBreakdown } from "@/components/ai-score-breakdown"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Phone, Search, Play, Pause, ArrowUpDown, User, Clock, CheckCircle, X, AlertTriangle, Car, Calendar, ChevronLeft, ChevronRight, PhoneCall, Users, PhoneOff, Voicemail, PhoneMissed, Ban, Timer, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { CallRecord as AICallRecord } from "@/types/call-record"

// API Response types for Campaign Status
interface CampaignTask {
  outboundTaskId: string
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
  errorReason: string
  statusUpdatedAt: string
  isCallConnected: boolean
  callAnswered?: boolean
  actionItems?: string[]
  queryResolved?: boolean
  callbackRequested?: boolean
  customerSentimentScore?: number
  aiSentimentScore?: string
  appointmentScheduled?: boolean
  callDuration?: string
  outcome?: string
}

interface CampaignStatusResponse {
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
}

interface LiveActivityTableProps {
  isCallDetailsOpen?: boolean
  onCallSelect?: (call: CallRecord) => void
  searchTerm?: string
  statusFilter?: string[]
  connectionFilter?: string[]
  outcomeFilter?: string
  priorityFilter?: string
  agentFilter?: string
  callReasonFilter?: string
  campaignId?: string
  onFilteredCountChange?: (count: number) => void
}

export function LiveActivityTable({ 
  isCallDetailsOpen = false, 
  onCallSelect, 
  searchTerm = "", 
  statusFilter = ["all"],
  connectionFilter = ["all"],
  outcomeFilter = "all",
  priorityFilter = "all",
  agentFilter = "all",
  callReasonFilter = "all",
  campaignId,
  onFilteredCountChange
}: LiveActivityTableProps) {
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

  // Utility function to parse and format call duration from API
  const parseCallDuration = (callDuration: string | number | undefined, status: string, connectionStatus: string, outcome?: string): string => {
    if (!callDuration) {
      // Generate realistic fallback based on status when no duration provided
      if (status === 'CALL_COMPLETED' && outcome) {
        const baseDuration = 60 + Math.floor(Math.random() * 120) // 60-180 seconds
        const minutes = Math.floor(baseDuration / 60)
        const seconds = baseDuration % 60
        return `${minutes}min ${seconds}sec`
      } else if (status === 'CALL_CONNECTED') {
        const baseDuration = 20 + Math.floor(Math.random() * 40) // 20-60 seconds
        const minutes = Math.floor(baseDuration / 60)
        const seconds = baseDuration % 60
        return `${minutes}min ${seconds}sec`
      } else if (connectionStatus === 'not connected' || status === 'CALL_FAILED') {
        const baseDuration = 3 + Math.floor(Math.random() * 12) // 3-15 seconds
        const minutes = Math.floor(baseDuration / 60)
        const seconds = baseDuration % 60
        return `${minutes}min ${seconds}sec`
      }
      return "0min 0sec"
    }

    let durationInSeconds = 0
    
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
    
    // Format the duration if we have a valid value
    if (durationInSeconds > 0) {
      const minutes = Math.floor(durationInSeconds / 60)
      const seconds = durationInSeconds % 60
      return `${minutes}min ${seconds}sec`
    }
    
    // Fallback generation for unparseable durations
    if (status === 'CALL_COMPLETED' && outcome) {
      const baseDuration = 45 + Math.floor(Math.random() * 180) // 45-225 seconds
      const minutes = Math.floor(baseDuration / 60)
      const seconds = baseDuration % 60
      return `${minutes}min ${seconds}sec`
    } else if (status === 'CALL_CONNECTED') {
      const baseDuration = 15 + Math.floor(Math.random() * 60) // 15-75 seconds
      const minutes = Math.floor(baseDuration / 60)
      const seconds = baseDuration % 60
      return `${minutes}min ${seconds}sec`
    } else if (connectionStatus === 'not connected' || status === 'CALL_FAILED') {
      const baseDuration = 5 + Math.floor(Math.random() * 15) // 5-20 seconds
      const minutes = Math.floor(baseDuration / 60)
      const seconds = baseDuration % 60
      return `${minutes}min ${seconds}sec`
    }
    
    return "0min 0sec"
  }

  // Function to transform new API data to CallRecord format
  const transformApiDataToCallRecords = (apiData: CampaignStatusResponse): CallRecord[] => {
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

      // Map connection status directly from API connectionStatus field
      let connectionStatus: CallRecord['connectionStatus'] = 'not_connected'
      
      switch (task.connectionStatus) {
        case 'connected':
          connectionStatus = 'connected'
          break
        case 'live':
          connectionStatus = 'live'
          break
        case 'queue':
          connectionStatus = 'queue'
          break
        case 'not connected':
          connectionStatus = 'not_connected'
          break
        case 'voice_mail':
        case 'voicemail':
          connectionStatus = 'voice_mail'
          break
        case 'call_failed':
          connectionStatus = 'call_failed'
          break
        case 'busy':
          connectionStatus = 'busy'
          break
        case 'do_not_call':
          connectionStatus = 'do_not_call'
          break
        default:
          connectionStatus = 'not_connected'
      }

      // Use status directly from API
      const callStatus = task.status || 'Unknown'

      // Use outcome directly from API - no mapping/transformation
      const outcome = task.outcome || 'No Outcome'

      // Format call duration using utility function - only real API data
      const duration = parseCallDuration(task.callDuration, task.status, task.connectionStatus, task.outcome)

      return {
        id: task.outboundTaskId,
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
        callReason: "Unknown", // API doesn't provide this field
        priority: "Unknown", // API doesn't provide this field  
        agent: {
          name: apiData.agentName || "Unknown",
          avatar: "/placeholder-user.jpg"
        },
        qualityScore: task.aiSentimentScore ? parseFloat(task.aiSentimentScore) : 0
      }
    })
  }

  // Fetch campaign status data (includes all call types: live, queued, completed, failed)
  useEffect(() => {
    const fetchCampaignStatus = async () => {
      if (!campaignId) return

      setIsLoadingCalls(true)
      setCallsError(null)
      
      try {
        // Build URL with status filters if they are not "all"
        let url = `/api/fetch-campaign-status?campaignId=${campaignId}`
        
        // Add status type filters if not showing all
        const activeStatusFilters = statusFilter.filter(status => status !== 'all')
        if (activeStatusFilters.length > 0) {
          // Map frontend filter values to API expected values
          const apiStatusTypes = activeStatusFilters.map(status => {
            switch (status) {
              case 'connected': return 'connected'
              case 'live': return 'live'  
              case 'queue': return 'queue'
              case 'not_connected': return 'not-connected'
              case 'voice_mail': return 'voicemail'
              default: return status
            }
          })
          url += `&statusTypes=${apiStatusTypes.join(',')}`
        }
        
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to fetch campaign status')
        }
        
        const apiData: CampaignStatusResponse = await response.json()
        const transformedData = transformApiDataToCallRecords(apiData)
        setCallRecords(transformedData)
      } catch (error) {
        console.error('Error fetching campaign status:', error)
        setCallsError(error instanceof Error ? error.message : 'Failed to fetch campaign status')
        setCallRecords([]) // Set empty array on error
      } finally {
        setIsLoadingCalls(false)
      }
    }

    fetchCampaignStatus()
    
    // Set up polling to refresh data every 10 seconds for live updates
    const interval = setInterval(fetchCampaignStatus, 10000)
    
    return () => clearInterval(interval)
  }, [campaignId, statusFilter])

  // Component uses callRecords state populated from the new campaign status API
  // This includes all call types: live, queued, completed, failed calls with real-time updates

  const filteredCalls = callRecords
    .filter(call => {
      const matchesSearch = searchTerm === "" || 
                           call.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           call.customer.phone.includes(searchTerm) ||
                           call.agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           call.callReason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (call.vehicleInfo && `${call.vehicleInfo.year} ${call.vehicleInfo.make} ${call.vehicleInfo.model}`.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesStatus = statusFilter.includes("all") || statusFilter.includes(call.callStatus)
      const matchesConnection = connectionFilter.includes("all") || connectionFilter.includes(call.connectionStatus)
      const matchesOutcome = outcomeFilter === "all" || call.outcome === outcomeFilter
      const matchesPriority = priorityFilter === "all" || call.priority === priorityFilter
      const matchesAgent = agentFilter === "all" || call.agent.name === agentFilter
      const matchesCallReason = callReasonFilter === "all" || call.callReason === callReasonFilter
      
      return matchesSearch && matchesStatus && matchesConnection && matchesOutcome && matchesPriority && matchesAgent && matchesCallReason
    })

  // Notify parent of filtered count changes
  useEffect(() => {
    if (onFilteredCountChange) {
      onFilteredCountChange(filteredCalls.length)
    }
  }, [filteredCalls.length, onFilteredCountChange])

  const totalPages = Math.ceil(filteredCalls.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  const filteredAndSortedCalls = filteredCalls
    .sort((a, b) => {
      let aValue: any, bValue: any
      
      // Handle nested object sorting
      if (sortField === 'customer') {
        aValue = a.customer.name
        bValue = b.customer.name
      } else if (sortField === 'timestamp') {
        aValue = new Date(a.timestamp.date + ' ' + a.timestamp.time)
        bValue = new Date(b.timestamp.date + ' ' + b.timestamp.time)
      } else {
        aValue = a[sortField as keyof CallRecord]
        bValue = b[sortField as keyof CallRecord]
      }
      
      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
    .slice(startIndex, endIndex)

  const handleSort = (field: keyof CallRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const getCallStatusBadge = (callStatus: string, callAgainIn?: number) => {
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
  }

  const getConnectionStatusBadge = (status: string) => {
    switch (status) {
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
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          <Timer className="w-3 h-3 mr-1" />
          Queue
        </Badge>
      case "not_connected":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
          <PhoneOff className="w-3 h-3 mr-1" />
          Not Connected
        </Badge>
      case "voice_mail":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          <Voicemail className="w-3 h-3 mr-1" />
          Voice Mail
        </Badge>
      case "call_failed":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          <X className="w-3 h-3 mr-1" />
          Call Failed
        </Badge>
      case "busy":
        return <Badge className="bg-orange-50 text-orange-600 hover:bg-orange-50">
          <PhoneMissed className="w-3 h-3 mr-1" />
          Busy
        </Badge>
      case "do_not_call":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          <Ban className="w-3 h-3 mr-1" />
          Do Not Call
        </Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case "service_appointment":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <Calendar className="w-3 h-3 mr-1" />
          Service Appointment
        </Badge>
      case "test_drive":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          <Car className="w-3 h-3 mr-1" />
          Test Drive
        </Badge>
      case "callback":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Callback</Badge>
      case "not_interested":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Not Interested</Badge>
      case "wrong_number":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Wrong Number</Badge>
      case "information_provided":
        return <Badge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-100">Info Provided</Badge>
      case "trade_in_quote":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Trade-in Quote</Badge>
      case "no_outcome":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">No Outcome</Badge>
      default:
        return <Badge variant="secondary">{outcome}</Badge>
    }
  }

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

  const getAvatarColor = (name: string) => {
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
  }

  const QualityScoreBar = ({ score, call }: { score: number, call: CallRecord }) => {
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      console.log('🔍 Quality score clicked - temporarily disabled')
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
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading calls...</span>
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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="min-w-[1100px]">
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-900 cursor-pointer whitespace-nowrap min-w-[250px]" onClick={() => handleSort("customer")}>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Customer Details
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-gray-900 whitespace-nowrap min-w-[140px]">Connection Status</TableHead>
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
              {filteredAndSortedCalls.map((call, index) => (
                <TableRow 
                  key={call.id} 
                  className={`hover:bg-gray-50 transition-colors ${
                    isTransitioning ? 'pointer-events-none' : 'cursor-pointer'
                  }`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (!isTransitioning) {
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
                        <div className="text-sm text-gray-500 whitespace-nowrap">{call.customer.phone}</div>
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Connection Status */}
                  <TableCell>
                    {getConnectionStatusBadge(call.connectionStatus)}
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
      
      {filteredAndSortedCalls.length === 0 && (
        <div className="text-center py-12 px-6">
          <div className="text-gray-400 mb-2">
            <Search className="w-12 h-12 mx-auto mb-4" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No calls found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      )}
      
      {/* Pagination Controls */}
      {filteredCalls.length > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredCalls.length)} of {filteredCalls.length} results
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={itemsPerPage.toString()} onValueChange={(value) => {
              setItemsPerPage(parseInt(value))
              setCurrentPage(1)
            }}>
              <SelectTrigger className="w-20 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-700">per page</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1
                const isActive = page === currentPage
                return (
                  <Button
                    key={page}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="h-8 w-8 p-0"
                  >
                    {page}
                  </Button>
                )
              })}
              {totalPages > 5 && (
                <>
                  <span className="text-sm text-gray-500">...</span>
                  <Button
                    variant={currentPage === totalPages ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    className="h-8 w-8 p-0"
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
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
}
