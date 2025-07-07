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
 devin/1751845727-add-env-example

    if (apiKey) {
      this.anthropic = new Anthropic({
        apiKey,
        dangerouslyAllowBrowser: process.env['NEXT_PUBLIC_ALLOW_BROWSER'] === 'true', // Controlled via environment variable
      });
    } else if (typeof window !== 'undefined' && 'claude' in window) {

    const isBrowser = typeof window !== 'undefined';

    if (apiKey && !isBrowser) {
      // Server-side execution – safe to create the SDK client.
      this.anthropic = new Anthropic({ apiKey });
 devin/1751828946-production-fixes

    } else if (isBrowser && typeof window !== 'undefined' && window.claude) {
      // Client-side fallback (e.g. window.claude injected for demos).
 main
      this.fallbackToWindowClaude = true;
 main
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
 devin/1751828946-production-fixes
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

        if (this.anthropic && typeof window === 'undefined') {
          // Use Anthropic SDK on the server
          // Note: The actual SDK call should be implemented here if you want to call Anthropic directly server-side.
          throw new Error('Direct Anthropic SDK calls not implemented in this method. Use a backend endpoint instead.');
        } else if (this.fallbackToWindowClaude && typeof window !== 'undefined' && window.claude) {
          // Use window.claude in the browser (for demos)
          const response = await Promise.race([
 devin/1751845727-add-env-example
            this.anthropic.messages.create({
              model: 'claude-3-sonnet-20240229',
              max_tokens: request.maxTokens || 4000,
              temperature: request.temperature || 0.3,
              messages: [
                {
                  role: 'user',
                  content: request.prompt,
                },
              ],
            }),

            window.claude.complete(request.prompt),
 main
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Request timeout')), timeout)
            ),
          ]);
          return response;
        } else if (typeof window !== 'undefined') {
          // In browser, call the backend API endpoint
          const response = await fetch('/api/claude', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API error: ${errorData.error || response.statusText}`);
          }
 devin/1751845727-add-env-example
          throw new Error('Invalid response format');
        } else if (this.fallbackToWindowClaude) {
          // Use window.claude for artifacts
          const response = await Promise.race([
            (window as any).claude.complete(request.prompt),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Request timeout')), timeout)
            ),
          ]);

          return response;


          const data = await response.json();
          return data.content;
 main
        } else {
          throw new Error('Claude API not available');
 main
        }

        throw new Error('Invalid response format from Claude API');
      } catch (error) {
 devin/1751828946-production-fixes
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

        console.error(`Claude API attempt ${attempt} failed:`, error);

        if (attempt === maxRetries) {
          throw new Error(
 devin/1751845727-add-env-example
            `Claude API failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`

            `Claude API failed after ${maxRetries} attempts: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
 main
          );
 main
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
 devin/1751828946-production-fixes
      const response = await this.sendRequest({
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt,
        temperature: 0,

      const startTime = Date.now();
      const response = await this.sendRequest({ prompt });
      const analysisTime = Date.now() - startTime;

 devin/1751845727-add-env-example
      console.log(`Claude API analysis completed in ${analysisTime}ms`);

      console.warn(`Claude API analysis completed in ${analysisTime}ms`);
 main

      // Robust JSON parsing with validation
      let analyses: ClaudeAnalysisResponse[];
      try {
        const cleanedResponse = response
          .trim()
          .replace(/^```json\s*/, '')
          .replace(/\s*```$/, '');
 devin/1751845727-add-env-example
        analyses = JSON.parse(cleanedResponse);

        const parsed = JSON.parse(cleanedResponse) as unknown;
        if (!Array.isArray(parsed)) {
          throw new Error('Expected array response from Claude API');
        }
        analyses = parsed as ClaudeAnalysisResponse[];
 main
      } catch (parseError) {
        console.error('JSON parsing failed:', parseError);
        console.error('Raw response:', response);
        throw new Error('Invalid JSON response from Claude API');
      }

      // Validate and enhance each analysis
      return analyses.map((analysis, index) => {
        const diffItem = diffs.find((d) => d.id === analysis.diffId) || diffs[index];
 devin/1751845727-add-env-example


 main
        return {
          analysisId: generateId('claude-seg'),
          diffId: analysis.diffId || diffItem?.id || `unknown-${index}`,
          section: this.validateSection(analysis.section),
          changeType: diffItem?.type || 'unknown',
          reviewerPoint: analysis.reviewerPoint || 'Analysis completed',
          assessment: this.validateAssessment(analysis.assessment),
          comment: analysis.comment || 'Change analyzed',
          relatedText: (diffItem?.text || '').slice(0, 60),
          priority: this.validatePriority(analysis.priority),
          confidence: Math.min(Math.max(analysis.confidence || 0.5, 0), 1),
          timestamp: new Date().toISOString(),
        };
 main
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

 devin/1751828946-production-fixes
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

 devin/1751845727-add-env-example
      console.log(`Claude reviewer alignment analysis completed in ${analysisTime}ms`);

      let analyses: any[];

      console.warn(`Claude reviewer alignment analysis completed in ${analysisTime}ms`);

      let analyses: ClaudeReviewerResponse[];
 main
      try {
        const cleanedResponse = response
          .trim()
          .replace(/^```json\s*/, '')
          .replace(/\s*```$/, '');
 devin/1751845727-add-env-example
        analyses = JSON.parse(cleanedResponse);

        const parsed = JSON.parse(cleanedResponse) as unknown;
        if (!Array.isArray(parsed)) {
          throw new Error('Expected array response from Claude API');
        }
        analyses = parsed as ClaudeReviewerResponse[];
 main
      } catch (parseError) {
        console.error('JSON parsing failed for reviewer alignment:', parseError);
        throw new Error('Invalid JSON response from Claude API');
      }

      return analyses
        .filter((analysis) => analysis.alignmentScore > 25) // Filter low-relevance items
        .map((analysis, index) => {
          const diffItem = diffs.find((d) => d.id === analysis.diffId);
 devin/1751845727-add-env-example


 main
          return {
            analysisId: generateId('claude-rev'),
            diffId: analysis.diffId || `rev-${index}`,
            section: this.validateSection(analysis.section),
            changeType: diffItem?.type || 'unknown',
            reviewerPoint: analysis.reviewerPoint || 'Addresses reviewer concerns',
            assessment: this.validateAssessment(analysis.assessment),
            comment: analysis.comment || 'Responds to reviewer feedback',
            relatedText: (diffItem?.text || '').slice(0, 60),
            priority: this.validatePriority(analysis.priority),
            confidence: Math.min(Math.max(analysis.confidence || 0.7, 0), 1),
            timestamp: new Date().toISOString(),
          };
        });
 main
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
