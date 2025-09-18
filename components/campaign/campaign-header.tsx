'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, Info, Square, Calendar, Play } from 'lucide-react'
import { buildUrlWithParams } from '@/lib/url-utils'
import { formatTimeRange } from '@/lib/time-utils'
import type { CampaignDetailResponse } from '@/lib/campaign-api'
import type { Agent } from '@/lib/agent-api'
import type { Agent as DeployedAgent } from '@/hooks/use-agents'

interface CampaignHeaderProps {
  campaignData: CampaignDetailResponse | null
  conversationData?: any
  campaignId?: string
  isSalesCampaign: boolean
  isServiceCampaign: boolean
  isCallDetailsOpen: boolean
  activeTab: string
  campaignRunning: boolean
  campaignAgent: Agent | null
  isLoadingAgent: boolean
  deployedAgents?: DeployedAgent[]
  analyticsData?: any // Add analytics data for real API data
  onTabChange: (tab: string) => void
  onToggleCampaignStatus: () => void
}

export function CampaignHeader({
  campaignData,
  conversationData,
  campaignId,
  isSalesCampaign,
  isServiceCampaign,
  isCallDetailsOpen,
  activeTab,
  campaignRunning,
  campaignAgent,
  isLoadingAgent,
  deployedAgents = [],
  analyticsData,
  onTabChange,
  onToggleCampaignStatus
}: CampaignHeaderProps) {
  const [isCompact, setIsCompact] = useState(false)
  const isCompactRef = useRef(false)
  const lastScrollY = useRef(0)
  const scrollDirection = useRef<'up' | 'down'>('down')
  const isTransitioning = useRef(false)

  // Keep ref in sync with state
  useEffect(() => {
    isCompactRef.current = isCompact
  }, [isCompact])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null
    let rafId: number | null = null

    const updateScrollState = () => {
      // Clear any pending timeout
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      // Prevent multiple transitions
      if (isTransitioning.current) {
        return
      }

      // Debounce the state update to prevent rapid flickering
      timeoutId = setTimeout(() => {
        const currentScrollY = window.scrollY
        
        // Determine scroll direction
        if (currentScrollY > lastScrollY.current) {
          scrollDirection.current = 'down'
        } else if (currentScrollY < lastScrollY.current) {
          scrollDirection.current = 'up'
        }
        lastScrollY.current = currentScrollY
        
        // Use wider hysteresis thresholds and consider scroll direction
        let shouldBeCompact: boolean
        
        if (isCompactRef.current) {
          // Currently compact - only expand when scrolled well up AND scrolling up
          shouldBeCompact = !(currentScrollY <= 20 && scrollDirection.current === 'up')
        } else {
          // Currently expanded - only compact when scrolled well down AND scrolling down
          shouldBeCompact = currentScrollY >= 80 && scrollDirection.current === 'down'
        }

        if (shouldBeCompact !== isCompactRef.current) {
          isTransitioning.current = true
          
          // Use requestAnimationFrame to ensure smooth transition
          rafId = requestAnimationFrame(() => {
            setIsCompact(shouldBeCompact)
            
            // Allow new transitions after the CSS transition completes
            setTimeout(() => {
              isTransitioning.current = false
            }, 300) // Match the CSS transition duration
          })
        }
      }, 50) // Longer debounce delay for more stability
    }

    // Use passive listener for better performance
    window.addEventListener('scroll', updateScrollState, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', updateScrollState)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, []) // Remove isCompact from dependency array to prevent feedback loop

  if (!campaignData) return null

  // Transform deployedAgents to include avatar URLs, prioritizing real API data
  const agentsWithAvatars = React.useMemo(() => {
    // If we have real agent data from analytics API, use that first
    if (analyticsData?.agentName) {
      return [{
        name: analyticsData.agentName,
        imageUrl: '/placeholder-user.jpg'
      }]
    }
    
    // Otherwise use deployed agents data
    return deployedAgents.map(agent => ({
      name: agent.agentName || agent.name, // Use agentName if available, fallback to name
      imageUrl: (agent as any).imageUrl || '/placeholder-user.jpg' // Use real image URL if available
    }))
  }, [analyticsData?.agentName, deployedAgents])

  // Calculate campaign completion metrics from real API data
  const totalCalls = conversationData?.totalCustomers || campaignData?.campaign?.totalCustomers || 0
  const callsMade = conversationData?.totalCustomersLeadCreated || 0
  const completionPercentage = totalCalls > 0 ? Math.round((callsMade / totalCalls) * 100) : 0
  
  // Calculate remaining time based on real data
  const remainingCalls = totalCalls - callsMade
  const callsPerHour = conversationData?.callLimits?.hourlyThrottle || 50 // Use real hourly throttle from API
  const remainingHours = remainingCalls > 0 && callsPerHour > 0 ? Math.ceil(remainingCalls / callsPerHour) : 0
  const remainingTime = remainingHours > 1 ? `${remainingHours}hr remaining` : 
                       remainingHours === 1 ? `${remainingHours}hr remaining` :
                       remainingCalls > 0 ? `${Math.ceil(remainingCalls / (callsPerHour / 60))}min remaining` : 'Completed'
  
  // Determine completed state from derived metrics
  const isCompleted = completionPercentage >= 100 || remainingCalls <= 0

  return (
    <div className={`
      bg-white border-b border-gray-100 sticky top-0 z-50 transition-all duration-300 ease-out
      ${isCompact ? 'shadow-md' : 'shadow-none'}
    `}>
      <div 
        className={`
          flex flex-col transition-all duration-300 ease-out
          ${isCompact ? 'px-6 py-3' : 'px-12 pt-8 pb-4'}
        `}
      >
        {/* Header Section */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            {/* Breadcrumb - Always visible */}
            <div className="flex items-center gap-3">
              <Link href={buildUrlWithParams("/results")} className="flex items-center text-black hover:text-gray-600 transition-colors">
                <ArrowLeft className={`transition-all duration-300 ease-out ${isCompact ? 'h-5 w-5' : 'h-6 w-6'}`} />
              </Link>
              <div className={`
                flex items-center gap-1 text-sm font-medium transition-all duration-300 ease-out overflow-hidden
                ${isCompact ? 'opacity-0 max-w-0' : 'opacity-100 max-w-xs'}
              `}>
                <span className="text-black whitespace-nowrap">Campaign</span>
                <span className="text-black whitespace-nowrap">/</span>
              </div>
            </div>
            
            {/* Title and Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <h1 className={`
                  font-semibold text-black transition-all duration-300 ease-out
                  ${isCompact ? 'text-lg leading-6' : 'text-2xl leading-8'}
                `}>
                  {
                    // Use real campaign name from conversation data if available
                    conversationData?.name || 
                    // Fallback to campaign data name if it's not a UUID
                    (campaignData?.campaign?.name && 
                     !campaignData.campaign.name.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
                      ? campaignData.campaign.name 
                      : 'Campaign')
                  }
                </h1>
                <div className={`
                  relative group flex items-center justify-center w-[30px] h-[30px] rounded-full hover:bg-gray-50 
                  transition-all duration-300 ease-out cursor-help
                  ${isCompact ? 'opacity-0 max-w-0 max-h-0 overflow-hidden' : 'opacity-100 max-w-[30px] max-h-[30px]'}
                `}>
                  <Info className="h-5 w-5 text-gray-400" />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-[9999] shadow-xl border border-gray-700">
                    Campaign ID: {(() => {
                      const id = campaignData?.campaign?.campaignId || campaignData?.campaign?._id || campaignId || 'Loading...'
                      console.log('Tooltip Campaign ID:', id, {
                        fromCampaignData: campaignData?.campaign?.campaignId,
                        fromId: campaignData?.campaign?._id,
                        fromParams: campaignId,
                        campaignData: campaignData
                      })
                      return id
                    })()}
                  </div>
                </div>
              </div>
              <Badge className={`px-2 py-0.5 text-xs font-medium flex items-center gap-2 transition-all duration-200 ${
                isCompleted
                  ? "bg-green-50 text-green-700 border-green-100"
                  : "cursor-pointer hover:scale-105 hover:shadow-sm " + (campaignRunning 
                      ? "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 hover:border-blue-200" 
                      : "bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100 hover:border-orange-200")
              }`}>
                <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  isCompleted ? "bg-green-600" : (campaignRunning ? "bg-blue-600" : "bg-orange-600")
                }`} />
                {isCompleted ? "Completed" : (campaignRunning ? "Active" : "Paused")}
              </Badge>
            </div>
          </div>
          
          {/* Stop/Resume Campaign Button */}
          {!isCompleted && (
            <div className="flex items-center gap-4">
              <Button 
                variant="outline"
                className={`
                  font-semibold flex items-center gap-2 transition-all duration-300 ease-out hover:scale-105 hover:shadow-sm
                  ${isCompact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}
                  ${campaignRunning 
                    ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100 hover:border-red-200' 
                    : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 hover:border-blue-200'
                  }
                `}
                onClick={onToggleCampaignStatus}
              >
                <span className={`transition-all duration-300 ease-out ${isCompact ? 'max-w-12' : 'max-w-32'} overflow-hidden whitespace-nowrap`}>
                  {campaignRunning 
                    ? (isCompact ? 'Stop' : 'Stop Campaign')
                    : (isCompact ? 'Resume' : 'Resume Campaign')
                  }
                </span>
                {campaignRunning 
                  ? <Square className="h-3 w-3 fill-current flex-shrink-0" />
                  : <Play className="h-3 w-3 fill-current flex-shrink-0" />
                }
              </Button>
            </div>
          )}
        </div>
        
        {/* Campaign Details Section - Animated visibility */}
        <div className={`
          transition-all duration-300 ease-out
          ${isCompact ? 'max-h-0 opacity-0 mt-0 overflow-hidden' : 'max-h-40 opacity-100 mt-6 overflow-visible'}
        `}>
          <div className="flex items-start w-full">
            {/* Left side - Campaign details */}
            <div className="flex items-start gap-16 flex-1">
              {/* Scheduled for column */}
              <div className="flex flex-col">
                <div className="text-sm font-medium text-gray-600 mb-2">
                  Scheduled for:
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {analyticsData?.schedule ? (
                    (() => {
                      const startDate = new Date(analyticsData.schedule.startDate)
                      // Check if endDate is valid before using it
                      const endDateStr = analyticsData.schedule.endDate
                      if (!endDateStr || endDateStr === '' || new Date(endDateStr).toString() === 'Invalid Date') {
                        // For "start now" campaigns without end date, just show start date
                        return startDate.toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })
                      }
                      const endDate = new Date(endDateStr)
                      return formatTimeRange(startDate, endDate)
                    })()
                  ) : conversationData?.startDate ? (
                    (() => {
                      const startDate = new Date(conversationData.startDate)
                      // Check if we have a valid end date
                      const endDateStr = conversationData.endDate || conversationData.completedDate
                      if (!endDateStr || endDateStr === '' || new Date(endDateStr).toString() === 'Invalid Date') {
                        // For "start now" campaigns without end date, just show start date
                        return startDate.toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })
                      }
                      const endDate = new Date(endDateStr)
                      return formatTimeRange(startDate, endDate)
                    })()
                  ) : campaignData?.campaign?.startDate ? (
                    (() => {
                      const startDate = new Date(campaignData.campaign.startDate)
                      // Check if we have a valid end date
                      const endDateStr = campaignData.campaign.completedDate
                      if (!endDateStr || endDateStr === '' || new Date(endDateStr).toString() === 'Invalid Date') {
                        // For "start now" campaigns without end date, just show start date
                        return startDate.toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })
                      }
                      const endDate = new Date(endDateStr)
                      return formatTimeRange(startDate, endDate)
                    })()
                  ) : (
                    'Not scheduled'
                  )}
                </div>
              </div>
              
              {/* Campaign Type column */}
              <div className="flex flex-col">
                <div className="text-sm font-medium text-gray-600 mb-2">
                  Campaign Type
                </div>
                <Badge className="bg-green-50 text-green-600 border-green-100 px-2 py-1 text-xs font-semibold flex items-center gap-2 hover:bg-green-50 hover:text-green-600 hover:border-green-100 cursor-default">
                  <Calendar className="h-4 w-4" />
                  {(() => {
                    // Prefer campaignUseCase coming from the Campaign Status API (conversationData)
                    const useCaseFromStatus = conversationData?.campaignUseCase
                    if (typeof useCaseFromStatus === 'string' && useCaseFromStatus.length > 0) {
                      return useCaseFromStatus
                        .replace(/([a-z])([A-Z])/g, '$1 $2')
                        .replace(/^./, (str: string) => str.toUpperCase())
                    }

                    // Fallback to analytics or campaign detail data if available
                    const useCaseFromAnalytics = analyticsData?.campaignUseCase
                    if (typeof useCaseFromAnalytics === 'string' && useCaseFromAnalytics.length > 0) {
                      return useCaseFromAnalytics
                        .replace(/([a-z])([A-Z])/g, '$1 $2')
                        .replace(/^./, (str: string) => str.toUpperCase())
                    }

                    const useCaseFromCampaign = campaignData?.campaign?.campaignUseCase
                    if (typeof useCaseFromCampaign === 'string' && useCaseFromCampaign.length > 0) {
                      return useCaseFromCampaign
                        .replace(/([a-z])([A-Z])/g, '$1 $2')
                        .replace(/^./, (str: string) => str.toUpperCase())
                    }

                    // Last resort: infer from boolean flags
                    return isSalesCampaign ? 'Sales Campaign' : 'Service Campaign'
                  })()}
                </Badge>
              </div>
              
              {/* Created on column */}
              <div className="flex flex-col">
                <div className="text-sm font-medium text-gray-600 mb-2">
                  Created on:
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {analyticsData?.createdAt ? (
                    new Date(analyticsData.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })
                  ) : conversationData?.createdAt ? (
                    new Date(conversationData.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })
                  ) : campaignData?.campaign?.createdAt ? (
                    new Date(campaignData.campaign.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })
                  ) : (
                    'Unknown'
                  )}
                </span>
              </div>
              
              {/* Agents Deployed column */}
              <div className="flex flex-col max-w-48">
                <div className="text-sm font-medium text-gray-600 mb-2">
                  Agents Deployed:
                </div>
                <div className="flex items-center gap-4">
                  {agentsWithAvatars.length > 0 ? (
                    <>
                      {/* Desktop view - show all agents */}
                      <div className="hidden xl:flex items-center gap-4">
                        {agentsWithAvatars.map((agent, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="bg-purple-100 text-purple-600 text-xs font-medium">
                                {agent.name.split(' ').map((word: string) => word[0]).filter(Boolean).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-gray-900">
                              {agent.name}{index < agentsWithAvatars.length - 1 ? ',' : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Mobile/Tablet view - show truncated with tooltip */}
                      <div className="xl:hidden flex items-center gap-2">
                        {agentsWithAvatars.slice(0, 2).map((agent, index) => (
                          <div key={index} className="flex items-center gap-1">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="bg-purple-100 text-purple-600 text-xs font-medium">
                                {agent.name.split(' ').map((word: string) => word[0]).filter(Boolean).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-gray-900">
                              {agent.name}{index < Math.min(2, agentsWithAvatars.length) - 1 ? ',' : ''}
                            </span>
                          </div>
                        ))}
                        {agentsWithAvatars.length > 2 && (
                          <div className="relative group">
                            <span className="text-sm font-medium text-gray-500 cursor-help">
                              +{agentsWithAvatars.length - 2}
                            </span>
                            {/* Tooltip */}
                            <div className="absolute right-0 top-6 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              {agentsWithAvatars.slice(2).map(agent => agent.name).join(', ')}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500">No agents deployed</span>
                  )}
                </div>
              </div>
            </div>

            {/* Right side - Campaign Progress */}
            <div className="flex flex-col flex-shrink-0 ml-8">
              <div className="flex flex-col gap-3 w-48">
                <div className="flex items-center justify-between text-sm font-medium text-gray-600 leading-[18px]">
                  <span>{callsMade.toLocaleString()}/{totalCalls.toLocaleString()}</span>
                  <span>{remainingTime}</span>
                </div>
                <div className="bg-[#f2f2f2] h-2.5 rounded-[64px] overflow-hidden">
                  <div 
                    className="bg-[#027a48] h-full rounded-[64px] transition-all duration-300 ease-out"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
