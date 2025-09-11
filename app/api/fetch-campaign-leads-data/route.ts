import { NextRequest, NextResponse } from 'next/server'
import { configs } from '@/configs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const enterpriseId = searchParams.get('enterpriseId')
    const teamId = searchParams.get('teamId')
    const leadsFilterOptions = searchParams.get('leadsFilterOptions')
    const authKey = searchParams.get('auth_key')

    if (!enterpriseId || !teamId || !leadsFilterOptions) {
      return NextResponse.json(
        { error: 'Missing required parameters: enterpriseId, teamId, and leadsFilterOptions are required' },
        { status: 400 }
      )
    }

    // Build the URL for the external API
    const params = new URLSearchParams()
    params.append('enterpriseId', enterpriseId)
    params.append('teamId', teamId)
    params.append('leadsFilterOptions', leadsFilterOptions)

    if (authKey) {
      params.append('auth_key', authKey)
    }

    const fullUrl = `${configs.base_url}conversation/campaign/campaign-leads-data?${params.toString()}`

    const response = await fetch(fullUrl)

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage += ` - ${errorData.error || errorData.message || 'Unknown error'}`
      } catch {
        // If response is not JSON, try to get text
        try {
          const errorText = await response.text()
          if (errorText) {
            errorMessage += ` - ${errorText}`
          }
        } catch {
          // Ignore if we can't get error details
        }
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching campaign leads data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
