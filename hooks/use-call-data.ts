import { useState, useEffect, useCallback } from 'react'
import type { CallRecord } from '@/types/call-record'
import type { SpyneApiResponse } from '@/types/spyne-api'
import { fetchCallRecords } from '@/lib/spyne-api'

export interface UseCallDataReturn {
  calls: CallRecord[]
  analytics: SpyneApiResponse['analytics'] | null
  pagination: SpyneApiResponse['pagination'] | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  fetchPage: (page: number) => Promise<void>
}

export interface UseCallDataOptions {
  page?: number
  limit?: number
  enterpriseId?: string
  teamId?: string
  dateRange?: string
  customStartDate?: string
  customEndDate?: string
  outcome?: string
  agentType?: string
}

export function useCallData(options: UseCallDataOptions = {}): UseCallDataReturn {
  const [calls, setCalls] = useState<CallRecord[]>([])
  const [analytics, setAnalytics] = useState<SpyneApiResponse['analytics'] | null>(null)
  const [pagination, setPagination] = useState<SpyneApiResponse['pagination'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)



  const fetchData = useCallback(async (page = 1, append = false) => {
    setLoading(true)
    setError(null)

    try {
      const result = await fetchCallRecords({
        page,
        limit: options.limit,
        enterpriseId: options.enterpriseId,
        teamId: options.teamId,
        dateRange: options.dateRange,
        customStartDate: options.customStartDate,
        customEndDate: options.customEndDate,
        outcome: options.outcome,
        agentType: options.agentType,
      })



      if (page === 1 || !append) {
        // For page 1 or when not appending, replace the entire array
        setCalls(result.calls)

      } else {
        // For subsequent pages, append to existing calls
        setCalls(prevCalls => {
          const newCalls = [...prevCalls, ...result.calls]

          return newCalls
        })
      }
      
      setAnalytics(result.analytics)
      setPagination(result.pagination)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch call data'
      setError(errorMessage)
      // swallow error logging in UI
      
      // Don't fallback to mock data - show the error instead
      setCalls([])
      setAnalytics(null)
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [options.limit, options.enterpriseId, options.teamId, options.dateRange, options.customStartDate, options.customEndDate, options.outcome, options.agentType])

  const fetchPage = useCallback(async (page: number) => {
    // For pagination (not infinite scroll), always replace data
    await fetchData(page, false)
  }, [fetchData])

  const refetch = useCallback(async () => {
    // Refetch should always replace data, not append
    await fetchData(options.page || 1, false)
  }, [fetchData]) // Remove options.page to avoid infinite loops

  useEffect(() => {
    // Initial load should always replace data, not append
    fetchData(options.page || 1, false)
  }, [fetchData]) // Remove options.page to avoid infinite loops

  return {
    calls,
    analytics,
    pagination,
    loading,
    error,
    refetch,
    fetchPage,
  }
}
