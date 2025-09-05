import { NextRequest, NextResponse } from 'next/server';
import { configs } from '@/configs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const authKey = searchParams.get('auth_key');

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Missing required parameter: campaignId' },
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

    const response = await fetch(
      `${configs.base_url}conversation/campaign/details/${campaignId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authKey}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch campaign details: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch campaign details: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in fetch-campaign-details API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
