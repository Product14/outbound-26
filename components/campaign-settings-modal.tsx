'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Calendar, Clock, Phone, MessageSquare, Settings2, FileText, Zap, Users } from 'lucide-react'
import { fetchCampaignDetails, type CampaignDetailResponse, fetchCampaignConversationData, type CampaignConversationData } from '@/lib/campaign-api'
import { fetchAgentList, type Agent } from '@/lib/agent-api'
import { extractUrlParams } from '@/lib/url-utils'
import { formatUseCaseLabel } from '@/utils/campaign-setup-utils'

interface CampaignSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  campaignId: string
  campaignName: string
  campaignType: string
  campaignUseCase?: string
}

interface CampaignSettings {
  // Basic Details
  name: string
  type: string
  useCase: string
  status: string
  totalCustomers: number
  
  // Agent Details
  agentName?: string
  agentImageUrl?: string
  
  // Schedule Settings
  schedule: 'now' | 'scheduled'
  startDate?: string
  endDate?: string
  timeSlots?: Array<{
    startTime: string
    endTime: string
  }>
  
  // Call Settings
  maxRetryAttempts?: number
  retryDelayMinutes?: number
  voicemailStrategy?: string
  voicemailMessage?: string
  smsSwitchOnSecondAttempt?: boolean
  
  // Pacing & Limits
  maxCallsPerDay?: number
  maxCallsPerHour?: number
  maxConcurrentCalls?: number
}

export function CampaignSettingsModal({
  isOpen,
  onClose,
  campaignId,
  campaignName,
  campaignType,
  campaignUseCase
}: CampaignSettingsModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<CampaignSettings | null>(null)
  const [agent, setAgent] = useState<Agent | null>(null)

  const urlParams = extractUrlParams()

  useEffect(() => {
    if (isOpen && campaignId) {
      loadCampaignSettings()
    }
  }, [isOpen, campaignId])

  const loadCampaignSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch campaign conversation data (the new API with all the details)
      const conversationData = await fetchCampaignConversationData(campaignId, urlParams.auth_key || undefined)

      // Fetch agents to get agent details
      let agentData = null
      if (urlParams.enterprise_id && urlParams.team_id) {
        try {
          const agents = await fetchAgentList(
            urlParams.enterprise_id,
            urlParams.team_id,
            undefined,
            undefined,
            undefined,
            urlParams.auth_key || undefined
          )
          // Find the agent for this campaign using teamAgentMappingId
          agentData = agents.find(agent => agent.id === conversationData.teamAgentMappingId) || agents[0] || null
          setAgent(agentData)
        } catch (agentError) {
          console.warn('Could not fetch agent details:', agentError)
        }
      }

        // Map campaign conversation data to our settings structure
        const mappedSettings: CampaignSettings = {
          name: conversationData.name,
          type: conversationData.campaignType,
          useCase: conversationData.campaignUseCase,
          status: conversationData.status === 'active' ? 'active' : conversationData.status,
          totalCustomers: conversationData.totalCustomers,
          agentName: agentData?.name,
          agentImageUrl: agentData?.imageUrl,
        
        // Use real data from the API
        schedule: 'now', // Most campaigns start immediately - could be enhanced based on startDate
        maxRetryAttempts: conversationData.retryLogic?.maxAttempts,
        retryDelayMinutes: conversationData.retryLogic?.retryDelay ? Math.round(conversationData.retryLogic.retryDelay / 60) : 60, // Convert seconds to minutes
        voicemailStrategy: conversationData.voicemailConfig?.method,
        voicemailMessage: conversationData.voicemailConfig?.voicemailMessage,
        smsSwitchOnSecondAttempt: conversationData.retryLogic?.smsSwitchover,
        maxCallsPerDay: conversationData.callLimits?.dailyContactLimit,
        maxCallsPerHour: conversationData.callLimits?.hourlyThrottle,
        maxConcurrentCalls: conversationData.callLimits?.maxConcurrentCalls,
        timeSlots: conversationData.scheduledTime?.map(slot => ({ 
          startTime: slot.start, 
          endTime: slot.end 
        })) || []
      }

      setSettings(mappedSettings)
    } catch (err) {
      console.error('Error loading campaign settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to load campaign settings')
    } finally {
      setLoading(false)
    }
  }

  const formatScheduleType = (schedule: string) => {
    return schedule === 'now' ? 'Start Immediately' : 'Scheduled'
  }

  const formatRetryDelay = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`
    if (minutes === 60) return '1 hour'
    if (minutes < 1440) return `${minutes / 60} hours`
    return `${minutes / 1440} days`
  }

  const formatVoicemailStrategy = (strategy: string) => {
    switch (strategy) {
      case 'leave_message': return 'Leave voicemail message'
      case 'hang_up': return 'Hang up'
      case 'transfer': return 'Transfer to human'
      case 'sms_fallback': return 'Send SMS fallback'
      default: return strategy
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b border-gray-200 flex-shrink-0 pr-12">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Campaign Settings
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 mt-1">
            Configuration summary for {campaignName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 max-h-[calc(90vh-120px)] overflow-y-auto">
          <div className="px-6 py-4 space-y-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-600">Loading campaign settings...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-red-500 text-center">
                <p className="font-medium">Error loading settings</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadCampaignSettings}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : settings ? (
            <div>
              {/* Campaign Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-900">Campaign Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Campaign Name</p>
                    <p className="text-sm font-medium text-gray-900">{settings.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Use Case</p>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                      {formatUseCaseLabel(settings.type)} - {formatUseCaseLabel(settings.useCase)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Total Records</p>
                    <p className="text-sm font-medium text-gray-900">{settings.totalCustomers} customers</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Status</p>
                    <Badge className={`text-xs ${
                      settings.status === 'running' ? 'bg-green-100 text-green-800 border-green-200' :
                      settings.status === 'completed' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                      settings.status === 'active' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                      'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }`}>
                      {settings.status}
                    </Badge>
                  </div>
                </div>
                
                {agent && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">AI Agent</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 border border-gray-300">
                        <img
                          src={agent.imageUrl || '/placeholder-user.jpg'}
                          alt={agent.name}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{agent.name}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Schedule Settings */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-900">Schedule Settings</h3>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Schedule Type</p>
                  <div className="flex items-center gap-2">
                    {settings.schedule === 'now' ? (
                      <Zap className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                    <p className="text-sm font-medium text-gray-900">
                      {formatScheduleType(settings.schedule)}
                    </p>
                  </div>
                </div>
                
                {settings.timeSlots && settings.timeSlots.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Daily Time Slots</p>
                    <div className="space-y-1">
                      {settings.timeSlots.map((slot, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span>{slot.startTime} - {slot.endTime}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Call Settings */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-900">Call Rules & Behavior</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Max Retry Attempts</p>
                    <p className="text-sm font-medium text-gray-900">{settings.maxRetryAttempts} attempts</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Retry Delay</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatRetryDelay(settings.retryDelayMinutes || 60)}
                    </p>
                  </div>
                </div>
                
                {/* <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">SMS Switch on 2nd Attempt</p>
                  <Badge className={`text-xs ${
                    settings.smsSwitchOnSecondAttempt 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : 'bg-gray-100 text-gray-800 border-gray-200'
                  }`}>
                    {settings.smsSwitchOnSecondAttempt ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div> */}
              </div>

              {/* Voicemail Settings */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-900">Voicemail Strategy</h3>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Handling Method</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatVoicemailStrategy(settings.voicemailStrategy || 'leave_message')}
                  </p>
                </div>
                
                {settings.voicemailStrategy === 'leave_message' && settings.voicemailMessage && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Voicemail Message</p>
                    <div className="bg-white border border-gray-200 rounded p-3">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {settings.voicemailMessage}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Pacing & Limits */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Settings2 className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-900">Pacing & Limits</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Daily Limit</p>
                    <p className="text-sm font-medium text-gray-900">
                      {settings.maxCallsPerDay} contacts/day
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Hourly Throttle</p>
                    <p className="text-sm font-medium text-gray-900">
                      {settings.maxCallsPerHour} contacts/hour
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Concurrent Calls</p>
                    <p className="text-sm font-medium text-gray-900">
                      {settings.maxConcurrentCalls} concurrent
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
