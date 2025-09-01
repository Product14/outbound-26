import { NextRequest, NextResponse } from 'next/server';
import { LaunchCampaignPayload } from '@/lib/campaign-api';
import { configs } from '@/configs';

export async function POST(request: NextRequest) {
  try {
    const payload: LaunchCampaignPayload = await request.json();
    
    // Validate the payload
    if (!payload.name || !payload.campaignType || !payload.campaignUseCase || 
        !payload.enterpriseId || !payload.teamId || !payload.customers) {
      return NextResponse.json(
        { error: 'Missing required fields in payload' },
        { status: 400 }
      );
    }

    // Validate customers array
    if (!Array.isArray(payload.customers) || payload.customers.length === 0) {
      return NextResponse.json(
        { error: 'Customers array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Note: Customer field validation is now handled dynamically by the campaign-types API
    // The exact required fields come from the campaign-types API response and are validated during CSV mapping
    // We only send the exact fields specified in the requiredKeys array from the campaign-types API

    console.log('Campaign Launch Payload:', JSON.stringify(payload, null, 2));
    
    // Call the real Spyne API
    const externalResponse = await fetch(`${configs.base_url}conversation/campaign/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    if (!externalResponse.ok) {
      const errorText = await externalResponse.text();
      console.error('External API error:', externalResponse.status, errorText);
      throw new Error(`External API error: ${externalResponse.status} - ${errorText}`);
    }
    
    const result = await externalResponse.json();

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error launching campaign:', error);
    return NextResponse.json(
      { 
        error: 'Failed to launch campaign',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
