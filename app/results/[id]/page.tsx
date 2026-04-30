'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Toaster } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle, Download, ArrowLeft } from 'lucide-react'
import Link from "next/link"
import type { CampaignDetailResponse } from '@/lib/campaign-api'
import type { Agent } from '@/lib/agent-api'
import { calculateAndFormatEstimatedTime, getShortEstimatedTime } from '@/lib/time-utils'
import { generateCallStatus, generateCallTime, generateCallDuration, calculatecampaignStatus } from '@/lib/call-status-utils'
import { buildUrlWithParams, extractUrlParams } from '@/lib/url-utils'

// Import our new components
import { CampaignHeader } from '@/components/campaign/campaign-header'
import { LiveCallsTab } from '@/components/campaign/live-calls-tab'
import { AnalyticsTab } from '@/components/campaign/analytics-tab'
import { LeadsTab } from '@/components/campaign/leads-tab'
import { ErrorsTab } from '@/components/campaign/errors-tab'
import { SettingsTab } from '@/components/campaign/settings-tab'
// import { TabsNavigation } from '@/components/ui/tabs-navigation'
import { ApiCallDrawer } from '@/components/api-call-drawer'
import { CampaignPageShimmer } from '@/components/ui/campaign-shimmer'
// import { FunnelChart } from '@/components/ui/funnel-chart'
// import AppointmentFunnel from '@/components/ui/appointment-funnel'
import { getCampaignFunnelData, calculateFunnelMetrics, getAppointmentFunnelData } from '@/lib/funnel-utils'
import { calculateCampaignMetricsFromAPI, type CampaignAnalyticsResponse, type CampaignCompletedResponse } from '@/lib/metrics-utils'
import {
  getMockAgents,
  getMockCampaignAnalytics,
  getMockCampaignCompleted,
  getMockCampaignConversationData,
  getMockCampaignDetails,
  getMockLeadsData,
  getMockCampaignTypes,
  getMockAnalyticsExtras,
  getMockErrorsData,
  getMockSmsOverview,
} from '@/lib/outbound-local-data'
// import { MetricsGrid } from '@/components/ui/metrics-grid'
import type { CallRecord } from '@/types/call-record'
// import { PerformanceTimeChart } from '@/components/charts/PerformanceTimeChart'

// Map API campaign type to display format using dynamic data
const mapCampaignType = (campaignType: string, campaignTypes?: any | null): string => {
  if (campaignTypes?.data) {
    for (const group of campaignTypes.data) {
      if (group.campaignTypes) {
        for (const type of group.campaignTypes) {
          if (type.name.toLowerCase() === campaignType.toLowerCase() || 
              type.name.replace(/[_\s]/g, '-').toLowerCase() === campaignType.toLowerCase()) {
            return group.campaignFor
          }
        }
      }
    }
  }
  
  // Enhanced fallback mapping for service-related campaign types
  const serviceKeywords = ['recall', 'service', 'maintenance', 'repair', 'warranty', 'inspection']
  const lowerCampaignType = campaignType.toLowerCase()
  
  if (serviceKeywords.some(keyword => lowerCampaignType.includes(keyword))) {
    return 'Service'
  }

  if (lowerCampaignType === 'sales') return 'Sales'
  if (lowerCampaignType === 'service') return 'Service'
  
  // Default fallback - return the original campaign type if no mapping found
  // This allows for explicit checking in components
  return campaignType
}

// Calculate service campaign specific statistics
const allowedTabs = ['overview', 'analytics', 'leads', 'errors', 'settings'] as const

const calculateServicecampaignStatus = (totalCalls: number) => {
  const stats = calculatecampaignStatus(totalCalls)
  
  return {
    serviceCallsMade: stats.callsMade,
    serviceAppointmentCount: Math.round(stats.callsMade * 0.35),
    serviceConversionRate: Math.round((Math.round(stats.callsMade * 0.35) / stats.callsMade) * 100),
    followUpRequested: Math.round(stats.callsMade * 0.15),
    followUpSuccessRate: Math.round((Math.round(stats.callsMade * 0.15) * 0.8 / Math.round(stats.callsMade * 0.15)) * 100),
    serviceAnswerRate: stats.answerRate,
    serviceAvgCallDuration: stats.avgCallDuration,
    callsAnswered: stats.callsAnswered
  }
}

export default function CampaignDetail() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string

  // Extract URL parameters
  const urlParams = extractUrlParams()
  
  // State management
  const [campaignData, setCampaignData] = useState<CampaignDetailResponse | null>(null)
  const [campaignTypes, setCampaignTypes] = useState<any | null>(null)
  const [campaignAgent, setCampaignAgent] = useState<Agent | null>(null)
  const [conversationData, setConversationData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingAgent, setIsLoadingAgent] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [campaignRunning, setCampaignRunning] = useState(true)
  const [isCallDetailsOpen, setIsCallDetailsOpen] = useState(false)
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null)
  const [callDetailsTab, setCallDetailsTab] = useState('highlights')
  const [callTimer, setCallTimer] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState(["all"])
  const [connectionFilter, setConnectionFilter] = useState(["all"])
  const [showFilters, setShowFilters] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [funnelMode, setFunnelMode] = useState<'sms' | 'call' | 'all'>('sms')
  const audioRef = useRef<any>(null)
  const [isClosing, setIsClosing] = useState(false)
  const lastCloseTimeRef = useRef<number>(0)
  const lastCallSelectRef = useRef<number>(0)
  
  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState<CampaignAnalyticsResponse | null>(null)
  const [completedCallsData, setCompletedCallsData] = useState<CampaignCompletedResponse | null>(null)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)
  
  // Refresh trigger for table data
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Campaign type detection
  const mappedCampaignType = campaignData?.campaign?.campaignType 
    ? mapCampaignType(campaignData.campaign.campaignType, campaignTypes) 
    : ''
  const isSalesCampaign = mappedCampaignType === 'Sales'
  const isServiceCampaign = mappedCampaignType === 'Service'
  
  

  useEffect(() => {
    if (!campaignId) return
    setIsLoadingAnalytics(true)
    setAnalyticsData(getMockCampaignAnalytics(campaignId))
    setCompletedCallsData(getMockCampaignCompleted(campaignId))
    setIsLoadingAnalytics(false)
  }, [campaignId])


  // Extract agents from real API data instead of mock calls
  const deployedAgents = useMemo(() => {
    const agents = []
    
    // Add agent from completed calls data if available
    if (completedCallsData?.agentName) {
      agents.push({
        id: completedCallsData.agentName.toLowerCase().replace(/\s+/g, '-'),
        name: completedCallsData.agentName,
        agentName: completedCallsData.agentName,
        type: 'voice',
        status: 'active'
      })
    }
    
    // Add campaign agent if different and available
    if (campaignAgent && campaignAgent.name !== completedCallsData?.agentName) {
      agents.push({
        id: campaignAgent.id,
        name: campaignAgent.name,
        agentName: (campaignAgent as any).agentName || campaignAgent.name,
        type: campaignAgent.type || 'voice',
        status: (campaignAgent as any).status || 'active'
      })
    }
    
    // If no agents from API, check conversation data for agent mapping
    if (agents.length === 0 && conversationData?.teamAgentMappingId && campaignAgent) {
      agents.push({
        id: campaignAgent.id,
        name: campaignAgent.name,
        agentName: (campaignAgent as any).agentName || campaignAgent.name,
        type: campaignAgent.type || 'voice',
        status: (campaignAgent as any).status || 'active'
      })
    }
    
    return agents
  }, [completedCallsData, campaignAgent, conversationData])

  // Calculate statistics
  const serviceStats = isServiceCampaign && campaignData?.campaign ? 
    calculateServicecampaignStatus(campaignData.campaign.totalCallPlaced) : null
  const calculatedStats = isSalesCampaign && campaignData?.campaign ? 
    calculatecampaignStatus(campaignData.campaign.totalCallPlaced) : null

  // Calculate campaign metrics using real API data (memoized)
  const campaignMetrics = useMemo(() => {
    if (analyticsData || completedCallsData) {
      return calculateCampaignMetricsFromAPI(analyticsData, completedCallsData)
    }
    // Return empty metrics if no API data available
    return {
      totalCallsMade: { count: 0 },
      totalCustomersContacted: { count: 0 },
      totalAppointmentsSet: { count: 0 },
      answerRate: { percentage: 0 },
      voicemailPercentage: { count: 0, percentage: 0 },
      avgCallDuration: { duration: '0:00' },
      callFailedPercentage: { count: 0, percentage: 0 },
      percentageOfFollowups: { count: 0, percentage: 0 }
    }
  }, [analyticsData, completedCallsData])

  const leadsData = useMemo(() => getMockLeadsData(campaignId), [campaignId])
  const analyticsExtrasData = useMemo(() => getMockAnalyticsExtras(campaignId), [campaignId])
  const errorsData = useMemo(() => getMockErrorsData(campaignId), [campaignId])
  const smsOverviewData = useMemo(() => getMockSmsOverview(campaignId), [campaignId])

  // Utility functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isCallInProgress = (call: any) => {
    return call.status === 'In Progress' || call.status === 'Connected'
  }

  // Event handlers
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    const newUrl = buildUrlWithParams(`/results/${campaignId}`, { tab })
    router.replace(newUrl, { scroll: false })
  }

  const togglecampaignStatus = () => {
    setCampaignRunning(!campaignRunning)
  }
  
  // Handler to update conversation data after status change
  const handleUpdateConversationData = (updatedData: any) => {
    setConversationData(updatedData)
  }
  
  // Handler to refresh table data and conversation data after status change
  const handleRefreshTableData = async () => {
    // Increment refresh trigger to refresh table data
    setRefreshTrigger(prev => prev + 1)

    if (campaignId) {
      const data = getMockCampaignConversationData(campaignId)
      setConversationData(data)
      setCampaignRunning(data.campaignStatus.toLowerCase() === 'running')
      setAnalyticsData(getMockCampaignAnalytics(campaignId))
      setCompletedCallsData(getMockCampaignCompleted(campaignId))
    }
  }

  const handleCallSelect = (call: any) => {
    
    // Basic validation only
    if (!call || !call.id || !call.customer) {
      return
    }
    
    // Convert the table's CallRecord to the proper CallRecord type
    const convertedCall: CallRecord = {
      call_id: call.id,
      dealership_id: "dealership-001", // Default value
      started_at: new Date().toISOString(), // Mock timestamp
      ended_at: new Date(Date.now() + 180000).toISOString(), // 3 minutes later
      direction: "outbound",
      domain: call.callReason?.includes('service') || call.callReason?.includes('maintenance') ? "service" : "sales",
      campaign_id: campaignId,
      customer: {
        name: call.customer.name,
        phone: call.customer.phone,
        email: null
      },
      vehicle: {
        vin: null,
        stock_id: null,
        year: call.vehicleInfo?.year || 2023,
        make: call.vehicleInfo?.make || null,
        model: call.vehicleInfo?.model || null,
        trim: null,
        delivery_type: null
      },
      primary_intent: call.callReason?.replace(/_/g, ' ') || 'general inquiry',
      intents: [{
        label: call.callReason?.replace(/_/g, ' ') || 'general inquiry',
        confidence: 0.9
      }],
      outcome: call.outcome === "service_appointment" ? "Service Appointment Scheduled" :
               call.outcome === "test_drive" ? "Test Drive Scheduled" :
               call.outcome === "callback" ? "Callback Requested" :
               call.outcome === "not_interested" ? "Not Interested" :
               call.outcome === "information_provided" ? "Success" : "Success",
      appointment: call.outcome === "service_appointment" || call.outcome === "test_drive" ? {
        type: call.outcome === "service_appointment" ? "service" : "test_drive",
        starts_at: new Date(Date.now() + 86400000).toISOString(), // tomorrow
        ends_at: new Date(Date.now() + 90000000).toISOString(),
        location: "Main Dealership",
        advisor: call.agent.name,
        status: "scheduled"
      } : null,
      sentiment: {
        label: call.qualityScore >= 8 ? "positive" : call.qualityScore >= 6 ? "neutral" : "negative",
        score: call.qualityScore / 10
      },
      ai_score: call.qualityScore,
      containment: call.qualityScore >= 7,
      summary: `Call with ${call.customer.name} regarding ${call.callReason?.replace(/_/g, ' ')}.`,
      notes: "",
      report: {
        title: call.callReason?.includes('service') ? 
          `Service Appointment Booking: ${call.callReason?.replace(/_/g, ' ')} at ${campaignData?.campaign?.name || 'Dealership'}` :
          `${call.callReason?.replace(/_/g, ' ') || 'General Inquiry'}: ${call.vehicleInfo?.make || ''} ${call.vehicleInfo?.model || ''}`.trim(),
        summary: [
          `Customer called to schedule an ${call.callReason?.includes('service') ? 'oil change' : 'appointment'} appointment early morning this week.`,
          `Earliest appointment available is Monday at 8 AM; customer agrees to this slot.`,
          `Customer inquired about acceptance of competitor coupons and was informed they are accepted if valid.`,
          `Customer declined to provide email for confirmation.`,
          `Appointment confirmed for Monday at 8 AM with a promise of hot coffee available during visit.`
        ],
        queryResolved: call.outcome === "service_appointment" || call.outcome === "test_drive" ? "Yes" : "Partial",
        actionItems: call.outcome === "service_appointment" || call.outcome === "test_drive" ? 
          ["Send appointment confirmation", "Prepare service bay", "Order necessary parts"] : 
          ["Follow up with customer", "Schedule callback"],
        Outcome: call.outcome === "service_appointment" ? "Service Appointment Scheduled" :
                call.outcome === "test_drive" ? "Test Drive Scheduled" : "Information Provided"
      },
      follow_up: {
        needed: false,
        reason: null,
        due_at: null,
        assignee: null
      },
      metrics: {
        duration_sec: 180, // Mock 3 minutes
        hold_sec: 10,
        silence_sec: 15
      },
      recording_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav", // Mock audio URL for testing
      voice_recording_url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav", // Mock audio URL for testing
      transcript_url: null,
      transcript: [
        {
          speaker: "Agent",
          text: `Hello, this is ${campaignAgent?.name || 'Agent'} calling from ${campaignData?.campaign?.name || 'the dealership'}. May I speak with ${call.customer.name}?`,
          timestamp: 0,
          duration: 3
        },
        {
          speaker: "Customer",
          text: "Yes, this is " + call.customer.name,
          timestamp: 3,
          duration: 2
        },
        {
          speaker: "Agent",
          text: call.callReason?.includes('service') ? 
            "I'm calling about your vehicle's scheduled maintenance. Would you like to book a service appointment?" :
            "I'm calling regarding your interest in our vehicles. Would you like to schedule a test drive?",
          timestamp: 5,
          duration: 4
        },
        {
          speaker: "Customer",
          text: call.outcome === "service_appointment" || call.outcome === "test_drive" ? 
            "Yes, I'd be interested in scheduling that." :
            "I'm not sure right now, can you call me back later?",
          timestamp: 9,
          duration: 3
        }
      ],
      smsThread: [
        // Day 1
        {
          sender: 'agent' as const,
          text: `Hi ${call.customer.name}, this is ${campaignAgent?.name || 'Avery'} from ${campaignData?.campaign?.name || 'the dealership'}. We have some great options for you! Would you like to learn more?`,
          timestamp: '9:00 AM',
          status: 'Delivered' as const,
          day: 1,
          dateLabel: 'APR 9',
        },
        {
          sender: 'lead' as const,
          text: 'Hi! Yes, I was actually looking at the Silverado. Do you have any in stock?',
          timestamp: '9:47 AM',
          day: 1,
        },
        {
          sender: 'agent' as const,
          text: 'Absolutely! We have several Silverados available. Would you prefer a specific trim or color? I can check our current inventory for you.',
          timestamp: '9:48 AM',
          status: 'AI' as const,
          day: 1,
        },
        {
          sender: 'lead' as const,
          text: 'Looking for the LT trim in white or black. What kind of pricing are we talking?',
          timestamp: '10:15 AM',
          day: 1,
        },
        {
          sender: 'agent' as const,
          text: `Great taste! We have a 2024 Silverado LT in White currently available. I'd love to set up a time for you to come see it and take a test drive. Are you available this week?`,
          timestamp: '10:16 AM',
          status: 'Delivered' as const,
          day: 1,
        },
        // Day 2 — EOD banner + escalation
        {
          sender: 'agent' as const,
          text: `Hey ${call.customer.name}, just checking in on the Silverado. We have $3,500 in manufacturer incentives running this week! Want to hear more?`,
          timestamp: '2:00 PM',
          status: 'Delivered' as const,
          day: 2,
          dateLabel: 'APR 10',
          preBanner: { variant: 'eod' as const, text: 'EOD — No reply. Day 2 scheduled.' },
        },
        {
          sender: 'lead' as const,
          text: "Maybe. What's the promotion?",
          timestamp: '3:15 PM',
          day: 2,
        },
        {
          sender: 'agent' as const,
          text: "Great to hear from you! Right now there's $3,500 in manufacturer incentives on the Silverado LT. Want the full breakdown?",
          timestamp: '3:15 PM',
          status: 'AI' as const,
          day: 2,
        },
        {
          sender: 'lead' as const,
          text: "Yes. And I have a 2019 Accord I'd want to trade in.",
          timestamp: '3:22 PM',
          day: 2,
          preBanner: undefined,
        },
        {
          sender: 'agent' as const,
          text: "A trade-in is a great way to lower the cost! To give you the best numbers, let me give you a quick call — mind if I ring you now?",
          timestamp: '14:22',
          status: 'AI' as const,
          day: 2,
          preBanner: { variant: 'escalation' as const, text: 'Escalation triggered: pricing + trade_in detected' },
          voicemail: {
            startedAt: '3:24 PM',
            duration: '4m 12s',
            description: "Customer didn't answer; an automated trade-in voicemail was left.",
          },
        },
        {
          sender: 'agent' as const,
          text: "I just tried calling and left you a quick voicemail. I can also help over text with the trade-in estimate for your 2019 Accord, or we can schedule a better time to talk.",
          timestamp: '14:22',
          status: 'AI' as const,
          day: 2,
          preBanner: { variant: 'callAttempted' as const, text: 'Call attempted • Voicemail left' },
        },
        {
          sender: 'lead' as const,
          text: "Let's schedule the call for 9:30 PM .",
          timestamp: '14:20',
          day: 2,
        },
        {
          sender: 'agent' as const,
          text: "Sure, let me Schedule the Call for you 9:30 PM",
          timestamp: '14:22',
          status: 'AI' as const,
          day: 2,
          postCall: {
            duration: '4m 12s',
            outcome: 'Test drive booked for Apr 15, 3:00 PM',
            startedAt: '3:24 PM',
          },
        },
      ],
      tags: [call.callReason?.replace(/_/g, ' ') || 'general', call.outcome.replace(/_/g, ' ')]
    }
    
    setSelectedCall(convertedCall)
    setIsCallDetailsOpen(true)
    
    // Update URL to include selected call
    const newUrl = buildUrlWithParams(`/results/${campaignId}`, { 
      tab: activeTab,
      selectedCall: convertedCall.call_id || 'selected'
    })
    router.replace(newUrl, { scroll: false })
  }

  const handleCallDetailsTabChange = (tab: string) => {
    setCallDetailsTab(tab)
    // Update URL to include call details tab
    const newUrl = buildUrlWithParams(`/results/${campaignId}`, { 
      tab: activeTab,
      callDetailsTab: tab,
      selectedCall: selectedCall?.call_id || 'selected'
    })
    router.replace(newUrl, { scroll: false })
  }

  const handleCallDetailsClose = () => {
    lastCloseTimeRef.current = Date.now()
    setIsClosing(true)
    setIsCallDetailsOpen(false)
    setSelectedCall(null)
    
    // Add a temporary click blocker to the document
    const clickBlocker = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
    }
    
    document.addEventListener('click', clickBlocker, { capture: true })
    
    // Remove click blocker after a short delay
    setTimeout(() => {
      document.removeEventListener('click', clickBlocker, { capture: true })
    }, 100)
    
    // Remove call-related parameters from URL
    const newUrl = buildUrlWithParams(`/results/${campaignId}`, { tab: activeTab })
    router.replace(newUrl, { scroll: false })
    
    // Reset the closing flag after a longer delay to prevent immediate reopening
    setTimeout(() => {
      setIsClosing(false)
    }, 500)
  }

  // Helper functions for BlankCallDrawer
  const getAgentDetails = (callId: string) => {
    return {
      name: campaignAgent?.name || "Agent",
      avatar: "/placeholder-user.jpg"
    }
  }

  const getCallSummary = (call: CallRecord) => {
    return call.summary || `Call with ${call.customer.name} regarding ${call.primary_intent}.`
  }

  const getVehicleInfo = (call: CallRecord) => {
    if (call.vehicle.make && call.vehicle.year) {
      return `${call.vehicle.year} ${call.vehicle.make} ${call.vehicle.model || ''}`.trim()
    }
    return null
  }

  const getNextAction = (call: CallRecord) => {
    if (call.follow_up.needed) {
      return call.follow_up.reason || "Follow-up required"
    }
    if (call.appointment?.status === "scheduled") {
      return `${call.appointment.type === "service" ? "Service" : "Test Drive"} appointment scheduled`
    }
    return "No further action required"
  }

  const getPotentialRevenue = (call: CallRecord) => {
    // Mock revenue calculation based on outcome
    if (call.outcome.includes("Purchase") || call.outcome.includes("Sale")) {
      return 25000
    }
    if (call.outcome.includes("Service") || call.outcome.includes("Appointment")) {
      return 500
    }
    return 0
  }

  const formatRevenue = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getTimeAgo = (call: CallRecord) => {
    const now = new Date()
    const callTime = new Date(call.started_at)
    const diffInMinutes = Math.floor((now.getTime() - callTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const getCallTitle = (call: CallRecord) => {
    if (call.appointment?.type === "service") {
      return `Service Appointment: ${call.primary_intent}`
    }
    if (call.appointment?.type === "test_drive") {
      return `Test Drive: ${call.vehicle.make} ${call.vehicle.model}`
    }
    return `${call.primary_intent.charAt(0).toUpperCase() + call.primary_intent.slice(1)}`
  }

  const handlePlayStateChange = (call: CallRecord, playing: boolean) => {
    setIsPlaying(playing)
  }

  // Handle body scroll when drawer state changes
  useEffect(() => {
    if (isCallDetailsOpen) {
      // Store original overflow values
      const originalBodyOverflow = document.body.style.overflow
      const originalHtmlOverflow = document.documentElement.style.overflow
      
      // Prevent body scroll when drawer opens
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      
      // Return cleanup function that restores original values
      return () => {
        document.body.style.overflow = originalBodyOverflow || ''
        document.documentElement.style.overflow = originalHtmlOverflow || ''
      }
    } else {
      // Ensure scroll is restored when drawer is closed
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      
      // Force a reflow to ensure the style change takes effect
      document.body.offsetHeight
      
      // Additional restoration with timeout to ensure it happens after other JS
      setTimeout(() => {
        document.body.style.overflow = ''
        document.documentElement.style.overflow = ''
      }, 100)
    }
  }, [isCallDetailsOpen])

  // Effects
  useEffect(() => {
    // Restore tab from URL parameters if present, otherwise default to overview.
    if (urlParams.tab === 'live-calls') {
      setActiveTab('overview')
    } else if (urlParams.tab && allowedTabs.includes(urlParams.tab as (typeof allowedTabs)[number])) {
      setActiveTab(urlParams.tab)
    } else {
      setActiveTab('overview')
    }
  }, [urlParams.tab])

  // Debug logging for drawer state
  useEffect(() => {
    
  }, [selectedCall, isCallDetailsOpen])

  // Note: Removed body scroll disabling to allow continuous scrolling with drawer open


  useEffect(() => {
    // Restore call details state from URL parameters if present
    if (urlParams.callDetailsTab && ['highlights', 'transcript', 'notes'].includes(urlParams.callDetailsTab)) {
      setCallDetailsTab(urlParams.callDetailsTab)
    }
    if (urlParams.selectedCall) {
      // In a real app, you would fetch the call details by ID
      // For now, we'll just set the call details open state
      setIsCallDetailsOpen(true)
    }
  }, [urlParams.callDetailsTab, urlParams.selectedCall])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const campaignResponse = getMockCampaignDetails(campaignId)
        const typesResponse = getMockCampaignTypes()
        const conversationResponse = getMockCampaignConversationData(campaignId)

        setCampaignData(campaignResponse)
        setCampaignTypes(typesResponse)
        setConversationData(conversationResponse)
        setCampaignRunning(conversationResponse.campaignStatus.toLowerCase() === 'running')
      } catch (error) {
        console.error('Error in fetchData:', error)
        setError('Failed to load campaign details. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    if (campaignId) {
      fetchData()
    } else {
      setError('No campaign ID provided.')
    }
  }, [campaignId])

  useEffect(() => {
    const fetchAgent = async () => {
      if (campaignData?.campaign) {
        try {
          setIsLoadingAgent(true)
          const agentResponse = getMockAgents()
          const targetAgentId = campaignData.campaign.teamAgentMappingId
          const agent =
            agentResponse.find(
              (item) => item.id === targetAgentId || item.agentId === targetAgentId,
            ) || agentResponse[0] || null
          setCampaignAgent(agent)
        } catch (error) {
          console.warn('Failed to fetch agent details, using fallback:', error)
          
        } finally {
          setIsLoadingAgent(false)
        }
      }
    }

    fetchAgent()
  }, [campaignData?.campaign])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (selectedCall && isCallInProgress(selectedCall)) {
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [selectedCall])


  // Handle Escape key to close drawer
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCallDetailsOpen) {
        handleCallDetailsClose()
      }
    }

    if (isCallDetailsOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isCallDetailsOpen])

  // Loading state
  if (isLoading) {
    return <CampaignPageShimmer />
  }

  // Error state
  if (error || !campaignData) {
    return (
      <div className="min-h-screen overflow-auto" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <div className="px-12 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Link href={buildUrlWithParams("/results")} className="flex items-center text-[#6B7280] hover:text-[#1A1A1A] transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-[20px] font-semibold text-[#1A1A1A]">Campaign Details</h1>
          </div>
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-text-secondary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Unable to Load Campaign</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
                </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-auto" style={{ backgroundColor: 'hsl(var(--background))' }} data-campaign-container>
      <CampaignHeader
        campaignData={campaignData}
        conversationData={conversationData}
        campaignId={campaignId}
        isSalesCampaign={isSalesCampaign}
        isServiceCampaign={isServiceCampaign}
        isCallDetailsOpen={isCallDetailsOpen}
        activeTab={activeTab}
        campaignRunning={campaignRunning}
        campaignAgent={campaignAgent}
        isLoadingAgent={isLoadingAgent}
        deployedAgents={deployedAgents}
        analyticsData={analyticsData}
        onTabChange={handleTabChange}
        onTogglecampaignStatus={togglecampaignStatus}
        onUpdateConversationData={handleUpdateConversationData}
        onRefreshTableData={handleRefreshTableData}
      />

      {(isSalesCampaign || isServiceCampaign) ? (
        <div className="px-12 pt-4">
          <div className="flex items-center border-b border-gray-200">
            <button
              onClick={() => handleTabChange('overview')}
              className={`px-4 py-3 text-base border-b-2 transition-all duration-200 ${
                activeTab === 'overview'
                  ? 'text-black font-semibold border-[#4600F2] bg-transparent'
                  : 'text-gray-500 font-normal border-transparent hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => handleTabChange('leads')}
              className={`px-4 py-3 text-base border-b-2 transition-all duration-200 ${
                activeTab === 'leads'
                  ? 'text-black font-semibold border-[#4600F2] bg-transparent'
                  : 'text-gray-500 font-normal border-transparent hover:text-gray-700'
              }`}
            >
              Leads
            </button>
            <button
              onClick={() => handleTabChange('analytics')}
              className={`px-4 py-3 text-base border-b-2 transition-all duration-200 ${
                activeTab === 'analytics'
                  ? 'text-black font-semibold border-[#4600F2] bg-transparent'
                  : 'text-gray-500 font-normal border-transparent hover:text-gray-700'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => handleTabChange('errors')}
              className={`px-4 py-3 text-base border-b-2 transition-all duration-200 ${
                activeTab === 'errors'
                  ? 'text-black font-semibold border-[#4600F2] bg-transparent'
                  : 'text-gray-500 font-normal border-transparent hover:text-gray-700'
              }`}
            >
              Errors
            </button>
            <button
              onClick={() => handleTabChange('settings')}
              className={`px-4 py-3 text-base border-b-2 transition-all duration-200 ${
                activeTab === 'settings'
                  ? 'text-black font-semibold border-[#4600F2] bg-transparent'
                  : 'text-gray-500 font-normal border-transparent hover:text-gray-700'
              }`}
            >
              Settings
            </button>
          </div>
        </div>
      ) : null}
      
      {/* Content Area with Tabs for Sales and Service Campaigns */}
      {(isSalesCampaign || isServiceCampaign) ? (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsContent value="overview" className="mt-0">
            <LiveCallsTab
              isCallDetailsOpen={isCallDetailsOpen}
              onCallSelect={handleCallSelect}
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              connectionFilter={connectionFilter}
              onPauseCampaign={() => setCampaignRunning(!campaignRunning)}
              campaignRunning={campaignRunning}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onToggleFilters={() => setShowFilters(!showFilters)}
              showFilters={showFilters}
              campaignId={campaignId}
              totalLeads={analyticsData?.overview?.totalLeads ?? analyticsData?.totalLeads ?? 0}
              campaignData={campaignData}
              isSalesCampaign={isSalesCampaign}
              analyticsData={analyticsData}
              campaignMetrics={campaignMetrics}
              authKey={urlParams.auth_key || undefined}
              refreshTrigger={refreshTrigger}
              smsData={smsOverviewData}
              onFunnelModeChange={setFunnelMode}
              extrasData={analyticsExtrasData}
            />
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <div className="px-12 py-6">
              <AnalyticsTab
                isServiceCampaign={isServiceCampaign}
                campaignData={campaignData}
                serviceStats={serviceStats}
                calculatedStats={calculatedStats}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                analyticsData={analyticsData}
                extrasData={analyticsExtrasData}
                mode="analytics"
                smsData={smsOverviewData}
              />
            </div>
          </TabsContent>

          <TabsContent value="leads" className="mt-0">
            <div className="px-12 py-6">
              <LeadsTab data={leadsData} />
            </div>
          </TabsContent>

          <TabsContent value="errors" className="mt-0">
            <div className="px-12 py-6">
              <ErrorsTab data={errorsData} />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <div className="px-12 py-6">
              <SettingsTab
                campaignId={campaignId}
                campaignName={campaignData?.campaign?.name || 'Campaign'}
              />
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        // Non-Sales/Service campaigns - show simple completion message
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Campaign Complete</h2>
            <p className="text-muted-foreground mb-6">
              This {mappedCampaignType.toLowerCase()} campaign has finished running. 
              {campaignData?.campaign?.totalCallPlaced || 0} calls were made with {campaignData?.campaign?.appointmentScheduled || 0} appointments scheduled.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => router.push('/results')}>
                Back to Campaigns
                  </Button>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Export Results
                            </Button>
                          </div>
        </CardContent>
      </Card>
      )}

      {/* Custom Modal Implementation */}
      {isCallDetailsOpen && selectedCall && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleCallDetailsClose()
            }}
          />
          
          {/* Modal Content */}
          <div 
            className="fixed top-0 right-0 h-full w-full sm:max-w-xl bg-white shadow-2xl transform transition-all duration-300 ease-out overflow-hidden"
            style={{ maxWidth: '34rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <ApiCallDrawer
              call={selectedCall}
              open={isCallDetailsOpen}
              onClose={handleCallDetailsClose}
              onPlayStateChange={handlePlayStateChange}
              isPlaying={isPlaying}
              audioRef={audioRef}
              autoStartPlayback={false}
              hideTranscript={true}
            />
          </div>
        </div>
      )}
      
      
      <Toaster />
    </div>  
  )
}
