'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Phone, CheckCircle, Clock, AlertCircle, Calendar, BarChart3, Plus } from 'lucide-react'
import Link from "next/link"

const mockCampaigns = [
  {
    id: 'camp_2024_001',
    name: 'Q4 Maintenance Reminders',
    useCase: 'Service',
    subUseCase: 'Maintenance Reminder',
    status: 'Running',
    progress: 65,
    eta: '2 hours',
    callsPlaced: 156,
    totalRecords: 240,
    answerRate: 68,
    appointmentsBooked: 23,
    createdAt: new Date('2024-01-15T10:30:00')
  },
  {
    id: 'camp_2024_002', 
    name: 'Holiday Sales Follow-up',
    useCase: 'Sales',
    subUseCase: 'Follow-up on Leads',
    status: 'Completed',
    progress: 100,
    callsPlaced: 89,
    totalRecords: 89,
    answerRate: 72,
    appointmentsBooked: 18,
    completedAt: new Date('2024-01-14T16:45:00')
  },
  {
    id: 'camp_2024_003',
    name: 'Recall Notifications - Honda',
    useCase: 'Service',
    subUseCase: 'Recall Notification',
    status: 'Completed',
    progress: 100,
    callsPlaced: 234,
    totalRecords: 234,
    answerRate: 61,
    appointmentsBooked: 31,
    completedAt: new Date('2024-01-12T14:20:00')
  },
  {
    id: 'camp_2024_004',
    name: 'Trade-in Promotion',
    useCase: 'Sales',
    subUseCase: 'Trade-in Offers',
    status: 'Scheduled',
    progress: 0,
    callsPlaced: 0,
    totalRecords: 156,
    answerRate: 0,
    appointmentsBooked: 0,
    scheduledFor: new Date('2024-01-20T09:00:00')
  }
]

const useCaseColors: Record<string, string> = {
  'Sales': 'bg-green-100 text-green-800 border-green-200',
  'Service': 'bg-blue-100 text-blue-800 border-blue-200'
}

const statusColors: Record<string, string> = {
  Running: 'bg-blue-100 text-blue-800 border-blue-200',
  Completed: 'bg-green-100 text-green-800 border-green-200',
  Scheduled: 'bg-orange-100 text-orange-800 border-orange-200',
  Failed: 'bg-red-100 text-red-800 border-red-200'
}

const statusIcons: Record<string, any> = {
  Running: Clock,
  Completed: CheckCircle,
  Scheduled: Calendar,
  Failed: AlertCircle
}

export default function CampaignResults() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [useCaseFilter, setUseCaseFilter] = useState('all')

  const filteredCampaigns = mockCampaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || campaign.status.toLowerCase() === statusFilter
    const matchesUseCase = useCaseFilter === 'all' || campaign.useCase.toLowerCase() === useCaseFilter
    
    return matchesSearch && matchesStatus && matchesUseCase
  })

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 xl:p-10">
        {/* Header */}
        <div className="mb-8 lg:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl lg:text-4xl xl:text-5xl tracking-tight text-neutral-900 mb-3">Campaign Analytics</h1>
              <p className="text-base lg:text-lg text-neutral-600 max-w-2xl">Monitor performance metrics and analyze the success of your AI-powered outbound campaigns</p>
            </div>
            <Link href="/setup">
              <Button className="btn-primary px-6 lg:px-8 py-3 lg:py-3.5 text-sm lg:text-base tracking-wide hover-lift">
                <Plus className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                New Campaign
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card className="glass-card border-0 mb-8 lg:mb-10">
          <CardContent className="p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row gap-4 lg:gap-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <Input
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 lg:h-14 text-base lg:text-lg border-gray-200 bg-white/80 backdrop-blur-sm focus:bg-white transition-all duration-200"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-52 h-12 lg:h-14 text-base border-gray-200 bg-white/80 backdrop-blur-sm">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-xl border-gray-200">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={useCaseFilter} onValueChange={setUseCaseFilter}>
                <SelectTrigger className="w-full sm:w-52 h-12 lg:h-14 text-base border-gray-200 bg-white/80 backdrop-blur-sm">
                  <SelectValue placeholder="All Use Cases" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-xl border-gray-200">
                  <SelectItem value="all">All Use Cases</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Campaign List */}
        <div className="space-y-6 lg:space-y-8">
          {filteredCampaigns.map((campaign) => {
            const StatusIcon = statusIcons[campaign.status]
            
            return (
              <Card key={campaign.id} className="group glass-card border-0 hover-lift cursor-pointer overflow-hidden">
                <Link href={`/results/${campaign.id}`}>
                  <CardContent className="p-6 lg:p-8 xl:p-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 lg:mb-8 gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <h3 className="text-xl lg:text-2xl tracking-tight text-neutral-900 group-hover:text-indigo-700 transition-colors duration-200">{campaign.name}</h3>
                        <div className="flex items-center gap-3">
                          <Badge className={`${useCaseColors[campaign.useCase]} border-0 shadow-sm px-3 py-1.5 text-xs tracking-wide`}>
                            {campaign.useCase}
                          </Badge>
                          <Badge className={`${statusColors[campaign.status]} border-0 shadow-sm px-3 py-1.5 text-xs tracking-wide flex items-center`}>
                            <StatusIcon className="h-3 w-3 mr-1.5" />
                            {campaign.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {campaign.status === 'Completed' && (
                          <Button variant="outline" size="sm" className="btn-secondary px-4 py-2" onClick={(e) => e.preventDefault()}>
                            <Download className="h-4 w-4 mr-2" />
                            Download Report
                          </Button>
                        )}
                        <div className="text-sm text-neutral-500 bg-gray-50 px-3 py-2 rounded-lg">
                          {campaign.status === 'Running' && `ETA: ${campaign.eta}`}
                          {campaign.status === 'Completed' && campaign.completedAt && `Completed: ${formatDate(campaign.completedAt)}`}
                          {campaign.status === 'Scheduled' && campaign.scheduledFor && `Scheduled: ${formatDate(campaign.scheduledFor)}`}
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-base text-neutral-600 bg-slate-50 px-4 py-2 rounded-lg inline-block">{campaign.subUseCase}</p>
                    </div>

                    {campaign.status === 'Running' && (
                      <div className="mb-8">
                        <div className="flex justify-between text-sm text-neutral-600 mb-4">
                          <span className="tracking-wide">Progress: {campaign.progress}%</span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-amber-500" />
                            ETA: {campaign.eta}
                          </span>
                        </div>
                        <Progress value={campaign.progress} className="h-3 bg-gray-200" />
                      </div>
                    )}

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                      <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                        <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                          <Phone className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500 uppercase tracking-wide">Calls Placed</p>
                          <p className="text-lg lg:text-xl tracking-tight text-neutral-900">{campaign.callsPlaced}/{campaign.totalRecords}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl">
                        <div className="p-3 bg-emerald-500 rounded-xl shadow-lg">
                          <BarChart3 className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500 uppercase tracking-wide">Answer Rate</p>
                          <p className="text-lg lg:text-xl tracking-tight text-neutral-900">{campaign.answerRate}%</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl">
                        <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
                          <Calendar className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500 uppercase tracking-wide">Appointments</p>
                          <p className="text-lg lg:text-xl tracking-tight text-neutral-900">{campaign.appointmentsBooked}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl">
                        <div className="p-3 bg-amber-500 rounded-xl shadow-lg">
                          <StatusIcon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500 uppercase tracking-wide">Status</p>
                          <p className="text-sm tracking-tight text-neutral-900">{campaign.status}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            )
          })}
        </div>

        {filteredCampaigns.length === 0 && (
          <Card className="glass-card border-0">
            <CardContent className="p-12 lg:p-20 text-center">
              <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-slate-100 to-gray-200 rounded-full flex items-center justify-center">
                <Search className="h-12 w-12 text-neutral-400" />
              </div>
              <h3 className="text-2xl lg:text-3xl tracking-tight text-neutral-900 mb-4">No campaigns found</h3>
              <p className="text-neutral-600 mb-10 text-base lg:text-lg max-w-md mx-auto leading-relaxed">
                {searchTerm || statusFilter !== 'all' || useCaseFilter !== 'all'
                  ? 'Try adjusting your search criteria or filters to find the campaigns you\'re looking for'
                  : 'Ready to start your first AI-powered outbound campaign? Launch the campaign builder to get started.'}
              </p>
              <Link href="/setup">
                <Button size="lg" className="btn-primary px-8 lg:px-10 py-3 lg:py-4 text-base lg:text-lg hover-lift">
                  <Plus className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                  Launch Campaign Builder
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
