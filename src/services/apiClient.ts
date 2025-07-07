import type { DiffItem, AnalysisItem, AgentResult } from '../types';

export interface AnalyzeRequest {
  diffs: DiffItem[];
  revisionRequests?: string;
  analysisType: 'segmentation' | 'alignment';
}

export interface AnalyzeResponse {
  success: boolean;
  data: {
    analyses: AnalysisItem[];
    executionTime: number;
    analysisType: string;
    diffCount: number;
  };
  error?: string;
}

/**
 * Client-side API service for secure communication with backend
 */
export class APIClient {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl =
      typeof window !== 'undefined' 
        ? window.location.origin 
        : (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');
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
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Analyze reviewer alignment using secure backend API
   */
  async analyzeReviewerAlignment(
    diffs: DiffItem[],
    reviewerRequests: string
  ): Promise<AnalysisItem[]> {
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
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Unified analyze endpoint
   */
  async analyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          data: {
            analyses: [],
            executionTime: 0,
            analysisType: request.analysisType,
            diffCount: request.diffs.length,
          },
          error: errorData.error || `HTTP error! status: ${response.status}`,
        };
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        data: {
          analyses: [],
          executionTime: 0,
          analysisType: request.analysisType,
          diffCount: request.diffs.length,
        },
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Wrapper methods for compatibility
   */
  async analyzeSegmentation(diffs: DiffItem[]): Promise<AgentResult<{ analyses: AnalysisItem[] }>> {
    try {
      const analyses = await this.analyzeDiffSegmentation(diffs);
      return {
        success: true,
        data: { analyses },
        executionTime: 0,
        usedFallback: false,
        confidence: 1.0
      };
    } catch (error) {
      return {
        success: false,
        data: { analyses: [] },
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        executionTime: 0,
        usedFallback: true,
        confidence: 0
      };
    }
  }

  async analyzeAlignment(
    diffs: DiffItem[],
    reviewerRequests: string
  ): Promise<AgentResult<{ analyses: AnalysisItem[] }>> {
    try {
      const analyses = await this.analyzeReviewerAlignment(diffs, reviewerRequests);
      return {
        success: true,
        data: { analyses },
        executionTime: 0,
        usedFallback: false,
        confidence: 1.0
      };
    } catch (error) {
      return {
        success: false,
        data: { analyses: [] },
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        executionTime: 0,
        usedFallback: true,
        confidence: 0
      };
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string; services: Record<string, boolean> }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        services: {
          api: false,
          claude: false,
        },
      };
    }
  }
}

// Export singleton instance
export const apiClient = new APIClient();
