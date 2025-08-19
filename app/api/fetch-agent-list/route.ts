import { NextRequest, NextResponse } from 'next/server';
import { configs } from '@/configs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const enterpriseId = searchParams.get('enterpriseId');
    const teamId = searchParams.get('teamId');
    const agentUseCase = searchParams.get('agentUseCase') || 'recall_notification';
    const agentType = searchParams.get('agentType') || 'Service';
    const agentCallType = searchParams.get('agentCallType') || 'outbound';

    // Validate required parameters
    if (!enterpriseId || !teamId) {
      return NextResponse.json(
        { error: 'Missing required parameters: enterpriseId and teamId are required' },
        { status: 400 }
      );
    }

    // Build the external API URL - using base_url to match the curl command
    const externalUrl = `${configs.base_url}conversation/agents/fetch-agent-list?enterpriseId=${enterpriseId}&teamId=${teamId}&agentUseCase=${agentUseCase}&agentType=${agentType}&agentCallType=${agentCallType}`;
    
    console.log('Proxying request to:', externalUrl);
    
    // Call the external API
    const externalResponse = await fetch(externalUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!externalResponse.ok) {
      const errorText = await externalResponse.text();
      console.error('External API error:', externalResponse.status, errorText);
      return NextResponse.json(
        { 
          error: 'Failed to fetch agent list from external API',
          details: `${externalResponse.status} - ${errorText}`
        },
        { status: externalResponse.status }
      );
    }

    const agents = await externalResponse.json();
    console.log('Successfully fetched agents:', agents?.length || 'unknown count');

    return NextResponse.json(agents);
    
  } catch (error) {
    console.error('Error fetching agent list:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch agent list',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
