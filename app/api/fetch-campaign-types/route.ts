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

    // Call the Spyne API to get campaign types with retry logic
    let externalResponse;
    let lastError;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        externalResponse = await fetch(`${configs.base_url}conversation/campaign/master-data/campaign-types`, {
          method: 'GET',
          headers: getAuthHeaders(authKey),
          timeout: 10000, // 10 second timeout
        });
        
        // If we get a response, break out of retry loop
        if (externalResponse) {
          break;
        }
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt} failed:`, error);
        
        // If this is the last attempt, we'll throw the error below
        if (attempt === maxRetries) {
          break;
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    // If we still don't have a response after all retries
    if (!externalResponse) {
      console.error('All retry attempts failed:', lastError);
      return NextResponse.json(
        { error: 'Failed to connect to external API after multiple attempts', details: lastError?.message || 'Unknown error' },
        { status: 502 }
      );
    }
    
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
