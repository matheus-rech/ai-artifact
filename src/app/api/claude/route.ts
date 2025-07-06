import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ClaudeAPIRequest } from '../../../types';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env['ANTHROPIC_API_KEY'];
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    const requestData: ClaudeAPIRequest = await request.json();
    
    if (!requestData.prompt) {
      return NextResponse.json(
        { error: 'Missing required field: prompt' },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({
      apiKey,
    });

    const timeout = parseInt(process.env['API_TIMEOUT'] || '30000', 10);
    
    const response = await Promise.race([
      anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: requestData.maxTokens || 4000,
        temperature: requestData.temperature || 0.3,
        messages: [{
          role: 'user',
          content: requestData.prompt
        }]
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )
    ]);

    if (response.content[0]?.type === 'text') {
      return NextResponse.json({ content: response.content[0].text });
    }
    
    return NextResponse.json(
      { error: 'Invalid response format' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Claude API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
