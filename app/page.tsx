'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { buildUrlWithParams } from '@/lib/url-utils'

export default function Dashboard() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to results page to show campaign list, preserving URL parameters
    router.push(buildUrlWithParams('/results'))
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <div className="text-center">
        <p className="text-body text-text-secondary">
          Redirecting to Campaign Analytics...
        </p>
      </div>
    </div>
  )
}
