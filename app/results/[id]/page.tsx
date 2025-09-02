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
import { buildUrlWithParams, extractUrlParams } from '@/lib/url-utils'
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
  const urlParams = extractUrlParams()


  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [outcomeFilter, setOutcomeFilter] = useState('all')
  const [selectedCall, setSelectedCall] = useState<any>(null)
  const [isCallDetailsOpen, setIsCallDetailsOpen] = useState(false)
  const [callDetailsTab, setCallDetailsTab] = useState('highlights')
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
  }>>([
    // Dummy data for Live Calls tab
    {
      id: 1,
      customer: "Sarah Johnson",
      phone: "+1-(555) 987-6543",
      status: "Connected",
      outcome: "In Progress",
      appointment: "Yes",
      callTime: "2025-01-15T15:35:00Z",
      duration: "02:34",
      callQuality: 9,
      email: "sarah.johnson@email.com",
      year: "2023",
      make: "Honda",
      model: "Accord",
      vin: "1HGBH41JXMN109186"
    },
    {
      id: 2,
      customer: "John Smith",
      phone: "+1-(555) 123-4567",
      status: "Connected",
      outcome: "Success",
      appointment: "Yes",
      callTime: "2025-01-15T15:30:00Z",
      duration: "4:12",
      callQuality: 8,
      email: "john.smith@email.com",
      year: "2022",
      make: "Tesla",
      model: "Model 3",
      vin: "5YJ3E1EA4MF123456"
    },
    {
      id: 3,
      customer: "Amanda Rodriguez",
      phone: "+1-(555) 234-5678",
      status: "Connected",
      outcome: "Success",
      appointment: "Yes",
      callTime: "2025-01-15T15:25:00Z",
      duration: "3:45",
      callQuality: 9,
      email: "amanda.rodriguez@email.com",
      year: "2024",
      make: "Mercedes",
      model: "C-Class",
      vin: "WDDGF4HB0LR123456"
    },
    {
      id: 4,
      customer: "David Thompson",
      phone: "+1-(555) 345-6789",
      status: "Connected",
      outcome: "Follow-up Requested",
      appointment: "No",
      callTime: "2025-01-15T15:20:00Z",
      duration: "2:18",
      callQuality: 7,
      email: "david.thompson@email.com",
      year: "2021",
      make: "Audi",
      model: "A4",
      vin: "WAUZZZ8K9LA123456"
    },
    {
      id: 5,
      customer: "Jennifer Lee",
      phone: "+1-(555) 456-7890",
      status: "Connected",
      outcome: "Success",
      appointment: "Yes",
      callTime: "2025-01-15T15:15:00Z",
      duration: "5:22",
      callQuality: 10,
      email: "jennifer.lee@email.com",
      year: "2023",
      make: "Lexus",
      model: "RX",
      vin: "2T2BZMCA9LC123456"
    },
    {
      id: 6,
      customer: "Michael Chen",
      phone: "+1-(555) 567-8901",
      status: "Connected",
      outcome: "In Progress",
      appointment: "No",
      callTime: "2025-01-15T15:10:00Z",
      duration: "1:55",
      callQuality: 8,
      email: "michael.chen@email.com",
      year: "2022",
      make: "Porsche",
      model: "Cayenne",
      vin: "WP1AB2A25NLA12345"
    }
  ])
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
  const [activeTab, setActiveTab] = useState('live-calls')
  
  // Handle tab change - close right panel when switching tabs
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab)
    if (isCallDetailsOpen) {
      setIsCallDetailsOpen(false)
      setSelectedCall(null)
    }
  }
  
  // Live feed state
  const [callTimer, setCallTimer] = useState(154) // seconds for current call
  const [newCallAnimation, setNewCallAnimation] = useState(false)
  
  // Campaign control state
  const [campaignRunning, setCampaignRunning] = useState(true)
  
  // Live updates state
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date())
  const [isLiveUpdateEnabled, setIsLiveUpdateEnabled] = useState(true)
  
  // Queue and live call filtering state
  const [queuedCalls, setQueuedCalls] = useState<Array<{
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
    [key: string]: any;
  }>>([
    // Dummy data for Queue tab
    {
      id: 101,
      customer: "Mike Davis",
      phone: "+1-(555) 456-7890",
      status: "Voice Mail",
      outcome: "No Answer",
      appointment: "No",
      callTime: "2025-01-15T14:23:00Z",
      duration: "0:15",
      callQuality: 7,
      email: "mike.davis@email.com",
      year: "2022",
      make: "Toyota",
      model: "Camry",
      vin: "4T1BF1FK5CU123456"
    },
    {
      id: 102,
      customer: "Emma Wilson",
      phone: "+1-(555) 789-0123",
      status: "Failed",
      outcome: "Line Busy",
      appointment: "No",
      callTime: "2025-01-15T14:18:00Z",
      duration: "0:00",
      callQuality: 0,
      email: "emma.wilson@email.com",
      year: "2021",
      make: "Ford",
      model: "F-150",
      vin: "1FTFW1ET5DFC12345"
    },
    {
      id: 103,
      customer: "Robert Brown",
      phone: "+1-(555) 321-9876",
      status: "Voice Mail",
      outcome: "Voicemail Left",
      appointment: "No",
      callTime: "2025-01-15T14:12:00Z",
      duration: "0:45",
      callQuality: 8,
      email: "robert.brown@email.com",
      year: "2023",
      make: "Chevrolet",
      model: "Silverado",
      vin: "1GCUYDED5NZ123456"
    },
    {
      id: 104,
      customer: "Lisa Garcia",
      phone: "+1-(555) 654-3210",
      status: "Failed",
      outcome: "Network Error",
      appointment: "No",
      callTime: "2025-01-15T14:08:00Z",
      duration: "0:00",
      callQuality: 0,
      email: "lisa.garcia@email.com",
      year: "2020",
      make: "Nissan",
      model: "Altima",
      vin: "1N4BL4BV4LC123456"
    },
    {
      id: 105,
      customer: "James Miller",
      phone: "+1-(555) 987-1234",
      status: "Voice Mail",
      outcome: "Callback Requested",
      appointment: "No",
      callTime: "2025-01-15T14:05:00Z",
      duration: "1:20",
      callQuality: 9,
      email: "james.miller@email.com",
      year: "2024",
      make: "BMW",
      model: "X5",
      vin: "5UXCR6C04L9123456"
    }
  ])
  const [showLiveOnly, setShowLiveOnly] = useState(false)

  // Toggle campaign running state
  const toggleCampaignStatus = () => {
    setCampaignRunning(!campaignRunning)
  }

  // Live update function
  const refreshData = async () => {
    if (!campaignId || !isLiveUpdateEnabled) return
    
    try {
      const response = await fetchCampaignDetails(campaignId, urlParams.auth_key || undefined)
      if (response) {
        setCampaignData(response)
        setLastUpdateTime(new Date())
        
        // Trigger new call animation if there are new calls
        if (response.callDetails && response.callDetails.length > callDetails.length) {
          setNewCallAnimation(true)
          setTimeout(() => setNewCallAnimation(false), 1000)
        }
        
        // Update call details with proper mapping
        const mappedCallDetails = (response.callDetails || []).map((call, index) => {
          const statusResult = generateCallStatus(index, response.callDetails?.length || 10)
          return {
            id: index + 1,
            customer: String(call.customerName || `Customer ${index + 1}`),
            phone: String(call.phoneNumber || '+1-(555) 000-0000'),
            status: statusResult.status,
            outcome: String(call.outcome || 'Success'),
            appointment: call.appointmentScheduled ? 'Yes' : 'No',
            callTime: String(call.callTime || generateCallTime(index, '2025-01-01')),
            duration: String(call.callDuration || generateCallDuration(index, statusResult.status)),
            callQuality: Number(call.callQuality) || Math.floor(Math.random() * 3) + 8,
            email: String(call.email || ''),
            year: String(call.vehicleYear || '2023'),
            make: String(call.vehicleMake || 'Honda'),
            model: String(call.vehicleModel || 'Accord'),
            vin: String(call.vin || `1HGBH41JXMN10918${index}`)
          }
        })
        
        // Separate calls into live and queued based on status
        const liveCalls = mappedCallDetails.filter(call => 
          call.status === 'Connected'
        )
        const queuedCallsData = mappedCallDetails.filter(call => 
          call.status === 'Voice Mail' || call.status === 'Failed'
        )
        
        setCallDetails(liveCalls)
        setQueuedCalls(queuedCallsData)
      }
    } catch (error) {
      console.error('Error refreshing live data:', error)
    }
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
        
       
        const response = await fetchCampaignDetails(campaignId, urlParams.auth_key || undefined)
        
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
    
    // Apply live-only filter if enabled
    const matchesLiveFilter = !showLiveOnly || (call.status === 'Connected' && call.outcome === 'In Progress')
    
    return matchesSearch && matchesStatus && matchesOutcome && matchesLiveFilter
  })

  // Filter queued calls for the Queue tab
  const filteredQueuedCalls = queuedCalls.filter(call => {
    const matchesSearch = call.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         call.phone.includes(searchTerm) ||
                         call.vin.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || call.status.toLowerCase().replace(' ', '-') === statusFilter
    const matchesOutcome = outcomeFilter === 'all' || call.outcome.toLowerCase() === outcomeFilter
    
    return matchesSearch && matchesStatus && matchesOutcome
  })

  // Pagination calculations for Live Calls
  const totalPages = Math.ceil(filteredCalls.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPageCalls = filteredCalls.slice(startIndex, endIndex)

  // Pagination calculations for Queue
  const totalQueuePages = Math.ceil(filteredQueuedCalls.length / itemsPerPage)
  const queueStartIndex = (currentPage - 1) * itemsPerPage
  const queueEndIndex = queueStartIndex + itemsPerPage
  const currentPageQueuedCalls = filteredQueuedCalls.slice(queueStartIndex, queueEndIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, outcomeFilter])

  // Live call timer effect
  useEffect(() => {
    if (activeTab === 'live-calls' && campaignRunning) {
      const timer = setInterval(() => {
        setCallTimer(prev => prev + 1)
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [activeTab, campaignRunning])

  // Live data refresh - refresh campaign data every 5 seconds when on live-calls or queue tab
  useEffect(() => {
    if ((activeTab === 'live-calls' || activeTab === 'queue') && campaignRunning && isLiveUpdateEnabled) {
      const refreshInterval = setInterval(() => {
        refreshData()
      }, 5000) // Refresh every 5 seconds

      return () => clearInterval(refreshInterval)
    }
  }, [activeTab, campaignRunning, isLiveUpdateEnabled])

  // Simulate new calls appearing with animation
  useEffect(() => {
    if (activeTab === 'live-calls' && campaignRunning) {
      const newCallInterval = setInterval(() => {
        setNewCallAnimation(true)
        setTimeout(() => setNewCallAnimation(false), 1000)
      }, 12000) // New call animation every 12 seconds

      return () => clearInterval(newCallInterval)
    }
  }, [activeTab, campaignRunning])

  // Initial data refresh when switching to live-calls or queue tab
  useEffect(() => {
    if ((activeTab === 'live-calls' || activeTab === 'queue') && campaignId) {
      refreshData()
    }
  }, [activeTab, campaignId])

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

  // Check if a call is currently in progress (for demo purposes, we'll consider calls with "Connected" status as in progress)
  const isCallInProgress = (call: any): boolean => {
    return call.status === 'Connected' && call.outcome === 'In Progress'
  }

  const handleRefresh = async () => {
    if (!campaignId) return
    
    try {
      setError(null)
      const response = await fetchCampaignDetails(campaignId, urlParams.auth_key || undefined)
      
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
                <div className={`mt-6 transition-all duration-300 ease-in-out ${
                  isCallDetailsOpen ? 'w-[calc(100%-600px-24px)] pr-4' : 'w-full'
                }`}>
                  <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="h-auto p-0 bg-transparent border-b border-gray-200 rounded-none justify-start w-full">
                      <TabsTrigger 
                        value="analytics" 
                        className="flex items-center gap-2 py-3 text-base font-medium bg-transparent border-0 rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#4600F2] data-[state=active]:border-b-2 data-[state=active]:border-[#4600F2] data-[state=active]:font-semibold text-gray-500 hover:text-gray-700 transition-colors mr-10"
                      >
                        Analytics
                      </TabsTrigger>
                      <TabsTrigger 
                        value="live-calls" 
                        className="flex items-center gap-2 py-3 text-base font-medium bg-transparent border-0 rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#4600F2] data-[state=active]:border-b-2 data-[state=active]:border-[#4600F2] data-[state=active]:font-semibold text-gray-500 hover:text-gray-700 transition-colors mr-10"
                      >
                        Live Calls
                      </TabsTrigger>
                      <TabsTrigger 
                        value="queue" 
                        className="flex items-center gap-2 py-3 text-base font-medium bg-transparent border-0 rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#4600F2] data-[state=active]:border-b-2 data-[state=active]:border-[#4600F2] data-[state=active]:font-semibold text-gray-500 hover:text-gray-700 transition-colors mr-10"
                      >
                        Queue
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
        





        {/* Content Area with Tabs for Sales and Service Campaigns */}
        {(isSalesCampaign || isServiceCampaign) ? (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            {/* Live Calls Tab - Merged Live Activity and Call Details */}
            <TabsContent value="live-calls" className="mt-0">
              <div className="space-y-6">
                {/* Live Metrics at Top */}
                <div className={`grid grid-cols-3 gap-4 transition-all duration-300 ease-in-out ${
                  isCallDetailsOpen ? 'w-[calc(100%-600px-24px)] pr-4' : 'w-full'
                }`}>
                  <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Activity className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-600 mb-1">ACTIVE CALLS</p>
                    <p className="text-2xl font-bold text-green-600">{filteredCalls.filter(call => call.outcome === 'In Progress').length}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Phone className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-600 mb-1">CONNECTED CALLS</p>
                    <p className="text-2xl font-bold text-blue-600">{filteredCalls.length}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-600 mb-1">QUEUE LENGTH</p>
                    <p className="text-2xl font-bold text-purple-600">{filteredQueuedCalls.length}</p>
                  </div>
                </div>

                                {/* Main Content Area with Responsive Layout */}
                <div className="flex gap-6 relative">
                  {/* Cards Container - Shrinks when modal is open */}
                  <div className={`transition-all duration-300 ease-in-out ${
                    isCallDetailsOpen ? 'w-[calc(100%-600px-24px)] pr-4' : 'w-full'
                  }`}>
                    {/* Live Activity Feed */}
                    <Card className="border border-gray-200 bg-white rounded-xl">
                      <CardHeader className="px-6 pt-6 pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Activity className="w-5 h-5 text-purple-600" />
                            </div>
                            <CardTitle className="text-lg font-semibold text-gray-900">
                              Live Activity
                            </CardTitle>
                          </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${campaignRunning ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                            <span className={`text-sm font-medium ${campaignRunning ? 'text-green-600' : 'text-orange-600'}`}>
                              {campaignRunning ? 'LIVE' : 'PAUSED'}
                            </span>
                          </div>
                          
                          {/* Last updated indicator */}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <RefreshCw className={`w-3 h-3 ${isLiveUpdateEnabled && campaignRunning ? 'animate-spin' : ''}`} />
                            <span>
                              Updated: {lastUpdateTime.toLocaleTimeString('en-US', { 
                                hour12: false, 
                                hour: '2-digit', 
                                minute: '2-digit', 
                                second: '2-digit' 
                              })}
                            </span>
                          </div>
                        </div>
                        
                        {/* Filters */}
                        <div className={`flex gap-3 transition-all duration-300 ease-in-out ${
                          isCallDetailsOpen ? 'flex-wrap' : ''
                        }`}>
                          <div className={`transition-all duration-300 ease-in-out ${
                            isCallDetailsOpen ? 'w-64' : 'w-80'
                          }`}>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="Search by customer, phone, or VIN..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-10 text-sm border border-gray-200 rounded-lg focus:border-[#4600F2] focus:ring-1 focus:ring-[#4600F2] bg-white"
                              />
                            </div>
                          </div>
                          
                          {/* Live Only Toggle */}
                          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
                            <input
                              type="checkbox"
                              id="live-only"
                              checked={showLiveOnly}
                              onChange={(e) => setShowLiveOnly(e.target.checked)}
                              className="w-4 h-4 text-[#4600F2] bg-gray-100 border-gray-300 rounded focus:ring-[#4600F2] focus:ring-2"
                            />
                            <label htmlFor="live-only" className="text-sm font-medium text-gray-700 cursor-pointer">
                              Live Only
                            </label>
                          </div>
                          
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className={`h-10 border border-gray-200 rounded-lg focus:border-[#4600F2] focus:ring-1 focus:ring-[#4600F2] bg-white transition-all duration-200 ${
                              isCallDetailsOpen ? 'w-36' : 'w-40'
                            }`}>
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
                            <SelectTrigger className={`h-10 border border-gray-200 rounded-lg focus:border-[#4600F2] focus:ring-1 focus:ring-[#4600F2] bg-white transition-all duration-200 ${
                              isCallDetailsOpen ? 'w-36' : 'w-40'
                            }`}>
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
                    
                    <div className={`space-y-4 max-h-[700px] overflow-y-auto ${!campaignRunning ? 'opacity-60' : ''}`} id="live-feed-container">
                      {/* Current Active Call */}
                      <div className="bg-white rounded-lg border-2 border-green-200 p-6 shadow-sm relative">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-green-600">SJ</span>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">Sarah Johnson</h3>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                  <span className="text-sm text-red-600 font-medium">Live</span>
                                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                                    Connected
                                  </div>
                                </div>
                              </div>
                            </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                {/* Customer Info */}
                                <div>
                                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                                    <Phone className="w-4 h-4" />
                                    <span className="text-sm">+1-(555) 987-6543</span>
                                  </div>
                                  <div className="text-sm text-gray-600">sarah.johnson@email.com</div>
                                </div>
                                
                                {/* Vehicle Info */}
                                <div>
                                  <div className="text-sm font-medium text-gray-900 mb-1">2023 Honda Accord</div>
                                  <div className="font-mono text-xs text-gray-600">VIN: 1HGBH41JXMN109186</div>
                                </div>
                                
                                {/* Call Details */}
                                <div className="text-right">
                                  <div className="text-sm text-gray-900 mb-1">Jan 15, 2025, 03:35 PM</div>
                                  <div className="flex items-center justify-end gap-1 text-gray-600 mb-1">
                                    <Clock className="h-3 w-3" />
                                    <span className="font-mono text-xs font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">{formatTimer(callTimer)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Call Quality and Outcome */}
                              <div className="flex items-center justify-between pt-3 border-t border-green-100">
                                <div className="flex items-center gap-4">
                                  <span className="text-sm font-medium text-gray-900">
                                    Outcome: <span className="text-green-700 font-semibold">In Progress</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* All Calls from Call History */}
                      {currentPageCalls.map((call, index) => (
                        <div 
                          key={call.id} 
                          className={`bg-white rounded-lg p-6 border border-gray-200 hover:shadow-sm transition-all duration-200 cursor-pointer ${
                            newCallAnimation && index === 0 ? 'animate-slideInFromTop' : ''
                          } ${
                            selectedCall?.id === call.id 
                              ? 'border-purple-300 shadow-sm' 
                              : 'hover:border-purple-200'
                          }`}
                          onClick={() => {
                            setSelectedCall(call);
                            setIsCallDetailsOpen(true);
                          }}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-purple-600">{call.customer.charAt(0)}</span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-lg font-semibold text-gray-900">{call.customer}</h3>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600 mb-2">
                                  <Phone className="w-4 h-4" />
                                  <span className="text-sm">{call.phone}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500 mb-1">{formatDate(call.callTime)}</div>
                              <div className="flex items-center justify-end gap-1 text-gray-600">
                                <Clock className="h-3 w-3" />
                                <span className="text-xs">{call.duration}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h4 className="text-base font-semibold text-gray-900 mb-2">
                              {call.outcome === 'info provided' ? 'Service Appointment Booking: Oil Change at Avis Motors' : 
                               call.outcome === 'appointment set' ? 'Recall and oil change scheduling for Chevy Tahoe' :
                               'Inquiry about BMW X3 availability and pricing'}
                            </h4>
                            
                            <div className="flex items-center gap-3 mb-3">
                              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                                Outcome: {call.outcome}
                              </div>
                              {call.year && call.make && call.model ? (
                                <div className="text-xs text-gray-600">
                                  {call.year} {call.make} {call.model}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-600">No vehicle mentioned</div>
                              )}
                              <div className="text-xs text-gray-600">No services mentioned</div>
                            </div>
                            
                            <div className="text-sm text-gray-700 mb-3">
                              {call.outcome === 'info provided' ? 'Service Appointment Booking: Oil Change at Avis Motors' :
                               call.outcome === 'appointment set' ? 'Recall and oil change scheduling for Chevy Tahoe' :
                               'Inquiry about BMW X3 availability and pricing'}
                            </div>

                            {/* Action Items Section */}
                            <div className="mt-4">
                              <div className="flex items-center gap-2 mb-3">
                                <CheckCircle className="w-4 h-4 text-gray-400" />
                                <h4 className="text-sm font-medium text-gray-900">Action Items:</h4>
                              </div>
                              <div className="space-y-2">
                                {call.outcome === 'info provided' ? (
                                  <>
                                    <div className="flex items-start gap-2">
                                      <div className="w-1 h-1 bg-gray-400 rounded-full mt-2"></div>
                                      <p className="text-sm text-gray-700">Agent to secure and confirm the oil change appointment for Monday at 8 AM for the customer</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <div className="w-1 h-1 bg-gray-400 rounded-full mt-2"></div>
                                      <p className="text-sm text-gray-700">Agent to send confirmation of the appointment by 9 AM the day before.</p>
                                    </div>
                                  </>
                                ) : call.outcome === 'appointment set' ? (
                                  <>
                                    <div className="flex items-start gap-2">
                                      <div className="w-1 h-1 bg-gray-400 rounded-full mt-2"></div>
                                      <p className="text-sm text-gray-700">Agent will pass customer details to service team for recall and oil change scheduling</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <div className="w-1 h-1 bg-gray-400 rounded-full mt-2"></div>
                                      <p className="text-sm text-gray-700">Service team will call customer by 9 AM tomorrow to confirm recall part availability</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <div className="w-1 h-1 bg-gray-400 rounded-full mt-2"></div>
                                      <p className="text-sm text-gray-700">Service team will confirm the availability of a loaner car during the appointment.</p>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex items-start gap-2">
                                      <div className="w-1 h-1 bg-gray-400 rounded-full mt-2"></div>
                                      <p className="text-sm text-gray-700">Agent to pass customer's budget information to sales manager for pricing discussion</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <div className="w-1 h-1 bg-gray-400 rounded-full mt-2"></div>
                                      <p className="text-sm text-gray-700">Customer to consider scheduling a visit or test drive and reach out when ready.</p>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-gray-100 pt-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-600">KY</span>
                                </div>
                                <span className="text-sm text-gray-600">Kylie</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                                  {call.outcome === 'info provided' || call.outcome === 'appointment set' ? 'Customer Query Resolved' : 'Customer Query not Resolved'}
                                </div>
                                <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                  {call.outcome === 'info provided' ? '10.0' : 
                                   call.outcome === 'appointment set' ? '9.5' : '9.5'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
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

                    {/* Pagination */}
                    {filteredCalls.length > 0 && (
                      <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 text-sm text-[#6B7280]">
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
                </Card>
                  </div>



                  {/* Call Details Sidebar - Fixed position */}
                  <div className={`fixed right-0 top-0 h-full w-[600px] bg-white border-l border-gray-200 shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
                    isCallDetailsOpen ? 'translate-x-0' : 'translate-x-full'
                  }`}>
                    <div className="overflow-y-auto h-full p-6">
                  {selectedCall && (
                    <>
                      <div className="border-b pb-4 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-purple-600">{selectedCall.customer.charAt(0)}</span>
                          </div>
                          <div className="flex-1">
                            <h2 className="text-xl font-semibold text-gray-900">
                              {isCallInProgress(selectedCall) ? `Live Call with ${selectedCall.customer}` :
                               selectedCall.outcome === 'info provided' ? 'Service Appointment Booking: Oil Change at Avis Motors' : 
                               selectedCall.outcome === 'appointment set' ? 'Recall and oil change scheduling for Chevy Tahoe' :
                               'Inquiry about BMW X3 availability and pricing'}
                            </h2>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span>{selectedCall.phone}</span>
                              <span>•</span>
                              <span>{formatDate(selectedCall.callTime)}</span>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-600">KY</span>
                                </div>
                                <span>Kylie</span>
                              </div>
                              {isCallInProgress(selectedCall) && (
                                <div className="flex items-center gap-1 ml-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                  <span className="text-red-600 font-medium text-xs">LIVE</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {isCallInProgress(selectedCall) ? (
                        // In Progress Call State
                        <div className="space-y-6">
                          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
                            <div className="flex items-center justify-center gap-3 mb-4">
                              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                              <h3 className="text-lg font-semibold text-red-800">Call in Progress</h3>
                            </div>
                            <p className="text-red-700 mb-4">
                              This call is currently active. Detailed information will be available once the call is completed.
                            </p>
                            <div className="bg-white rounded-lg p-4 border border-red-200">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                <Clock className="w-5 h-5 text-red-600" />
                                <span className="font-mono text-lg font-semibold text-red-800">
                                  {formatTimer(callTimer)}
                                </span>
                              </div>
                              <p className="text-sm text-red-600">Call Duration</p>
                            </div>
                          </div>

                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Available Information:</h4>
                            <div className="space-y-2 text-sm text-gray-700">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-500" />
                                <span>Customer: {selectedCall.customer}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-500" />
                                <span>Phone: {selectedCall.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span>Started: {formatDate(selectedCall.callTime)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-gray-500" />
                                <span>Status: Connected & Active</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">Real-time Updates</span>
                            </div>
                            <p className="text-sm text-blue-700">
                              Call highlights, action items, and summary will be generated automatically once the call ends.
                            </p>
                          </div>
                        </div>
                      ) : (
                        // Completed Call State
                        <Tabs value={callDetailsTab} onValueChange={setCallDetailsTab} className="w-full">
                          <TabsList className="grid w-full grid-cols-5 mb-6">
                            <TabsTrigger value="highlights" className="text-xs">Highlights</TabsTrigger>
                            <TabsTrigger value="customer" className="text-xs">Customer</TabsTrigger>
                            <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
                            <TabsTrigger value="appointment" className="text-xs">Appointment</TabsTrigger>
                            <TabsTrigger value="transcript" className="text-xs">Transcript</TabsTrigger>
                          </TabsList>

                        <TabsContent value="highlights" className="space-y-6">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                              <div className="w-4 h-4 bg-yellow-100 rounded-full flex items-center justify-center">
                                <span className="text-xs">💡</span>
                              </div>
                              Key Highlights
                              <span className="text-xs text-gray-500">4 total</span>
                            </h3>
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-xs font-medium text-blue-600">1</span>
                                </div>
                                <p className="text-sm text-gray-700">
                                  {selectedCall.outcome === 'info provided' ? 
                                    'Customer inquired about a recall on his Chevy Tahoe.' :
                                    selectedCall.outcome === 'appointment set' ?
                                    'Customer inquired about a recall on his Chevy Tahoe.' :
                                    'Customer inquired about BMW X3 availability and pricing.'}
                                </p>
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-xs font-medium text-blue-600">2</span>
                                </div>
                                <p className="text-sm text-gray-700">
                                  {selectedCall.outcome === 'info provided' ? 
                                    'Customer wants to take care of the recall and get an oil change during the same visit.' :
                                    selectedCall.outcome === 'appointment set' ?
                                    'Customer wants to take care of the recall and get an oil change during the same visit.' :
                                    'Customer wants to schedule a test drive and get pricing information.'}
                                </p>
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-xs font-medium text-blue-600">3</span>
                                </div>
                                <p className="text-sm text-gray-700">
                                  {selectedCall.outcome === 'info provided' ? 
                                    'Customer asked about parts availability and loaner car availability for the appointment.' :
                                    selectedCall.outcome === 'appointment set' ?
                                    'Customer asked about parts availability and loaner car availability for the appointment.' :
                                    'Customer asked about financing options and trade-in value.'}
                                </p>
                              </div>
                              <div className="text-center text-sm text-gray-500 py-2">
                                Showing 3 of 4 highlights
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="customer" className="space-y-6">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              Customer Information
                            </h3>
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Users className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Customer Name</p>
                                  <p className="text-sm text-gray-600">{selectedCall.customer}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                  <Phone className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Phone Number</p>
                                  <p className="text-sm text-gray-600">{selectedCall.phone}</p>
                                </div>
                              </div>
                              {selectedCall.email && (
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                    <span className="text-sm">@</span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">Email Address</p>
                                    <p className="text-sm text-gray-600">{selectedCall.email}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="summary" className="space-y-6">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                              <Activity className="w-4 h-4" />
                              Summary & Action Items
                            </h3>
                            
                            <div className="mb-6">
                              <div className="flex items-center gap-2 mb-3">
                                <CheckCircle className="w-4 h-4 text-gray-400" />
                                <h4 className="text-sm font-medium text-gray-900">Action Items:</h4>
                              </div>
                              <div className="space-y-2 ml-6">
                                {selectedCall.outcome === 'info provided' ? (
                                  <>
                                    <div className="flex items-start gap-2">
                                      <div className="w-1 h-1 bg-gray-400 rounded-full mt-2"></div>
                                      <p className="text-sm text-gray-700">Agent to secure and confirm the oil change appointment for Monday at 8 AM for the customer</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <div className="w-1 h-1 bg-gray-400 rounded-full mt-2"></div>
                                      <p className="text-sm text-gray-700">Agent to send confirmation of the appointment by 9 AM the day before.</p>
                                    </div>
                                  </>
                                ) : selectedCall.outcome === 'appointment set' ? (
                                  <>
                                    <div className="flex items-start gap-2">
                                      <div className="w-1 h-1 bg-gray-400 rounded-full mt-2"></div>
                                      <p className="text-sm text-gray-700">Agent will pass customer details to service team for recall and oil change scheduling</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <div className="w-1 h-1 bg-gray-400 rounded-full mt-2"></div>
                                      <p className="text-sm text-gray-700">Service team will call customer by 9 AM tomorrow to confirm recall part availability</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <div className="w-1 h-1 bg-gray-400 rounded-full mt-2"></div>
                                      <p className="text-sm text-gray-700">Service team will confirm the availability of a loaner car during the appointment.</p>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex items-start gap-2">
                                      <div className="w-1 h-1 bg-gray-400 rounded-full mt-2"></div>
                                      <p className="text-sm text-gray-700">Agent to pass customer's budget information to sales manager for pricing discussion</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <div className="w-1 h-1 bg-gray-400 rounded-full mt-2"></div>
                                      <p className="text-sm text-gray-700">Customer to consider scheduling a visit or test drive and reach out when ready.</p>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800">Customer Query Resolved</span>
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="appointment" className="space-y-6">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Appointment Details
                            </h3>
                            {selectedCall.appointment === 'Yes' || selectedCall.outcome === 'appointment set' ? (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                  <span className="text-sm font-medium text-green-800">Appointment Scheduled</span>
                                </div>
                                <div className="space-y-2 text-sm text-gray-700">
                                  <p><span className="font-medium">Service:</span> Oil Change & Recall Service</p>
                                  <p><span className="font-medium">Date:</span> Monday, 8:00 AM</p>
                                  <p><span className="font-medium">Location:</span> Avis Motors Service Center</p>
                                  <p><span className="font-medium">Estimated Duration:</span> 2-3 hours</p>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <X className="w-5 h-5 text-gray-500" />
                                  <span className="text-sm font-medium text-gray-700">No Appointment Scheduled</span>
                                </div>
                                <p className="text-sm text-gray-600">Customer requested information only. No appointment was made during this call.</p>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="transcript" className="space-y-6">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                              <Activity className="w-4 h-4" />
                              Call Transcript
                            </h3>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <p className="text-sm text-gray-600 italic">
                                Call transcript is not available for this demo. In a real implementation, 
                                this would show the full conversation between the agent and customer.
                              </p>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                      )}
                    </>
                  )}
                    
                    {/* Close button */}
                    <button
                      onClick={() => setIsCallDetailsOpen(false)}
                      className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    </div>
                  </div>
                </div>
              
              {/* Custom CSS for animations */}
              <style jsx>{`
                @keyframes animate-pulse-border {
                  0%, 100% {
                    border-color: rgb(187, 247, 208);
                  }
                  50% {
                    border-color: rgb(134, 239, 172);
                  }
                }
                
                .animate-pulse-border {
                  animation: animate-pulse-border 2s infinite;
                }
                
                @keyframes slideInFromTop {
                  0% {
                    transform: translateY(-20px);
                    opacity: 0;
                  }
                  100% {
                    transform: translateY(0);
                    opacity: 1;
                  }
                }
                
                .animate-slideInFromTop {
                  animation: slideInFromTop 0.5s ease-out;
                }
              `}</style>
              </div>
            </TabsContent>
            
            {/* Queue Tab */}
            <TabsContent value="queue" className="mt-0">
              <div className="space-y-6">
                {/* Queue Metrics */}
                <div className={`grid grid-cols-3 gap-6 transition-all duration-300 ease-in-out ${
                  isCallDetailsOpen ? 'w-[calc(100%-600px-24px)] pr-4' : 'w-full'
                }`}>
                  <div className="bg-white rounded-[16px] border border-gray-200 p-4 text-center">
                    <p className="text-sm font-medium text-gray-600 mb-2">Total Queued</p>
                    <p className="text-3xl font-bold text-orange-600">{filteredQueuedCalls.length}</p>
                  </div>
                  <div className="bg-white rounded-[16px] border border-gray-200 p-4 text-center">
                    <p className="text-sm font-medium text-gray-600 mb-2">Failed Calls</p>
                    <p className="text-3xl font-bold text-red-600">{filteredQueuedCalls.filter(call => call.status === 'Failed').length}</p>
                  </div>
                  <div className="bg-white rounded-[16px] border border-gray-200 p-4 text-center">
                    <p className="text-sm font-medium text-gray-600 mb-2">No Answer</p>
                    <p className="text-3xl font-bold text-yellow-600">{filteredQueuedCalls.filter(call => call.status === 'No Answer').length}</p>
                  </div>
                </div>

                {/* Queue Feed */}
                <Card className="border-0 bg-gray-50 rounded-[16px]">
                  <CardHeader className="px-6 pt-6 pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[18px] font-semibold text-[#1A1A1A]">
                        Call Queue
                      </CardTitle>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          <span className="text-sm font-medium text-orange-600">
                            QUEUED
                          </span>
                        </div>
                        
                        {/* Filters for Queue */}
                        <div className="flex gap-3">
                          <div className="w-80">
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
                          
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-40 h-10 border-[#E5E7EB] rounded-md focus:border-[#4600F2] focus:ring-[#4600F2] bg-white">
                              <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Statuses</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                              <SelectItem value="no-answer">No Answer</SelectItem>
                              <SelectItem value="voicemail">Voicemail</SelectItem>
                              <SelectItem value="busy">Busy</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                            <SelectTrigger className="w-40 h-10 border-[#E5E7EB] rounded-md focus:border-[#4600F2] focus:ring-[#4600F2] bg-white">
                              <SelectValue placeholder="All Outcomes" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Outcomes</SelectItem>
                              <SelectItem value="retry">Retry Scheduled</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                              <SelectItem value="abandoned">Abandoned</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 pt-2">
                    <div className="space-y-8 max-h-[700px] overflow-y-auto">
                      {currentPageQueuedCalls.length > 0 ? (
                        currentPageQueuedCalls.map((call, index) => (
                          <div key={call.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-300">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900">{call.customer}</h3>
                                  <div className={`${statusColors[call.status]} border font-medium rounded-full text-xs px-3 py-1 shadow-sm`}>
                                    {call.status}
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                  {/* Customer Info */}
                                  <div>
                                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                                      <Phone className="w-4 h-4" />
                                      <span className="text-sm">{call.phone}</span>
                                    </div>
                                    {call.email && (
                                      <div className="text-sm text-gray-600">{call.email}</div>
                                    )}
                                  </div>
                                  
                                  {/* Vehicle Info */}
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 mb-1">
                                      {call.year} {call.make} {call.model}
                                    </div>
                                    <div className="font-mono text-xs text-gray-600">
                                      VIN: {call.vin}
                                    </div>
                                  </div>
                                  
                                  {/* Call Details */}
                                  <div className="text-right">
                                    <div className="text-sm text-gray-900 mb-1">
                                      {formatDate(call.callTime)}
                                    </div>
                                    <div className="flex items-center justify-end gap-1 text-gray-600 mb-1">
                                      <Clock className="h-3 w-3" />
                                      <span className="font-mono text-xs">{call.duration}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Queue Status and Actions */}
                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                  <div className="flex items-center gap-4">
                                    <span className="text-sm font-medium text-gray-900">
                                      Reason: <span className="text-gray-700 font-semibold">{call.outcome}</span>
                                    </span>
                                    <div className="flex items-center gap-1 text-orange-600 font-medium text-sm">
                                      <RefreshCw className="h-4 w-4" />
                                      <span>Retry Scheduled</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Button variant="outline" size="sm" className="text-xs hover:bg-orange-50 border-orange-200">
                                      Retry Now
                                    </Button>
                                 
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-16">
                          <div className="text-[#6B7280] mb-6">
                            <Clock className="h-16 w-16 mx-auto" />
                          </div>
                          <h3 className="text-[20px] font-semibold text-[#1A1A1A] leading-[1.4] mb-3">No calls in queue</h3>
                          <p className="text-[#6B7280] text-sm leading-[1.5]">
                            All calls have been processed successfully
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Queue Pagination */}
                    {filteredQueuedCalls.length > 0 && (
                      <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 text-sm text-[#6B7280]">
                        <div>
                          Showing {queueStartIndex + 1}-{Math.min(queueEndIndex, filteredQueuedCalls.length)} of {filteredQueuedCalls.length} queued calls
                        </div>
                        {totalQueuePages > 1 && (
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
                              {Array.from({ length: totalQueuePages }, (_, i) => i + 1)
                                .filter(page => {
                                  return page === 1 || page === totalQueuePages || Math.abs(page - currentPage) <= 1
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
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalQueuePages))}
                              disabled={currentPage === totalQueuePages}
                              className="h-8 px-3 text-xs"
                            >
                              Next
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
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
      </div>
      <Toaster />
    </div>  
  )
}
