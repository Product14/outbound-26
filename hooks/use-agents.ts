import { useMemo } from 'react'
import type { CallRecord } from '@/types/call-record'

export interface Agent {
  id: string
  name: string
  agentName: string
  type: string
  status: string
}

export interface UseAgentsReturn {
  agents: Agent[]
  loading: boolean
  error: string | null
}

export interface UseAgentsOptions {
  calls: CallRecord[]
  loading: boolean
}

export function useAgents(options: UseAgentsOptions): UseAgentsReturn {
  // Extract unique agents from call data
  const agents = useMemo(() => {
    if (options.loading || !options.calls || options.calls.length === 0) {
      return []
    }

    const uniqueAgents = new Map<string, Agent>()
    
    options.calls.forEach((call) => {
      // Extract agent information from call data
      // Check multiple possible locations for agent info
      let agentName = null
      let agentType = 'AI Agent'
      
      // First, check if there's agentConfig in the call data (new priority)
      if ((call as any).agentConfig?.agentName) {
        agentName = (call as any).agentConfig.agentName
        agentType = 'AI Agent' // agentConfig doesn't include type, default to AI Agent
      }
      // Then check if there's agentInfo in the call data (raw API response)
      else if ((call as any).agentInfo?.agentName) {
        agentName = (call as any).agentInfo.agentName
        agentType = (call as any).agentInfo.agentType || 'AI Agent'
      }
      // Fallback to appointment.advisor and follow_up.assignee
      else if (call.appointment?.advisor || call.follow_up?.assignee) {
        agentName = call.appointment?.advisor || call.follow_up?.assignee
      }
      
      if (agentName && agentName.trim() !== '') {
        if (!uniqueAgents.has(agentName)) {
          uniqueAgents.set(agentName, {
            id: `agent-${uniqueAgents.size + 1}`,
            name: agentName,
            agentName: agentName,
            type: agentType,
            status: 'active'
          })
        }
      }
    })
    
    const result = Array.from(uniqueAgents.values())

    return result
  }, [options.calls, options.loading])

  return {
    agents,
    loading: options.loading,
    error: null, // No separate API call, so no error state
  }
}
