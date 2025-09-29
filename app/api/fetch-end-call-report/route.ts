import { NextRequest, NextResponse } from 'next/server'
import { configs } from '@/configs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const callId = searchParams.get('callId')
    const authKey = searchParams.get('auth_key')
    
    if (!callId) {
      return NextResponse.json(
        { error: 'Call ID is required' },
        { status: 400 }
      )
    }

    // Build headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    // Add authorization header if auth_key is provided
    if (authKey) {
      // Check if authKey already has 'Bearer ' prefix
      headers['Authorization'] = authKey.startsWith('Bearer ') ? authKey : `Bearer ${authKey}`
    }

    // Use callId parameter as expected by the Spyne API
    const apiUrl = `${configs.base_url}conversation/vapi/end-call-report-by-id?callId=${callId}`
    
   
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Spyne API error: ${response.status} - ${errorText}`)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error fetching end call report data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch end call report data' },
      { status: 500 }
    )
  }
}
