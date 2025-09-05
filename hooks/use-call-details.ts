import { useState, useEffect } from 'react'
import { fetchSpyneCallReportById } from '@/lib/spyne-api'
import type { SpyneCallData } from '@/types/spyne-api'

interface UseCallDetailsReturn {
  callDetails: SpyneCallData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  retry: () => Promise<void>
}

export function useCallDetails(callId: string | null): UseCallDetailsReturn {
  const [callDetails, setCallDetails] = useState<SpyneCallData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCallDetails = async () => {
    if (!callId) {
      setCallDetails(null)
      return
    }

    setLoading(true)
    setError(null)

    try {

      const data = await fetchSpyneCallReportById(callId)
      
      // Validate the data structure before setting it
      if (!data || !data.callId) {
        throw new Error('Invalid response data structure')
      }
      
      setCallDetails(data)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch call details'
      setError(errorMessage)
      
      // Set a more user-friendly error message
      if (errorMessage.includes('Invalid time value')) {
        setError('Error processing call data - please try again')
      } else if (errorMessage.includes('Failed to fetch')) {
        setError('Unable to load call details - please check your connection')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCallDetails()
  }, [callId])

  return {
    callDetails,
    loading,
    error,
    refetch: fetchCallDetails,
    retry: fetchCallDetails
  }
}
