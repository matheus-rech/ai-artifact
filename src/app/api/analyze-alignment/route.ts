import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ClaudeAPIService } from '@/services/claudeApiService';
import type { DiffItem } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { diffs?: unknown; reviewerRequests?: unknown };
    const { diffs, reviewerRequests } = body;

    if (!diffs || !Array.isArray(diffs)) {
      return NextResponse.json(
        { error: 'Invalid request: diffs array is required' },
        { status: 400 }
      );
    }

    if (!reviewerRequests || typeof reviewerRequests !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: reviewerRequests string is required' },
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
    const alignedAnalyses = await claudeService.analyzeReviewerAlignment(diffs as DiffItem[], reviewerRequests);

    return NextResponse.json({
      success: true,
      data: alignedAnalyses
    });

  } catch (error) {
    console.error('Reviewer alignment API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Alignment analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export function GET(): NextResponse {
  return NextResponse.json(
    { message: 'Reviewer alignment analysis API endpoint. Use POST to analyze alignment.' },
    { status: 200 }
  );
}
