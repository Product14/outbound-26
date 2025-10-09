import { NextRequest, NextResponse } from 'next/server'
import { configs } from '@/configs'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignId, campaignStats } = body
    
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const authKey = authHeader?.replace('Bearer ', '');
    
    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

    if (!campaignStats) {
      return NextResponse.json(
        { error: 'Campaign status is required' },
        { status: 400 }
      )
    }

    // Validate campaign status
    const validStatuses = ['preparing', 'ready', 'running', 'completed', 'paused', 'stopped']
    if (!validStatuses.includes(campaignStats)) {
      return NextResponse.json(
        { error: `Invalid campaign status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    if (!authKey) {
      return NextResponse.json(
        { error: 'Missing required header: Authorization header with Bearer token is required for authentication' },
        { status: 401 }
      )
    }

    // Build the URL
    const url = `${configs.base_url}conversation/campaign/status`
    
    // Build headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    // Add authorization header
    if (authKey) {
      headers['Authorization'] = `Bearer ${authKey}`
    }
    
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        campaignId,
        campaignStats
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API Error: ${response.status} - ${errorText}`)
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error updating campaign status:', error)
    return NextResponse.json(
      { error: 'Failed to update campaign status' },
      { status: 500 }
    )
  }
}

