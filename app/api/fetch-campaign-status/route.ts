import { NextRequest, NextResponse } from 'next/server'
import { configs } from '@/configs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const statusTypes = searchParams.get('statusTypes')
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '50'
    
    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

    // Build the URL with optional status filters and pagination
    let url = `${configs.base_url}conversation/campaign/status/${campaignId}`
    const queryParams = new URLSearchParams()
    
    if (statusTypes) {
      queryParams.append('statusTypes', statusTypes)
    }
    queryParams.append('page', page)
    queryParams.append('limit', limit)
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
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
