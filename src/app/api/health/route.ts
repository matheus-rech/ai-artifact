import { NextResponse } from 'next/server';
import { ClaudeAPIService } from '@/services/claudeApiService';

export async function GET(): Promise<NextResponse> {
  try {
    const claudeService = new ClaudeAPIService();
    const claudeStatus = claudeService.getStatus();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        claude: {
          available: claudeStatus.available,
          method: claudeStatus.method
        },
        api: {
          status: 'operational'
        }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        hasAnthropicKey: !!process.env['ANTHROPIC_API_KEY']
      }
    };

    return NextResponse.json(health);
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
