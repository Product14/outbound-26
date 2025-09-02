import { NextRequest, NextResponse } from 'next/server';
import { configs } from '@/configs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Missing required parameter: campaignId' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${configs.base_url}conversation/campaign/details/${campaignId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'sails.sid=s%3A1qIYgfILXja4FsVoQ11K-gFZLGt7k3Qt.wkgWzjwWlv41sosK9FmWKUJ%2F1ZYwtml%2FaTuWNGWli%2BQ'
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
