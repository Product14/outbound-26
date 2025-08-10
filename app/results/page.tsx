'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Phone, CheckCircle, Clock, AlertCircle, Calendar, BarChart3, Plus, Loader2 } from 'lucide-react'
import Link from "next/link"
import { fetchCampaignList, type CampaignListItem } from '@/lib/campaign-api'
import { extractUrlParams } from '@/lib/url-utils'
import { toast } from 'sonner'
import { getShortEstimatedTime } from '@/lib/time-utils'

// Map API campaign type to display format
const mapCampaignType = (campaignType: string): string => {
  if (campaignType === 'recall') return 'Service'
  return campaignType // 'Sales', 'Service', etc.
}

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
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [useCaseFilter, setUseCaseFilter] = useState('all')
        
  // Get URL parameters or use defaults for local testing
  const urlParams = extractUrlParams();

  const [enterpriseId, setEnterpriseId] = useState(urlParams.enterprise_id)
  const [teamId, setTeamId] = useState(urlParams.team_id)

  useEffect(() => {
    setEnterpriseId(urlParams.enterprise_id)
    setTeamId(urlParams.team_id)
  }, [urlParams.enterprise_id, urlParams.team_id])

  // Load campaigns from API on component mount
  useEffect(() => {
    const loadCampaigns = async () => {
      if (!enterpriseId || !teamId) return;
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetchCampaignList(enterpriseId || '', teamId || '')
        
        if (response.success) {
          setCampaigns(response.campaigns)
          console.log('Loaded campaigns:', response.campaigns)
        } else {
          throw new Error('Failed to fetch campaigns')
        }
      } catch (error) {
        console.error('Error loading campaigns:', error)
        setError(error instanceof Error ? error.message : 'Failed to load campaigns')
        setCampaigns([])
      } finally {
        setLoading(false)
      }
    }

    loadCampaigns()
  }, [enterpriseId, teamId])

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || campaign.status.toLowerCase() === statusFilter
    const campaignType = mapCampaignType(campaign.campaignType)
    const matchesUseCase = useCaseFilter === 'all' || campaignType.toLowerCase() === useCaseFilter
    
    return matchesSearch && matchesStatus && matchesUseCase
  })

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

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-body text-text-secondary">Loading campaigns...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-error/10 rounded-full flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-error" />
              </div>
              <h3 className="text-page-heading text-text-primary mb-3">Failed to load campaigns</h3>
              <p className="text-body text-text-secondary mb-8 max-w-md mx-auto">
                {error}
              </p>
              <Button onClick={() => window.location.reload()} className="btn-primary">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Campaign List */}
        {!loading && !error && (
          <div className="space-y-6">
            {filteredCampaigns.map((campaign) => {
              const StatusIcon = statusIcons[campaign.status] || CheckCircle
              const campaignType = mapCampaignType(campaign.campaignType)
              
              return (
                <Card key={campaign.campaignId} className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden rounded-xl">
                  <Link href={`/results/${campaign.campaignId}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <h3 className="text-page-heading text-text-primary group-hover:text-primary transition-colors duration-200">
                            {campaign.name}
                          </h3>
                          <div className="flex items-center gap-3">
                            <Badge className={`${useCaseColors[campaignType]} border px-3 py-1 text-small`}>
                              {campaignType}
                            </Badge>
                          </div>
                        </div>
                        
                      </div>

                      {campaign.campaignUseCase && (
                        <div className="mb-6">
                          <p className="text-body text-text-secondary bg-muted px-4 py-2 rounded-md inline-block">
                            {campaign.campaignUseCase.replace('_', ' ').replace('notificaiton', 'notification')}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center space-x-3 p-4 bg-info/5 rounded-lg border border-info/10">
                          <div className="p-2 bg-info rounded-lg">
                            <Phone className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-small text-text-secondary uppercase tracking-wide">Calls Placed</p>
                            <p className="text-body font-medium text-text-primary">{campaign.totalCallPlaced}</p>
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
                            <p className="text-body font-medium text-text-primary">{campaign.appointmentScheduled}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-4 rounded-lg border border-border">
                          <div className={`p-2 rounded-lg ${
                            campaign.status === 'running' ? 'bg-info' :
                            campaign.status === 'completed' ? 'bg-success' :
                            campaign.status === 'scheduled' ? 'bg-warning' :
                            'bg-gray-500'
                          }`}>
                            <StatusIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-small text-text-secondary uppercase tracking-wide">Status</p>
                            <p className="text-small font-medium text-text-primary capitalize">{campaign.status}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              )
            })}
          </div>
        )}

        {!loading && !error && filteredCampaigns.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                <Search className="h-10 w-10 text-text-secondary" />
              </div>
              <h3 className="text-page-heading text-text-primary mb-3">No campaigns found</h3>
              <p className="text-body text-text-secondary mb-8 max-w-md mx-auto">
                {searchTerm || statusFilter !== 'all' || useCaseFilter !== 'all'
                  ? 'Try adjusting your search criteria or filters to find the campaigns you\'re looking for'
                  : 'You haven\'t created any campaigns yet. Ready to start your first AI-powered outbound campaign?'}
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
