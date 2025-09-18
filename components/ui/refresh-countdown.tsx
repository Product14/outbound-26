'use client'

import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { configs } from '@/configs'

interface RefreshCountdownProps {
  intervalSeconds?: number
  onRefresh?: () => void
  className?: string
}

export function RefreshCountdown({ 
  intervalSeconds, 
  onRefresh,
  className = ""
}: RefreshCountdownProps) {
  // Use config interval if not provided, but respect enablePolling setting
  const effectiveInterval = intervalSeconds ?? configs.pollingIntervalSeconds
  const [countdown, setCountdown] = useState(effectiveInterval)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    // If polling is disabled, don't start the countdown
    if (!configs.enablePolling) {
      return
    }

    if (countdown <= 0) {
      setIsRefreshing(true)
      onRefresh?.()
      
      // Reset countdown after a brief delay
      setTimeout(() => {
        setCountdown(effectiveInterval)
        setIsRefreshing(false)
      }, 1000)
      return
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, effectiveInterval, onRefresh])

  // If polling is disabled, show a manual refresh button instead
  if (!configs.enablePolling) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
        <button
          onClick={() => {
            setIsRefreshing(true)
            onRefresh?.()
            setTimeout(() => setIsRefreshing(false), 1000)
          }}
          className="flex items-center gap-2 hover:text-gray-700 transition-colors"
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      <span>
        {isRefreshing ? 'Refreshing...' : `Refreshing in ${countdown}s`}
      </span>
    </div>
  )
}
