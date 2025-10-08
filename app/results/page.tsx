'use client'

import { useState, useEffect } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Search, Download, Phone, CheckCircle, Clock, AlertCircle, BarChart3, Plus, Loader2, X, Copy, Check, CalendarIcon, Settings } from 'lucide-react'
import Link from "next/link"
import { fetchCampaignList, fetchCampaignTypes, type CampaignListItem, type CampaignTypesResponse } from '@/lib/campaign-api'
import { fetchAgentList, type Agent } from '@/lib/agent-api'
import { extractUrlParams, buildUrlWithParams } from '@/lib/url-utils'
import { toast } from 'sonner'
import { getShortEstimatedTime } from '@/lib/time-utils'
import { formatUseCaseLabel } from '@/utils/campaign-setup-utils'
import { CampaignListShimmer } from "@/components/ui/campaign-shimmer"
import { CampaignSettingsModal } from "@/components/campaign-settings-modal"
import { cn } from '@/lib/utils'

// Map API campaign type to display format
const mapCampaignType = (campaignType: string): string => {
  if (campaignType === 'recall') return 'Service'
  return campaignType // 'Sales', 'Service', etc.
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

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
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
  const [activeCampaignTypeFilters, setActiveCampaignTypeFilters] = useState<string[]>([])
  const [dateFilter, setDateFilter] = useState<string>('')
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
    const loadCampaigns = async () => {
      if (!enterpriseId || !teamId) return;
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetchCampaignList(enterpriseId || '', teamId || '', urlParams.auth_key || undefined)
        
        if (response.success) {
          setCampaigns(response.campaigns)
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

    const loadAgents = async () => {
      if (!enterpriseId || !teamId) return;
      try {
        const agentList = await fetchAgentList(enterpriseId, teamId, undefined, undefined, undefined, urlParams.auth_key || undefined)
        setAgents(agentList)
      } catch (error) {
        console.error('Error loading agents:', error)
        // Don't fail the whole page if agent fetch fails
        setAgents([])
      }
    }

    const loadCampaignTypes = async () => {
      try {
        const campaignTypesResponse = await fetchCampaignTypes(urlParams.auth_key || undefined)
        setCampaignTypesData(campaignTypesResponse)
      } catch (error) {
        console.error('Error loading campaign types:', error)
        // Don't fail the whole page if campaign types fetch fails
        setCampaignTypesData(null)
      }
    }

    loadCampaigns()
    loadAgents()
    loadCampaignTypes()
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
    const matchesStatus = activeStatusFilters.length === 0 || activeStatusFilters.includes(campaign.status.toLowerCase())
    const campaignType = mapCampaignType(campaign.campaignType)
    const matchesCampaignType = activeCampaignTypeFilters.length === 0 || activeCampaignTypeFilters.includes(campaignType.toLowerCase())
    
    // Tab filter - filter campaigns based on active tab
    const matchesTab = activeTab === 'sales' ? campaignType.toLowerCase() === 'sales' : campaignType.toLowerCase() === 'service'
    
    // Date filter - check if any date field matches the selected date
    let matchesDate = true
    if (dateFilter) {
      // Parse the date filter in local timezone
      const selectedDate = new Date(dateFilter + 'T00:00:00')
      const campaignCreatedDate = new Date(campaign.createdAt || campaign.startDate || '')
      const campaignCompletedDate = new Date(campaign.completedAt || '')
      
      // Check if any date field matches the selected date (within the same day in local timezone)
      const isSameDay = (date1: Date, date2: Date) => {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate()
      }
      
      matchesDate = isSameDay(campaignCreatedDate, selectedDate) || 
                   isSameDay(campaignCompletedDate, selectedDate)
    }
    
    return matchesSearch && matchesStatus && matchesCampaignType && matchesDate && matchesTab
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
    setDateFilter('')
    setSearchTerm('')
  }

  const clearDateFilter = () => {
    setDateFilter('')
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
            <Link href={buildUrlWithParams('/setup')}>
              <Button className="btn-primary">
                <Plus className="icon-medium mr-2" />
                New Campaign
              </Button>
            </Link>
          </div>
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

                {/* Date Filter - DatePicker component */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-36 h-10 text-[#666666] font-semibold border-border bg-surface justify-start text-left font-normal",
                        !dateFilter && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFilter ? new Date(dateFilter + 'T00:00:00').toLocaleDateString() : <span>Date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="start" side="bottom" sideOffset={4}>
                    <Calendar
                      mode="single"
                      selected={dateFilter ? new Date(dateFilter + 'T00:00:00') : undefined}
                      onSelect={(date) => {
                        if (date) {
                          // Format date in local timezone to avoid timezone shift
                          const year = date.getFullYear()
                          const month = String(date.getMonth() + 1).padStart(2, '0')
                          const day = String(date.getDate()).padStart(2, '0')
                          setDateFilter(`${year}-${month}-${day}`)
                        } else {
                          setDateFilter('')
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Filters Chips */}
        {(activeStatusFilters.length > 0 || activeCampaignTypeFilters.length > 0 || dateFilter || searchTerm) && (
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

              {/* Date Filter Chip */}
              {dateFilter && (
                <div className="flex items-center gap-1 px-3 py-1 rounded-full border border-[#4600F2] text-[#4600F2] text-sm">
                  <span>Date: {new Date(dateFilter + 'T00:00:00').toLocaleDateString()}</span>
                  <button
                    onClick={clearDateFilter}
                    className="ml-1 hover:bg-[#4600F2]/10 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              {(activeStatusFilters.length > 0 || activeCampaignTypeFilters.length > 0 || dateFilter || searchTerm) && (
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
              const StatusIcon = statusIcons[campaign.status] || CheckCircle
              const campaignType = mapCampaignType(campaign.campaignType)
              
              return (
                <Card key={campaign.campaignId} className="group hover:scale-105 transition-all duration-200 cursor-pointer overflow-hidden h-full border relative" style={{borderRadius: '16px'}}>
                  {/* Settings Icon */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleOpenSettings(campaign, e)}
                    className="absolute top-3 right-3 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-100 z-10"
                  >
                    <Settings className="h-4 w-4 text-gray-600" />
                  </Button>
                  
                  <Link href={buildUrlWithParams(`/results/${campaign.campaignId}`)}>
                    <CardContent className="p-4 sm:p-6 h-full flex flex-col">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-4">
                        <div className="flex-1">
                          <h3 className="text-base sm:text-lg font-semibold text-text-primary group-hover:text-primary transition-colors duration-200 line-clamp-2 mb-2">
                            {campaign.name}
                          </h3>
                          <div className="flex gap-2">
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
                          <span className="text-xs text-text-secondary">Calls</span>
                          <span className="text-sm font-medium text-text-primary">{campaign.totalCallPlaced}</span>
                        </div>
                        <div className="flex flex-col items-start p-3 bg-gray-50 rounded-lg min-w-0">
                          <span className="text-xs text-text-secondary">Answer Rate</span>
                          <span className="text-sm font-medium text-text-primary">{(campaign.answerRate ?? 0).toFixed(2)}%</span>
                        </div>
                        <div className="flex flex-col items-start p-3 bg-gray-50 rounded-lg min-w-0">
                          <span className="text-xs text-text-secondary">Appointments</span>
                          <span className="text-sm font-medium text-text-primary">{campaign.appointmentScheduled}</span>
                        </div>
                        <div className={`flex flex-col items-start p-3 rounded-lg min-w-0 ${
                          campaign.status === 'running' ? 'bg-blue-50' :
                          campaign.status === 'completed' ? 'bg-green-50' :
                          campaign.status === 'scheduled' ? 'bg-yellow-50' :
                          'bg-red-50'
                        }`}>
                          <span className="text-xs text-text-secondary">Status</span>
                          <span className={`text-sm font-medium capitalize ${
                            campaign.status === 'running' ? 'text-blue-700' :
                            campaign.status === 'completed' ? 'text-green-700' :
                            campaign.status === 'scheduled' ? 'text-yellow-700' :
                            'text-red-700'
                          }`}>{campaign.status}</span>
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
                {searchTerm || activeStatusFilters.length > 0 || activeCampaignTypeFilters.length > 0 || dateFilter
                  ? 'No campaigns match your current filters. Try adjusting your search criteria or removing some filters to find the campaigns you&apos;re looking for.'
                  : "You haven't created any campaigns yet. Ready to start your first AI-powered outbound campaign?"}
              </p>
              {searchTerm || activeStatusFilters.length > 0 || activeCampaignTypeFilters.length > 0 || dateFilter ? (
                <Button 
                  onClick={clearAllFilters}
                  size="lg"
                  className="btn-primary"
                >
                  Clear All Filters
                </Button>
              ) : (
                <Link href={buildUrlWithParams('/setup')}>
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
