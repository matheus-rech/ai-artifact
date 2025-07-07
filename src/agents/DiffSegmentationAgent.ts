import { BaseAgent } from './base/BaseAgent';
import type { DiffSegmentationInput, DiffSegmentationOutput } from './base/AgentTypes';
import type { AgentConfig, AnalysisItem } from '@/types';
import { apiClient } from '@/services/apiClient';
import { FallbackService } from '@/services/fallbackService';

/**
 * Agent responsible for analyzing and categorizing manuscript diffs by section
 */
export class DiffSegmentationAgent extends BaseAgent<
  DiffSegmentationInput,
  DiffSegmentationOutput
> {
  private fallbackService: FallbackService;

  constructor(config: AgentConfig) {
    super(config);
    this.fallbackService = new FallbackService();
  }

  protected async analyze(input: DiffSegmentationInput): Promise<DiffSegmentationOutput> {
    this.updateStatus('running', 30, 'Analyzing diff segments...');

    // Use secure API endpoint for intelligent analysis
    const result = await apiClient.analyzeSegmentation(input.diffs);

    if (!result.success) {
      throw new Error(result.error || 'Segmentation analysis failed');
    }

    this.updateStatus('running', 60, 'Creating summary...');
    const summary = this.createSummary(result.data.analyses);

    return {
      analyses: result.data.analyses,
      summary,
    };
  }

  protected async fallbackAnalyze(input: DiffSegmentationInput): Promise<DiffSegmentationOutput> {
    this.updateStatus('running', 30, 'Using heuristic analysis...');

    // Use fallback heuristic analysis
    const analyses = await Promise.resolve(
      this.fallbackService.analyzeDiffSegmentation(input.diffs)
    );

    this.updateStatus('running', 60, 'Creating summary from heuristic analysis...');
    const summary = this.createSummary(analyses);

    return {
      analyses,
      summary,
    };
  }

  /**
   * Create a summary of the segmentation analysis
   */
  private createSummary(analyses: AnalysisItem[]): DiffSegmentationOutput['summary'] {
    // Section breakdown
    const sectionBreakdown: Record<string, number> = {};
    analyses.forEach((analysis) => {
      sectionBreakdown[analysis.section] = (sectionBreakdown[analysis.section] || 0) + 1;
    });

    // Priority breakdown
    const priorityBreakdown: Record<string, number> = {};
    analyses.forEach((analysis) => {
      priorityBreakdown[analysis.priority] = (priorityBreakdown[analysis.priority] || 0) + 1;
    });

    // Calculate average confidence
    const averageConfidence =
      analyses.length > 0
        ? analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length
        : 0;

    return {
      totalAnalyzed: analyses.length,
      sectionBreakdown,
      priorityBreakdown,
      averageConfidence,
    };
  }

  override isAvailable(): boolean {
    return true; // Always available with fallback
  }

  protected async validateInput(input: DiffSegmentationInput): Promise<void> {
    if (!input.diffs || !Array.isArray(input.diffs) || input.diffs.length === 0) {
      throw new Error('Invalid input: diffs must be a non-empty array');
    }
  }

  protected async validateOutput(output: DiffSegmentationOutput): Promise<void> {
    if (!output.analyses || !Array.isArray(output.analyses)) {
      throw new Error('Invalid output: analyses must be an array');
    }
    if (!output.summary || typeof output.summary !== 'object') {
      throw new Error('Invalid output: summary must be an object');
    }
  }

  protected calculateConfidence(output: DiffSegmentationOutput): number {
    if (!output.analyses || output.analyses.length === 0) return 0;
    const avgConfidence = output.analyses.reduce((sum, a) => sum + a.confidence, 0) / output.analyses.length;
    return Math.min(avgConfidence, 1.0);
  }

  getEmptyResult(): DiffSegmentationOutput {
    return {
      analyses: [],
      summary: {
        totalAnalyzed: 0,
        sectionBreakdown: {},
        priorityBreakdown: {},
        averageConfidence: 0,
      },
    };
  }
}
