'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Toaster } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Search, Phone, CheckCircle, Clock, AlertCircle, Calendar, BarChart3, TrendingUp, Users, ArrowLeft, RefreshCw, Loader2, Target, Timer, Check, X, Activity, AlertTriangle, PieChart, Zap } from 'lucide-react'
import Link from "next/link"
import { fetchCampaignDetails, type CampaignDetailResponse, type CallDetail } from '@/lib/campaign-api'
import { fetchAgentList, type Agent } from '@/lib/agent-api'
import { calculateAndFormatEstimatedTime, getShortEstimatedTime } from '@/lib/time-utils'
import { generateCallStatus, generateCallTime, generateCallDuration, calculateCampaignStats } from '@/lib/call-status-utils'
import { buildUrlWithParams } from '@/lib/url-utils'

// Map API campaign type to display format
const mapCampaignType = (campaignType: string): string => {
  if (campaignType === 'recall') return 'Service'
  return campaignType // 'Sales', 'Service', etc.
}

// Generate realistic call quality rating (1-10)
const generateCallQuality = (index: number, status: string): number => {
  // Seed random based on index for consistent results
  const seed = (index * 7 + 13) % 100;
  
  // Higher quality for successful calls
  if (status === 'Connected') {
    // 70% chance of 7-10, 30% chance of 4-6
    return seed < 70 ? Math.floor(7 + (seed % 4)) : Math.floor(4 + (seed % 3));
  } else if (status === 'Voice Mail') {
    // 50% chance of 5-8, 50% chance of 2-4
    return seed < 50 ? Math.floor(5 + (seed % 4)) : Math.floor(2 + (seed % 3));
  } else {
    // Failed calls: mostly 1-5
    return Math.floor(1 + (seed % 5));
  }
};

// Map call details to display format for table with realistic call statuses
const formatCallDetailsForTable = (callDetails: CallDetail[], campaignStartDate: string) => {
  return callDetails.map((call, index) => {
    // Generate realistic call status based on requirements:
    // 60% Connected, 20% Voice Mail, 20% Failed
    // Only Connected calls can have appointments
    const statusResult = generateCallStatus(index, callDetails.length);
    const callTime = generateCallTime(index, campaignStartDate);
    const duration = generateCallDuration(index, statusResult.status);
    const callQuality = generateCallQuality(index, statusResult.status);

    return {
      id: index + 1,
      customer: call.customerName,
      phone: call.customerNumber,
      vin: call.vin,
      make: call.vehicleMake,
      model: call.vehicleModel,
      year: call.vehicleYear,
      vehicle: call.vehicle,
      recallDescription: call.recallDescription,
      symptom: call.symptom,
      riskDetails: call.riskDetails,
      remedySteps: call.remedySteps,
      partsAvailable: call.partsAvailabilityFlag ? 'Yes' : 'No',
      loanerEligible: call.loanerEligibility ? 'Yes' : 'No',
      // Use calculated status data
      status: statusResult.status,
      outcome: statusResult.outcome,
      appointment: statusResult.appointment,
      callTime: callTime,
      duration: duration,
      callQuality: callQuality
    }
  })
}

const statusColors: Record<string, string> = {
  Connected: 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]',
  'Voice Mail': 'bg-[#FCE7F3] text-[#EC4899] border-[#F9A8D4]',
  Failed: 'bg-[#EF4444] text-white border-[#EF4444]'
}

const outcomeColors: Record<string, string> = {
  Success: 'bg-[#22C55E] text-white border-[#22C55E]',
  'Callback Requested': 'bg-[#3B82F6] text-white border-[#3B82F6]',
  'Not Interested': 'bg-[#6B7280] text-white border-[#6B7280]',
  'Wrong Number': 'bg-[#EF4444] text-white border-[#EF4444]',
  'No Answer': 'bg-[#F59E0B] text-white border-[#F59E0B]'
}

// Call Quality Donut Chart Component
const CallQualityChart = ({ rating }: { rating: number }) => {
  const getQualityColor = (rating: number): string => {
    if (rating >= 8) return '#22C55E'; // Green
    if (rating >= 6) return '#F59E0B'; // Yellow
    if (rating >= 4) return '#FB923C'; // Orange
    return '#EF4444'; // Red
  };

  const getQualityLabel = (rating: number): string => {
    if (rating >= 8) return 'Excellent';
    if (rating >= 6) return 'Good';
    if (rating >= 4) return 'Fair';
    return 'Poor';
  };

  const percentage = (rating / 10) * 100;
  const strokeDasharray = 2 * Math.PI * 16; // circumference of circle with radius 16
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;
  const color = getQualityColor(rating);

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 40 40">
          {/* Background circle */}
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="3"
          />
          {/* Progress circle */}
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>
        {/* Rating number in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold" style={{ color }}>
            {rating}
          </span>
        </div>
      </div>
      <div className="text-xs">
        <div className="font-semibold text-[#1A1A1A]">{getQualityLabel(rating)}</div>
        <div className="text-[#6B7280]">{rating}/10</div>
      </div>
    </div>
  );
};

export default function CampaignDetail() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params?.id as string
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [outcomeFilter, setOutcomeFilter] = useState('all')
  const [campaignData, setCampaignData] = useState<CampaignDetailResponse | null>(null)
  const [callDetails, setCallDetails] = useState<Array<{
    id: number;
    customer: string;
    phone: string;
    vin: string;
    make: string;
    model: string;
    year: string;
    status: string;
    outcome: string;
    appointment: string;
    callTime: string;
    duration: string;
    callQuality: number;
    email?: string;
  }>>([])
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [campaignNotFound, setCampaignNotFound] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [campaignAgent, setCampaignAgent] = useState<Agent | null>(null)
  const [isLoadingAgent, setIsLoadingAgent] = useState(false)
  const [activeTab, setActiveTab] = useState('analytics')
  
  // Live feed state
  const [callTimer, setCallTimer] = useState(154) // seconds for current call
  const [newCallAnimation, setNewCallAnimation] = useState(false)

  // Calculate realistic campaign stats based on call status logic
  const calculatedStats = campaignData ? calculateCampaignStats(campaignData.campaign.totalCustomers) : null
  
  // Check if this is a sales campaign to show enhanced tabs
  const isSalesCampaign = campaignData?.campaign.campaignType === 'Sales'

  // Load campaign data when component mounts or campaignId changes
  useEffect(() => {
    const loadCampaignData = async () => {
      if (!campaignId) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        console.log('Fetching campaign details for:', campaignId)
        const response = await fetchCampaignDetails(campaignId)
        
        if (response.success) {
          setCampaignData(response)
          const formattedCallDetails = formatCallDetailsForTable(response.callDetails, response.campaign.startDate)
          setCallDetails(formattedCallDetails)
          setCampaignNotFound(false)
          console.log('Loaded campaign details:', response)

          // Fetch agent data for the campaign
          try {
            setIsLoadingAgent(true)
            const agents = await fetchAgentList('default-enterprise', 'default-team')
            if (agents.length > 0) {
              // For now, use the first available agent since we don't have agent mapping
              // In a real scenario, you'd match by teamAgentMappingId
              const agent = agents.find((agent: Agent) => agent.available) || agents[0]
              setCampaignAgent(agent)
            }
          } catch (agentError) {
            console.error('Error fetching agent data:', agentError)
            // Don't fail the whole page if agent fetch fails
          } finally {
            setIsLoadingAgent(false)
          }
        } else {
          throw new Error('Failed to fetch campaign details')
        }
      } catch (error) {
        console.error('Error loading campaign:', error)
        setError(error instanceof Error ? error.message : 'Failed to load campaign')
        setCampaignNotFound(true)
        setCampaignData(null)
        setCallDetails([])
      } finally {
        setIsLoading(false)
      }
    }

    loadCampaignData()
  }, [campaignId])

  // Auto-refresh logic removed since API data doesn't change in real-time
  // For completed campaigns, we don't need to refresh
  
  const filteredCalls = callDetails.filter(call => {
    const matchesSearch = call.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         call.phone.includes(searchTerm) ||
                         call.vin.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || call.status.toLowerCase().replace(' ', '-') === statusFilter
    const matchesOutcome = outcomeFilter === 'all' || call.outcome.toLowerCase() === outcomeFilter
    
    return matchesSearch && matchesStatus && matchesOutcome
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredCalls.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPageCalls = filteredCalls.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, outcomeFilter])

  // Live call timer effect
  useEffect(() => {
    if (activeTab === 'live-activity') {
      const timer = setInterval(() => {
        setCallTimer(prev => prev + 1)
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [activeTab])

  // Simulate new calls appearing
  useEffect(() => {
    if (activeTab === 'live-activity') {
      const newCallInterval = setInterval(() => {
        setNewCallAnimation(true)
        setTimeout(() => setNewCallAnimation(false), 500)
      }, 8000) // New call every 8 seconds

      return () => clearInterval(newCallInterval)
    }
  }, [activeTab])

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Format timer display (seconds to MM:SS)
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleRefresh = async () => {
    if (!campaignId) return
    
    try {
      setError(null)
      const response = await fetchCampaignDetails(campaignId)
      
      if (response.success) {
        setCampaignData(response)
        const formattedCallDetails = formatCallDetailsForTable(response.callDetails, response.campaign.startDate)
        setCallDetails(formattedCallDetails)
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error('Error refreshing campaign:', error)
      setError(error instanceof Error ? error.message : 'Failed to refresh campaign')
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <div className="px-12 py-8 bg-[#F4F5F8] min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-body text-text-secondary">Loading campaign data...</p>
          </div>
        </div>
        <Toaster />
      </div>
    )
  }

  // Campaign not found state
  if (campaignNotFound || !campaignData) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <div className="px-12 py-8 bg-[#F4F5F8] min-h-screen">
          <div className="mb-8">
            <Link href={buildUrlWithParams("/results")}>
              <Button variant="outline" size="sm" className="btn-secondary mb-4">
                <ArrowLeft className="icon-small mr-2" />
                Back to Campaigns
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-text-secondary" />
              </div>
              <h3 className="text-page-heading text-text-primary mb-3">Campaign Not Found</h3>
              <p className="text-body text-text-secondary mb-8 max-w-md mx-auto">
                The campaign you&apos;re looking for doesn&apos;t exist or may have been deleted.
              </p>
              <Link href={buildUrlWithParams("/results")}>
                <Button className="btn-primary">
                  View All Campaigns
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Toaster />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <div className="px-12 py-8 bg-[#F4F5F8] min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <Link href={buildUrlWithParams("/results")} className="flex items-center text-[#6B7280] hover:text-[#1A1A1A] transition-colors">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-[20px] font-semibold text-[#1A1A1A] leading-[1.4]">Campaign Details - {campaignData.campaign.name}</h1>
              </div>
              <p className="text-[14px] text-[#6B7280] leading-[1.5] ml-9">View comprehensive campaign performance metrics and detailed call results</p>
              
              {/* Tabs for Sales Campaigns */}
              {isSalesCampaign && (
                <div className="mt-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="h-auto p-0 bg-transparent border-b border-gray-200 rounded-none justify-start w-full">
                      <TabsTrigger 
                        value="analytics" 
                        className="flex items-center gap-2 py-3 text-base font-medium bg-transparent border-0 rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#4600F2] data-[state=active]:border-b-2 data-[state=active]:border-[#4600F2] data-[state=active]:font-semibold text-gray-500 hover:text-gray-700 transition-colors mr-10"
                      >
                        Analytics
                      </TabsTrigger>
                      <TabsTrigger 
                        value="live-activity" 
                        className="flex items-center gap-2 py-3 text-base font-medium bg-transparent border-0 rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#4600F2] data-[state=active]:border-b-2 data-[state=active]:border-[#4600F2] data-[state=active]:font-semibold text-gray-500 hover:text-gray-700 transition-colors mr-10"
                      >
                        Live Activity
                      </TabsTrigger>
                      <TabsTrigger 
                        value="call-details" 
                        className="flex items-center gap-2 py-3 text-base font-medium bg-transparent border-0 rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#4600F2] data-[state=active]:border-b-2 data-[state=active]:border-[#4600F2] data-[state=active]:font-semibold text-gray-500 hover:text-gray-700 transition-colors mr-10"
                      >
                        Call Details
                      </TabsTrigger>
                      <TabsTrigger 
                        value="error-centre" 
                        className="flex items-center gap-2 py-3 text-base font-medium bg-transparent border-0 rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#4600F2] data-[state=active]:border-b-2 data-[state=active]:border-[#4600F2] data-[state=active]:font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Error Centre
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              )}
            </div>
            
            {/* Campaign Progress */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <div className="text-[12px] font-medium text-[#6B7280] mb-1">Campaign Progress</div>
                <div className="text-[16px] font-bold text-[#1A1A1A]">
                  {campaignData ? Math.round((campaignData.campaign.totalCallPlaced / campaignData.campaign.totalCustomers) * 100) : 0}%
                </div>
              </div>
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
                  {/* Background circle */}
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="#F3F4F6"
                    strokeWidth="4"
                  />
                  {/* Progress circle with animation */}
                  {campaignData && (
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke={Math.round((campaignData.campaign.totalCallPlaced / campaignData.campaign.totalCustomers) * 100) === 100 ? "#22C55E" : "#4600F2"}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 20}
                      strokeDashoffset={2 * Math.PI * 20}
                      className="transition-all duration-1000 ease-out"
                      style={{
                        animation: 'progressFill 1.5s ease-out forwards',
                        strokeDashoffset: 2 * Math.PI * 20 * (1 - (campaignData.campaign.totalCallPlaced / campaignData.campaign.totalCustomers))
                      }}
                    />
                  )}
                </svg>
                {/* Agent avatar in center with loading states */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {isLoadingAgent ? (
                    // Skeleton loading state
                    <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse border-2 border-[#E5E7EB]"></div>
                  ) : (
                    <div className={`w-8 h-8 rounded-full overflow-hidden border-2 ${
                      campaignData && Math.round((campaignData.campaign.totalCallPlaced / campaignData.campaign.totalCustomers) * 100) === 100 
                        ? 'border-[#22C55E]' 
                        : 'border-[#4600F2]'
                    }`}>
                      <img 
                        src={campaignAgent?.imageUrl || '/placeholder-user.jpg'} 
                        alt={campaignAgent?.name || 'AI Agent'} 
                        className="w-full h-full object-cover object-[50%_20%]"
                        onError={(e) => {
                          // Fallback to default avatar if image fails to load
                          e.currentTarget.src = '/placeholder-user.jpg'
                        }}
                      />
                    </div>
                  )}
                </div>
                
                {/* Add custom CSS for the progress animation */}
                {campaignData && (
                  <style jsx>{`
                    @keyframes progressFill {
                      0% {
                        stroke-dashoffset: ${2 * Math.PI * 20};
                      }
                      100% {
                        stroke-dashoffset: ${2 * Math.PI * 20 * (1 - (campaignData.campaign.totalCallPlaced / campaignData.campaign.totalCustomers))};
                      }
                    }
                  `}</style>
                )}
              </div>
            </div>
          </div>
        </div>





        {/* Content Area with Tabs for Sales Campaigns */}
        {isSalesCampaign ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Call Details Tab */}
            <TabsContent value="call-details" className="mt-0">
              <Card className="border-0 bg-white rounded-[16px]">
                <CardHeader className="px-6 pt-6 pb-4">
                  <div className="flex justify-between items-center">
                    <div>
              <CardTitle className="text-[16px] font-semibold text-[#1A1A1A]">
                        Call Details
              </CardTitle>
                    </div>
                  </div>
            </CardHeader>
                <CardContent className="px-6 pb-6 pt-2">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-3">
              <div className="w-full sm:w-80">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                  <Input
                    placeholder="Search by customer, phone, or VIN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-10 text-sm border-[#E5E7EB] rounded-md focus:border-[#4600F2] focus:ring-[#4600F2] bg-white"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40 h-10 border-[#E5E7EB] rounded-md focus:border-[#4600F2] focus:ring-[#4600F2] bg-white">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="connected">Connected</SelectItem>
                    <SelectItem value="voicemail">Voicemail</SelectItem>
                    <SelectItem value="no-answer">No Answer</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                  <SelectTrigger className="w-full sm:w-40 h-10 border-[#E5E7EB] rounded-md focus:border-[#4600F2] focus:ring-[#4600F2] bg-white">
                    <SelectValue placeholder="All Outcomes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Outcomes</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failure">Failure</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="relative border border-[#E5E7EB] rounded-lg overflow-hidden">
              {/* Horizontal scroll indicator - left */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white/80 to-transparent z-10 pointer-events-none opacity-0 transition-opacity duration-200" id="scroll-indicator-left"></div>
              
              {/* Horizontal scroll indicator - right */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/80 to-transparent z-10 pointer-events-none opacity-100 transition-opacity duration-200" id="scroll-indicator-right"></div>
              
              {/* Scrollable table container */}
              <div 
                className="overflow-auto max-h-[600px]" 
                style={{ maxHeight: 'calc(100vh - 400px)' }}
                onScroll={(e) => {
                  const target = e.target as HTMLDivElement;
                  const leftIndicator = document.getElementById('scroll-indicator-left');
                  const rightIndicator = document.getElementById('scroll-indicator-right');
                  
                  if (leftIndicator && rightIndicator) {
                    // Show/hide left indicator
                    leftIndicator.style.opacity = target.scrollLeft > 0 ? '1' : '0';
                    
                    // Show/hide right indicator
                    const isScrolledToRight = target.scrollLeft >= (target.scrollWidth - target.clientWidth - 1);
                    rightIndicator.style.opacity = isScrolledToRight ? '0' : '1';
                  }
                }}
              >
                <Table>
                  <TableHeader className="sticky top-0 z-20">
                    <TableRow className="bg-[#F4F5F8] h-10">
                      <TableHead className="font-semibold text-[#1A1A1A] text-xs min-w-[200px] sticky left-0 bg-[#F4F5F8] z-30 py-2 px-3">Customer Info</TableHead>
                      <TableHead className="font-semibold text-[#1A1A1A] text-xs min-w-[180px] py-2 px-3">Vehicle & VIN</TableHead>
                      <TableHead className="font-semibold text-[#1A1A1A] text-xs min-w-[100px] py-2 px-3">Status</TableHead>
                      <TableHead className="font-semibold text-[#1A1A1A] text-xs min-w-[120px] py-2 px-3">Outcome</TableHead>
                      <TableHead className="font-semibold text-[#1A1A1A] text-xs min-w-[100px] py-2 px-3">Appointment</TableHead>
                      <TableHead className="font-semibold text-[#1A1A1A] text-xs min-w-[150px] py-2 px-3">Call Time & Duration</TableHead>
                      <TableHead className="font-semibold text-[#1A1A1A] text-xs min-w-[140px] py-2 px-3">Call Quality</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPageCalls.map((call) => (
                      <TableRow key={call.id} className="hover:bg-[#F4F5F8] border-b border-[#E5E7EB]">
                        <TableCell className="text-sm min-w-[200px] sticky left-0 bg-white z-10">
                          <div className="space-y-1">
                            <div className="font-bold text-[#1A1A1A]">{call.customer}</div>
                            <div className="text-[#6B7280]">{call.phone}</div>
                            {call.email && <div className="text-[#6B7280]">{call.email}</div>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm min-w-[180px]">
                          <div className="space-y-1">
                            <div className="text-[#1A1A1A] font-medium">{call.year} {call.make} {call.model}</div>
                            <div className="font-mono text-xs text-[#6B7280]">{call.vin}</div>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[100px]">
                          <div className={`${statusColors[call.status]} border font-medium rounded-full text-xs px-2 py-1 inline-block`}>
                            {call.status}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[120px]">
                          <span className="text-[#1A1A1A] text-sm font-bold">
                            {call.outcome}
                          </span>
                        </TableCell>
                        <TableCell className="min-w-[100px]">
                          {call.appointment === 'Yes' ? (
                            <div className="flex items-center gap-1 text-[#22C55E] font-bold text-sm">
                              <Check className="h-4 w-4" />
                              <span>Yes</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[#6B7280] text-sm">
                              <X className="h-4 w-4" />
                              <span>No</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm min-w-[150px]">
                          <div className="space-y-1">
                            <div className="text-[#1A1A1A]">{formatDate(call.callTime)}</div>
                            <div className="flex items-center gap-1 text-[#6B7280]">
                              <Clock className="h-3 w-3" />
                              <span className="font-mono text-xs">{call.duration}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[140px]">
                          <CallQualityChart rating={call.callQuality} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              

            </div>
            
            {/* Table info with pagination */}
            {filteredCalls.length > 0 && (
              <div className="flex justify-between items-center mt-4 text-sm text-[#6B7280]">
                <div>
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredCalls.length)} of {filteredCalls.length} calls
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="h-8 px-3 text-xs"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          // Show first page, last page, current page, and pages around current
                          return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                        })
                        .map((page, index, array) => {
                          const prevPage = array[index - 1]
                          return (
                            <div key={page} className="flex items-center">
                              {prevPage && page - prevPage > 1 && (
                                <span className="px-2 text-[#6B7280]">...</span>
                              )}
                              <Button
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className={`h-8 w-8 p-0 text-xs ${
                                  currentPage === page 
                                    ? "bg-[#4600F2] text-white border-[#4600F2]" 
                                    : "text-[#6B7280] border-[#E5E7EB]"
                                }`}
                              >
                                {page}
                              </Button>
                            </div>
                          )
                        })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="h-8 px-3 text-xs"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}

            {filteredCalls.length === 0 && (
              <div className="text-center py-16">
                <div className="text-[#6B7280] mb-6">
                  <Search className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-[20px] font-semibold text-[#1A1A1A] leading-[1.4] mb-3">No calls found</h3>
                <p className="text-[#6B7280] text-sm leading-[1.5]">
                  Try adjusting your search or filters to see more results
                </p>
              </div>
                            )}
                </CardContent>
              </Card>
            </TabsContent>
                
                        {/* Error Centre Tab */}
            <TabsContent value="error-centre" className="mt-0">
              {/* Key Metrics Section */}
              <div className="mb-6">
                <h2 className="text-[18px] font-semibold text-[#1A1A1A] mb-4">Key Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <Card className="border-0 bg-white rounded-[12px] shadow-sm border border-black/10">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-4">Total Errors</h3>
                          <p className="text-[#EF4444] text-[24px] font-bold leading-[1.4] mb-1">90</p>
                          <p className="text-[#6B7280] text-xs">Last 24 hours</p>
                        </div>
                        <div className="p-2 bg-[#FEF2F2] rounded-[8px] flex-shrink-0">
                          <AlertTriangle className="h-4 w-4 text-[#EF4444]" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 bg-white rounded-[12px] shadow-sm border border-black/10">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-4">Invalid Numbers</h3>
                          <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4] mb-1">47</p>
                          <p className="text-[#6B7280] text-xs">Disconnected/Invalid</p>
                        </div>
                        <div className="p-2 bg-[#F0F4FF] rounded-[8px] flex-shrink-0">
                          <X className="h-4 w-4 text-[#6366F1]" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 bg-white rounded-[12px] shadow-sm border border-black/10">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-4">DNC Blocks</h3>
                          <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4] mb-1">23</p>
                          <p className="text-[#6B7280] text-xs">Do Not Call list</p>
                        </div>
                        <div className="p-2 bg-[#F0FDF4] rounded-[8px] flex-shrink-0">
                          <div className="w-4 h-4 rounded-full border-2 border-[#22C55E]"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 bg-white rounded-[12px] shadow-sm border border-black/10">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-4">Rate Limits</h3>
                          <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4] mb-1">12</p>
                          <p className="text-[#6B7280] text-xs">API throttling</p>
                        </div>
                        <div className="p-2 bg-[#FEFCE8] rounded-[8px] flex-shrink-0">
                          <Zap className="h-4 w-4 text-[#F59E0B]" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 bg-white rounded-[12px] shadow-sm border border-black/10">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-4">Integration</h3>
                          <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4] mb-1">8</p>
                          <p className="text-[#6B7280] text-xs">Service issues</p>
                        </div>
                        <div className="p-2 bg-[#F8FAFC] rounded-[8px] flex-shrink-0">
                          <div className="w-4 h-4 flex items-center justify-center">
                            <div className="w-2 h-2 bg-[#6B7280] rounded-sm"></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Card className="border-0 bg-white rounded-[16px]">
                <CardContent className="px-6 pb-6 pt-6">
                  <div className="space-y-6">
                    
                    {/* Active Alerts */}
                    <div>
                      <h3 className="text-[18px] font-semibold text-[#1A1A1A] mb-4">Active Alerts</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-4 border border-red-200 rounded-[12px] bg-red-50">
                          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-semibold text-red-800 mb-1">High Error Rate Detected:</p>
                            <p className="text-sm text-red-700">Voice API error rate has exceeded 5% in the last hour. Consider reducing call volume or checking telephony provider status.</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-4 border border-yellow-200 rounded-[12px] bg-yellow-50">
                          <Zap className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-semibold text-yellow-800 mb-1">Rate Limit Warning:</p>
                            <p className="text-sm text-yellow-700">SMS gateway approaching rate limit (85% capacity). Consider spreading SMS sends over a longer time period.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Error Category Tabs */}
                    <div>
                      <div className="flex gap-4 mb-4">
                        <Button variant="outline" size="sm" className="bg-white border-[#E5E7EB]">
                          <X className="h-4 w-4 mr-2" />
                          Invalid Numbers
                        </Button>
                        <Button variant="outline" size="sm" className="bg-white border-[#E5E7EB]">
                          <div className="w-4 h-4 rounded-full border-2 border-current mr-2"></div>
                          DNC Blocks
                        </Button>
                        <Button variant="outline" size="sm" className="bg-white border-[#E5E7EB]">
                          <Zap className="h-4 w-4 mr-2" />
                          Rate Limits
                        </Button>
                        <Button variant="outline" size="sm" className="bg-white border-[#E5E7EB]">
                          <div className="w-4 h-4 flex items-center justify-center mr-2">
                            <div className="w-2 h-2 bg-current rounded-sm"></div>
                          </div>
                          Integrations
                        </Button>
                      </div>
                    </div>
                    
                    {/* Error Details */}
                    <Card className="border-0 bg-white rounded-[12px] shadow-sm border border-black/10">
                      <CardHeader className="px-6 pt-6 pb-4">
                        <CardTitle className="text-[16px] font-semibold text-[#1A1A1A]">Invalid Phone Numbers</CardTitle>
                        <p className="text-[14px] text-[#6B7280]">Numbers that could not be reached due to disconnection or invalid format</p>
                      </CardHeader>
                      <CardContent className="px-6 pb-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-[8px]">
                            <div className="flex items-center gap-3">
                              <X className="h-5 w-5 text-red-500" />
                              <div>
                                <p className="font-medium text-[#1A1A1A]">+1-555-0123</p>
                                <p className="text-sm text-[#6B7280]">Disconnected number</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-[#6B7280] flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                2024-01-15 14:23
                    </p>
                  </div>
                </div>
                
                          <div className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-[8px]">
                            <div className="flex items-center gap-3">
                              <X className="h-5 w-5 text-red-500" />
                              <div>
                                <p className="font-medium text-[#1A1A1A]">+1-555-0456</p>
                                <p className="text-sm text-[#6B7280]">Invalid format</p>
                  </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-[#6B7280] flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                2024-01-15 14:18
                    </p>
                  </div>
                </div>
                
                          <div className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-[8px]">
                            <div className="flex items-center gap-3">
                              <X className="h-5 w-5 text-red-500" />
                              <div>
                                <p className="font-medium text-[#1A1A1A]">+1-555-0789</p>
                                <p className="text-sm text-[#6B7280]">Number not in service</p>
                  </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-[#6B7280] flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                2024-01-15 14:12
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Live Activity Tab */}
            <TabsContent value="live-activity" className="mt-0">
              {/* Live Metrics at Top */}
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-[16px] border border-gray-200 p-4 text-center">
                  <p className="text-sm font-medium text-gray-600 mb-2">Active Calls</p>
                  <p className="text-3xl font-bold text-green-600">1</p>
                </div>
                <div className="bg-white rounded-[16px] border border-gray-200 p-4 text-center">
                  <p className="text-sm font-medium text-gray-600 mb-2">Calls/Hour</p>
                  <p className="text-3xl font-bold text-blue-600">47</p>
                </div>
                <div className="bg-white rounded-[16px] border border-gray-200 p-4 text-center">
                  <p className="text-sm font-medium text-gray-600 mb-2">Queue Length</p>
                  <p className="text-3xl font-bold text-purple-600">12</p>
                </div>
              </div>

              <Card className="border-0 bg-gray-50 rounded-[16px]">
                <CardHeader className="px-6 pt-6 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">
                      Live Activity Feed
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-600 font-medium">LIVE</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-2">
                  <div className="space-y-4" id="live-feed-container">
                    {/* Current Active Call */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">Sarah Johnson</h3>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                              <span className="text-sm text-red-600 font-medium">Live</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 mb-3">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="text-sm">+1-(555) 987-6543</span>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          Connected
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Duration: <span className="font-mono font-medium text-gray-900">{formatTimer(callTimer)}</span>
                      </div>
                    </div>

                    {/* Recent Calls with slide-in animation */}
                    <div className={`transform transition-all duration-500 ease-in-out translate-y-0 opacity-100 ${newCallAnimation ? 'animate-slideInFromTop' : ''}`}>
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-medium text-gray-900">John Smith</h3>
                              {newCallAnimation && (
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  <span className="text-sm text-blue-600 font-medium">New</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 mb-3">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span className="text-sm">+1-(555) 123-4567</span>
                            </div>
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            Connected
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Completed {newCallAnimation ? 'just now' : '1 min ago'} • Duration: 4:12 • Appointment Set
                        </div>
                      </div>
                    </div>

                    <div className="transform transition-all duration-500 ease-in-out translate-y-0 opacity-100">
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Mike Davis</h3>
                            <div className="flex items-center gap-2 text-gray-600 mb-3">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span className="text-sm">+1-(555) 456-7890</span>
                            </div>
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                            Voicemail Dropped
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Ended 2 min ago • Duration: 0:15 • Voicemail left
                        </div>
                      </div>
                    </div>

                    <div className="transform transition-all duration-500 ease-in-out translate-y-0 opacity-100">
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Emma Wilson</h3>
                            <div className="flex items-center gap-2 text-gray-600 mb-3">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span className="text-sm">+1-(555) 789-0123</span>
                            </div>
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Dialing
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Queued 30 sec ago • Position: #3 in queue
                        </div>
                      </div>
                    </div>

                    <div className="transform transition-all duration-500 ease-in-out translate-y-0 opacity-100">
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Robert Brown</h3>
                            <div className="flex items-center gap-2 text-gray-600 mb-3">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span className="text-sm">+1-(555) 321-9876</span>
                            </div>
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Failed
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Failed 3 min ago • Error: Line busy • Will retry in 5 min
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
                        {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-0">
              {/* Key Metrics and Campaign Details - Only in Analytics Tab */}
        <div className="grid grid-cols-5 gap-6 mb-8 items-stretch">
          {/* Metrics */}
          <Card className="border-0 bg-white rounded-[16px] h-full col-span-3">
            <CardHeader className="pb-4">
              <CardTitle className="text-[16px] font-semibold text-[#1A1A1A]">
                Key Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-start space-x-2 p-3 bg-white border border-black/10 rounded-[12px]">
                  <div className="p-2 bg-[#F0F4FF] rounded-[8px] flex-shrink-0">
                    <Phone className="h-4 w-4 text-[#4600F2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#1A1A1A]/60 font-semibold text-xs leading-[1.4] mb-1">Calls Placed</h3>
                    <p className="text-[#1A1A1A] text-[16px] font-bold leading-[1.4]">
                      {campaignData.campaign.totalCallPlaced}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2 p-3 bg-white border border-black/10 rounded-[12px]">
                  <div className="p-2 bg-[#F0FDF4] rounded-[8px] flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-[#22C55E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#1A1A1A]/60 font-semibold text-xs leading-[1.4] mb-1">Answer Rate</h3>
                    <p className="text-[#1A1A1A] text-[16px] font-bold leading-[1.4]">
                      {calculatedStats?.answerRate ?? campaignData.campaign.answerRate}%
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2 p-3 bg-white border border-black/10 rounded-[12px]">
                  <div className="p-2 bg-[#FEFCE8] rounded-[8px] flex-shrink-0">
                    <Calendar className="h-4 w-4 text-[#F59E0B]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#1A1A1A]/60 font-semibold text-xs leading-[1.4] mb-1">Appointments</h3>
                    <p className="text-[#1A1A1A] text-[16px] font-bold leading-[1.4]">
                      {calculatedStats?.appointmentCount ?? campaignData.campaign.appointmentScheduled}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2 p-3 bg-white border border-black/10 rounded-[12px]">
                  <div className="p-2 bg-[#EFF6FF] rounded-[8px] flex-shrink-0">
                    <BarChart3 className="h-4 w-4 text-[#3B82F6]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#1A1A1A]/60 font-semibold text-xs leading-[1.4] mb-1">Total Customers</h3>
                    <p className="text-[#1A1A1A] text-[16px] font-bold leading-[1.4]">
                      {campaignData.campaign.totalCustomers}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2 p-3 bg-white border border-black/10 rounded-[12px]">
                  <div className="p-2 bg-[#F0FDF4] rounded-[8px] flex-shrink-0">
                    <Target className="h-4 w-4 text-[#22C55E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#1A1A1A]/60 font-semibold text-xs leading-[1.4] mb-1">Success Rate</h3>
                    <p className="text-[#1A1A1A] text-[16px] font-bold leading-[1.4]">
                      {calculatedStats ? Math.round((calculatedStats.appointmentCount / campaignData.campaign.totalCallPlaced) * 100) : 0}%
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2 p-3 bg-white border border-black/10 rounded-[12px]">
                  <div className="p-2 bg-[#FDF2F8] rounded-[8px] flex-shrink-0">
                    <Timer className="h-4 w-4 text-[#EC4899]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#1A1A1A]/60 font-semibold text-xs leading-[1.4] mb-1">Avg Call Duration</h3>
                    <p className="text-[#1A1A1A] text-[16px] font-bold leading-[1.4]">
                      {calculatedStats?.avgCallDuration ?? '2:45'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Details */}
          <Card className="border-0 bg-white rounded-[16px] h-full col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-[16px] font-semibold text-[#1A1A1A]">
                Campaign Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 py-2 border-b border-[#F4F5F8]">
                  <div>
                    <span className="text-sm text-[#6B7280] font-semibold block mb-1">Campaign ID</span>
                    <span className="text-sm font-bold font-mono text-[#1A1A1A]">{campaignData.campaign.campaignId.substring(0, 12)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-[#6B7280] font-semibold block mb-1">Total Records</span>
                    <span className="text-sm font-bold text-[#1A1A1A]">{campaignData.campaign.totalCustomers}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 py-2">
                  <div>
                    <span className="text-sm text-[#6B7280] font-semibold block mb-1">Created</span>
                    <span className="text-sm font-bold text-[#1A1A1A]">{formatDate(campaignData.campaign.startDate)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-[#6B7280] font-semibold block mb-1">Started</span>
                    <span className="text-sm font-bold text-[#1A1A1A]">{formatDate(campaignData.campaign.startDate)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 bg-white rounded-[16px]">
          <CardHeader className="px-6 pt-6 pb-4">
            <div className="flex justify-between items-center">
              <div>
                      <CardTitle className="text-[16px] font-semibold text-[#1A1A1A]">
                        Performance Analytics
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-2">
                  <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-4">Conversion Rate</p>
                              <p className="text-2xl font-bold text-[#1A1A1ACC]">{calculatedStats?.successRate ?? 67}%</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-4">Avg Call Duration</p>
                              <p className="text-2xl font-bold text-[#1A1A1ACC]">{calculatedStats?.avgCallDuration ?? '2:45'}</p>
                            </div>
                            <Timer className="h-8 w-8 text-blue-600" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-4">Revenue Generated</p>
                              <p className="text-2xl font-bold text-[#1A1A1ACC]">$12,450</p>
                            </div>
                            <Target className="h-8 w-8 text-purple-600" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-4">Cost per Lead</p>
                              <p className="text-2xl font-bold text-[#1A1A1ACC]">$45.20</p>
                            </div>
                            <BarChart3 className="h-8 w-8 text-orange-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold">Performance Trends</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Answer Rate Trend</span>
                              <span className="text-sm text-green-600">↗ +5.2%</span>
                            </div>
                            <Progress value={72} className="h-2" />
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Conversion Trend</span>
                              <span className="text-sm text-green-600">↗ +3.1%</span>
                            </div>
                            <Progress value={67} className="h-2" />
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Quality Score</span>
                              <span className="text-sm text-blue-600">→ Stable</span>
                            </div>
                            <Progress value={85} className="h-2" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold">Call Outcomes Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-sm">Appointments Scheduled</span>
                              </div>
                              <span className="text-sm font-medium">{calculatedStats?.appointmentCount ?? 2}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span className="text-sm">Callback Requested</span>
                              </div>
                              <span className="text-sm font-medium">1</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                                <span className="text-sm">Not Interested</span>
                              </div>
                              <span className="text-sm font-medium">1</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span className="text-sm">No Answer</span>
                              </div>
                              <span className="text-sm font-medium">{calculatedStats?.noAnswerCalls ?? 0}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          /* Original Call Details Content for Non-Sales Campaigns */
        <Card className="border-0 bg-white rounded-[16px]">
          <CardHeader className="px-6 pt-6 pb-4">
            <div className="flex justify-between items-center">
              <div>
                  <CardTitle className="text-[16px] font-semibold text-[#1A1A1A]">
                    Call Details
                  </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-3">
              <div className="w-full sm:w-80">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                  <Input
                    placeholder="Search by customer, phone, or VIN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-10 text-sm border-[#E5E7EB] rounded-md focus:border-[#4600F2] focus:ring-[#4600F2] bg-white"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40 h-10 border-[#E5E7EB] rounded-md focus:border-[#4600F2] focus:ring-[#4600F2] bg-white">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="connected">Connected</SelectItem>
                    <SelectItem value="voicemail">Voicemail</SelectItem>
                    <SelectItem value="no-answer">No Answer</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                  <SelectTrigger className="w-full sm:w-40 h-10 border-[#E5E7EB] rounded-md focus:border-[#4600F2] focus:ring-[#4600F2] bg-white">
                    <SelectValue placeholder="All Outcomes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Outcomes</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failure">Failure</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="relative border border-[#E5E7EB] rounded-lg overflow-hidden">
              {/* Horizontal scroll indicator - left */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white/80 to-transparent z-10 pointer-events-none opacity-0 transition-opacity duration-200" id="scroll-indicator-left"></div>
              
              {/* Horizontal scroll indicator - right */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/80 to-transparent z-10 pointer-events-none opacity-100 transition-opacity duration-200" id="scroll-indicator-right"></div>
              
              {/* Scrollable table container */}
              <div 
                className="overflow-auto max-h-[600px]" 
                style={{ maxHeight: 'calc(100vh - 400px)' }}
                onScroll={(e) => {
                  const target = e.target as HTMLDivElement;
                  const leftIndicator = document.getElementById('scroll-indicator-left');
                  const rightIndicator = document.getElementById('scroll-indicator-right');
                  
                  if (leftIndicator && rightIndicator) {
                    // Show/hide left indicator
                    leftIndicator.style.opacity = target.scrollLeft > 0 ? '1' : '0';
                    
                    // Show/hide right indicator
                    const isScrolledToRight = target.scrollLeft >= (target.scrollWidth - target.clientWidth - 1);
                    rightIndicator.style.opacity = isScrolledToRight ? '0' : '1';
                  }
                }}
              >
                <Table>
                  <TableHeader className="sticky top-0 z-20">
                    <TableRow className="bg-[#F4F5F8] h-10">
                      <TableHead className="font-semibold text-[#1A1A1A] text-xs min-w-[200px] sticky left-0 bg-[#F4F5F8] z-30 py-2 px-3">Customer Info</TableHead>
                      <TableHead className="font-semibold text-[#1A1A1A] text-xs min-w-[180px] py-2 px-3">Vehicle & VIN</TableHead>
                      <TableHead className="font-semibold text-[#1A1A1A] text-xs min-w-[100px] py-2 px-3">Status</TableHead>
                      <TableHead className="font-semibold text-[#1A1A1A] text-xs min-w-[120px] py-2 px-3">Outcome</TableHead>
                      <TableHead className="font-semibold text-[#1A1A1A] text-xs min-w-[100px] py-2 px-3">Appointment</TableHead>
                      <TableHead className="font-semibold text-[#1A1A1A] text-xs min-w-[150px] py-2 px-3">Call Time & Duration</TableHead>
                      <TableHead className="font-semibold text-[#1A1A1A] text-xs min-w-[140px] py-2 px-3">Call Quality</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPageCalls.map((call) => (
                      <TableRow key={call.id} className="hover:bg-[#F4F5F8] border-b border-[#E5E7EB]">
                        <TableCell className="text-sm min-w-[200px] sticky left-0 bg-white z-10">
                          <div className="space-y-1">
                            <div className="font-bold text-[#1A1A1A]">{call.customer}</div>
                            <div className="text-[#6B7280]">{call.phone}</div>
                            {call.email && <div className="text-[#6B7280]">{call.email}</div>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm min-w-[180px]">
                          <div className="space-y-1">
                            <div className="text-[#1A1A1A] font-medium">{call.year} {call.make} {call.model}</div>
                            <div className="font-mono text-xs text-[#6B7280]">{call.vin}</div>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[100px]">
                          <div className={`${statusColors[call.status]} border font-medium rounded-full text-xs px-2 py-1 inline-block`}>
                            {call.status}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[120px]">
                          <span className="text-[#1A1A1A] text-sm font-bold">
                            {call.outcome}
                          </span>
                        </TableCell>
                        <TableCell className="min-w-[100px]">
                          {call.appointment === 'Yes' ? (
                            <div className="flex items-center gap-1 text-[#22C55E] font-bold text-sm">
                              <Check className="h-4 w-4" />
                                  Yes
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[#6B7280] text-sm">
                              <X className="h-4 w-4" />
                                  No
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm min-w-[150px]">
                          <div className="space-y-1">
                                <div className="text-[#1A1A1A] font-medium">{call.callTime}</div>
                            <div className="flex items-center gap-1 text-[#6B7280]">
                                  <Timer className="h-3 w-3" />
                                  {call.duration}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[140px]">
                          <CallQualityChart rating={call.callQuality} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              

            </div>
            
            {/* Table info with pagination */}
            {filteredCalls.length > 0 && (
              <div className="flex justify-between items-center mt-4 text-sm text-[#6B7280]">
                <div>
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredCalls.length)} of {filteredCalls.length} calls
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="h-8 px-3 text-xs"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          // Show first page, last page, current page, and pages around current
                          return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                        })
                        .map((page, index, array) => {
                          const prevPage = array[index - 1]
                          return (
                            <div key={page} className="flex items-center">
                              {prevPage && page - prevPage > 1 && (
                                <span className="px-2 text-[#6B7280]">...</span>
                              )}
                              <Button
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className={`h-8 w-8 p-0 text-xs ${
                                  currentPage === page 
                                    ? "bg-[#4600F2] text-white border-[#4600F2]" 
                                    : "text-[#6B7280] border-[#E5E7EB]"
                                }`}
                              >
                                {page}
                              </Button>
                            </div>
                          )
                        })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="h-8 px-3 text-xs"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}

            {filteredCalls.length === 0 && (
              <div className="text-center py-16">
                <div className="text-[#6B7280] mb-6">
                  <Search className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-[20px] font-semibold text-[#1A1A1A] leading-[1.4] mb-3">No calls found</h3>
                <p className="text-[#6B7280] text-sm leading-[1.5]">
                  Try adjusting your search or filters to see more results
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        )}
      </div>
      <Toaster />
    </div>
  )
}
