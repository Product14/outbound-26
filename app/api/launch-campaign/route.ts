import { NextRequest, NextResponse } from 'next/server';
import { LaunchCampaignPayload } from '@/lib/campaign-api';
import { configs } from '@/configs';

export async function POST(request: NextRequest) {
  try {
    const payload: LaunchCampaignPayload = await request.json();
    
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const authKey = authHeader?.replace('Bearer ', '');
    
    // Validate the payload
    if (!payload.name || !payload.campaignType || !payload.campaignUseCase || 
        !payload.enterpriseId || !payload.teamId || !payload.customers) {
      return NextResponse.json(
        { error: 'Missing required fields in payload' },
        { status: 400 }
      );
    }

    // Validate auth_key requirement
    if (!authKey) {
      return NextResponse.json(
        { error: 'Missing required header: Authorization header with Bearer token is required for authentication' },
        { status: 401 }
      );
    }

    // Validate customers array - allow empty array if importSource is specified (e.g., vin_solution)
    // as customers will be populated dynamically by the external system
    if (!Array.isArray(payload.customers)) {
      return NextResponse.json(
        { error: 'Customers must be an array' },
        { status: 400 }
      );
    }
    
    // Only require non-empty customers array if no importSource is specified
    if (payload.customers.length === 0 && !payload.importSource) {
      return NextResponse.json(
        { error: 'Customers array is required and must not be empty when no importSource is specified' },
        { status: 400 }
      );
    }

    // Note: Customer field validation is now handled dynamically by the campaign-types API
    // The exact required fields come from the campaign-types API response and are validated during CSV mapping
    // We only send the exact fields specified in the requiredKeys array from the campaign-types API
    
    // Call the real Spyne API
    const externalResponse = await fetch(`${configs.base_url}conversation/campaign/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authKey}`,
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
