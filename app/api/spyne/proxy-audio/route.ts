import { NextRequest, NextResponse } from 'next/server'

// Proxies remote audio files (e.g., Spyne recording URLs) so we can attach
// Authorization headers and avoid CORS issues in the browser audio element.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const target = searchParams.get('target')
  if (!target) {
    return NextResponse.json({ error: 'Missing target URL' }, { status: 400 })
  }

  // Forward headers that are important for media streaming
  const forwardHeaders: Record<string, string> = {}
  const range = request.headers.get('range')
  if (range) forwardHeaders['Range'] = range

  // Try to carry through Authorization if provided; no .env fallback
  const incomingAuth = request.headers.get('authorization')
  if (incomingAuth) {
    forwardHeaders['Authorization'] = incomingAuth
  }
  // No .env token dependency - auth must come from request headers

  try {
    const upstream = await fetch(target, {
      method: 'GET',
      headers: forwardHeaders,
    })

    // Pass through the upstream response (status, headers, body)
    const resHeaders = new Headers()
    upstream.headers.forEach((value, key) => {
      // Avoid setting forbidden headers
      if (!['content-security-policy'].includes(key.toLowerCase())) {
        resHeaders.set(key, value)
      }
    })
    // Make sure range/streaming headers are present for the browser
    if (!resHeaders.has('Accept-Ranges')) resHeaders.set('Accept-Ranges', 'bytes')

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: resHeaders,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to proxy audio', details: String(err) }, { status: 502 })
  }
}


