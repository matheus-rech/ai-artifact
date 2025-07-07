import Anthropic from '@anthropic-ai/sdk';
import type { DiffItem, AnalysisItem } from '@/types';

/**
 * Type definitions for Claude API interactions
 */
interface ClaudeAPIRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  system?: string;
  max_tokens?: number;
  temperature?: number;
}

interface ClaudeAnalysisRequest {
  type: 'segmentation' | 'alignment';
  diffs: DiffItem[];
  reviewerRequests?: string;
}

/**
 * Service for interacting with Claude API
 * Handles both diff segmentation and reviewer alignment analysis
 */
export class ClaudeAPIService {
  private static readonly DEFAULT_MAX_RETRIES = 3;
  private static readonly DEFAULT_API_TIMEOUT = 30_000;

  private anthropic: Anthropic | null = null;

  constructor() {
    this.initializeAPI();
  }

  private initializeAPI(): void {
    const apiKey = process.env['ANTHROPIC_API_KEY'];
    const isBrowser = typeof window !== 'undefined';

    if (apiKey && !isBrowser) {
      // Server-side execution – safe to create the SDK client.
      this.anthropic = new Anthropic({ apiKey });
    } else {
      console.warn(
        'No Claude API configuration found. This service should only be used server-side.'
      );
    }
  }

  /**
   * Send a request to Claude API with retry logic
   */
  private async sendRequest(request: ClaudeAPIRequest): Promise<string> {
    const envRetriesRaw = process.env['NEXT_PUBLIC_MAX_RETRIES'];
    const envTimeoutRaw = process.env['NEXT_PUBLIC_API_TIMEOUT'];
    const envRetries = Number(envRetriesRaw);
    const envTimeout = Number(envTimeoutRaw);

    let maxRetries: number;
    if (envRetriesRaw !== undefined && (!Number.isFinite(envRetries) || envRetries <= 0)) {
      console.warn(
        `[claudeApiService] Invalid NEXT_PUBLIC_MAX_RETRIES value "${envRetriesRaw}" – using default ${ClaudeAPIService.DEFAULT_MAX_RETRIES}`
      );
      maxRetries = ClaudeAPIService.DEFAULT_MAX_RETRIES;
    } else {
      maxRetries = envRetries || ClaudeAPIService.DEFAULT_MAX_RETRIES;
    }

    let apiTimeout: number;
    if (envTimeoutRaw !== undefined && (!Number.isFinite(envTimeout) || envTimeout <= 0)) {
      console.warn(
        `[claudeApiService] Invalid NEXT_PUBLIC_API_TIMEOUT value "${envTimeoutRaw}" – using default ${ClaudeAPIService.DEFAULT_API_TIMEOUT}`
      );
      apiTimeout = ClaudeAPIService.DEFAULT_API_TIMEOUT;
    } else {
      apiTimeout = envTimeout || ClaudeAPIService.DEFAULT_API_TIMEOUT;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (!this.anthropic) {
          throw new Error('Claude API not initialized. Check API key configuration.');
        }

        const response = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-latest',
          messages: request.messages,
          system: request.system,
          max_tokens: request.max_tokens || 4096,
          temperature: request.temperature || 0,
        });

        if (response.content && response.content.length > 0 && response.content[0].type === 'text') {
          return response.content[0].text;
        }

        throw new Error('Invalid response format from Claude API');
      } catch (error) {
        lastError = error as Error;
        console.warn(`Claude API attempt ${attempt + 1} failed:`, error);

        // Don't retry on specific errors
        if (
          error instanceof Error &&
          (error.message.includes('API key') ||
            error.message.includes('not initialized') ||
            error.message.includes('401'))
        ) {
          break;
        }

        // Wait before retrying
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError || new Error('Claude API request failed after all retries');
  }

  /**
   * Analyze manuscript diffs for segmentation
   */
  async analyzeDiffSegmentation(diffs: DiffItem[]): Promise<AnalysisItem[]> {
    if (!diffs || diffs.length === 0) {
      return [];
    }

    const systemPrompt = `You are an expert academic manuscript reviewer. Analyze the following manuscript changes and categorize them by section (Abstract, Introduction, Methods, Results, Discussion, Conclusions, References, Other).

For each change, determine:
1. Which manuscript section it belongs to
2. The priority (high/medium/low) based on scientific importance
3. Assessment (positive/negative/neutral) of the change quality
4. A brief expert comment

Respond in JSON format only.`;

    const userPrompt = `Analyze these manuscript changes:

${diffs
  .map(
    (d) => `
Change ID: ${d.id}
Type: ${d.type}
Text: ${d.text}
Context: ${d.context || 'No context provided'}
---`
  )
  .join('\n')}

Respond with a JSON array where each item has:
{
  "diffId": "string",
  "section": "Abstract|Introduction|Methods|Results|Discussion|Conclusions|References|Other",
  "priority": "high|medium|low",
  "assessment": "positive|negative|neutral",
  "comment": "brief expert analysis",
  "confidence": 0.0-1.0
}`;

    try {
      const response = await this.sendRequest({
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt,
        temperature: 0,
      });

      const analyses = this.parseAnalysisResponse(response, diffs);
      return analyses;
    } catch (error) {
      console.error('Diff segmentation analysis failed:', error);
      throw error;
    }
  }

  /**
   * Analyze reviewer alignment
   */
  async analyzeReviewerAlignment(
    diffs: DiffItem[],
    reviewerRequests: string
  ): Promise<AnalysisItem[]> {
    if (!diffs || diffs.length === 0 || !reviewerRequests) {
      return [];
    }

    const systemPrompt = `You are an expert academic manuscript reviewer. Analyze how well the manuscript changes address the reviewer's requests.

For each change, determine:
1. Which specific reviewer request it addresses
2. The alignment score (0-100) indicating how well it addresses the request
3. A brief explanation of the alignment

Respond in JSON format only.`;

    const userPrompt = `Reviewer Requests:
${reviewerRequests}

Manuscript Changes:
${diffs
  .map(
    (d) => `
Change ID: ${d.id}
Type: ${d.type}
Text: ${d.text}
Context: ${d.context || 'No context provided'}
---`
  )
  .join('\n')}

Analyze alignment and respond with a JSON array where each item has:
{
  "diffId": "string",
  "reviewerPoint": "specific request being addressed",
  "alignmentScore": 0-100,
  "comment": "explanation of how this addresses the reviewer",
  "confidence": 0.0-1.0
}`;

    try {
      const response = await this.sendRequest({
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt,
        temperature: 0,
      });

      const analyses = this.parseAlignmentResponse(response, diffs);
      return analyses;
    } catch (error) {
      console.error('Reviewer alignment analysis failed:', error);
      throw error;
    }
  }

  /**
   * Parse segmentation analysis response
   */
  private parseAnalysisResponse(response: string, diffs: DiffItem[]): AnalysisItem[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]) as Array<{
        diffId: string;
        section: string;
        priority: string;
        assessment: string;
        comment: string;
        confidence: number;
      }>;

      return parsed.map((item) => ({
        analysisId: `claude-seg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        diffId: item.diffId,
        section: item.section,
        priority: item.priority as 'high' | 'medium' | 'low',
        assessment: item.assessment as 'positive' | 'negative' | 'neutral',
        comment: item.comment,
        confidence: item.confidence || 0.8,
      }));
    } catch (error) {
      console.error('Failed to parse Claude response:', error);
      throw new Error('Failed to parse analysis response');
    }
  }

  /**
   * Parse alignment analysis response
   */
  private parseAlignmentResponse(response: string, diffs: DiffItem[]): AnalysisItem[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]) as Array<{
        diffId: string;
        reviewerPoint: string;
        alignmentScore: number;
        comment: string;
        confidence: number;
      }>;

      return parsed.map((item) => ({
        analysisId: `claude-align-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        diffId: item.diffId,
        section: 'Review Alignment',
        priority: item.alignmentScore > 80 ? 'high' : item.alignmentScore > 50 ? 'medium' : 'low',
        assessment: item.alignmentScore > 70 ? 'positive' : item.alignmentScore > 40 ? 'neutral' : 'negative',
        comment: item.comment,
        confidence: item.confidence || 0.8,
        reviewerPoint: item.reviewerPoint,
        alignmentScore: item.alignmentScore,
      }));
    } catch (error) {
      console.error('Failed to parse Claude response:', error);
      throw new Error('Failed to parse alignment response');
    }
  }

  /**
   * Check if the service is available
   */
  isAvailable(): boolean {
    return this.anthropic !== null;
  }

  /**
   * Get service status for health checks
   */
  getStatus(): { available: boolean; method: string } {
    return {
      available: this.isAvailable(),
      method: this.anthropic ? 'SDK' : 'None',
    };
  }
}

// Export singleton instance
export const claudeAPI = new ClaudeAPIService();
