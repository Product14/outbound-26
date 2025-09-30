import { NextRequest, NextResponse } from 'next/server'
import { configs } from '@/configs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const authKey = authHeader?.replace('Bearer ', '');
    
    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

    // Build headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    // Add authorization header if auth_key is provided
    if (authKey) {
      headers['Authorization'] = `Bearer ${authKey}`
    }

    const response = await fetch(
      `${configs.base_url}conversation/campaign/${campaignId}`,
      {
        method: 'GET',
        headers,
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error fetching campaign conversation data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign conversation data' },
      { status: 500 }
    )
  }
}
