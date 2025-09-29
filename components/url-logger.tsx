'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function URLLogger() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Construct the full URL
    const url = `${window.location.origin}${pathname}`
    const fullUrl = searchParams.toString() 
      ? `${url}?${searchParams.toString()}`
      : url

  
  }, [pathname, searchParams])

  // This component doesn't render anything
  return null
}
