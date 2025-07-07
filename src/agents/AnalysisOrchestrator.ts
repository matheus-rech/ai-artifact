import { DiffSegmentationAgent } from './DiffSegmentationAgent';
import { ReviewerAlignmentAgent } from './ReviewerAlignmentAgent';
import type { DiffItem, OverallAnalysis, AgentConfig, AgentResult } from '@/types';
import { DEFAULT_AGENT_CONFIGS } from './base/AgentTypes';
import type {
  AgentType,
  DiffSegmentationInput,
  DiffSegmentationOutput,
  ReviewerAlignmentInput,
  ReviewerAlignmentOutput,
} from './base/AgentTypes';
import { BaseAgent } from './base/BaseAgent';

type AgentInput = DiffSegmentationInput | ReviewerAlignmentInput;
type AgentOutput = DiffSegmentationOutput | ReviewerAlignmentOutput;

/**
 * Orchestrates multiple AI agents for comprehensive manuscript analysis
 */
export class AnalysisOrchestrator {
  private agents: Map<AgentType, BaseAgent<AgentInput, AgentOutput>> = new Map();
  private agentStatuses: Map<AgentType, 'idle' | 'executing' | 'completed' | 'error'> = new Map();
  private executionResults: Map<AgentType, AgentResult<AgentOutput>> = new Map();

  constructor(configs?: Partial<Record<AgentType, AgentConfig>>) {
    this.initializeAgents(configs);
  }

  /**
   * Initialize all agents with their configurations
   */
  private initializeAgents(configs?: Partial<Record<AgentType, AgentConfig>>): void {
    // Initialize Diff Segmentation Agent
    const diffSegConfig =
      configs?.['diff-segmentation'] || DEFAULT_AGENT_CONFIGS['diff-segmentation'];
    const diffSegAgent = new DiffSegmentationAgent(diffSegConfig);
    this.agents.set('diff-segmentation', diffSegAgent as BaseAgent<AgentInput, AgentOutput>);
    this.agentStatuses.set('diff-segmentation', 'idle');

    // Initialize Reviewer Alignment Agent
    const reviewerConfig =
      configs?.['reviewer-alignment'] || DEFAULT_AGENT_CONFIGS['reviewer-alignment'];
    const reviewerAgent = new ReviewerAlignmentAgent(reviewerConfig);
    this.agents.set('reviewer-alignment', reviewerAgent as BaseAgent<AgentInput, AgentOutput>);
    this.agentStatuses.set('reviewer-alignment', 'idle');
  }

  /**
   * Execute diff segmentation analysis
   */
  async executeDiffSegmentation(
    input: DiffSegmentationInput
  ): Promise<AgentResult<DiffSegmentationOutput>> {
    const agent = this.agents.get('diff-segmentation');
    if (!agent) {
      throw new Error('Diff segmentation agent not initialized');
    }

    this.agentStatuses.set('diff-segmentation', 'executing');

    try {
      const result = await agent.execute(input);
      this.executionResults.set('diff-segmentation', result);
      this.agentStatuses.set('diff-segmentation', 'completed');
      return result as AgentResult<DiffSegmentationOutput>;
    } catch (error) {
      this.agentStatuses.set('diff-segmentation', 'error');
      const errorResult: AgentResult<DiffSegmentationOutput> = {
        success: false,
        data: { analyses: [], summary: { totalAnalyzed: 0, sectionBreakdown: {}, priorityBreakdown: {}, averageConfidence: 0 } },
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: 0,
        usedFallback: false,
        confidence: 0,
      };
      this.executionResults.set('diff-segmentation', errorResult);
      return errorResult;
    }
  }

  /**
   * Run comprehensive analysis workflow
   */
  async runComprehensiveAnalysis(
    diffs: DiffItem[],
    reviewerRequests?: string
  ): Promise<{
    segmentationResult: AgentResult<DiffSegmentationOutput>;
    alignmentResult: AgentResult<ReviewerAlignmentOutput>;
    overallAnalysis: OverallAnalysis;
    executionSummary: {
      totalTime: number;
      successfulAgents: number;
      failedAgents: number;
      usedFallback: boolean;
    };
  }> {
    const startTime = Date.now();
    this.resetExecution();

    try {
      // Run diff segmentation analysis
      const segmentationResult = await this.runAgent<DiffSegmentationOutput>('diff-segmentation', {
        diffs,
      });

      // Run reviewer alignment analysis (if requests provided)
      let alignmentResult: AgentResult<ReviewerAlignmentOutput>;
      if (reviewerRequests && reviewerRequests.trim()) {
        alignmentResult = await this.runAgent<ReviewerAlignmentOutput>('reviewer-alignment', {
          diffs,
          reviewerRequests,
        });
      } else {
        alignmentResult = {
          success: true,
          data: {
            alignedAnalyses: [],
            summary: {
              totalChanges: diffs.length,
              alignedChanges: 0,
              alignmentPercentage: 0,
              topRequests: [],
              averageAlignmentScore: 0,
            },
          },
          executionTime: 0,
          usedFallback: false,
          confidence: 0,
        };
      }

      // Create overall analysis
      const overallAnalysis = this.createOverallAnalysis(
        segmentationResult,
        alignmentResult,
        diffs.length
      );

      const totalTime = Date.now() - startTime;
      const successfulAgents = [segmentationResult, alignmentResult].filter(r => r.success).length;
      const failedAgents = 2 - successfulAgents;
      const usedFallback = segmentationResult.usedFallback || alignmentResult.usedFallback;

      return {
        segmentationResult,
        alignmentResult,
        overallAnalysis,
        executionSummary: {
          totalTime,
          successfulAgents,
          failedAgents,
          usedFallback,
        },
      };
    } catch (error) {
      console.error('Comprehensive analysis failed:', error);
      throw new Error(
        `Analysis orchestration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Execute reviewer alignment analysis
   */
  async executeReviewerAlignment(
    input: ReviewerAlignmentInput
  ): Promise<AgentResult<ReviewerAlignmentOutput>> {
    const agent = this.agents.get('reviewer-alignment');
    if (!agent) {
      throw new Error('Reviewer alignment agent not initialized');
    }

    this.agentStatuses.set('reviewer-alignment', 'executing');

    try {
      const result = await agent.execute(input);
      this.executionResults.set('reviewer-alignment', result);
      this.agentStatuses.set('reviewer-alignment', 'completed');
      return result as AgentResult<ReviewerAlignmentOutput>;
    } catch (error) {
      this.agentStatuses.set('reviewer-alignment', 'error');
      const errorResult: AgentResult<ReviewerAlignmentOutput> = {
        success: false,
        data: { alignedAnalyses: [], summary: { totalChanges: 0, alignedChanges: 0, alignmentPercentage: 0, topRequests: [], averageAlignmentScore: 0 } },
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: 0,
        usedFallback: false,
        confidence: 0,
      };
      this.executionResults.set('reviewer-alignment', errorResult);
      return errorResult;
    }
  }

  /**
   * Execute all agents in parallel
   */
  async executeAll(
    diffInput: DiffSegmentationInput,
    alignmentInput?: ReviewerAlignmentInput
  ): Promise<{
    diffSegmentation: AgentResult<DiffSegmentationOutput>;
    reviewerAlignment?: AgentResult<ReviewerAlignmentOutput>;
  }> {
    const promises: Promise<unknown>[] = [this.executeDiffSegmentation(diffInput)];

    if (alignmentInput) {
      promises.push(this.executeReviewerAlignment(alignmentInput));
    }

    const results = await Promise.all(promises);

    return {
      diffSegmentation: results[0] as AgentResult<DiffSegmentationOutput>,
      reviewerAlignment: alignmentInput
        ? (results[1] as AgentResult<ReviewerAlignmentOutput>)
        : undefined,
    };
  }

  /**
   * Get the current status of an agent
   */
  getAgentStatus(agentType: AgentType): 'idle' | 'executing' | 'completed' | 'error' {
    return this.agentStatuses.get(agentType) || 'idle';
  }

  /**
   * Get all agent statuses
   */
  getAllStatuses(): Record<AgentType, 'idle' | 'executing' | 'completed' | 'error'> {
    return Object.fromEntries(this.agentStatuses) as Record<AgentType, 'idle' | 'executing' | 'completed' | 'error'>;
  }

  /**
   * Get the execution result of an agent
   */
  getExecutionResult(agentType: AgentType): AgentResult<AgentOutput> | undefined {
    return this.executionResults.get(agentType);
  }

  /**
   * Reset an agent's status
   */
  resetAgent(agentType: AgentType): void {
    this.agentStatuses.set(agentType, 'idle');
    this.executionResults.delete(agentType);
  }

  /**
   * Reset execution state
   */
  private resetExecution(): void {
    this.agentStatuses.forEach((_, agentType) => {
      this.agentStatuses.set(agentType, 'idle');
    });
    this.executionResults.clear();
  }

  /**
   * Run a specific agent
   */
  private async runAgent<T extends AgentOutput>(
    agentType: AgentType,
    input: AgentInput
  ): Promise<AgentResult<T>> {
    const agent = this.agents.get(agentType);
    if (!agent) {
      throw new Error(`Agent ${agentType} not initialized`);
    }

    this.agentStatuses.set(agentType, 'executing');

    try {
      const result = await agent.execute(input);
      this.executionResults.set(agentType, result);
      this.agentStatuses.set(agentType, 'completed');
      return result as AgentResult<T>;
    } catch (error) {
      this.agentStatuses.set(agentType, 'error');
      const errorResult: AgentResult<T> = {
        success: false,
        data: {} as T,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: 0,
        usedFallback: false,
        confidence: 0,
      };
      this.executionResults.set(agentType, errorResult);
      return errorResult;
    }
  }

  /**
   * Create overall analysis from agent results
   */
  private createOverallAnalysis(
    segmentationResult: AgentResult<DiffSegmentationOutput>,
    alignmentResult: AgentResult<ReviewerAlignmentOutput>,
    totalChanges: number
  ): OverallAnalysis {
    const segmentationAnalyses = segmentationResult.success ? segmentationResult.data.analyses : [];
    const alignmentAnalyses = alignmentResult.success ? alignmentResult.data.alignedAnalyses : [];
    
    const allAnalyses = [...segmentationAnalyses, ...alignmentAnalyses];
    
    const sectionBreakdown: Record<string, number> = {};
    allAnalyses.forEach(analysis => {
      sectionBreakdown[analysis.section] = (sectionBreakdown[analysis.section] || 0) + 1;
    });

    const priorityBreakdown: Record<string, number> = {};
    allAnalyses.forEach(analysis => {
      priorityBreakdown[analysis.priority] = (priorityBreakdown[analysis.priority] || 0) + 1;
    });

    const assessmentBreakdown: Record<string, number> = {};
    allAnalyses.forEach(analysis => {
      assessmentBreakdown[analysis.assessment] = (assessmentBreakdown[analysis.assessment] || 0) + 1;
    });

    const averageConfidence = allAnalyses.length > 0 
      ? allAnalyses.reduce((sum, analysis) => sum + analysis.confidence, 0) / allAnalyses.length
      : 0;

    return {
      summary: `Analysis completed for ${totalChanges} changes with ${allAnalyses.length} detailed analyses.`,
      totalChanges,
      sectionBreakdown,
      priorityBreakdown,
      assessmentBreakdown,
      averageConfidence,
      recommendations: [
        'Review high-priority changes first',
        'Address negative assessments',
        'Verify alignment with reviewer requests'
      ],
    };
  }

  /**
   * Reset all agents
   */
  resetAll(): void {
    this.agentStatuses.forEach((_, agentType) => {
      this.agentStatuses.set(agentType, 'idle');
    });
    this.executionResults.clear();
  }

  /**
   * Check if any agent is currently running
   */
  isAnyAgentRunning(): boolean {
    return Array.from(this.agentStatuses.values()).some(status => status === 'executing');
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    // Clean up any agent resources if needed
    this.agents.clear();
    this.agentStatuses.clear();
    this.executionResults.clear();
  }
}
