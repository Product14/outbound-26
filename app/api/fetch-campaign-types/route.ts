import { NextRequest, NextResponse } from 'next/server';
import { configs } from '@/configs';

export async function GET(request: NextRequest) {
  try {
    // Extract auth_key from URL parameters
    const { searchParams } = new URL(request.url);
    const authKey = searchParams.get('auth_key');

    if (!authKey) {
      return NextResponse.json(
        { error: 'Missing required parameter: auth_key is required for authentication' },
        { status: 401 }
      );
    }

    // Call the Spyne API to get campaign types
    const externalResponse = await fetch(`${configs.base_url}conversation/campaign/master-data/campaign-types`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authKey}`
      },
    });
    
    if (!externalResponse.ok) {
      const errorText = await externalResponse.text();
      console.error('External API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch campaign types from external API', details: errorText },
        { status: externalResponse.status }
      );
    }
    
    const data = await externalResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in fetch-campaign-types API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
