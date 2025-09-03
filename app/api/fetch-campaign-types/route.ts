import { NextRequest, NextResponse } from 'next/server';
import { configs } from '@/configs';
import { extractAuthKey, validateAuthKey, getAuthHeaders } from '@/lib/auth-config';

export async function GET(request: NextRequest) {
  try {
    // Extract auth_key from URL parameters (controlled by auth config)
    const authKey = extractAuthKey(request);

    // Validate auth_key requirement based on configuration
    const authValidation = validateAuthKey(authKey);
    if (!authValidation.isValid) {
      return NextResponse.json(
        authValidation.error,
        { status: authValidation.error.status }
      );
    }

    // Call the Spyne API to get campaign types
    const externalResponse = await fetch(`${configs.base_url}conversation/campaign/master-data/campaign-types`, {
      method: 'GET',
      headers: getAuthHeaders(authKey),
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
