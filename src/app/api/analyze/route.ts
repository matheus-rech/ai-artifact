import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ClaudeAPIService } from '@/services/claudeApiService';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as {
      diffs: unknown;
      revisionRequests?: string;
      analysisType: string;
    };
    const { diffs, revisionRequests, analysisType } = body;

    if (!diffs || !Array.isArray(diffs)) {
      return NextResponse.json(
        { error: 'Invalid diffs data provided' },
        { status: 400 }
      );
    }

    if (diffs.length === 0) {
      return NextResponse.json(
        { error: 'No diffs provided for analysis' },
        { status: 400 }
      );
    }

    const claudeService = new ClaudeAPIService();

    if (!claudeService.isAvailable()) {
      return NextResponse.json(
        { error: 'Claude API service is not available. Please check your API key configuration.' },
        { status: 503 }
      );
    }

    let result;
    const startTime = Date.now();

    try {
      if (analysisType === 'segmentation') {
        result = await claudeService.analyzeDiffSegmentation(diffs);
      } else if (analysisType === 'alignment' && revisionRequests) {
        result = await claudeService.analyzeReviewerAlignment(diffs, revisionRequests);
      } else {
        return NextResponse.json(
          { error: 'Invalid analysis type or missing revision requests for alignment analysis' },
          { status: 400 }
        );
      }

      const executionTime = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        data: {
          analyses: result,
          executionTime,
          analysisType,
          diffCount: diffs.length
        }
      });

    } catch (analysisError) {
      console.error('Analysis error:', analysisError);
      return NextResponse.json(
        { 
          error: `Analysis failed: ${analysisError instanceof Error ? analysisError.message : 'Unknown error'}`,
          analysisType 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  const claudeService = new ClaudeAPIService();
  const status = claudeService.getStatus();
  
  return NextResponse.json({
    status: 'API endpoint is running',
    claudeAPI: status,
    timestamp: new Date().toISOString()
  });
}
