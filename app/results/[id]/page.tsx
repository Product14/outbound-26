'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Search, Phone, CheckCircle, Clock, AlertCircle, Calendar, BarChart3, TrendingUp, Users, ArrowLeft, RefreshCw } from 'lucide-react'
import Link from "next/link"

// Function to load campaign data by ID
const loadCampaignById = (campaignId: string) => {
  try {
    // Check localStorage for user-created campaigns
    const storedCampaigns = localStorage.getItem('outbound-campaigns')
    if (storedCampaigns) {
      const campaigns = JSON.parse(storedCampaigns)
      const userCampaign = campaigns.find((c: any) => c.id === campaignId)
      if (userCampaign) {
        return userCampaign
      }
    }
    
    // If not found, return null
    return null
  } catch (error) {
    console.error('Error loading campaign:', error)
    return null
  }
}

// Mock call detail data
const callDetails = [
  {
    id: 1,
    customer: 'John Smith',
    phone: '(555) 123-4567',
    vin: '1HGBH41JXMN109186',
    make: 'Honda',
    model: 'Civic',
    year: '2021',
    status: 'Connected',
    outcome: 'Success',
    appointment: 'Yes',
    callTime: '2024-01-15T11:15:00',
    duration: '3:45'
  },
  {
    id: 2,
    customer: 'Sarah Johnson',
    phone: '(555) 234-5678',
    vin: '2T1BURHE0JC123456',
    make: 'Toyota',
    model: 'Corolla',
    year: '2020',
    status: 'Voicemail',
    outcome: 'Pending',
    appointment: 'No',
    callTime: '2024-01-15T11:20:00',
    duration: '0:30'
  },
  {
    id: 3,
    customer: 'Mike Davis',
    phone: '(555) 345-6789',
    vin: '3VW2B7AJ8KM123789',
    make: 'Volkswagen',
    model: 'Jetta',
    year: '2019',
    status: 'Connected',
    outcome: 'Success',
    appointment: 'Yes',
    callTime: '2024-01-15T11:25:00',
    duration: '4:12'
  },
  {
    id: 4,
    customer: 'Lisa Wilson',
    phone: '(555) 456-7890',
    vin: '1FA6P8TH0J5123456',
    make: 'Ford',
    model: 'Mustang',
    year: '2022',
    status: 'No Answer',
    outcome: 'Failure',
    appointment: 'No',
    callTime: '2024-01-15T11:30:00',
    duration: '0:00'
  },
  {
    id: 5,
    customer: 'David Brown',
    phone: '(555) 567-8901',
    vin: '1G1ZD5ST8JF123456',
    make: 'Chevrolet',
    model: 'Malibu',
    year: '2021',
    status: 'Connected',
    outcome: 'Failure',
    appointment: 'No',
    callTime: '2024-01-15T11:35:00',
    duration: '2:18'
  }
]

const statusColors: Record<string, string> = {
  Connected: 'bg-[#22C55E] text-white border-[#22C55E]',
  Voicemail: 'bg-[#FACC15] text-[#1A1A1A] border-[#FACC15]',
  'No Answer': 'bg-[#EF4444] text-white border-[#EF4444]'
}

const outcomeColors: Record<string, string> = {
  Success: 'bg-[#22C55E] text-white border-[#22C55E]',
  Failure: 'bg-[#EF4444] text-white border-[#EF4444]',
  Pending: 'bg-[#6B7280] text-white border-[#6B7280]'
}

export default function CampaignDetail() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params?.id as string
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [outcomeFilter, setOutcomeFilter] = useState('all')
  const [campaignData, setCampaignData] = useState<any>(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [campaignNotFound, setCampaignNotFound] = useState(false)

  // Load campaign data when component mounts or campaignId changes
  useEffect(() => {
    if (campaignId) {
      const campaign = loadCampaignById(campaignId)
      if (campaign) {
        setCampaignData(campaign)
        setCampaignNotFound(false)
      } else {
        setCampaignNotFound(true)
      }
      setIsLoading(false)
    }
  }, [campaignId])

  // Auto-refresh every 5 seconds for running campaigns
  useEffect(() => {
    if (campaignData && campaignData.status === 'Running') {
      const interval = setInterval(() => {
        setCampaignData((prev: any) => {
          const newProgress = Math.min(prev.progress + Math.random() * 3, 100)
          const newStatus = newProgress >= 100 ? 'Completed' : 'Running'
          return {
            ...prev,
            progress: newProgress,
            status: newStatus,
            callsPlaced: Math.floor((newProgress / 100) * prev.totalRecords),
            answerRate: Math.max(65, Math.min(85, prev.answerRate + (Math.random() - 0.5) * 2)),
            appointmentsBooked: Math.floor((newProgress / 100) * (prev.totalRecords * 0.15)),
            eta: newStatus === 'Completed' ? null : `${Math.ceil((100 - newProgress) / 10)} hours`
          }
        })
        setLastRefresh(new Date())
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [campaignData?.status])

  const filteredCalls = callDetails.filter(call => {
    const matchesSearch = call.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         call.phone.includes(searchTerm) ||
                         call.vin.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || call.status.toLowerCase().replace(' ', '-') === statusFilter
    const matchesOutcome = outcomeFilter === 'all' || call.outcome.toLowerCase() === outcomeFilter
    
    return matchesSearch && matchesStatus && matchesOutcome
  })

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleRefresh = () => {
    if (campaignId) {
      const refreshedCampaign = loadCampaignById(campaignId)
      if (refreshedCampaign) {
        setCampaignData(refreshedCampaign)
      }
    }
    setLastRefresh(new Date())
  }

  // Loading state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="px-12 py-8 bg-[#F4F5F8] min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-body text-text-secondary">Loading campaign data...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Campaign not found state
  if (campaignNotFound || !campaignData) {
    return (
      <MainLayout>
        <div className="px-12 py-8 bg-[#F4F5F8] min-h-screen">
          <div className="mb-8">
            <Link href="/results">
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
                The campaign you're looking for doesn't exist or may have been deleted.
              </p>
              <Link href="/results">
                <Button className="btn-primary">
                  View All Campaigns
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="px-12 py-8 bg-[#F4F5F8] min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/results" className="flex items-center text-[#6B7280] hover:text-[#1A1A1A] transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-[20px] font-semibold text-[#1A1A1A] leading-[1.4]">{campaignData.name}</h1>
          </div>
          <p className="text-sm text-[#6B7280] leading-[1.5] ml-9">{campaignData.useCase} - {campaignData.subUseCase}</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border border-[#1A1A1A]/10 bg-white rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-start space-x-6">
                <div className="p-3 bg-[#F0F4FF] rounded-lg flex-shrink-0">
                  <Phone className="h-6 w-6 text-[#4600F2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[#1A1A1A]/60 font-semibold text-sm leading-[1.4] mb-1">Calls Placed</h3>
                  <p className="text-[#1A1A1A] text-[26px] font-bold leading-[1.4]">
                    {campaignData.callsPlaced}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-[#1A1A1A]/10 bg-white rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-start space-x-6">
                <div className="p-3 bg-[#F0FDF4] rounded-lg flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-[#22C55E]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[#1A1A1A]/60 font-semibold text-sm leading-[1.4] mb-1">Answer Rate</h3>
                  <p className="text-[#1A1A1A] text-[26px] font-bold leading-[1.4]">
                    {campaignData.answerRate}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-[#1A1A1A]/10 bg-white rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-start space-x-6">
                <div className="p-3 bg-[#FEFCE8] rounded-lg flex-shrink-0">
                  <Calendar className="h-6 w-6 text-[#F59E0B]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[#1A1A1A]/60 font-semibold text-sm leading-[1.4] mb-1">Appointments</h3>
                  <p className="text-[#1A1A1A] text-[26px] font-bold leading-[1.4]">
                    {campaignData.appointmentsBooked}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-[#1A1A1A]/10 bg-white rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-start space-x-6">
                <div className="p-3 bg-[#EFF6FF] rounded-lg flex-shrink-0">
                  <BarChart3 className="h-6 w-6 text-[#3B82F6]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[#1A1A1A]/60 font-semibold text-sm leading-[1.4] mb-1">Success Rate</h3>
                  <p className="text-[#1A1A1A] text-[26px] font-bold leading-[1.4]">
                    {campaignData.successRate}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Details */}
        <div className="mb-8">
          <Card className="border border-[#1A1A1A]/10 bg-white rounded-xl">
            <CardHeader className="p-6">
              <div>
                <CardTitle className="text-[20px] font-semibold text-[#1A1A1A] leading-[1.4]">
                  Campaign Details
                </CardTitle>
                <CardDescription className="text-sm text-[#6B7280] leading-[1.5] mt-1">
                  Campaign information and configuration
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#F4F5F8] rounded-lg">
                  <div>
                    <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Campaign ID</p>
                    <p className="text-sm font-mono text-[#1A1A1A] mt-1">{campaignData.id}</p>
                  </div>
                  <div className="p-2 bg-[#4600F2]/10 rounded-lg">
                    <div className="w-4 h-4 bg-[#4600F2] rounded-sm"></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-[#F4F5F8] rounded-lg">
                  <div>
                    <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Created</p>
                    <p className="text-sm text-[#1A1A1A] mt-1">{formatDate(campaignData.createdAt)}</p>
                  </div>
                  <div className="p-2 bg-[#22C55E]/10 rounded-lg">
                    <Calendar className="h-4 w-4 text-[#22C55E]" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-[#F4F5F8] rounded-lg">
                  <div>
                    <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Started</p>
                    <p className="text-sm text-[#1A1A1A] mt-1">{formatDate(campaignData.startedAt)}</p>
                  </div>
                  <div className="p-2 bg-[#F59E0B]/10 rounded-lg">
                    <Clock className="h-4 w-4 text-[#F59E0B]" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-[#F4F5F8] rounded-lg">
                  <div>
                    <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Total Records</p>
                    <p className="text-sm text-[#1A1A1A] mt-1">{campaignData.totalRecords}</p>
                  </div>
                  <div className="p-2 bg-[#3B82F6]/10 rounded-lg">
                    <Users className="h-4 w-4 text-[#3B82F6]" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Progress */}
        <div className="mb-8">
          <Card className="border border-[#1A1A1A]/10 bg-white rounded-xl">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[20px] font-semibold text-[#1A1A1A] leading-[1.4]">
                    {campaignData.status === 'Running' ? 'Campaign Progress' : 'Campaign Results'}
                  </CardTitle>
                  <CardDescription className="text-sm text-[#6B7280] leading-[1.5] mt-1">
                    {campaignData.status === 'Running' 
                      ? 'Real-time calling progress and metrics' 
                      : 'Final campaign results and performance'
                    }
                  </CardDescription>
                </div>
                {campaignData.status === 'Running' && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-[#3B82F6]/10 rounded-full">
                    <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-pulse"></div>
                    <span className="text-xs text-[#3B82F6] font-medium">Live</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#1A1A1A] text-sm leading-[1.5]">
                    Progress: {campaignData.callsPlaced} of {campaignData.totalRecords} calls
                  </span>
                  {campaignData.status === 'Running' && (
                    <span className="text-[#6B7280] flex items-center text-sm bg-[#F4F5F8] px-3 py-1 rounded-full">
                      <Clock className="h-4 w-4 mr-1" />
                      ETA: {campaignData.eta}
                    </span>
                  )}
                </div>
                {campaignData.status === 'Running' ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <Progress value={campaignData.progress} className="h-3 bg-[#F4F5F8] rounded-full" />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#4600F2]/20 to-[#3B82F6]/20 rounded-full"></div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#1A1A1A] mb-1">
                        {campaignData.progress.toFixed(1)}%
                      </div>
                      <div className="text-sm text-[#6B7280]">Complete</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-[#22C55E]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-[#22C55E]" />
                    </div>
                    <div className="text-2xl font-bold text-[#22C55E] mb-2">
                      Campaign Completed
                    </div>
                    <div className="text-sm text-[#6B7280]">
                      All {campaignData.totalRecords} calls have been processed successfully
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call Details */}
        <Card className="border-0 shadow-xl bg-white rounded-lg">
          <CardHeader className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-[20px] font-semibold text-[#1A1A1A] leading-[1.4]">Call Details</CardTitle>
                <CardDescription className="text-sm text-[#6B7280] leading-[1.5]">Individual call results and outcomes</CardDescription>
              </div>
              {campaignData.status === 'Completed' && (
                <Button variant="outline" size="sm" className="h-9 px-4 text-sm border-[#E5E7EB] text-[#1A1A1A] hover:bg-[#F4F5F8] rounded-lg">
                  <Download className="h-4 w-4 mr-2" />
                  Download Full Report
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6B7280]" />
                  <Input
                    placeholder="Search by customer, phone, or VIN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 text-sm border-[#E5E7EB] rounded-md focus:border-[#4600F2] focus:ring-[#4600F2]"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 h-12 border-[#E5E7EB] rounded-md focus:border-[#4600F2] focus:ring-[#4600F2]">
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
                <SelectTrigger className="w-full sm:w-48 h-12 border-[#E5E7EB] rounded-md focus:border-[#4600F2] focus:ring-[#4600F2]">
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

            {/* Table */}
            <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F4F5F8]">
                    <TableHead className="font-semibold text-[#1A1A1A] text-sm">Customer</TableHead>
                    <TableHead className="font-semibold text-[#1A1A1A] text-sm">Phone</TableHead>
                    <TableHead className="font-semibold text-[#1A1A1A] text-sm">Vehicle</TableHead>
                    <TableHead className="font-semibold text-[#1A1A1A] text-sm">VIN</TableHead>
                    <TableHead className="font-semibold text-[#1A1A1A] text-sm">Status</TableHead>
                    <TableHead className="font-semibold text-[#1A1A1A] text-sm">Outcome</TableHead>
                    <TableHead className="font-semibold text-[#1A1A1A] text-sm">Appointment</TableHead>
                    <TableHead className="font-semibold text-[#1A1A1A] text-sm">Call Time</TableHead>
                    <TableHead className="font-semibold text-[#1A1A1A] text-sm">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalls.map((call) => (
                    <TableRow key={call.id} className="hover:bg-[#F4F5F8] border-b border-[#E5E7EB]">
                      <TableCell className="font-medium text-[#1A1A1A] text-sm">{call.customer}</TableCell>
                      <TableCell className="text-[#1A1A1A] text-sm">{call.phone}</TableCell>
                      <TableCell className="text-[#1A1A1A] text-sm">{call.year} {call.make} {call.model}</TableCell>
                      <TableCell className="font-mono text-sm text-[#1A1A1A]">{call.vin}</TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[call.status]} border font-medium rounded-full text-xs px-2 py-1`}>
                          {call.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${outcomeColors[call.outcome]} border font-medium rounded-full text-xs px-2 py-1`}>
                          {call.outcome}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={call.appointment === 'Yes' ? 'default' : 'secondary'} className="font-medium rounded-full text-xs px-2 py-1">
                          {call.appointment}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[#1A1A1A] text-sm">{formatDate(call.callTime)}</TableCell>
                      <TableCell className="font-mono text-[#1A1A1A] text-sm">{call.duration}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

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
      </div>
    </MainLayout>
  )
}
