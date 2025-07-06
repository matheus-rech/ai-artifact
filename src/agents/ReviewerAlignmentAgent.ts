import { BaseAgent } from './base/BaseAgent';
import type { 
  ReviewerAlignmentInput, 
  ReviewerAlignmentOutput 
} from './base/AgentTypes';
import type { AgentConfig, AnalysisItem } from '@/types';
import { apiClient } from '@/services/apiClient';
import { FallbackService } from '@/services/fallbackService';

/**
 * Agent responsible for analyzing alignment between changes and reviewer requests
 */
export class ReviewerAlignmentAgent extends BaseAgent<ReviewerAlignmentInput, ReviewerAlignmentOutput> {
  private fallbackService: FallbackService;

  constructor(config: AgentConfig) {
    super(config);
    this.fallbackService = new FallbackService();
  }

  protected async analyze(input: ReviewerAlignmentInput): Promise<ReviewerAlignmentOutput> {
    this.updateStatus('running', 30, 'Analyzing reviewer alignment...');

    // Use secure API endpoint for intelligent alignment analysis
    const result = await apiClient.analyzeReviewerAlignment(
      input.diffs, 
      input.reviewerRequests
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Reviewer alignment analysis failed');
    }
    
    this.updateStatus('running', 60, 'Creating alignment summary...');
    const summary = this.createAlignmentSummary(input.diffs, result.data.analyses, input.reviewerRequests);

    return {
      alignedAnalyses: result.data.analyses,
      summary
    };
  }

  protected async fallbackAnalyze(input: ReviewerAlignmentInput): Promise<ReviewerAlignmentOutput> {
    this.updateStatus('running', 30, 'Using heuristic alignment analysis...');

    // Use fallback heuristic analysis
    const alignedAnalyses = this.fallbackService.analyzeReviewerAlignment(
      input.diffs, 
      input.reviewerRequests
    );
    
    this.updateStatus('running', 60, 'Creating alignment summary...');
    const summary = this.createAlignmentSummary(input.diffs, alignedAnalyses, input.reviewerRequests);

    return {
      alignedAnalyses,
      summary
    };
  }

  protected async validateInput(input: ReviewerAlignmentInput): Promise<void> {
    if (!input) {
      throw new Error('Input is required');
    }

    if (!input.diffs || !Array.isArray(input.diffs)) {
      throw new Error('Diffs array is required');
    }

    if (input.diffs.length === 0) {
      throw new Error('At least one diff is required');
    }

    if (!input.reviewerRequests || typeof input.reviewerRequests !== 'string') {
      throw new Error('Reviewer requests must be a non-empty string');
    }

    if (input.reviewerRequests.trim().length < 10) {
      console.warn('Reviewer requests are very short. Analysis quality may be limited.');
    }

    // Validate each diff item
    for (const diff of input.diffs) {
      if (!diff.id || !diff.text || !diff.type) {
        throw new Error('Invalid diff item: missing required fields');
      }
    }
  }

  protected async validateOutput(output: ReviewerAlignmentOutput): Promise<void> {
    if (!output) {
      throw new Error('Output is required');
    }

    if (!output.alignedAnalyses || !Array.isArray(output.alignedAnalyses)) {
      throw new Error('Aligned analyses array is required');
    }

    if (!output.summary) {
      throw new Error('Summary is required');
    }

    // Validate summary structure
    const { summary } = output;
    if (typeof summary.totalChanges !== 'number' || 
        typeof summary.alignedChanges !== 'number' ||
        typeof summary.alignmentPercentage !== 'number') {
      throw new Error('Invalid summary structure');
    }

    // Validate each analysis item
    for (const analysis of output.alignedAnalyses) {
      if (!analysis.analysisId || !analysis.diffId || !analysis.reviewerPoint) {
        throw new Error('Invalid aligned analysis item: missing required fields');
      }

      if (analysis.confidence < 0 || analysis.confidence > 1) {
        throw new Error('Invalid confidence score: must be between 0 and 1');
      }
    }
  }

  protected calculateConfidence(result: ReviewerAlignmentOutput): number {
    if (result.alignedAnalyses.length === 0) return 0;

    // Base confidence on alignment percentage and individual confidences
    const avgItemConfidence = result.alignedAnalyses.reduce(
      (sum, analysis) => sum + analysis.confidence, 0
    ) / result.alignedAnalyses.length;

    const alignmentBonus = result.summary.alignmentPercentage / 100 * 0.3;
    
    return Math.min(avgItemConfidence + alignmentBonus, 1.0);
  }

  protected getEmptyResult(): ReviewerAlignmentOutput {
    return {
      alignedAnalyses: [],
      summary: {
        totalChanges: 0,
        alignedChanges: 0,
        alignmentPercentage: 0,
        topRequests: [],
        averageAlignmentScore: 0
      }
    };
  }

  /**
   * Create alignment summary from analysis results
   */
  private createAlignmentSummary(
    diffs: ReviewerAlignmentInput['diffs'],
    alignedAnalyses: AnalysisItem[],
    reviewerRequests: string
  ): ReviewerAlignmentOutput['summary'] {
    const totalChanges = diffs.length;
    const alignedChanges = alignedAnalyses.length;
    const alignmentPercentage = totalChanges > 0 
      ? Math.round((alignedChanges / totalChanges) * 100) 
      : 0;

    // Extract top requests/topics from reviewer feedback
    const topRequests = this.extractTopRequests(reviewerRequests);

    // Calculate average alignment score (if available in analysis metadata)
    const averageAlignmentScore = alignedAnalyses.length > 0
      ? alignedAnalyses.reduce((sum, analysis) => {
          // Estimate alignment score based on confidence and priority
          const score = analysis.confidence * (
            analysis.priority === 'high' ? 100 : 
            analysis.priority === 'medium' ? 70 : 40
          );
          return sum + score;
        }, 0) / alignedAnalyses.length
      : 0;

    return {
      totalChanges,
      alignedChanges,
      alignmentPercentage,
      topRequests,
      averageAlignmentScore: Math.round(averageAlignmentScore)
    };
  }

  /**
   * Extract top requests/topics from reviewer feedback
   */
  private extractTopRequests(reviewerRequests: string): string[] {
    const requests = reviewerRequests.toLowerCase();
    
    // Common academic manuscript topics/requests
    const topicPatterns = [
      { pattern: /method(ology|s)?/g, topic: 'Methodology' },
      { pattern: /result(s)?/g, topic: 'Results' },
      { pattern: /discussion/g, topic: 'Discussion' },
      { pattern: /literature\s+review/g, topic: 'Literature Review' },
      { pattern: /introduction/g, topic: 'Introduction' },
      { pattern: /conclusion(s)?/g, topic: 'Conclusions' },
      { pattern: /data\s+analysis/g, topic: 'Data Analysis' },
      { pattern: /statistical?/g, topic: 'Statistics' },
      { pattern: /figure(s)?/g, topic: 'Figures' },
      { pattern: /table(s)?/g, topic: 'Tables' },
      { pattern: /reference(s)?/g, topic: 'References' },
      { pattern: /clarity|clear/g, topic: 'Clarity' },
      { pattern: /explanation|explain/g, topic: 'Explanations' },
      { pattern: /limitation(s)?/g, topic: 'Limitations' }
    ];

    const foundTopics = topicPatterns
      .filter(({ pattern }) => pattern.test(requests))
      .map(({ topic }) => topic);

    // Remove duplicates and return top 5
    return [...new Set(foundTopics)].slice(0, 5);
  }

  /**
   * Get detailed alignment metrics
   */
  getAlignmentMetrics(output: ReviewerAlignmentOutput): {
    sectionAlignment: Array<{ section: string; count: number; percentage: number }>;
    priorityAlignment: Array<{ priority: string; count: number; percentage: number }>;
    alignmentQuality: {
      excellent: number; // >80% confidence
      good: number;      // 60-80% confidence
      fair: number;      // 40-60% confidence
      poor: number;      // <40% confidence
    };
    recommendations: string[];
  } {
    const { alignedAnalyses, summary } = output;
    
    // Section alignment breakdown
    const sectionCounts: Record<string, number> = {};
    const priorityCounts: Record<string, number> = {};
    
    alignedAnalyses.forEach(analysis => {
      sectionCounts[analysis.section] = (sectionCounts[analysis.section] || 0) + 1;
      priorityCounts[analysis.priority] = (priorityCounts[analysis.priority] || 0) + 1;
    });

    const sectionAlignment = Object.entries(sectionCounts)
      .map(([section, count]) => ({
        section,
        count,
        percentage: Math.round((count / alignedAnalyses.length) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    const priorityAlignment = Object.entries(priorityCounts)
      .map(([priority, count]) => ({
        priority,
        count,
        percentage: Math.round((count / alignedAnalyses.length) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    // Alignment quality distribution
    const alignmentQuality = {
      excellent: alignedAnalyses.filter(a => a.confidence > 0.8).length,
      good: alignedAnalyses.filter(a => a.confidence > 0.6 && a.confidence <= 0.8).length,
      fair: alignedAnalyses.filter(a => a.confidence > 0.4 && a.confidence <= 0.6).length,
      poor: alignedAnalyses.filter(a => a.confidence <= 0.4).length
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(summary, alignmentQuality);

    return {
      sectionAlignment,
      priorityAlignment,
      alignmentQuality,
      recommendations
    };
  }

  /**
   * Generate actionable recommendations based on alignment analysis
   */
  private generateRecommendations(
    summary: ReviewerAlignmentOutput['summary'],
    alignmentQuality: { excellent: number; good: number; fair: number; poor: number }
  ): string[] {
    const recommendations: string[] = [];

    if (summary.alignmentPercentage < 30) {
      recommendations.push('Consider addressing more reviewer requests in your revisions');
    }

    if (summary.alignmentPercentage > 80) {
      recommendations.push('Excellent alignment with reviewer requests');
    }

    if (alignmentQuality.poor > alignmentQuality.excellent) {
      recommendations.push('Focus on improving the quality of responses to reviewer feedback');
    }

    if (summary.topRequests.length > 0) {
      recommendations.push(`Key areas addressed: ${summary.topRequests.slice(0, 3).join(', ')}`);
    }

    if (summary.averageAlignmentScore < 50) {
      recommendations.push('Consider providing more substantial responses to reviewer concerns');
    }

    return recommendations;
  }
}
