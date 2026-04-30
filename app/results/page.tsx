'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Toaster } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, AlertCircle, Plus, X, Copy, Check, CalendarIcon, Settings, Play, Pause, Square, PhoneCall, MessageSquare, Zap, BarChart3 } from 'lucide-react'
import Link from "next/link"
import type { CampaignListItem, CampaignTypesResponse } from '@/lib/campaign-api'
import type { Agent } from '@/lib/agent-api'
import { extractUrlParams, buildUrlWithParams } from '@/lib/url-utils'
import { toast } from 'sonner'
import { getShortEstimatedTime } from '@/lib/time-utils'
import { formatUseCaseLabel } from '@/utils/campaign-setup-utils'
import { CampaignListShimmer } from "@/components/ui/campaign-shimmer"
import { CampaignSettingsModal } from "@/components/campaign-settings-modal"
import { cn } from '@/lib/utils'
import { AnalyticsSummary } from '@/components/campaign/analytics-tab'
import {
  getMockAgents,
  getMockCampaignList,
  getMockCampaignTypes,
  getCampaignChannel,
  getCampaignChannelStats,
  getMockAggregateAnalyticsExtras,
  type CampaignChannel,
} from '@/lib/outbound-local-data'

// Map API campaign type to display format
const mapCampaignType = (campaignType: string): string => {
  if (campaignType === 'recall') return 'Service'
  return campaignType // 'Sales', 'Service', etc.
}

// Channel icon badge — SMS / Call / SMS+Call
function ChannelBadge({ channel }: { channel: CampaignChannel }) {
  if (channel === 'SMS+Call') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EDE9FE] text-[#6D28D9]"
        title="SMS + Call"
      >
        <Zap className="h-3 w-3" /> SMS + Call
      </span>
    )
  }
  if (channel === 'SMS') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#D1FAE5] text-[#065F46]"
        title="SMS Only"
      >
        <MessageSquare className="h-3 w-3" /> SMS
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#DBEAFE] text-[#1D4ED8]"
      title="Call Only"
    >
      <PhoneCall className="h-3 w-3" /> Call
    </span>
  )
}

// Dynamic display mapping will be populated from campaign types API
// This is a fallback for cases where API data is not available
const fallbackUseCaseDisplayMapping: Record<string, { label: string; color: string }> = {
  // Fallback for unknown use cases - these will be replaced by API data
}

// Get display information for campaign usecase using dynamic data from API
const getCampaignUseCaseDisplay = (
  campaignUseCase?: string, 
  campaignType?: string,
  campaignTypes?: any[] // Pass campaign types data from API
) => {
  if (!campaignUseCase) {
    // Fallback to generic campaign type
    if (campaignType === 'Sales') {
      return { label: 'Sales', color: 'bg-green-100 text-green-800 border-green-200' }
    } else if (campaignType === 'Service' || campaignType === 'recall') {
      return { label: 'Service', color: 'bg-blue-100 text-blue-800 border-blue-200' }
    }
    return { label: 'Campaign', color: 'bg-gray-100 text-gray-800 border-gray-200' }
  }
  
  // Try to find the use case in the dynamic campaign types data
  if (campaignTypes) {
    for (const group of campaignTypes) {
      if (group.campaignTypes) {
        for (const type of group.campaignTypes) {
          // Match by various formats: exact name, kebab-case, etc.
          const normalizedTypeName = type.name.replace(/[_\s]/g, '-').toLowerCase();
          const normalizedUseCase = campaignUseCase.replace(/[_\s]/g, '-').toLowerCase();
          
          if (normalizedTypeName === normalizedUseCase || type.name === campaignUseCase) {
            // Determine color based on campaign category
            const color = group.campaignFor.toLowerCase() === 'sales' 
              ? 'bg-green-100 text-green-800 border-green-200'
              : 'bg-blue-100 text-blue-800 border-blue-200';
            
            return {
              label: formatUseCaseLabel(type.name),
              color
            };
          }
        }
      }
    }
  }
  
  // Fallback to transforming the use case name
  const fallbackLabel = formatUseCaseLabel(campaignUseCase);
  const fallbackColor = campaignType === 'Sales' 
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-blue-100 text-blue-800 border-blue-200';
    
  return { 
    label: fallbackLabel, 
    color: fallbackColor
  };
}

export default function CampaignResults() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeStatusFilters, setActiveStatusFilters] = useState<string[]>([])
  const [activeCampaignTypeFilters, setActiveCampaignTypeFilters] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<{ field: string; order: 'asc' | 'desc' }>({ field: 'createdAt', order: 'desc' })
  const [agents, setAgents] = useState<Agent[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('sales')
  const [campaignTypesData, setCampaignTypesData] = useState<CampaignTypesResponse | null>(null)
  
  // Settings modal state
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [selectedCampaignForSettings, setSelectedCampaignForSettings] = useState<CampaignListItem | null>(null)
        
  // Get URL parameters or use defaults for local testing
  const urlParams = extractUrlParams();

  const [enterpriseId, setEnterpriseId] = useState(urlParams.enterprise_id)
  const [teamId, setTeamId] = useState(urlParams.team_id)

  useEffect(() => {
    setEnterpriseId(urlParams.enterprise_id)
    setTeamId(urlParams.team_id)
  }, [urlParams.enterprise_id, urlParams.team_id])

  // Restore tab from URL parameters on page load/reload
  useEffect(() => {
    if (urlParams.tab && ['sales', 'service'].includes(urlParams.tab)) {
      setActiveTab(urlParams.tab)
    }
  }, [urlParams.tab])

  // Load campaigns from API on component mount
  useEffect(() => {
    setLoading(true)
    setError(null)
    setCampaigns(getMockCampaignList())
    setAgents(getMockAgents())
    setCampaignTypesData(getMockCampaignTypes())
    setLoading(false)
  }, [enterpriseId, teamId])

  // Calculate campaign counts for tabs
  const salesCampaignCount = campaigns.filter(campaign => {
    const campaignType = mapCampaignType(campaign.campaignType)
    return campaignType.toLowerCase() === 'sales'
  }).length

  const serviceCampaignCount = campaigns.filter(campaign => {
    const campaignType = mapCampaignType(campaign.campaignType)
    return campaignType.toLowerCase() === 'service'
  }).length

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
    const campaignStatusValue = campaign.campaignStatus || campaign.status || 'unknown'
    const matchesStatus = activeStatusFilters.length === 0 || activeStatusFilters.includes(campaignStatusValue.toLowerCase())
    const campaignType = mapCampaignType(campaign.campaignType)
    const matchesCampaignType = activeCampaignTypeFilters.length === 0 || activeCampaignTypeFilters.includes(campaignType.toLowerCase())
    
    // Tab filter - filter campaigns based on active tab
    const matchesTab = activeTab === 'sales' ? campaignType.toLowerCase() === 'sales' : campaignType.toLowerCase() === 'service'
    
    return matchesSearch && matchesStatus && matchesCampaignType && matchesTab
  })

  // Sort the filtered campaigns
  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    if (sortBy.field === 'createdAt') {
      const dateA = new Date(a.createdAt || a.startDate || 0)
      const dateB = new Date(b.createdAt || b.startDate || 0)
      
      if (sortBy.order === 'asc') {
        return dateA.getTime() - dateB.getTime() // Oldest to newest
      } else {
        return dateB.getTime() - dateA.getTime() // Newest to oldest
      }
    }
    return 0
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

  const addCampaignTypeFilter = (campaignType: string) => {
    if (campaignType !== 'all' && !activeCampaignTypeFilters.includes(campaignType)) {
      setActiveCampaignTypeFilters([...activeCampaignTypeFilters, campaignType])
    }
  }

  const removeCampaignTypeFilter = (campaignType: string) => {
    setActiveCampaignTypeFilters(activeCampaignTypeFilters.filter(f => f !== campaignType))
  }

  const clearAllFilters = () => {
    setActiveStatusFilters([])
    setActiveCampaignTypeFilters([])
    setSearchTerm('')
  }

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy({ field, order })
  }

  const copyCampaignId = async (campaignId: string) => {
    try {
      await navigator.clipboard.writeText(campaignId)
      setCopiedId(campaignId)
      setTimeout(() => setCopiedId(null), 2000) // Reset after 2 seconds
      toast.success('Campaign ID copied to clipboard!')
      
      // Post message to parent window for clipboard action, similar to Talk To Agent button
      parent.postMessage({
        type: 'COPY_TO_CLIPBOARD',
        data: { 
          text: campaignId
        }
      }, '*');
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy Campaign ID')
    }
  }

  // Handle settings modal
  const handleOpenSettings = (campaign: CampaignListItem, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setSelectedCampaignForSettings(campaign)
    setSettingsModalOpen(true)
  }

  const handleCloseSettings = () => {
    setSettingsModalOpen(false)
    setSelectedCampaignForSettings(null)
  }


  const formatDate = (dateString: string) => {
    
    if (!dateString) {
      return 'No date'
    }
    
    const date = new Date(dateString)
    
    if (isNaN(date.getTime())) {
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
            <button
              type="button"
              onClick={() => router.push(buildUrlWithParams('/campaign/new'))}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#4600F2] hover:bg-[#3700C2] active:bg-[#2E00A0] text-white text-sm font-semibold rounded-[10px] transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              New Campaign
            </button>
          </div>
        </div>

        {/* Aggregate Analytics Summary — all-data view across campaigns */}
        <div className="mb-8">
          <AnalyticsSummary
            extrasData={getMockAggregateAnalyticsExtras()}
            level="glance"
            title="All-campaign performance"
            subtitle="Rolled up across every Sales and Service campaign"
          />
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex items-center border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab('sales')
                const newUrl = buildUrlWithParams('/results', { tab: 'sales' })
                window.history.replaceState({}, '', newUrl)
              }}
              className={`px-4 py-3 text-base border-b-2 transition-all duration-200 ${
                activeTab === 'sales'
                  ? 'text-black font-semibold border-[#4600F2] bg-transparent'
                  : 'text-gray-500 font-normal border-transparent hover:text-gray-700'
              }`}
            >
              Sales ({salesCampaignCount})
            </button>
            <button
              onClick={() => {
                setActiveTab('service')
                const newUrl = buildUrlWithParams('/results', { tab: 'service' })
                window.history.replaceState({}, '', newUrl)
              }}
              className={`px-4 py-3 text-base border-b-2 transition-all duration-200 ${
                activeTab === 'service'
                  ? 'text-black font-semibold border-[#4600F2] bg-transparent'
                  : 'text-gray-500 font-normal border-transparent hover:text-gray-700'
              }`}
            >
              Service ({serviceCampaignCount})
            </button>
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
                    className="flex h-10 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2 pl-12 text-sm shadow-sm transition-all duration-200 ease-out focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 ml-auto">
                {/* Status Filter - Short content, smaller width */}
                <Select value="" onValueChange={addStatusFilter}>
                  <SelectTrigger className="w-full sm:w-32 h-10 text-[#666666] font-semibold border-border bg-surface">
                    <SelectValue placeholder="Status" />
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
                
                {/* Campaign Type Filter - Medium content, medium width */}
                {/* <Select value="" onValueChange={addCampaignTypeFilter}>
                  <SelectTrigger className="w-full sm:w-40 h-10 text-[#666666] font-semibold border-border bg-surface">
                    <SelectValue placeholder="Campaign Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-border shadow-lg">
                    <SelectItem value="sales" disabled={activeCampaignTypeFilters.includes('sales')}>
                      Sales {activeCampaignTypeFilters.includes('sales') && '✓'}
                    </SelectItem>
                    <SelectItem value="service" disabled={activeCampaignTypeFilters.includes('service')}>
                      Service {activeCampaignTypeFilters.includes('service') && '✓'}
                    </SelectItem>
                  </SelectContent>
                </Select> */}

                {/* Sort Filter - Short content, smaller width */}
                <Select value={`${sortBy.field}-${sortBy.order}`} onValueChange={(value) => {
                  const [field, order] = value.split('-') as [string, 'asc' | 'desc']
                  handleSortChange(field, order)
                }}>
                  <SelectTrigger className="w-full sm:w-36 h-10 text-[#666666] font-semibold border-border bg-surface">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-border shadow-lg">
                    <SelectItem value="createdAt-desc">Newest First</SelectItem>
                    <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Filters Chips */}
        {(activeStatusFilters.length > 0 || activeCampaignTypeFilters.length > 0 || searchTerm) && (
          <div className="mb-3 mt-3">
            <div className="flex flex-wrap gap-2 items-center">
              {searchTerm && (
                <div className="flex items-center gap-1 px-3 py-1 rounded-full border border-[#4600F2] text-[#4600F2] text-sm">
                  <span>Search: &quot;{searchTerm}&quot;</span>
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
                  <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                  <button
                    onClick={() => removeStatusFilter(status)}
                    className="ml-1 hover:bg-[#4600F2]/10 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              
              {activeCampaignTypeFilters.map((campaignType) => (
                <div key={`campaigntype-${campaignType}`} className="flex items-center gap-1 px-3 py-1 rounded-full border border-[#4600F2] text-[#4600F2] text-sm">
                  <span>{campaignType.charAt(0).toUpperCase() + campaignType.slice(1)}</span>
                  <button
                    onClick={() => removeCampaignTypeFilter(campaignType)}
                    className="ml-1 hover:bg-[#4600F2]/10 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              
              {(activeStatusFilters.length > 0 || activeCampaignTypeFilters.length > 0 || searchTerm) && (
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
        {loading && <CampaignListShimmer />}

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
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4 sm:gap-6">
            {sortedCampaigns.map((campaign) => {
              const campaignStatusValue = campaign.campaignStatus || campaign.status || 'unknown'
              const campaignType = mapCampaignType(campaign.campaignType)
              const channel = getCampaignChannel(campaign.campaignId)
              const channelStats = getCampaignChannelStats(campaign.campaignId)
              const isRunning = campaignStatusValue.toLowerCase() === 'running'

              return (
                <Card key={campaign.campaignId} className="group hover:scale-105 transition-all duration-200 cursor-pointer overflow-hidden h-full border relative" style={{borderRadius: '16px'}}>
                  {/* Action Buttons */}
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    {isRunning ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          toast.success(`Paused "${campaign.name}"`)
                        }}
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                        title="Pause campaign"
                      >
                        <Pause className="h-4 w-4 text-gray-600" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          toast.success(`Started "${campaign.name}"`)
                        }}
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                        title="Start campaign"
                      >
                        <Play className="h-4 w-4 text-gray-600" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toast.success(`Stopped "${campaign.name}"`)
                      }}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      title="Stop campaign"
                    >
                      <Square className="h-4 w-4 text-gray-600" />
                    </Button>
                    {/* Settings Icon */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleOpenSettings(campaign, e)}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      title="Settings"
                    >
                      <Settings className="h-4 w-4 text-gray-600" />
                    </Button>
                  </div>

                  <Link href={buildUrlWithParams(`/results/${campaign.campaignId}`)}>
                    <CardContent className="p-4 sm:p-6 h-full flex flex-col">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {isRunning && (
                              <span className="relative flex h-2 w-2 flex-shrink-0" title="Live">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                              </span>
                            )}
                            <h3 className="text-base sm:text-lg font-semibold text-text-primary group-hover:text-primary transition-colors duration-200 line-clamp-2">
                              {campaign.name}
                            </h3>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {(() => {
                              const useCaseDisplay = getCampaignUseCaseDisplay(
                                campaign.campaignUseCase,
                                campaign.campaignType,
                                campaignTypesData?.data
                              )
                              return (
                                <Badge className={`text-xs ${useCaseDisplay.color} hover:${useCaseDisplay.color} pointer-events-none`}>
                                  {useCaseDisplay.label}
                                </Badge>
                              )
                            })()}
                            <ChannelBadge channel={channel} />
                          </div>
                        </div>
                        {/* <div className="flex items-center gap-2">
                          {agents.length > 0 ? (
                            <>
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                                <img 
                                  src={agents[0]?.imageUrl || '/placeholder-user.jpg'} 
                                  alt={agents[0]?.name || 'Agent'} 
                                  className="w-full h-full object-cover object-top"
                                />
                              </div>
                              <span className="text-sm text-text-secondary font-medium">{agents[0]?.name || 'Agent'}</span>
                            </>
                          ) : (
                            <>
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600">A</span>
                              </div>
                              <span className="text-sm text-text-secondary font-medium">Agent</span>
                            </>
                          )}
                        </div> */}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <div className="flex flex-col items-start p-3 bg-gray-50 rounded-lg min-w-0">
                          <span className="text-xs text-text-secondary">Enrolled</span>
                          <span className="text-sm font-medium text-text-primary">{channelStats.enrolled.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col items-start p-3 bg-gray-50 rounded-lg min-w-0">
                          <span className="text-xs text-text-secondary">Connect Rate</span>
                          <span className="text-sm font-medium text-text-primary">{channelStats.connectRate}%</span>
                        </div>
                        <div className="flex flex-col items-start p-3 bg-gray-50 rounded-lg min-w-0">
                          <span className="text-xs text-text-secondary">Appointments</span>
                          <span className="text-sm font-medium text-text-primary">{campaign.appointmentScheduled}</span>
                        </div>
                        <div className={`flex flex-col items-start p-3 rounded-lg min-w-0 ${
                          campaignStatusValue === 'running' ? 'bg-blue-50' :
                          campaignStatusValue === 'completed' ? 'bg-green-50' :
                          campaignStatusValue === 'scheduled' ? 'bg-yellow-50' :
                          'bg-red-50'
                        }`}>
                          <span className="text-xs text-text-secondary">Status</span>
                          <span className={`text-sm font-medium capitalize ${
                            campaignStatusValue === 'running' ? 'text-blue-700' :
                            campaignStatusValue === 'completed' ? 'text-green-700' :
                            campaignStatusValue === 'scheduled' ? 'text-yellow-700' :
                            'text-red-700'
                          }`}>{campaignStatusValue}</span>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-text-secondary">
                            {(() => {
                              // Try to extract date from campaign ID if it contains timestamp
                              const extractDateFromId = (id: string) => {
                                // Look for timestamp patterns in the ID
                                const timestampMatch = id.match(/(\d{10,13})/)
                                if (timestampMatch) {
                                  const timestamp = parseInt(timestampMatch[1])
                                  // Check if it's a valid timestamp (10-13 digits)
                                  if (timestamp > 1000000000 && timestamp < 9999999999999) {
                                    const date = new Date(timestamp.toString().length === 10 ? timestamp * 1000 : timestamp)
                                    if (!isNaN(date.getTime())) {
                                      return date.toISOString()
                                    }
                                  }
                                }
                                return null
                              }
                              
                              const extractedDate = extractDateFromId(campaign.campaignId)
                              if (extractedDate) {
                                return formatDate(extractedDate)
                              }
                              
                              return campaign.completedAt 
                                ? formatDate(campaign.completedAt)
                                : 'Active Campaign'
                            })()}
                          </div>
                          <div className="text-xs text-text-secondary font-semibold">
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                copyCampaignId(campaign.campaignId)
                              }}
                              className="group relative flex items-center gap-1 hover:text-primary transition-colors duration-200"
                              title="Click to copy Campaign ID"
                            >
                              <span className="relative inline-block">
                                Campaign ID: {campaign.campaignId.slice(-8)}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-black rounded opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                  Click to copy
                                </div>
                              </span>
                              {copiedId === campaign.campaignId ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                              )}
                            </button>
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

        {!loading && !error && sortedCampaigns.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                <Search className="h-10 w-10 text-text-secondary" />
              </div>
              <h3 className="text-page-heading text-text-primary mb-3">No campaigns found</h3>
              <p className="text-body text-text-secondary mb-8 max-w-md mx-auto">
                {searchTerm || activeStatusFilters.length > 0 || activeCampaignTypeFilters.length > 0
                  ? 'No campaigns match your current filters. Try adjusting your search criteria or removing some filters to find the campaigns you&apos;re looking for.'
                  : "You haven't created any campaigns yet. Ready to start your first AI-powered outbound campaign?"}
              </p>
              {searchTerm || activeStatusFilters.length > 0 || activeCampaignTypeFilters.length > 0 ? (
                <Button 
                  onClick={clearAllFilters}
                  size="lg"
                  className="btn-primary"
                >
                  Clear All Filters
                </Button>
              ) : (
                <Button asChild size="lg" className="btn-primary">
                  <Link href={buildUrlWithParams('/setup')}>
                    <Plus className="icon-medium mr-2" />
                    Launch Campaign Builder
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      <Toaster />

      {/* Campaign Settings Modal */}
      {selectedCampaignForSettings && (
        <CampaignSettingsModal
          isOpen={settingsModalOpen}
          onClose={handleCloseSettings}
          campaignId={selectedCampaignForSettings.campaignId}
          campaignName={selectedCampaignForSettings.name}
          campaignType={selectedCampaignForSettings.campaignType}
          campaignUseCase={selectedCampaignForSettings.campaignUseCase}
        />
      )}
    </div>
  )
}
