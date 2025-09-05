'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, ChevronDown, Square, Calendar, Play } from 'lucide-react'
import { buildUrlWithParams } from '@/lib/url-utils'
import { formatTimeRange } from '@/lib/time-utils'
import type { CampaignDetailResponse } from '@/lib/campaign-api'
import type { Agent } from '@/lib/agent-api'
import type { Agent as DeployedAgent } from '@/hooks/use-agents'

interface CampaignHeaderProps {
  campaignData: CampaignDetailResponse | null
  isSalesCampaign: boolean
  isServiceCampaign: boolean
  isCallDetailsOpen: boolean
  activeTab: string
  campaignRunning: boolean
  campaignAgent: Agent | null
  isLoadingAgent: boolean
  deployedAgents?: DeployedAgent[]
  onTabChange: (tab: string) => void
  onToggleCampaignStatus: () => void
}

export function CampaignHeader({
  campaignData,
  isSalesCampaign,
  isServiceCampaign,
  isCallDetailsOpen,
  activeTab,
  campaignRunning,
  campaignAgent,
  isLoadingAgent,
  deployedAgents = [],
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

  // Transform deployedAgents to include avatar URLs
  const agentsWithAvatars = deployedAgents.map(agent => ({
    name: agent.name,
    imageUrl: '/placeholder-user.jpg' // In real implementation, this would come from agent data
  }))

  // Calculate campaign completion metrics
  const totalCalls = 1000 // Total calls to be made in the campaign
  const callsMade = 850 // Number of calls already made (from dummy data)
  const completionPercentage = Math.round((callsMade / totalCalls) * 100)
  
  // Calculate remaining time (mock calculation)
  const remainingCalls = totalCalls - callsMade
  const callsPerHour = 150 // estimated calls per hour
  const remainingHours = Math.ceil(remainingCalls / callsPerHour)
  const remainingTime = remainingHours > 1 ? `${remainingHours}hr remaining` : `${remainingHours * 60}min remaining`

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
                    // If campaign name looks like a UUID, show a fallback name
                    campaignData?.campaign?.name && 
                    !campaignData.campaign.name.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
                      ? campaignData.campaign.name 
                      : 'Q4 Service Reminder Campaign'
                  }
                </h1>
                <button className={`
                  flex items-center justify-center w-[30px] h-[30px] rounded-full hover:bg-gray-50 
                  transition-all duration-300 ease-out overflow-hidden
                  ${isCompact ? 'opacity-0 max-w-0 max-h-0' : 'opacity-100 max-w-[30px] max-h-[30px]'}
                `}>
                  <ChevronDown className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              <Badge className={`px-2 py-0.5 text-xs font-medium flex items-center gap-2 ${
                campaignRunning 
                  ? "bg-blue-50 text-blue-600 border-blue-100" 
                  : "bg-orange-50 text-orange-600 border-orange-100"
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  campaignRunning ? "bg-blue-600" : "bg-orange-600"
                }`} />
                {campaignRunning ? "Active" : "Paused"}
              </Badge>
            </div>
          </div>
          
          {/* Stop/Resume Campaign Button */}
          <div className="flex items-center gap-4">
            <Button 
              variant="outline"
              className={`
                font-semibold flex items-center gap-2 transition-all duration-300 ease-out
                ${isCompact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}
                ${campaignRunning 
                  ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' 
                  : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'
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
        </div>
        
        {/* Campaign Details Section - Animated visibility */}
        <div className={`
          transition-all duration-300 ease-out overflow-hidden
          ${isCompact ? 'max-h-0 opacity-0 mt-0' : 'max-h-40 opacity-100 mt-6'}
        `}>
          <div className="flex items-start justify-between w-full">
            {/* Left side - Campaign details */}
            <div className="flex items-start gap-16">
              {/* Scheduled for column */}
              <div className="flex flex-col">
                <div className="text-sm font-medium text-gray-600 mb-2">
                  Scheduled for:
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {campaignData?.campaign?.startDate ? (
                    (() => {
                      const startDate = new Date(campaignData.campaign.startDate)
                      const endDate = campaignData.campaign.completedDate 
                        ? new Date(campaignData.campaign.completedDate)
                        : new Date(startDate.getTime() + 3 * 60 * 60 * 1000) // Default to 3 hours later
                      
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
                <Badge className="bg-green-50 text-green-600 border-green-100 px-2 py-1 text-xs font-semibold italic flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Appointment Reminder
                </Badge>
              </div>
              
              {/* Created on column */}
              <div className="flex flex-col">
                <div className="text-sm font-medium text-gray-600 mb-2">
                  Created on:
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {campaignData?.campaign?.createdAt ? (
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
              <div className="flex flex-col">
                <div className="text-sm font-medium text-gray-600 mb-2">
                  Agents Deployed:
                </div>
                <div className="flex items-center gap-4">
                  {agentsWithAvatars.length > 0 ? (
                    agentsWithAvatars.map((agent, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage 
                            src={agent.imageUrl} 
                            alt={agent.name}
                          />
                          <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                            {agent.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-gray-900">
                          {agent.name}{index < agentsWithAvatars.length - 1 ? ',' : ''}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">No agents deployed</span>
                  )}
                </div>
              </div>
            </div>

            {/* Right side - Campaign Progress */}
            <div className="flex flex-col">
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
