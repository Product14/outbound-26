'use client'

import { useState, useEffect } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Phone, CheckCircle, Clock, AlertCircle, Calendar, BarChart3, Plus, Loader2, X } from 'lucide-react'
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
  const [activeStatusFilters, setActiveStatusFilters] = useState<string[]>([])
  const [activeUseCaseFilters, setActiveUseCaseFilters] = useState<string[]>([])
        
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
          // Debug: Log the first campaign's date fields
          if (response.campaigns.length > 0) {
            const firstCampaign = response.campaigns[0]
            console.log('First campaign date fields:', {
              startDate: firstCampaign.startDate,
              createdAt: firstCampaign.createdAt,
              completedAt: firstCampaign.completedAt,
              allFields: Object.keys(firstCampaign),
              fullCampaign: firstCampaign
            })
          }
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
    const matchesStatus = activeStatusFilters.length === 0 || activeStatusFilters.includes(campaign.status.toLowerCase())
    const campaignType = mapCampaignType(campaign.campaignType)
    const matchesUseCase = activeUseCaseFilters.length === 0 || activeUseCaseFilters.includes(campaignType.toLowerCase())
    
    return matchesSearch && matchesStatus && matchesUseCase
  })

  // Helper functions for managing filters
  const addStatusFilter = (status: string) => {
    if (status !== 'all' && !activeStatusFilters.includes(status)) {
      setActiveStatusFilters([...activeStatusFilters, status])
    }
  }

  const removeStatusFilter = (status: string) => {
    setActiveStatusFilters(activeStatusFilters.filter(f => f !== status))
  }

  const addUseCaseFilter = (useCase: string) => {
    if (useCase !== 'all' && !activeUseCaseFilters.includes(useCase)) {
      setActiveUseCaseFilters([...activeUseCaseFilters, useCase])
    }
  }

  const removeUseCaseFilter = (useCase: string) => {
    setActiveUseCaseFilters(activeUseCaseFilters.filter(f => f !== useCase))
  }

  const clearAllFilters = () => {
    setActiveStatusFilters([])
    setActiveUseCaseFilters([])
    setSearchTerm('')
  }

  const formatDate = (dateString: string) => {
    console.log('Formatting date:', dateString, 'Type:', typeof dateString)
    
    if (!dateString) {
      console.log('Date string is empty or null')
      return 'No date'
    }
    
    const date = new Date(dateString)
    console.log('Parsed date:', date, 'Is valid:', !isNaN(date.getTime()))
    
    if (isNaN(date.getTime())) {
      console.log('Invalid date detected:', dateString)
      return 'Invalid date'
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
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
        <Card className="mb-8 border-0">
          <CardContent className="p-2">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-80">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary" />
                  <Input
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-10 text-[#666666] font-semibold border-border bg-surface focus:bg-surface transition-all duration-200"
                  />
                </div>
              </div>
              
              <div className="flex gap-4 ml-auto">
                <Select value="" onValueChange={addStatusFilter}>
                  <SelectTrigger className="w-full sm:w-52 h-10 text-[#666666] font-semibold border-border bg-surface">
                    <SelectValue placeholder="Add Status Filter" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-border shadow-lg">
                    <SelectItem value="running" disabled={activeStatusFilters.includes('running')}>
                      Running {activeStatusFilters.includes('running') && '✓'}
                    </SelectItem>
                    <SelectItem value="completed" disabled={activeStatusFilters.includes('completed')}>
                      Completed {activeStatusFilters.includes('completed') && '✓'}
                    </SelectItem>
                    <SelectItem value="scheduled" disabled={activeStatusFilters.includes('scheduled')}>
                      Scheduled {activeStatusFilters.includes('scheduled') && '✓'}
                    </SelectItem>
                    <SelectItem value="failed" disabled={activeStatusFilters.includes('failed')}>
                      Failed {activeStatusFilters.includes('failed') && '✓'}
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value="" onValueChange={addUseCaseFilter}>
                  <SelectTrigger className="w-full sm:w-52 h-10 text-[#666666] font-semibold border-border bg-surface">
                    <SelectValue placeholder="Add Use Case Filter" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-border shadow-lg">
                    <SelectItem value="sales" disabled={activeUseCaseFilters.includes('sales')}>
                      Sales {activeUseCaseFilters.includes('sales') && '✓'}
                    </SelectItem>
                    <SelectItem value="service" disabled={activeUseCaseFilters.includes('service')}>
                      Service {activeUseCaseFilters.includes('service') && '✓'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Filters Chips */}
        {(activeStatusFilters.length > 0 || activeUseCaseFilters.length > 0 || searchTerm) && (
          <div className="mb-3 mt-3">
            <div className="flex flex-wrap gap-2 items-center">
              {searchTerm && (
                <div className="flex items-center gap-1 px-3 py-1 rounded-full border border-[#4600F2] text-[#4600F2] text-sm">
                  <span>Search: "{searchTerm}"</span>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 hover:bg-[#4600F2]/10 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              {activeStatusFilters.map((status) => (
                <div key={`status-${status}`} className="flex items-center gap-1 px-3 py-1 rounded-full border border-[#4600F2] text-[#4600F2] text-sm">
                  <span>Status: {status.charAt(0).toUpperCase() + status.slice(1)}</span>
                  <button
                    onClick={() => removeStatusFilter(status)}
                    className="ml-1 hover:bg-[#4600F2]/10 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              
              {activeUseCaseFilters.map((useCase) => (
                <div key={`usecase-${useCase}`} className="flex items-center gap-1 px-3 py-1 rounded-full border border-[#4600F2] text-[#4600F2] text-sm">
                  <span>Use Case: {useCase.charAt(0).toUpperCase() + useCase.slice(1)}</span>
                  <button
                    onClick={() => removeUseCaseFilter(useCase)}
                    className="ml-1 hover:bg-[#4600F2]/10 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              
              {(activeStatusFilters.length > 0 || activeUseCaseFilters.length > 0 || searchTerm) && (
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 underline ml-2"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}

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
                <Card key={campaign.campaignId} className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden" style={{borderRadius: '16px'}}>
                  <Link href={`/results/${campaign.campaignId}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <h3 className="text-page-heading text-text-primary group-hover:text-primary transition-colors duration-200">
                            {campaign.name}
                          </h3>
                        </div>
                        
                        <div className="text-small text-text-secondary">
                          {formatDate(campaign.startDate || campaign.createdAt || '')} - {campaign.completedAt ? formatDate(campaign.completedAt) : 'In Progress'}
                        </div>
                      </div>



                      <div className="grid grid-cols-4 gap-4">
                        <div className="flex items-center space-x-3 p-4 bg-info/5 rounded-lg border border-info/10">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Phone className="h-5 w-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-small text-text-secondary tracking-wide">Calls Placed</p>
                            <p className="text-body font-medium text-text-primary">{campaign.totalCallPlaced}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-4 bg-success/5 rounded-lg border border-success/10">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <BarChart3 className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                            <p className="text-small text-text-secondary tracking-wide">Answer Rate</p>
                            <p className="text-body font-medium text-text-primary">{campaign.answerRate}%</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-4 rounded-lg border border-border">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Calendar className="h-5 w-5 text-purple-500" />
                          </div>
                          <div>
                            <p className="text-small text-text-secondary tracking-wide">Appointments</p>
                            <p className="text-body font-medium text-text-primary">{campaign.appointmentScheduled}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-4 rounded-lg border border-border">
                          <div className={`p-2 rounded-lg ${
                            campaign.status === 'running' ? 'bg-blue-100' :
                            campaign.status === 'completed' ? 'bg-green-100' :
                            campaign.status === 'scheduled' ? 'bg-yellow-100' :
                            'bg-gray-100'
                          }`}>
                            <StatusIcon className={`h-5 w-5 ${
                              campaign.status === 'running' ? 'text-blue-500' :
                              campaign.status === 'completed' ? 'text-green-500' :
                              campaign.status === 'scheduled' ? 'text-yellow-500' :
                              'text-gray-500'
                            }`} />
                          </div>
                          <div>
                            <p className="text-small text-text-secondary tracking-wide">Status</p>
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
                {searchTerm || activeStatusFilters.length > 0 || activeUseCaseFilters.length > 0
                  ? 'No campaigns match your current filters. Try adjusting your search criteria or removing some filters to find the campaigns you\'re looking for.'
                  : 'You haven\'t created any campaigns yet. Ready to start your first AI-powered outbound campaign?'}
              </p>
              {searchTerm || activeStatusFilters.length > 0 || activeUseCaseFilters.length > 0 ? (
                <Button 
                  onClick={clearAllFilters}
                  size="lg"
                  className="btn-primary"
                >
                  Clear All Filters
                </Button>
              ) : (
                <Link href="/setup">
                  <Button size="lg" className="btn-primary">
                    <Plus className="icon-medium mr-2" />
                    Launch Campaign Builder
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      <Toaster />
    </div>
  )
}
