'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { buildUrlWithParams } from '@/lib/url-utils'

export default function Dashboard() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to results page to show campaign list, preserving URL parameters
    router.push(buildUrlWithParams('/results'))
  }, [router])

  return (
    <MainLayout>
      <div className="page-container min-h-screen flex flex-col">
        {/* Fallback content while redirecting */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-body text-text-secondary">
              Redirecting to Campaign Analytics...
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
