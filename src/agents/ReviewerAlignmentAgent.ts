import { BaseAgent } from './base/BaseAgent';
import type { ReviewerAlignmentInput, ReviewerAlignmentOutput } from './base/AgentTypes';
import type { AgentConfig, AnalysisItem } from '@/types';
import { apiClient } from '@/services/apiClient';
import { FallbackService } from '@/services/fallbackService';

/**
 * Agent responsible for analyzing alignment between changes and reviewer requests
 */
export class ReviewerAlignmentAgent extends BaseAgent<
  ReviewerAlignmentInput,
  ReviewerAlignmentOutput
> {
 devin/1751828946-production-fixes

 devin/1751845727-add-env-example

 devin/1751831368-production-fixes

 main
  private claudeAPI: ClaudeAPIService;
 main
 main
  private fallbackService: FallbackService;

  constructor(config: AgentConfig) {
    super(config);
    this.fallbackService = new FallbackService();
  }

  protected async analyze(input: ReviewerAlignmentInput): Promise<ReviewerAlignmentOutput> {
    this.updateStatus('running', 30, 'Analyzing reviewer alignment...');

    // Use secure API endpoint for intelligent alignment analysis
    const result = await apiClient.analyzeAlignment(input.diffs, input.reviewerRequests);

    if (!result.success) {
      throw new Error(result.error || 'Reviewer alignment analysis failed');
    }

    this.updateStatus('running', 60, 'Creating alignment summary...');
    const summary = this.createAlignmentSummary(
      input.diffs,
      result.data.analyses,
      input.reviewerRequests
    );

    return {
 devin/1751828946-production-fixes
      analyses: result.data.analyses,

      alignedAnalyses: result.data.analyses,

    // Use Claude API for intelligent alignment analysis
    const alignedAnalyses = await this.claudeAPI.analyzeReviewerAlignment(
      input.diffs,
      input.reviewerRequests
    );

    this.updateStatus('running', 60, 'Creating alignment summary...');
    const summary = this.createAlignmentSummary(
      input.diffs,
      alignedAnalyses,
      input.reviewerRequests
    );

    return {
      alignedAnalyses,
 devin/1751845727-add-env-example

 main
 main
 main
      summary,
    };
  }

  protected async fallbackAnalyze(input: ReviewerAlignmentInput): Promise<ReviewerAlignmentOutput> {
    this.updateStatus('running', 30, 'Using heuristic alignment analysis...');

    // Use fallback heuristic analysis
    const alignedAnalyses = await Promise.resolve(
      this.fallbackService.analyzeReviewerAlignment(input.diffs, input.reviewerRequests)
    );

    this.updateStatus('running', 60, 'Creating summary from heuristic analysis...');
    const summary = this.createAlignmentSummary(
      input.diffs,
      alignedAnalyses,
      input.reviewerRequests
 devin/1751828946-production-fixes
    );

    ); devin/1751845727-add-env-example

 devin/1751831368-production-fixes


    // Minimal await to satisfy linter
    await Promise.resolve();
 main
 main
 main

    return {
      analyses: alignedAnalyses,
      summary,
    };
  }

  /**
   * Create a summary of the alignment analysis
   */
  private createAlignmentSummary(
    diffs: ReviewerAlignmentInput['diffs'],
    analyses: AnalysisItem[],
    reviewerRequests: string
  ): ReviewerAlignmentOutput['summary'] {
    const alignedAnalyses = analyses.filter((a) => a.alignmentScore && a.alignmentScore > 0);
    const totalChanges = diffs.length;
    const alignedChanges = alignedAnalyses.length;
    const alignmentPercentage = Math.round((alignedChanges / totalChanges) * 100);

    // Calculate average alignment score
    const averageAlignmentScore =
      alignedAnalyses.length > 0
        ? alignedAnalyses.reduce((sum, a) => sum + (a.alignmentScore || 0), 0) /
          alignedAnalyses.length
        : 0;

    // Extract top reviewer requests (simplified)
    const topRequests = this.extractTopRequests(reviewerRequests, analyses);

    return {
      totalChanges,
      alignedChanges,
      alignmentPercentage,
      topRequests,
      averageAlignmentScore,
    };
  }

  /**
   * Extract top reviewer requests based on alignment
   */
  private extractTopRequests(reviewerRequests: string, analyses: AnalysisItem[]): string[] {
    // Simple implementation - extract first few sentences
    const sentences = reviewerRequests.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    
    // Return top 3 requests
    return sentences.slice(0, 3).map((s) => s.trim());
  }

  isAvailable(): boolean {
    return true; // Always available with fallback
  }

  getEmptyResult(): ReviewerAlignmentOutput {
    return {
      analyses: [],
      summary: {
        totalChanges: 0,
        alignedChanges: 0,
        alignmentPercentage: 0,
        topRequests: [],
        averageAlignmentScore: 0,
      },
    };
  }
}
