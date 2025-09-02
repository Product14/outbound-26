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
import { Download, Search, Phone, CheckCircle, Clock, AlertCircle, Calendar, BarChart3, TrendingUp, Users, ArrowLeft, RefreshCw, Loader2, Target, Timer, Check, X, Activity, AlertTriangle, PieChart, Zap, Play, Pause } from 'lucide-react'
import Link from "next/link"
import { fetchCampaignDetails, fetchCampaignTypes, type CampaignDetailResponse, type CallDetail, type CampaignTypesResponse } from '@/lib/campaign-api'
import { fetchAgentList, type Agent } from '@/lib/agent-api'
import { calculateAndFormatEstimatedTime, getShortEstimatedTime } from '@/lib/time-utils'
import { generateCallStatus, generateCallTime, generateCallDuration, calculateCampaignStats, generateTopPerformingVehicles, generatePerformanceTimeData } from '@/lib/call-status-utils'
import { buildUrlWithParams } from '@/lib/url-utils'
import { PerformanceTimeChart } from '@/components/charts/PerformanceTimeChart'


// Map API campaign type to display format using dynamic data
const mapCampaignType = (campaignType: string, campaignTypes?: CampaignTypesResponse | null): string => {
  // If we have campaign types data, use it to determine the proper mapping
  if (campaignTypes?.data) {
    for (const group of campaignTypes.data) {
      if (group.campaignTypes) {
        for (const type of group.campaignTypes) {
          if (type.name.toLowerCase() === campaignType.toLowerCase() || 
              type.name.replace(/[_\s]/g, '-').toLowerCase() === campaignType.toLowerCase()) {
            return group.campaignFor; // Returns 'Sales' or 'Service' etc.
          }
        }
      }
    }
  }
  
  // Fallback to hardcoded logic if no API data
  if (campaignType === 'recall') return 'Service'
  return campaignType // 'Sales', 'Service', etc.
}

// Calculate service campaign specific statistics
const calculateServiceCampaignStats = (totalCalls: number) => {
  const stats = calculateCampaignStats(totalCalls);
  
  // Service-specific metrics based on the stats
  const serviceAppointmentCount = stats.appointmentCount;
  const serviceCallsMade = stats.callsMade;
  const serviceConversionRate = serviceCallsMade > 0 ? Math.round((serviceAppointmentCount / serviceCallsMade) * 100) : 0;
  const followUpRequested = stats.followUpRequested;
  
  return {
    ...stats,
    serviceCallsMade,
    serviceAppointmentCount,
    serviceConversionRate,
    followUpRequested,
    serviceAnswerRate: stats.answerRate,
    serviceAvgCallDuration: stats.avgCallDuration,
    // Additional service-specific metrics
    followUpSuccessRate: stats.followUpSuccessRate
  };
};

// Generate top performing services for service campaigns
const generateTopPerformingServices = (totalAppointments: number) => {
  const services = [
    { service: 'Oil Change', appointments: Math.round(totalAppointments * 0.35), percentage: 35 },
    { service: 'Brake Repair', appointments: Math.round(totalAppointments * 0.25), percentage: 25 },
    { service: 'Tire Service', appointments: Math.round(totalAppointments * 0.20), percentage: 20 },
    { service: 'Engine Diagnostic', appointments: Math.round(totalAppointments * 0.12), percentage: 12 },
    { service: 'Transmission Service', appointments: Math.round(totalAppointments * 0.08), percentage: 8 }
  ];
  
  return services.filter(service => service.appointments > 0);
};

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

// Helper function to render table cell content based on column type
const renderTableCell = (call: any, column: {key: string, label: string, type: 'text' | 'vehicle' | 'boolean'}, formatDate: (date: string | Date) => string) => {
  switch (column.type) {
    case 'vehicle':
      return (
        <div className="space-y-1">
          <div className="text-[#1A1A1A] font-medium">
            {[call.vehicleYear, call.vehicleMake, call.vehicleModel].filter(Boolean).join(' ') || 'N/A'}
          </div>
          <div className="font-mono text-xs text-[#6B7280]">{call.vin || 'N/A'}</div>
        </div>
      );
    case 'boolean':
      if (column.key === 'appointment') {
        return call.appointment === 'Yes' ? (
          <div className="flex items-center gap-1 text-[#22C55E] font-bold text-sm">
            <Check className="h-4 w-4" />
            <span>Yes</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[#6B7280] text-sm">
            <X className="h-4 w-4" />
            <span>No</span>
          </div>
        );
      } else {
        // Other boolean fields
        const value = call[column.key];
        return value === 'Yes' ? (
          <div className="flex items-center gap-1 text-[#22C55E] text-sm">
            <Check className="h-4 w-4" />
            <span>Yes</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[#6B7280] text-sm">
            <X className="h-4 w-4" />
            <span>No</span>
          </div>
        );
      }
    default:
      if (column.key === 'customer') {
        return (
          <div className="space-y-1">
            <div className="font-bold text-[#1A1A1A]">{call.customer}</div>
            <div className="text-[#6B7280]">{call.phone}</div>
            {call.email && <div className="text-[#6B7280]">{call.email}</div>}
          </div>
        );
      } else if (column.key === 'status') {
        return (
          <div className={`${statusColors[call.status]} border font-medium rounded-full text-xs px-2 py-1 inline-block`}>
            {call.status}
          </div>
        );
      } else if (column.key === 'outcome') {
        return (
          <span className="text-[#1A1A1A] text-sm font-bold">
            {call.outcome}
          </span>
        );
      } else if (column.key === 'callTime') {
        return (
          <div className="space-y-1">
            <div className="text-[#1A1A1A]">{formatDate(call.callTime)}</div>
            <div className="flex items-center gap-1 text-[#6B7280]">
              <Clock className="h-3 w-3" />
              <span className="font-mono text-xs">{call.duration}</span>
            </div>
          </div>
        );
      } else if (column.key === 'callQuality') {
        return <CallQualityChart rating={call.callQuality} />;
      } else {
        // Generic text field
        return (
          <span className="text-[#1A1A1A] text-sm">
            {call[column.key] || 'N/A'}
          </span>
        );
      }
  }
};

// Helper function to get display columns based on available data
const getDisplayColumnsForCallData = (callDetails: any[]): Array<{key: string, label: string, type: 'text' | 'vehicle' | 'boolean'}> => {
  if (!callDetails || callDetails.length === 0) {
    return [
      { key: 'customer', label: 'Customer Info', type: 'text' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'outcome', label: 'Outcome', type: 'text' },
      { key: 'appointment', label: 'Appointment', type: 'boolean' },
      { key: 'callTime', label: 'Call Time & Duration', type: 'text' },
      { key: 'callQuality', label: 'Call Quality', type: 'text' }
    ];
  }

  const sampleCall = callDetails[0];
  const columns: Array<{key: string, label: string, type: 'text' | 'vehicle' | 'boolean'}> = [
    { key: 'customer', label: 'Customer Info', type: 'text' }
  ];

  // Check for vehicle-related fields
  const hasVehicleFields = sampleCall.vin || sampleCall.vehicleMake || sampleCall.vehicleModel || sampleCall.vehicleYear;
  if (hasVehicleFields) {
    columns.push({ key: 'vehicle', label: 'Vehicle & VIN', type: 'vehicle' });
  }

  // Add other dynamic fields (skip standard fields we handle separately)
  const skipFields = ['id', 'customer', 'phone', 'status', 'outcome', 'appointment', 'callTime', 'duration', 'callQuality', 'email', 'vin', 'vehicleMake', 'vehicleModel', 'vehicleYear'];
  Object.keys(sampleCall).forEach(key => {
    if (!skipFields.includes(key)) {
      // Format the field name for display
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      const type = key.toLowerCase().includes('flag') || key.toLowerCase().includes('eligib') ? 'boolean' : 'text';
      columns.push({ key, label, type });
    }
  });

  // Add standard columns at the end
  columns.push(
    { key: 'status', label: 'Status', type: 'text' },
    { key: 'outcome', label: 'Outcome', type: 'text' },
    { key: 'appointment', label: 'Appointment', type: 'boolean' },
    { key: 'callTime', label: 'Call Time & Duration', type: 'text' },
    { key: 'callQuality', label: 'Call Quality', type: 'text' }
  );

  return columns;
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

    // Helper function to safely convert values to strings
    const toString = (value: string | number | boolean | undefined): string => {
      if (value === undefined || value === null) return '';
      return String(value);
    };

    // Helper function to format boolean values for display
    const formatBoolean = (value: string | number | boolean | undefined): string => {
      if (value === undefined || value === null) return 'No';
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      if (typeof value === 'string') {
        const lowerValue = value.toLowerCase();
        if (lowerValue === 'true' || lowerValue === 'yes' || lowerValue === '1') return 'Yes';
        if (lowerValue === 'false' || lowerValue === 'no' || lowerValue === '0') return 'No';
        return toString(value);
      }
      return toString(value);
    };

    // Build the base call object with standard fields
    const baseCall = {
      id: index + 1,
      customer: call.customerName,
      phone: call.customerNumber,
      // Use calculated status data
      status: statusResult.status,
      outcome: statusResult.outcome,
      appointment: statusResult.appointment,
      callTime: callTime,
      duration: duration,
      callQuality: callQuality
    };

    // Add all dynamic fields from the call data
    const dynamicFields: Record<string, any> = {};
    Object.keys(call).forEach(key => {
      // Skip the base fields we've already handled
      if (!['_id', 'customerName', 'customerNumber'].includes(key)) {
        const value = call[key];
        
        // Handle different field types appropriately
        if (key.toLowerCase().includes('flag') || key.toLowerCase().includes('eligib')) {
          // Boolean-like fields
          dynamicFields[key] = formatBoolean(value);
        } else {
          // Regular fields
          dynamicFields[key] = toString(value);
        }
      }
    });

    // Combine base call data with dynamic fields
    return {
      ...baseCall,
      ...dynamicFields
    };
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
    status: string;
    outcome: string;
    appointment: string;
    callTime: string;
    duration: string;
    callQuality: number;
    email?: string;
    // Allow any additional dynamic fields
    [key: string]: any;
  }>>([])
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [campaignNotFound, setCampaignNotFound] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [campaignTypes, setCampaignTypes] = useState<CampaignTypesResponse | null>(null)
  const [displayColumns, setDisplayColumns] = useState<Array<{key: string, label: string, type: 'text' | 'vehicle' | 'boolean'}>>([])
  const itemsPerPage = 10
  const [campaignAgent, setCampaignAgent] = useState<Agent | null>(null)
  const [isLoadingAgent, setIsLoadingAgent] = useState(false)
  const [activeTab, setActiveTab] = useState('analytics')
  
  // Live feed state
  const [callTimer, setCallTimer] = useState(154) // seconds for current call
  const [newCallAnimation, setNewCallAnimation] = useState(false)
  
  // Campaign control state
  const [campaignRunning, setCampaignRunning] = useState(true)

  // Toggle campaign running state
  const toggleCampaignStatus = () => {
    setCampaignRunning(!campaignRunning)
  }

  // Check if this is a sales campaign to show enhanced tabs
  const isSalesCampaign = campaignData?.campaign.campaignType === 'Sales'
  
  // Check if this is a service campaign to show enhanced tabs
  const isServiceCampaign = campaignData?.campaign.campaignType === 'recall' || mapCampaignType(campaignData?.campaign.campaignType || '', campaignTypes) === 'Service'
  
  // Calculate realistic campaign stats based on call status logic
  const calculatedStats = campaignData ? calculateCampaignStats(campaignData.campaign.totalCustomers) : null
  
  // Calculate service campaign specific stats
  const serviceStats = campaignData && isServiceCampaign ? calculateServiceCampaignStats(campaignData.campaign.totalCustomers) : null

  // Load campaign data when component mounts or campaignId changes
  useEffect(() => {
    const loadCampaignData = async () => {
      if (!campaignId) return
      
      try {
        setIsLoading(true)
        setError(null)
        
       
        const response = await fetchCampaignDetails(campaignId)
        
        if (response.success) {
          setCampaignData(response)
          const formattedCallDetails = formatCallDetailsForTable(response.callDetails, response.campaign.startDate)
          setCallDetails(formattedCallDetails)
          
          // Set display columns based on the formatted data
          const columns = getDisplayColumnsForCallData(formattedCallDetails)
          setDisplayColumns(columns)
          
          setCampaignNotFound(false)
          

          // Fetch campaign types data
          try {
            const campaignTypesResponse = await fetchCampaignTypes()
            setCampaignTypes(campaignTypesResponse)
          } catch (error) {
            console.error('Error loading campaign types:', error)
            // Don't fail the whole page if campaign types fetch fails
            setCampaignTypes(null)
          }

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
    if (activeTab === 'live-activity' && campaignRunning) {
      const timer = setInterval(() => {
        setCallTimer(prev => prev + 1)
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [activeTab, campaignRunning])

  // Simulate new calls appearing
  useEffect(() => {
    if (activeTab === 'live-activity' && campaignRunning) {
      const newCallInterval = setInterval(() => {
        setNewCallAnimation(true)
        setTimeout(() => setNewCallAnimation(false), 500)
      }, 8000) // New call every 8 seconds

      return () => clearInterval(newCallInterval)
    }
  }, [activeTab, campaignRunning])

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
        
        // Update display columns based on refreshed data
        const columns = getDisplayColumnsForCallData(formattedCallDetails)
        setDisplayColumns(columns)
        
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
              
              {/* Tabs for Sales and Service Campaigns */}
              {(isSalesCampaign || isServiceCampaign) && (
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
            
            {/* Campaign Controls for Sales and Service Campaigns or Progress for Others */}
            {(isSalesCampaign || isServiceCampaign) ? (
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${campaignRunning ? 'bg-[#10B981]' : 'bg-[#6B7280]'}`}></div>
                <Button
                  onClick={toggleCampaignStatus}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 px-3 py-1.5 border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] text-sm"
                >
                  {campaignRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      Pause Campaign
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      Resume Campaign
                    </>
                  )}
                </Button>
              </div>
            ) : (
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
            )}
          </div>
        </div>





        {/* Content Area with Tabs for Sales and Service Campaigns */}
        {(isSalesCampaign || isServiceCampaign) ? (
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
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
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
                      <div className={`w-2 h-2 rounded-full ${campaignRunning ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
                      <span className={`text-sm font-medium ${campaignRunning ? 'text-green-600' : 'text-orange-600'}`}>
                        {campaignRunning ? 'LIVE' : 'PAUSED'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-2">
                  {!campaignRunning && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <Pause className="w-5 h-5 text-orange-600" />
                        <div>
                          <p className="text-sm font-medium text-orange-800">Campaign Paused</p>
                          <p className="text-xs text-orange-600">All calling activity has been suspended. Resume to continue.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className={`space-y-4 ${!campaignRunning ? 'opacity-60' : ''}`} id="live-feed-container">
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
              {isServiceCampaign ? (
                <div className="space-y-6">
                  {/* 1. Service Campaign Overview and Service Funnel - Horizontal Layout */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Campaign Overview - 2x2 Grid */}
                    <Card className="border-0 bg-white rounded-[16px]">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">
                          Service Campaign Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                            <div className="p-2 bg-[#F0F4FF] rounded-[8px] flex-shrink-0">
                              <Phone className="h-5 w-5 text-[#4600F2]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Total Service Calls Made</h3>
                              <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                                {serviceStats?.serviceCallsMade ?? campaignData.campaign.totalCallPlaced}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                            <div className="p-2 bg-[#F0FDF4] rounded-[8px] flex-shrink-0">
                              <Calendar className="h-5 w-5 text-[#22C55E]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Total Service Appointments Set</h3>
                              <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                                {serviceStats?.serviceAppointmentCount ?? campaignData.campaign.appointmentScheduled}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                            <div className="p-2 bg-[#FEFCE8] rounded-[8px] flex-shrink-0">
                              <TrendingUp className="h-5 w-5 text-[#F59E0B]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Service Conversion Rate</h3>
                              <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                                {serviceStats?.serviceConversionRate ?? 0}%
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                            <div className="p-2 bg-[#EFF6FF] rounded-[8px] flex-shrink-0">
                              <RefreshCw className="h-5 w-5 text-[#3B82F6]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Follow-ups Requested</h3>
                              <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                                {serviceStats?.followUpRequested ?? 0}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                            <div className="p-2 bg-[#F0FDF4] rounded-[8px] flex-shrink-0">
                              <CheckCircle className="h-5 w-5 text-[#22C55E]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Answer Rate (Service)</h3>
                              <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                                {serviceStats?.serviceAnswerRate ?? campaignData.campaign.answerRate}%
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                            <div className="p-2 bg-[#FDF2F8] rounded-[8px] flex-shrink-0">
                              <Timer className="h-5 w-5 text-[#EC4899]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Avg Call Duration (Service)</h3>
                              <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                                {serviceStats?.serviceAvgCallDuration ?? '2:45'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Service Funnel */}
                    <Card className="border-0 bg-white rounded-[16px]">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">
                          Service Funnel
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="relative">
                          {/* Service funnel stages with visual widths representing conversion */}
                          <div className="space-y-4">
                            {/* Calls Made */}
                            <div>
                              <div className="bg-gradient-to-r from-[#E0E7FF] to-[#C7D2FE] text-[#3730A3] p-4 rounded-[12px] shadow-sm border border-[#C7D2FE]">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Phone className="h-5 w-5" />
                                    <span className="font-semibold">Calls Made</span>
                                  </div>
                                  <div className="text-[20px] font-bold">{serviceStats?.serviceCallsMade ?? campaignData.campaign.totalCallPlaced}</div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Calls Answered */}
                            <div>
                              <div className="bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0] text-[#065F46] p-4 rounded-[12px] shadow-sm border border-[#A7F3D0]" style={{width: '85%'}}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5" />
                                    <span className="font-semibold">Calls Answered</span>
                                  </div>
                                  <div className="text-[20px] font-bold">{serviceStats?.callsAnswered ?? Math.round(campaignData.campaign.totalCallPlaced * 0.6)}</div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Appointments Set */}
                            <div>
                              <div className="bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] text-[#92400E] p-4 rounded-[12px] shadow-sm border border-[#FDE68A]" style={{width: '55%'}}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5" />
                                    <span className="font-semibold">Appointments Set</span>
                                  </div>
                                  <div className="text-[20px] font-bold">{serviceStats?.serviceAppointmentCount ?? campaignData.campaign.appointmentScheduled}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Service funnel summary */}
                          <div className="mt-6 grid grid-cols-2 gap-4">
                            <div className="p-3 bg-white border border-black/10 rounded-[12px]">
                              <h3 className="text-[#6B7280] font-semibold text-sm mb-1">Answer Rate</h3>
                              <p className="text-[#065F46] text-[18px] font-bold">{serviceStats?.serviceAnswerRate ?? Math.round((Math.round(campaignData.campaign.totalCallPlaced * 0.6) / campaignData.campaign.totalCallPlaced) * 100)}%</p>
                            </div>
                            
                            <div className="p-3 bg-white border border-black/10 rounded-[12px]">
                              <h3 className="text-[#6B7280] font-semibold text-sm mb-1">Overall Conversion</h3>
                              <p className="text-[#92400E] text-[18px] font-bold">{serviceStats?.serviceConversionRate ?? 0}%</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 3. Best Performance Time and Top Performing Services */}
                  <div className="grid grid-cols-2 gap-6">
                    <PerformanceTimeChart 
                      data={generatePerformanceTimeData()} 
                      title="Best Campaign Performance Time"
                    />

                    <Card className="border-0 bg-white rounded-[16px]">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">
                          Top Performing Services
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {generateTopPerformingServices(serviceStats?.serviceAppointmentCount ?? campaignData.campaign.appointmentScheduled).map((service, index) => (
                            <div key={service.service} className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-[8px]">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#F0F4FF] rounded-full flex items-center justify-center text-[#4600F2] font-bold text-sm">
                                  {index + 1}
                                </div>
                                <span className="font-medium text-[#1A1A1A]">{service.service}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-[16px] font-bold text-[#1A1A1A]">{service.appointments}</div>
                                <div className="text-xs text-[#6B7280]">appointments</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 4. Follow-up Metrics (Service) */}
                  <Card className="border-0 bg-white rounded-[16px]">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">
                        Follow-up Metrics (Service)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                          <div className="p-2 bg-[#EFF6FF] rounded-[8px] flex-shrink-0">
                            <RefreshCw className="h-5 w-5 text-[#3B82F6]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Total Follow-ups Requested (Service)</h3>
                            <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                              {serviceStats?.followUpRequested ?? 0}
                            </p>
                            <p className="text-[#6B7280] text-xs mt-1">Number of follow-up requests made for service-related calls</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                          <div className="p-2 bg-[#F0FDF4] rounded-[8px] flex-shrink-0">
                            <Target className="h-5 w-5 text-[#22C55E]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Follow-up Success Rate (Service)</h3>
                            <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                              {serviceStats?.followUpSuccessRate ?? 0}%
                            </p>
                            <p className="text-[#6B7280] text-xs mt-1">Percentage of follow-up calls that resulted in confirmed service appointments</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 1. Sales Campaign Overview and Sales Funnel - Horizontal Layout */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Campaign Overview - 2x2 Grid */}
                    <Card className="border-0 bg-white rounded-[16px]">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">
                          Campaign Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                            <div className="p-2 bg-[#F0F4FF] rounded-[8px] flex-shrink-0">
                              <Phone className="h-5 w-5 text-[#4600F2]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Total Sales Calls Made</h3>
                              <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                                {calculatedStats?.callsMade ?? campaignData.campaign.totalCallPlaced}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                            <div className="p-2 bg-[#F0FDF4] rounded-[8px] flex-shrink-0">
                              <Calendar className="h-5 w-5 text-[#22C55E]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Total Appointments Set</h3>
                              <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                                {calculatedStats?.appointmentCount ?? campaignData.campaign.appointmentScheduled}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                            <div className="p-2 bg-[#FEFCE8] rounded-[8px] flex-shrink-0">
                              <TrendingUp className="h-5 w-5 text-[#F59E0B]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Sales Conversion Rate</h3>
                              <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                                {calculatedStats?.salesConversionRate ?? 0}%
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                            <div className="p-2 bg-[#EFF6FF] rounded-[8px] flex-shrink-0">
                              <RefreshCw className="h-5 w-5 text-[#3B82F6]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Follow-ups Requested</h3>
                              <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                                {calculatedStats?.followUpRequested ?? 0}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                            <div className="p-2 bg-[#F0FDF4] rounded-[8px] flex-shrink-0">
                              <CheckCircle className="h-5 w-5 text-[#22C55E]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Answer Rate (Sales)</h3>
                              <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                                {calculatedStats?.answerRate ?? campaignData.campaign.answerRate}%
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-3 p-4 bg-white border border-black/10 rounded-[12px]">
                            <div className="p-2 bg-[#FDF2F8] rounded-[8px] flex-shrink-0">
                              <Timer className="h-5 w-5 text-[#EC4899]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-[#6B7280] font-semibold text-sm leading-[1.4] mb-2">Avg Call Duration (Sales)</h3>
                              <p className="text-[#1A1A1A] text-[24px] font-bold leading-[1.4]">
                                {calculatedStats?.avgCallDuration ?? '2:45'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Sales Funnel */}
                    <Card className="border-0 bg-white rounded-[16px]">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">
                          Sales Funnel
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="relative">
                          {/* Funnel stages with visual widths representing conversion */}
                          <div className="space-y-4">
                            {/* Calls Made */}
                            <div>
                              <div className="bg-gradient-to-r from-[#E0E7FF] to-[#C7D2FE] text-[#3730A3] p-4 rounded-[12px] shadow-sm border border-[#C7D2FE]">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Phone className="h-5 w-5" />
                                    <span className="font-semibold">Calls Made</span>
                                  </div>
                                  <div className="text-[20px] font-bold">{calculatedStats?.callsMade ?? campaignData.campaign.totalCallPlaced}</div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Calls Answered */}
                            <div>
                              <div className="bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0] text-[#065F46] p-4 rounded-[12px] shadow-sm border border-[#A7F3D0]" style={{width: '85%'}}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5" />
                                    <span className="font-semibold">Calls Answered</span>
                                  </div>
                                  <div className="text-[20px] font-bold">{calculatedStats?.callsAnswered ?? Math.round(campaignData.campaign.totalCallPlaced * 0.6)}</div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Follow-ups Requested */}
                            <div>
                              <div className="bg-gradient-to-r from-[#DBEAFE] to-[#BFDBFE] text-[#1E3A8A] p-4 rounded-[12px] shadow-sm border border-[#BFDBFE]" style={{width: '70%'}}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <RefreshCw className="h-5 w-5" />
                                    <span className="font-semibold">Follow-ups Requested</span>
                                  </div>
                                  <div className="text-[20px] font-bold">{calculatedStats?.followUpRequested ?? 0}</div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Appointments Set */}
                            <div>
                              <div className="bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] text-[#92400E] p-4 rounded-[12px] shadow-sm border border-[#FDE68A]" style={{width: '55%'}}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5" />
                                    <span className="font-semibold">Appointments Set</span>
                                  </div>
                                  <div className="text-[20px] font-bold">{calculatedStats?.appointmentCount ?? campaignData.campaign.appointmentScheduled}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          

                        </div>
                      </CardContent>
                    </Card>
                  </div>

                {/* 3. Best Campaign Performance Time and Top Performing Vehicles */}
                <div className="grid grid-cols-2 gap-6">
                  <PerformanceTimeChart 
                    data={generatePerformanceTimeData()} 
                    title="Best Campaign Performance Time"
                  />

                  <Card className="border-0 bg-white rounded-[16px]">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">
                        Top Performing Vehicles
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {generateTopPerformingVehicles(calculatedStats?.appointmentCount ?? campaignData.campaign.appointmentScheduled).map((vehicle, index) => (
                          <div key={vehicle.vehicle} className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-[8px]">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-[#F0F4FF] rounded-full flex items-center justify-center text-[#4600F2] font-bold text-sm">
                                {index + 1}
                              </div>
                              <span className="font-medium text-[#1A1A1A]">{vehicle.vehicle}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-[16px] font-bold text-[#1A1A1A]">{vehicle.appointments}</div>
                              <div className="text-xs text-[#6B7280]">{vehicle.percentage}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>


              </div>
              )}
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
