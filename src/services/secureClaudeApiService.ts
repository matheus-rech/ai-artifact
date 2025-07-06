import type { 
  DiffItem, 
  AnalysisItem
} from '../types';

/**
 * Secure Claude API service that uses backend endpoints instead of client-side API calls
 */
export class SecureClaudeAPIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  }

  /**
   * Analyze diff segmentation using secure backend endpoint
   */
  async analyzeDiffSegmentation(diffs: DiffItem[]): Promise<AnalysisItem[]> {
    if (!diffs || diffs.length === 0) {
      throw new Error('No diffs provided for analysis');
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/claude/analyze-diff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ diffs }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success || !Array.isArray(data.analyses)) {
        throw new Error('Invalid response format from analysis endpoint');
      }

      return data.analyses;

    } catch (error) {
      console.error('Secure Claude API segmentation error:', error);
      throw new Error(`Segmentation analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze reviewer alignment using secure backend endpoint
   */
  async analyzeReviewerAlignment(diffs: DiffItem[], revisionRequests: string): Promise<AnalysisItem[]> {
    if (!diffs || diffs.length === 0) {
      return [];
    }

    if (!revisionRequests || revisionRequests.trim().length < 10) {
      console.warn('Revision requests are very short or empty. Analysis may be limited.');
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/claude/analyze-reviewer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ diffs, revisionRequests }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success || !Array.isArray(data.analyses)) {
        throw new Error('Invalid response format from reviewer analysis endpoint');
      }

      return data.analyses;

    } catch (error) {
      console.error('Secure Claude API reviewer alignment error:', error);
      throw new Error(`Reviewer alignment analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check API status using secure backend endpoint
   */
  async getStatus(): Promise<{ available: boolean; method: string; hasApiKey: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/claude/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        available: data.available || false,
        method: data.method || 'Unknown',
        hasApiKey: data.hasApiKey || false
      };

    } catch (error) {
      console.error('Secure Claude API status error:', error);
      return {
        available: false,
        method: 'Error',
        hasApiKey: false
      };
    }
  }

  /**
   * Check if the secure API is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const status = await this.getStatus();
      return status.available && status.hasApiKey;
    } catch {
      return false;
    }
  }
}
