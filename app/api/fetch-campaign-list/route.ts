import { NextRequest, NextResponse } from 'next/server';
import { configs } from '@/configs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const enterpriseId = searchParams.get('enterpriseId');
    const teamId = searchParams.get('teamId');

    if (!enterpriseId || !teamId) {
      return NextResponse.json(
        { error: 'Missing required parameters: enterpriseId and teamId' },
        { status: 400 }
      );
    }

    console.log(`Fetching campaign list for enterprise ${enterpriseId}, team ${teamId}`);

    const response = await fetch(
      `${configs.base_url}conversation/campaign/list?enterpriseId=${enterpriseId}&teamId=${teamId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`Campaign list API response status: ${response.status}`);

    if (!response.ok) {
      console.error(`Failed to fetch campaign list: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch campaign list: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Campaign list API response data:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in fetch-campaign-list API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
