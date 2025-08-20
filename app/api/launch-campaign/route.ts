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

    // Validate each customer has required fields
    for (const customer of payload.customers) {
      if (!customer.name || !customer.mobile) {
        return NextResponse.json(
          { error: 'Each customer must have name and mobile' },
          { status: 400 }
        );
      }
      
      // For recall notification campaigns, validate additional required fields
      if (payload.campaignUseCase === 'recall_notificaiton') {
        if (!customer.vin || !customer.recallDescription || !customer.vehicleMake || 
            !customer.vehicleModel || !customer.vehicleYear) {
          return NextResponse.json(
            { error: 'For recall notifications, each customer must have vin, recallDescription, vehicleMake, vehicleModel, and vehicleYear' },
            { status: 400 }
          );
        }
      }
    }

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
    console.log('API Response:', JSON.stringify(result, null, 2));

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
