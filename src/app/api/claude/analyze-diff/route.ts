import { NextRequest, NextResponse } from 'next/server';
import { ClaudeAPIService } from '@/services/claudeApiService';
import type { DiffItem } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { diffs } = await request.json();

    if (!diffs || !Array.isArray(diffs)) {
      return NextResponse.json(
        { error: 'Invalid request: diffs array is required' },
        { status: 400 }
      );
    }

    if (!process.env['ANTHROPIC_API_KEY']) {
      return NextResponse.json(
        { error: 'Server configuration error: API key not configured' },
        { status: 500 }
      );
    }

    const claudeService = new ClaudeAPIService();
    
    if (!claudeService.isAvailable()) {
      return NextResponse.json(
        { error: 'Claude API service is not available' },
        { status: 503 }
      );
    }

    const analyses = await claudeService.analyzeDiffSegmentation(diffs as DiffItem[]);

    return NextResponse.json({
      success: true,
      analyses,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Claude API analyze-diff error:', error);
    
    return NextResponse.json(
      { 
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
