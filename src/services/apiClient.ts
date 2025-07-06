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

export class APIClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  }

  async analyzeSegmentation(diffs: DiffItem[]): Promise<AgentResult<{ analyses: AnalysisItem[] }>> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diffs,
          analysisType: 'segmentation'
        }),
      });

      const result: AnalyzeResponse = await response.json();
      const executionTime = Date.now() - startTime;

      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return {
        success: true,
        data: { analyses: result.data.analyses },
        executionTime,
        usedFallback: false,
        confidence: 0.9
      };

    } catch (error) {
      console.error('API segmentation analysis error:', error);
      return {
        success: false,
        data: { analyses: [] },
        error: error instanceof Error ? error.message : 'Unknown API error',
        executionTime: Date.now() - startTime,
        usedFallback: false,
        confidence: 0
      };
    }
  }

  async analyzeReviewerAlignment(diffs: DiffItem[], revisionRequests: string): Promise<AgentResult<{ analyses: AnalysisItem[] }>> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diffs,
          revisionRequests,
          analysisType: 'alignment'
        }),
      });

      const result: AnalyzeResponse = await response.json();
      const executionTime = Date.now() - startTime;

      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return {
        success: true,
        data: { analyses: result.data.analyses },
        executionTime,
        usedFallback: false,
        confidence: 0.9
      };

    } catch (error) {
      console.error('API reviewer alignment analysis error:', error);
      return {
        success: false,
        data: { analyses: [] },
        error: error instanceof Error ? error.message : 'Unknown API error',
        executionTime: Date.now() - startTime,
        usedFallback: false,
        confidence: 0
      };
    }
  }

  async checkHealth(): Promise<{ status: string; claudeAPI: { available: boolean; method: string } }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      return { status: 'error', claudeAPI: { available: false, method: 'None' } };
    }
  }
}

export const apiClient = new APIClient();
