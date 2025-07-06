import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ClaudeAPIService } from '@/services/claudeApiService';
import type { DiffItem } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { diffs?: unknown };
    const { diffs } = body;

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
    const analyses = await claudeService.analyzeDiffSegmentation(diffs as DiffItem[]);

    return NextResponse.json({
      success: true,
      data: analyses
    });

  } catch (error) {
    console.error('Diff analysis API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export function GET(): NextResponse {
  return NextResponse.json(
    { message: 'Diff analysis API endpoint. Use POST to analyze diffs.' },
    { status: 200 }
  );
}
