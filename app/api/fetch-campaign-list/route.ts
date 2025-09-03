import { NextRequest, NextResponse } from 'next/server';
import { configs } from '@/configs';
import { extractAuthKey, validateAuthKey, getAuthHeaders } from '@/lib/auth-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const enterpriseId = searchParams.get('enterpriseId');
    const teamId = searchParams.get('teamId');
    // Extract auth_key (controlled by auth config)
    const authKey = extractAuthKey(request);

    if (!enterpriseId || !teamId) {
      return NextResponse.json(
        { error: 'Missing required parameters: enterpriseId and teamId' },
        { status: 400 }
      );
    }

    // Validate auth_key requirement based on configuration
    const authValidation = validateAuthKey(authKey);
    if (!authValidation.isValid) {
      return NextResponse.json(
        authValidation.error,
        { status: authValidation.error.status }
      );
    }

    const response = await fetch(
      `${configs.base_url}conversation/campaign/list?enterpriseId=${enterpriseId}&teamId=${teamId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(authKey)
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch campaign list: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch campaign list: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in fetch-campaign-list API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
