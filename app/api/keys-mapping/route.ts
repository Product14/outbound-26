import { NextRequest, NextResponse } from 'next/server';
import { configs } from '@/configs';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    // Extract auth_key from URL parameters
    const { searchParams } = new URL(request.url);
    const authKey = searchParams.get('auth_key');
    
    // Validate the payload
    if (!payload.requiredKeys || !Array.isArray(payload.requiredKeys) ||
        !payload.availableKeys || !Array.isArray(payload.availableKeys)) {
      return NextResponse.json(
        { error: 'Missing required fields: requiredKeys and availableKeys arrays are required' },
        { status: 400 }
      );
    }

    // Validate auth_key requirement
    if (!authKey) {
      return NextResponse.json(
        { error: 'Missing required parameter: auth_key is required for authentication' },
        { status: 401 }
      );
    }
    
    
    // Call the Spyne API for key mapping
    const externalResponse = await fetch(`${configs.base_url}conversation/campaign/keys-mapping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authKey}`,
      },
      body: JSON.stringify(payload)
    });
    
    if (!externalResponse.ok) {
      const errorText = await externalResponse.text();
      console.error('External API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to process key mapping from external API', details: errorText },
        { status: externalResponse.status }
      );
    }
    
    const data = await externalResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in keys-mapping API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
