'use client'

import { useState, useEffect } from 'react'
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

// Mock campaign data that updates
const getCampaignData = (progress = 65) => ({
  id: 'camp_2024_001',
  name: 'Q4 Maintenance Reminders',
  useCase: 'Service',
  subUseCase: 'Maintenance Reminder',
  status: progress >= 100 ? 'Completed' : 'Running',
  progress: Math.min(progress, 100),
  eta: progress >= 100 ? null : `${Math.ceil((100 - progress) / 10)} hours`,
  callsPlaced: Math.floor((progress / 100) * 240),
  totalRecords: 240,
  answerRate: 68 + Math.floor(Math.random() * 5),
  appointmentsBooked: Math.floor((progress / 100) * 35),
  successRate: 72 + Math.floor(Math.random() * 6),
  createdAt: new Date('2024-01-15T10:30:00'),
  startedAt: new Date('2024-01-15T10:35:00')
})

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
  Connected: 'bg-green-100 text-green-800 border-green-200',
  Voicemail: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'No Answer': 'bg-red-100 text-red-800 border-red-200'
}

const outcomeColors: Record<string, string> = {
  Success: 'bg-green-100 text-green-800 border-green-200',
  Failure: 'bg-red-100 text-red-800 border-red-200',
  Pending: 'bg-gray-100 text-gray-800 border-gray-200'
}

export default function CampaignDetail() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [outcomeFilter, setOutcomeFilter] = useState('all')
  const [campaignData, setCampaignData] = useState(getCampaignData(65))
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Auto-refresh every 5 seconds for running campaigns
  useEffect(() => {
    if (campaignData.status === 'Running') {
      const interval = setInterval(() => {
        setCampaignData(prev => {
          const newProgress = Math.min(prev.progress + Math.random() * 3, 100)
          return getCampaignData(newProgress)
        })
        setLastRefresh(new Date())
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [campaignData.status])

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
    setCampaignData(prev => getCampaignData(prev.progress))
    setLastRefresh(new Date())
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link href="/results" className="flex items-center text-gray-500 hover:text-gray-700">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Campaign Results
                </Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900 font-medium">{campaignData.name}</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{campaignData.name}</h1>
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                  {campaignData.useCase} - {campaignData.subUseCase}
                </Badge>
                <Badge className={`${campaignData.status === 'Running' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-green-100 text-green-800 border-green-200'} px-3 py-1`}>
                  {campaignData.status === 'Running' ? <Clock className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                  {campaignData.status}
                </Badge>
                {campaignData.status === 'Running' && (
                  <div className="flex items-center text-sm text-gray-500">
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Last updated: {lastRefresh.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {campaignData.status === 'Running' && (
                <Button variant="outline" onClick={handleRefresh} className="px-6">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              )}
              {campaignData.status === 'Completed' && (
                <Button variant="outline" className="px-6">
                  <Download className="h-4 w-4 mr-2" />
                  Download Full Report
                </Button>
              )}
              <Link href="/setup">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  New Campaign
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* KPI Cards - Move this section up */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
       <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-1">Calls Placed</p>
                  <p className="text-3xl font-bold text-blue-900">{campaignData.callsPlaced}</p>
                  <p className="text-xs text-blue-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {campaignData.progress}% complete
                  </p>
                </div>
                <div className="p-3 bg-blue-600 rounded-xl">
                  <Phone className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
        <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">Answer Rate</p>
                  <p className="text-3xl font-bold text-green-900">{campaignData.answerRate}%</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Above average
                  </p>
                </div>
                <div className="p-3 bg-green-600 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 mb-1">Appointments</p>
                  <p className="text-3xl font-bold text-purple-900">{campaignData.appointmentsBooked}</p>
                  <p className="text-xs text-purple-600 flex items-center mt-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    {Math.round((campaignData.appointmentsBooked / campaignData.callsPlaced) * 100) || 0}% conversion
                  </p>
                </div>
                <div className="p-3 bg-purple-600 rounded-xl">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 mb-1">Success Rate</p>
                  <p className="text-3xl font-bold text-orange-900">{campaignData.successRate}%</p>
                  <p className="text-xs text-orange-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Excellent
                  </p>
                </div>
                <div className="p-3 bg-orange-600 rounded-xl">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Overview - More Compact */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Progress Card */}
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 p-4">
              <CardTitle className="text-lg">
                {campaignData.status === 'Running' ? 'Campaign Progress' : 'Campaign Results'}
              </CardTitle>
              <CardDescription className="text-sm">
                {campaignData.status === 'Running' 
                  ? 'Real-time calling progress and metrics' 
                  : 'Final campaign results and performance'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700 text-base">
                    Progress: {campaignData.callsPlaced} of {campaignData.totalRecords} calls
                  </span>
                  {campaignData.status === 'Running' && (
                    <span className="text-gray-600 flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-1" />
                      ETA: {campaignData.eta}
                    </span>
                  )}
                </div>
                {campaignData.status === 'Running' ? (
                  <>
                    <Progress value={campaignData.progress} className="h-3" />
                    <div className="text-center text-xl font-bold text-gray-900">
                      {campaignData.progress}% Complete
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      Campaign Completed
                    </div>
                    <div className="text-sm text-gray-600">
                      All {campaignData.totalRecords} calls have been processed
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Campaign Info */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-4">
              <CardTitle className="text-lg">Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Campaign ID</p>
                <p className="text-sm font-mono text-gray-900 mt-1">{campaignData.id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Created</p>
                <p className="text-sm text-gray-900 mt-1">{formatDate(campaignData.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Started</p>
                <p className="text-sm text-gray-900 mt-1">{formatDate(campaignData.startedAt)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Records</p>
                <p className="text-sm text-gray-900 mt-1">{campaignData.totalRecords}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call Details */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl">Call Details</CardTitle>
                <CardDescription className="text-sm">Individual call results and outcomes</CardDescription>
              </div>
              {campaignData.status === 'Completed' && (
                <Button variant="outline" size="sm" className="px-4">
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
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search by customer, phone, or VIN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 text-lg"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 h-12">
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
                <SelectTrigger className="w-full sm:w-48 h-12">
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
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-900">Customer</TableHead>
                    <TableHead className="font-semibold text-gray-900">Phone</TableHead>
                    <TableHead className="font-semibold text-gray-900">Vehicle</TableHead>
                    <TableHead className="font-semibold text-gray-900">VIN</TableHead>
                    <TableHead className="font-semibold text-gray-900">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900">Outcome</TableHead>
                    <TableHead className="font-semibold text-gray-900">Appointment</TableHead>
                    <TableHead className="font-semibold text-gray-900">Call Time</TableHead>
                    <TableHead className="font-semibold text-gray-900">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalls.map((call) => (
                    <TableRow key={call.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">{call.customer}</TableCell>
                      <TableCell className="text-gray-900">{call.phone}</TableCell>
                      <TableCell className="text-gray-900">{call.year} {call.make} {call.model}</TableCell>
                      <TableCell className="font-mono text-sm text-gray-900">{call.vin}</TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[call.status]} border font-medium`}>
                          {call.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${outcomeColors[call.outcome]} border font-medium`}>
                          {call.outcome}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={call.appointment === 'Yes' ? 'default' : 'secondary'} className="font-medium">
                          {call.appointment}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-900">{formatDate(call.callTime)}</TableCell>
                      <TableCell className="font-mono text-gray-900">{call.duration}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredCalls.length === 0 && (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-6">
                  <Search className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">No calls found</h3>
                <p className="text-gray-600 text-lg">
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
