import type { DiffItem, AnalysisItem } from '../types';

/**
 * Client-side API service for secure communication with backend
 */
export class APIClient {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? '' // Use relative URLs in production
      : 'http://localhost:3000';
  }

  /**
   * Analyze diffs using secure backend API
   */
  async analyzeDiffSegmentation(diffs: DiffItem[]): Promise<AnalysisItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/analyze-diffs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ diffs }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      return result.data;
    } catch (error) {
      console.error('Diff segmentation API error:', error);
      throw new Error(`Failed to analyze diffs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze reviewer alignment using secure backend API
   */
  async analyzeReviewerAlignment(diffs: DiffItem[], reviewerRequests: string): Promise<AnalysisItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/analyze-alignment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ diffs, reviewerRequests }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Alignment analysis failed');
      }

      return result.data;
    } catch (error) {
      console.error('Reviewer alignment API error:', error);
      throw new Error(`Failed to analyze alignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Health check for API connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/analyze-diffs`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
