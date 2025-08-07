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
  Running: 'bg-info/10 text-info border-info/20',
  Completed: 'bg-success/10 text-success border-success/20',
  Scheduled: 'bg-warning/10 text-warning border-warning/20',
  Failed: 'bg-error/10 text-error border-error/20'
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
      <div className="page-container">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-page-heading text-text-primary">Campaign Analytics</h1>
              <p className="text-subheading text-text-secondary max-w-2xl">
                Monitor performance metrics and analyze the success of your AI-powered outbound campaigns
              </p>
            </div>
            <Link href="/setup">
              <Button className="btn-primary">
                <Plus className="icon-medium mr-2" />
                New Campaign
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-80">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary" />
                  <Input
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-10 text-body border-border bg-surface focus:bg-surface transition-all duration-200"
                  />
                </div>
              </div>
              
              <div className="flex gap-4 ml-auto">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-52 h-10 text-body border-border bg-surface">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-border shadow-lg">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={useCaseFilter} onValueChange={setUseCaseFilter}>
                  <SelectTrigger className="w-full sm:w-52 h-10 text-body border-border bg-surface">
                    <SelectValue placeholder="All Use Cases" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-border shadow-lg">
                    <SelectItem value="all">All Use Cases</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Campaign List */}
        <div className="space-y-6">
          {filteredCampaigns.map((campaign) => {
            const StatusIcon = statusIcons[campaign.status]
            
            return (
              <Card key={campaign.id} className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden rounded-xl">
                <Link href={`/results/${campaign.id}`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <h3 className="text-page-heading text-text-primary group-hover:text-primary transition-colors duration-200">
                          {campaign.name}
                        </h3>
                        <div className="flex items-center gap-3">
                          <Badge className={`${useCaseColors[campaign.useCase]} border px-3 py-1 text-small`}>
                            {campaign.useCase}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {campaign.status === 'Completed' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="btn-secondary"
                            onClick={(e) => e.preventDefault()}
                          >
                            <Download className="icon-small mr-2" />
                            Download Report
                          </Button>
                        )}
                        <div className="text-small text-text-secondary bg-muted px-3 py-2 rounded-md">
                          {campaign.status === 'Running' && `ETA: ${campaign.eta}`}
                          {campaign.status === 'Completed' && campaign.completedAt && `Completed: ${formatDate(campaign.completedAt)}`}
                          {campaign.status === 'Scheduled' && campaign.scheduledFor && `Scheduled: ${formatDate(campaign.scheduledFor)}`}
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-body text-text-secondary bg-muted px-4 py-2 rounded-md inline-block">
                        {campaign.subUseCase}
                      </p>
                    </div>

                    {campaign.status === 'Running' && (
                      <div className="mb-6">
                        <div className="flex justify-between text-small text-text-secondary mb-3">
                          <span>Progress: {campaign.progress}%</span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-warning" />
                            ETA: {campaign.eta}
                          </span>
                        </div>
                        <Progress value={campaign.progress} className="h-2 bg-muted" />
                      </div>
                    )}

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-3 p-4 bg-info/5 rounded-lg border border-info/10">
                        <div className="p-2 bg-info rounded-lg">
                          <Phone className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-small text-text-secondary uppercase tracking-wide">Calls Placed</p>
                          <p className="text-body font-medium text-text-primary">{campaign.callsPlaced}/{campaign.totalRecords}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-4 bg-success/5 rounded-lg border border-success/10">
                        <div className="p-2 bg-success rounded-lg">
                          <BarChart3 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-small text-text-secondary uppercase tracking-wide">Answer Rate</p>
                          <p className="text-body font-medium text-text-primary">{campaign.answerRate}%</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-4 rounded-lg border border-border">
                        <div className="p-2 bg-primary rounded-lg">
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-small text-text-secondary uppercase tracking-wide">Appointments</p>
                          <p className="text-body font-medium text-text-primary">{campaign.appointmentsBooked}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-4 rounded-lg border border-border">
                        <div className={`p-2 rounded-lg ${
                          campaign.status === 'Running' ? 'bg-info' :
                          campaign.status === 'Completed' ? 'bg-success' :
                          campaign.status === 'Scheduled' ? 'bg-warning' :
                          'bg-error'
                        }`}>
                          <StatusIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-small text-text-secondary uppercase tracking-wide">Status</p>
                          <p className="text-small font-medium text-text-primary">{campaign.status}</p>
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
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                <Search className="h-10 w-10 text-text-secondary" />
              </div>
              <h3 className="text-page-heading text-text-primary mb-3">No campaigns found</h3>
              <p className="text-body text-text-secondary mb-8 max-w-md mx-auto">
                {searchTerm || statusFilter !== 'all' || useCaseFilter !== 'all'
                  ? 'Try adjusting your search criteria or filters to find the campaigns you\'re looking for'
                  : 'Ready to start your first AI-powered outbound campaign? Launch the campaign builder to get started.'}
              </p>
              <Link href="/setup">
                <Button size="lg" className="btn-primary">
                  <Plus className="icon-medium mr-2" />
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
