import { NextRequest, NextResponse } from 'next/server'
import { config, getApiBaseUrl, getFallbackApiBaseUrl, shouldUseProduction } from '@/config'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint')
  const callId = searchParams.get('callId')
  
  let apiUrl: string
  // No .env dependencies - enterprise and team IDs come from URL parameters only
  const DEFAULT_ENTERPRISE_ID = ''
  const DEFAULT_TEAM_ID = ''
  
  // Use auth configuration to determine API endpoints
  const PRIMARY_BASE = getApiBaseUrl()
  const FALLBACK_BASE = getFallbackApiBaseUrl()
  
  // Forward auth if present (header, query param, or referer auth_key)
  const incomingAuthHeader = request.headers.get('authorization')
  const authTokenParam = searchParams.get('authToken')
  
  // Extract auth_key from referer URL if present
  const referer = request.headers.get('referer') || request.headers.get('referrer')
  let authKeyFromReferer: string | undefined
  if (referer) {
    try {
      const u = new URL(referer)
      authKeyFromReferer = u.searchParams.get('auth_key') || undefined
    } catch {}
  }
  
  // Log which environment we're using and auth sources
  console.log(`[API Route] Using ${shouldUseProduction() ? 'PRODUCTION' : 'STAGING'} API: ${PRIMARY_BASE}`)
  console.log(`[API Route] Auth sources - Header: ${!!incomingAuthHeader}, Query: ${!!authTokenParam}, Referer: ${!!authKeyFromReferer}`)
  
  // No .env token dependency - auth comes from request headers, query params, or referer
  const defaultBearer = undefined
  const forwardHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  // Only add Authorization header if we have auth credentials
  // Production API requires auth, staging API doesn't
  if (incomingAuthHeader) {
    forwardHeaders['Authorization'] = incomingAuthHeader
  } else if (authTokenParam) {
    forwardHeaders['Authorization'] = `Bearer ${authTokenParam}`
  } else if (authKeyFromReferer) {
    forwardHeaders['Authorization'] = authKeyFromReferer // auth_key already includes "Bearer "
  } else if (defaultBearer) {
    forwardHeaders['Authorization'] = defaultBearer
  }
  
  // Log auth status
  const hasAuth = !!(incomingAuthHeader || authTokenParam || authKeyFromReferer || defaultBearer)
  console.log(`[API Route] Has auth: ${hasAuth}, Using ${shouldUseProduction() ? 'PRODUCTION' : 'STAGING'} API`)
  
  // Helper to extract tenant IDs from query or Referer header
  const getTenantIds = (): { enterpriseId?: string; teamId?: string } => {
    const qpEnterprise = searchParams.get('enterpriseId') || searchParams.get('enterprise_id') || undefined
    const qpTeam = searchParams.get('teamId') || searchParams.get('team_id') || undefined
    if (qpEnterprise && qpTeam) return { enterpriseId: qpEnterprise, teamId: qpTeam }
    const referer = request.headers.get('referer') || request.headers.get('referrer')
    if (referer) {
      try {
        const u = new URL(referer)
        const enterpriseId = u.searchParams.get('enterpriseId') || u.searchParams.get('enterprise_id') || undefined
        const teamId = u.searchParams.get('teamId') || u.searchParams.get('team_id') || undefined
        return { enterpriseId: enterpriseId || qpEnterprise, teamId: teamId || qpTeam }
      } catch {}
    }
    return { enterpriseId: qpEnterprise, teamId: qpTeam }
  }

  let path = ''
  let queryParams: URLSearchParams | null = null

  if (endpoint === 'reports') {
    // Consolidated reports endpoint - now gets all data in single API call
    const { enterpriseId, teamId } = getTenantIds()
    const effectiveEnterpriseId = enterpriseId || DEFAULT_ENTERPRISE_ID
    const effectiveTeamId = teamId || DEFAULT_TEAM_ID
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit')
    const dateRange = searchParams.get('dateRange') || undefined
    const customStartDate = searchParams.get('customStartDate') || undefined
    const customEndDate = searchParams.get('customEndDate') || undefined
    const outcome = searchParams.get('outcome') || undefined
    const agentType = searchParams.get('agentType') || undefined
    
    queryParams = new URLSearchParams({
      ...(effectiveEnterpriseId ? { enterpriseId: effectiveEnterpriseId } : {} as any),
      ...(effectiveTeamId ? { teamId: effectiveTeamId } : {} as any),
      page,
      ...(limit && { limit }),
      ...(dateRange && { dateRange }),
      ...(customStartDate && { customStartDate }),
      ...(customEndDate && { customEndDate }),
      ...(outcome && { outcome }),
      ...(agentType && { agentType })
    })
    path = `/conversation/vapi/end-call-reports?${queryParams}`


  } else if (endpoint === 'report-by-id' && callId) {
    // Individual call endpoint - kept for backward compatibility but may not be needed
    path = `/conversation/vapi/end-call-report-by-id?callId=${callId}`

  } else if (endpoint === 'agents') {
    // Agents list endpoint
    const { enterpriseId, teamId } = getTenantIds()
    const effectiveEnterpriseId = enterpriseId || DEFAULT_ENTERPRISE_ID
    const effectiveTeamId = teamId || DEFAULT_TEAM_ID
    queryParams = new URLSearchParams({
      ...(effectiveEnterpriseId ? { enterpriseId: effectiveEnterpriseId } : {} as any),
      ...(effectiveTeamId ? { teamId: effectiveTeamId } : {} as any),
    })
    path = `/conversation/agents/fetch-agent-list?${queryParams}`
  } else {
    return NextResponse.json({ error: 'Invalid endpoint or missing callId' }, { status: 400 })
  }



  try {
    // Helper to decide if the response contains usable data
    const hasUsableData = (ep: string, body: any): boolean => {
      try {
        if (ep === 'reports') {
          return Array.isArray(body?.data) && body.data.length > 0
        }
        if (ep === 'agents') {
          return Array.isArray(body) || Array.isArray(body?.data)
        }
        if (ep === 'report-by-id') {
          return !!body?.callId
        }
      } catch {}
      return false
    }

    // Try primary API first (based on auth_manage_prod setting)
    let upstream = await fetch(`${PRIMARY_BASE}${path}`, { method: 'GET', headers: forwardHeaders })
    let chosenBase = PRIMARY_BASE

    let data: any = null
    if (upstream.ok) {
      try { data = await upstream.json() } catch { data = null }
    }

    if (!upstream.ok || !hasUsableData(endpoint || '', data)) {
      // Fallback to secondary API
      console.log(`[API Route] Primary API failed, trying fallback: ${FALLBACK_BASE}`)
      upstream = await fetch(`${FALLBACK_BASE}${path}`, { method: 'GET', headers: forwardHeaders })
      chosenBase = FALLBACK_BASE
      data = null
      if (upstream.ok) {
        try { data = await upstream.json() } catch { data = null }
      }
      if (!upstream.ok) {
        // Try to get more details about the error
        let errorDetails = ''
        try {
          const errorText = await upstream.text()
          errorDetails = errorText
        } catch (e) {}
        return NextResponse.json(
          { 
            error: `API request failed: ${upstream.status} ${upstream.statusText}`,
            details: errorDetails,
            url: `${chosenBase}${path}`
          },
          { status: upstream.status }
        )
      }
      // If fallback also returns empty/unusable, return empty shape and let client fallback to mock
      if (!hasUsableData(endpoint || '', data)) {
        console.log(`[API Route] Both primary and fallback APIs returned unusable data`)
        const res = NextResponse.json(data || { data: [], analytics: { sentimentAnalysis: [], agentTypeCounts: {} }, pagination: { page: 1, limit: 0, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false } })
        try { res.headers.set('x-spyne-base-url', chosenBase) } catch {}
        return res
      }
    }

    // Success - return the chosen environment data
    console.log(`[API Route] Successfully fetched data from: ${chosenBase}`)
    const res = NextResponse.json(data)
    try {
      res.headers.set('x-spyne-base-url', chosenBase)
      res.headers.set('x-use-production', config.useProduction.toString())
    } catch {}
    return res
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
