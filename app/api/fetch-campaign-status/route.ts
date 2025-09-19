import { NextRequest, NextResponse } from 'next/server'
import { configs } from '@/configs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const authKey = searchParams.get('auth_key')
    const statusTypes = searchParams.get('statusTypes') // Legacy support
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '50'
    const q = searchParams.get('q') // Search query
    const connectionStatus = searchParams.get('connectionStatus') || statusTypes // Use connectionStatus or fallback to statusTypes
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const minDuration = searchParams.get('minDuration')
    const maxDuration = searchParams.get('maxDuration')
    const outcomes = searchParams.get('outcomes')
    const minAiQuality = searchParams.get('minAiQuality')
    const maxAiQuality = searchParams.get('maxAiQuality')
    const sortBy = searchParams.get('sortBy')
    const sortOrder = searchParams.get('sortOrder')
    
    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

    // Build the URL with optional filters and pagination
    let url = `${configs.base_url}conversation/campaign/status/${campaignId}`
    const queryParams = new URLSearchParams()
    
    // Add all available query parameters
    if (connectionStatus) queryParams.append('connectionStatus', connectionStatus)
    if (q) queryParams.append('q', q)
    if (startDate) queryParams.append('startDate', startDate)
    if (endDate) queryParams.append('endDate', endDate)
    if (minDuration) queryParams.append('minDuration', minDuration)
    if (maxDuration) queryParams.append('maxDuration', maxDuration)
    if (outcomes) queryParams.append('outcomes', outcomes)
    if (minAiQuality) queryParams.append('minAiQuality', minAiQuality)
    if (maxAiQuality) queryParams.append('maxAiQuality', maxAiQuality)
    if (sortBy) queryParams.append('sortBy', sortBy)
    if (sortOrder) queryParams.append('sortOrder', sortOrder)
    
    queryParams.append('page', page)
    queryParams.append('limit', limit)
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`
    }

    console.log('Fetching from URL:', url) // Debug log
    
    // Build headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    // Add authorization header if auth_key is provided
    if (authKey) {
      headers['Authorization'] = authKey.startsWith('Bearer ') ? authKey : `Bearer ${authKey}`
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API Error: ${response.status} - ${errorText}`)
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error fetching campaign status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign status' },
      { status: 500 }
    )
  }
}
