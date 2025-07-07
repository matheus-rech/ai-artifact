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
      alignedAnalyses: result.data.analyses,
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
    );

    return {
      alignedAnalyses,
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
    const alignedAnalyses = analyses.filter((a: AnalysisItem & { alignmentScore?: number }) => a.alignmentScore && a.alignmentScore > 0);
    const totalChanges = diffs.length;
    const alignedChanges = alignedAnalyses.length;
    const alignmentPercentage = Math.round((alignedChanges / totalChanges) * 100);

    // Calculate average alignment score
    const averageAlignmentScore =
      alignedAnalyses.length > 0
        ? alignedAnalyses.reduce((sum, a) => sum + ((a as any).alignmentScore || 0), 0) /
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
  private extractTopRequests(reviewerRequests: string, _analyses: AnalysisItem[]): string[] {
    // Simple implementation - extract first few sentences
    const sentences = reviewerRequests.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    
    // Return top 3 requests
    return sentences.slice(0, 3).map((s) => s.trim());
  }

  protected async validateInput(input: ReviewerAlignmentInput): Promise<void> {
    if (!input.diffs || !Array.isArray(input.diffs)) {
      throw new Error('Invalid input: diffs must be an array');
    }
    if (input.diffs.length === 0) {
      throw new Error('Invalid input: diffs array cannot be empty');
    }
    if (!input.reviewerRequests || typeof input.reviewerRequests !== 'string') {
      throw new Error('Invalid input: reviewerRequests must be a string');
    }
  }

  protected async validateOutput(output: ReviewerAlignmentOutput): Promise<void> {
    if (!output.alignedAnalyses || !Array.isArray(output.alignedAnalyses)) {
      throw new Error('Invalid output: alignedAnalyses must be an array');
    }
    if (!output.summary || typeof output.summary !== 'object') {
      throw new Error('Invalid output: summary must be an object');
    }
  }

  protected calculateConfidence(result: ReviewerAlignmentOutput): number {
    if (result.alignedAnalyses.length === 0) return 0;
    
    // Calculate confidence based on alignment quality
    const alignmentPercentage = result.summary.alignmentPercentage / 100;
    const avgAlignmentScore = result.summary.averageAlignmentScore / 100;
    
    return Math.min(alignmentPercentage * avgAlignmentScore, 1);
  }

  override isAvailable(): boolean {
    return true; // Always available with fallback
  }

  getEmptyResult(): ReviewerAlignmentOutput {
    return {
      alignedAnalyses: [],
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
