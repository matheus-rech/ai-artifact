import { NextResponse } from 'next/server';
import { ClaudeAPIService } from '@/services/claudeApiService';

export async function GET() {
  try {
    const claudeService = new ClaudeAPIService();
    const status = claudeService.getStatus();
    
    return NextResponse.json({
      ...status,
      hasApiKey: !!process.env['ANTHROPIC_API_KEY'],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Claude API status error:', error);
    
    return NextResponse.json(
      { 
        available: false,
        method: 'Error',
        hasApiKey: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
