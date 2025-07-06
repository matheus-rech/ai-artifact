import { BaseAgent } from './base/BaseAgent';
import type { 
  DiffSegmentationInput, 
  DiffSegmentationOutput 
} from './base/AgentTypes';
import type { AgentConfig, AnalysisItem } from '@/types';
import { APIClient } from '@/services/apiClient';
import { FallbackService } from '@/services/fallbackService';

/**
 * Agent responsible for analyzing and categorizing manuscript diffs by section
 */
export class DiffSegmentationAgent extends BaseAgent<DiffSegmentationInput, DiffSegmentationOutput> {
  private apiClient: APIClient;
  private fallbackService: FallbackService;

  constructor(config: AgentConfig) {
    super(config);
    this.apiClient = new APIClient();
    this.fallbackService = new FallbackService();
  }

  protected async analyze(input: DiffSegmentationInput): Promise<DiffSegmentationOutput> {
    this.updateStatus('running', 30, 'Analyzing diff segments...');

    // Use secure API client for intelligent analysis
    const analyses = await this.apiClient.analyzeDiffSegmentation(input.diffs);
    
    this.updateStatus('running', 60, 'Creating summary...');
    const summary = this.createSummary(analyses);

    return {
      analyses,
      summary
    };
  }

  protected async fallbackAnalyze(input: DiffSegmentationInput): Promise<DiffSegmentationOutput> {
    this.updateStatus('running', 30, 'Using heuristic analysis...');

    // Use fallback heuristic analysis
    const analyses = this.fallbackService.analyzeDiffSegmentation(input.diffs);
    
    this.updateStatus('running', 60, 'Creating summary...');
    const summary = this.createSummary(analyses);

    return {
      analyses,
      summary
    };
  }

  protected async validateInput(input: DiffSegmentationInput): Promise<void> {
    if (!input) {
      throw new Error('Input is required');
    }

    if (!input.diffs || !Array.isArray(input.diffs)) {
      throw new Error('Diffs array is required');
    }

    if (input.diffs.length === 0) {
      throw new Error('At least one diff is required');
    }

    if (input.diffs.length > 200) {
      console.warn(`Large number of diffs (${input.diffs.length}). Consider chunking for better performance.`);
    }

    // Validate each diff item
    for (const diff of input.diffs) {
      if (!diff.id || !diff.text || !diff.type) {
        throw new Error('Invalid diff item: missing required fields');
      }
    }
  }

  protected async validateOutput(output: DiffSegmentationOutput): Promise<void> {
    if (!output) {
      throw new Error('Output is required');
    }

    if (!output.analyses || !Array.isArray(output.analyses)) {
      throw new Error('Analyses array is required');
    }

    if (!output.summary) {
      throw new Error('Summary is required');
    }

    // Validate each analysis item
    for (const analysis of output.analyses) {
      if (!analysis.analysisId || !analysis.diffId || !analysis.section) {
        throw new Error('Invalid analysis item: missing required fields');
      }

      if (analysis.confidence < 0 || analysis.confidence > 1) {
        throw new Error('Invalid confidence score: must be between 0 and 1');
      }
    }
  }

  protected calculateConfidence(result: DiffSegmentationOutput): number {
    if (result.analyses.length === 0) return 0;

    const totalConfidence = result.analyses.reduce((sum, analysis) => sum + analysis.confidence, 0);
    return totalConfidence / result.analyses.length;
  }

  protected getEmptyResult(): DiffSegmentationOutput {
    return {
      analyses: [],
      summary: {
        totalAnalyzed: 0,
        sectionBreakdown: {},
        priorityBreakdown: {},
        averageConfidence: 0
      }
    };
  }

  /**
   * Create summary statistics from analysis results
   */
  private createSummary(analyses: AnalysisItem[]): DiffSegmentationOutput['summary'] {
    const sectionBreakdown: Record<string, number> = {};
    const priorityBreakdown: Record<string, number> = {};
    let totalConfidence = 0;

    for (const analysis of analyses) {
      // Count sections
      sectionBreakdown[analysis.section] = (sectionBreakdown[analysis.section] || 0) + 1;
      
      // Count priorities
      priorityBreakdown[analysis.priority] = (priorityBreakdown[analysis.priority] || 0) + 1;
      
      // Sum confidence
      totalConfidence += analysis.confidence;
    }

    return {
      totalAnalyzed: analyses.length,
      sectionBreakdown,
      priorityBreakdown,
      averageConfidence: analyses.length > 0 ? totalConfidence / analyses.length : 0
    };
  }

  /**
   * Get detailed analysis metrics
   */
  getAnalysisMetrics(output: DiffSegmentationOutput): {
    topSections: Array<{ section: string; count: number; percentage: number }>;
    priorityDistribution: Array<{ priority: string; count: number; percentage: number }>;
    confidenceStats: {
      min: number;
      max: number;
      average: number;
      median: number;
    };
  } {
    const { analyses, summary } = output;
    
    // Top sections by count
    const topSections = Object.entries(summary.sectionBreakdown)
      .map(([section, count]) => ({
        section,
        count,
        percentage: Math.round((count / summary.totalAnalyzed) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    // Priority distribution
    const priorityDistribution = Object.entries(summary.priorityBreakdown)
      .map(([priority, count]) => ({
        priority,
        count,
        percentage: Math.round((count / summary.totalAnalyzed) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    // Confidence statistics
    const confidenceValues = analyses.map(a => a.confidence).sort((a, b) => a - b);
    const confidenceStats = {
      min: confidenceValues[0] || 0,
      max: confidenceValues[confidenceValues.length - 1] || 0,
      average: summary.averageConfidence,
      median: confidenceValues.length > 0 
        ? confidenceValues[Math.floor(confidenceValues.length / 2)]! 
        : 0
    };

    return {
      topSections,
      priorityDistribution,
      confidenceStats
    };
  }
}
