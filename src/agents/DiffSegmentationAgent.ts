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
 devin/1751828946-production-fixes

 devin/1751845727-add-env-example

 devin/1751831368-production-fixes
]
 main
  private claudeAPI: ClaudeAPIService;
 main
 main
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

 devin/1751828946-production-fixes

    // Use Claude API for intelligent analysis
    const analyses = await this.claudeAPI.analyzeDiffSegmentation(input.diffs);
 devin/1751845727-add-env-example

 main
 main

 main
    this.updateStatus('running', 60, 'Creating summary...');
    const summary = this.createSummary(result.data.analyses);

    return {
      analyses: result.data.analyses,
 devin/1751828946-production-fixes


      analyses,
 devin/1751845727-add-env-example

 main
 main
 main
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

  isAvailable(): boolean {
    return true; // Always available with fallback
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
