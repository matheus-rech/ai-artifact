interface ProcessEnv {
  ANTHROPIC_API_KEY?: string;
  NEXT_PUBLIC_ALLOW_BROWSER?: string;
  NEXT_PUBLIC_MAX_RETRIES?: string;
  NEXT_PUBLIC_API_TIMEOUT?: string;
}

// Ensure process is available in browser environments
declare const process: {
  env: ProcessEnv;
};

interface WindowClaude {
  complete(prompt: string): Promise<string>;
}

interface ClaudeAnalysisResponse {
  diffId: string;
  section: string;
  priority: string;
  assessment: string;
  comment: string;
  reviewerPoint: string;
  confidence: number;
}

interface ClaudeReviewerResponse {
  diffId: string;
  alignmentScore: number;
  section: string;
  priority: string;
  assessment: string;
  reviewerPoint: string;
  comment: string;
  confidence: number;
}

declare global {
  interface Window {
    claude?: WindowClaude;
  }
}
import Anthropic from '@anthropic-ai/sdk';
import type {
  DiffItem,
  AnalysisItem,
  ClaudeAPIRequest,
  ManuscriptSection,
  Assessment,
  Priority,
} from '@/types';
import { generateId } from '@/utils';

// Type definitions for Claude API responses
interface ClaudeAnalysisResponse {
  diffId: string;
  section: string;
  priority: string;
  assessment: string;
  comment: string;
  reviewerPoint: string;
  confidence: number;
}

interface ClaudeReviewerResponse extends ClaudeAnalysisResponse {
  alignmentScore: number;
}

interface WindowClaude {
  complete: (prompt: string) => Promise<string>;
}

declare global {
  interface Window {
    claude?: WindowClaude;
  }
}

/**
 * Production-ready Claude API service with comprehensive error handling
 */
export class ClaudeAPIService {
  private static readonly DEFAULT_MAX_RETRIES = 3;
  private static readonly DEFAULT_API_TIMEOUT = 30_000;

  private anthropic: Anthropic | null = null;
  private fallbackToWindowClaude = false;

  constructor() {
    this.initializeAPI();
  }

  private initializeAPI(): void {
 devin/1751838409-production-security-fixes
    if (typeof window !== 'undefined' && 'claude' in window) {

    const apiKey = process.env['ANTHROPIC_API_KEY'];

    // Never bundle the Claude API key in client-side code. Only instantiate the SDK
    // when running on the server.
    const isBrowser = typeof window !== 'undefined';

    if (apiKey && !isBrowser) {
      // Server-side execution – safe to create the SDK client.
      this.anthropic = new Anthropic({
        apiKey,
        dangerouslyAllowBrowser: process.env['NEXT_PUBLIC_ALLOW_BROWSER'] === 'true', // Controlled via environment variable
      });
    } else if (isBrowser && 'claude' in window) {
      // Client-side fallback (e.g. window.claude injected for demos).
 main
      this.fallbackToWindowClaude = true;
    } else {
      console.warn('No Claude API configuration found. Falling back to heuristic analysis.');
    }
    
    this.anthropic = {} as Anthropic;
  }

  /**
   * Send a request to Claude API with retry logic
   */
  private async sendRequest(request: ClaudeAPIRequest): Promise<string> {
    // Robust parsing of numeric env vars – fall back to sane defaults when the
    // variable is missing **or** not a valid positive number.
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
      maxRetries =
        Number.isFinite(envRetries) && envRetries > 0
          ? envRetries
          : ClaudeAPIService.DEFAULT_MAX_RETRIES;
    }

    let timeout: number;
    if (envTimeoutRaw !== undefined && (!Number.isFinite(envTimeout) || envTimeout <= 0)) {
      console.warn(
        `[claudeApiService] Invalid NEXT_PUBLIC_API_TIMEOUT value "${envTimeoutRaw}" – using default ${ClaudeAPIService.DEFAULT_API_TIMEOUT}`
      );
      timeout = ClaudeAPIService.DEFAULT_API_TIMEOUT;
    } else {
      timeout =
        Number.isFinite(envTimeout) && envTimeout > 0
          ? envTimeout
          : ClaudeAPIService.DEFAULT_API_TIMEOUT;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (this.anthropic) {
 devin/1751838409-production-security-fixes
          // Use our secure backend API endpoint instead of direct Anthropic SDK
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

          const data = await response.json();
          return data.content;
        } else if (this.fallbackToWindowClaude) {

          // Use Anthropic SDK
          const response = await Promise.race([
            this.anthropic.messages.create({
              model: 'claude-3-7-sonnet-20250219',
              max_tokens: request.maxTokens || 4000,
              temperature: request.temperature || 0.3,
              messages: [
                {
                  role: 'user',
                  content: request.prompt,
                },
              ],
            }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Request timeout')), timeout)
            ),
          ]);

          if (response.content[0]?.type === 'text') {
            return response.content[0].text;
          }
          throw new Error('Invalid response format');
        } else if (this.fallbackToWindowClaude && window.claude) {
 main
          // Use window.claude for artifacts
          const response = await Promise.race([
            window.claude.complete(request.prompt),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Request timeout')), timeout)
            ),
          ]);

          return response;
        } else {
          throw new Error('Claude API not available');
        }
      } catch (error) {
        console.error(`Claude API attempt ${attempt} failed:`, error);

        if (attempt === maxRetries) {
          throw new Error(
            `Claude API failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }

        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new Error('Unexpected error in Claude API request');
  }

  /**
   * Analyze diff segmentation with enhanced prompting
   */
  async analyzeDiffSegmentation(diffs: DiffItem[]): Promise<AnalysisItem[]> {
    if (!diffs || diffs.length === 0) {
      throw new Error('No diffs provided for analysis');
    }

    if (diffs.length > 100) {
      console.warn(
        `Large number of diffs (${diffs.length}). Consider chunking for better performance.`
      );
    }

    const prompt = `You are a senior manuscript editor with expertise in academic writing and journal standards. 

TASK: Analyze the following ${diffs.length} text changes in an academic manuscript revision and provide structured insights.

CHANGES TO ANALYZE:
${diffs
  .map(
    (d, i) => `
Change ${i + 1} (ID: ${d.id}):
- Type: ${d.type}
- Text: "${d.text}"
- Confidence: ${d.confidence?.toFixed(2) || 'N/A'}
- Context: ${d.context || 'No context available'}
- Position: Original ${d.originalPos}, Revised ${d.revisedPos}
`
  )
  .join('\n')}

ANALYSIS REQUIREMENTS:
For each change, determine:
1. SECTION: Which manuscript section (Abstract, Introduction, Literature Review, Methods, Results, Discussion, Conclusion, References, Appendix, or Body)
2. PRIORITY: Impact level (high=major content changes, medium=moderate improvements, low=minor edits)
3. ASSESSMENT: Quality evaluation (positive=improves clarity/accuracy, negative=unclear/problematic, neutral=minor change)
4. COMMENT: Specific editorial assessment (2-3 sentences explaining the change's impact)
5. REVIEWER_INSIGHT: How this change addresses common reviewer concerns or manuscript standards

RESPOND WITH VALID JSON ONLY:
[
  {
    "diffId": "exact_change_id_from_above",
    "section": "section_name",
    "priority": "high|medium|low",
    "assessment": "positive|negative|neutral",
    "comment": "detailed editorial assessment of this specific change",
    "reviewerPoint": "how this addresses manuscript quality or reviewer expectations",
    "confidence": 0.85
  }
]

CRITICAL: Return ONLY the JSON array. No markdown, no explanations, no additional text.`;

    try {
      const startTime = Date.now();
      const response = await this.sendRequest({ prompt });
      const analysisTime = Date.now() - startTime;

      console.warn(`Claude API analysis completed in ${analysisTime}ms`);

      // Robust JSON parsing with validation
      let analyses: ClaudeAnalysisResponse[];
      try {
        const cleanedResponse = response
          .trim()
          .replace(/^```json\s*/, '')
          .replace(/\s*```$/, '');


        analyses = JSON.parse(cleanedResponse) as ClaudeAnalysisResponse[];

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
      });
    } catch (error) {
      console.error('Claude API segmentation error:', error);
      throw new Error(
        `Segmentation analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Analyze reviewer alignment with enhanced context understanding
   */
  async analyzeReviewerAlignment(
    diffs: DiffItem[],
    revisionRequests: string
  ): Promise<AnalysisItem[]> {
    if (!diffs || diffs.length === 0) {
      return [];
    }

    if (!revisionRequests || revisionRequests.trim().length < 10) {
      console.warn('Revision requests are very short or empty. Analysis may be limited.');
      return [];
    }

    const prompt = `You are an expert academic reviewer analyzing how manuscript revisions address specific reviewer requests.

REVIEWER REVISION REQUESTS:
"${revisionRequests.trim()}"

AUTHOR CHANGES (${diffs.length} total):
${diffs
  .map(
    (d, i) => `
Change ${i + 1} (ID: ${d.id}):
- Type: ${d.type}
- Text: "${d.text}"
- Confidence: ${d.confidence?.toFixed(2) || 'N/A'}
- Context: ${d.context || 'Limited context'}
`
  )
  .join('\n')}

ANALYSIS TASK:
1. Identify which changes directly address the reviewer requests
2. Calculate alignment score (0-100) based on:
   - Direct keyword/topic matches
   - Conceptual relevance to requests
   - Quality of the response to concerns
3. Only include changes with alignment score > 25
4. Provide specific commentary on how each change addresses requests

RESPOND WITH VALID JSON ONLY:
[
  {
    "diffId": "exact_change_id_from_above",
    "alignmentScore": 85,
    "section": "section_name",
    "priority": "high|medium|low",
    "assessment": "positive|negative|neutral",
    "reviewerPoint": "specific request this change addresses",
    "comment": "detailed explanation of how this change responds to reviewer concerns",
    "confidence": 0.90
  }
]

CRITICAL: Return ONLY the JSON array. Include only changes with meaningful alignment (score > 25).`;

    try {
      const startTime = Date.now();
      const response = await this.sendRequest({ prompt });
      const analysisTime = Date.now() - startTime;

      console.warn(`Claude reviewer alignment analysis completed in ${analysisTime}ms`);

      let analyses: ClaudeReviewerResponse[];
      try {
        const cleanedResponse = response
          .trim()
          .replace(/^```json\s*/, '')
          .replace(/\s*```$/, '');
 copilot/fix-fc6013a0-f0af-4bf8-8e3a-7743fb843179

        analyses = JSON.parse(cleanedResponse) as ClaudeReviewerResponse[];

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
    } catch (error) {
      console.error('Claude API reviewer alignment error:', error);
      throw new Error(
        `Reviewer alignment analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validation helpers
   */
  private validateSection(section: string): ManuscriptSection {
    const validSections: ManuscriptSection[] = [
      'Abstract',
      'Introduction',
      'Literature Review',
      'Methods',
      'Methodology',
      'Results',
      'Discussion',
      'Conclusion',
      'References',
      'Appendix',
      'Body',
    ];
    return validSections.includes(section as ManuscriptSection)
      ? (section as ManuscriptSection)
      : 'Body';
  }

  private validateAssessment(assessment: string): Assessment {
    const valid: Assessment[] = ['positive', 'negative', 'neutral'];
    return valid.includes(assessment as Assessment) ? (assessment as Assessment) : 'neutral';
  }

  private validatePriority(priority: string): Priority {
    const valid: Priority[] = ['high', 'medium', 'low'];
    return valid.includes(priority as Priority) ? (priority as Priority) : 'medium';
  }

  /**
   * Check if Claude API is available
   */
  isAvailable(): boolean {
    return (
      this.anthropic !== null ||
      (this.fallbackToWindowClaude && typeof window !== 'undefined' && Boolean(window.claude))
    );
  }

  /**
   * Get API status information
   */
  getStatus(): { available: boolean; method: string } {
    if (this.anthropic) {
      return { available: true, method: 'Anthropic SDK' };
    } else if (this.fallbackToWindowClaude) {
      return { available: true, method: 'Window Claude' };
    } else {
      return { available: false, method: 'None' };
    }
  }
}
