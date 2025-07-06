import { DiffSegmentationAgent } from './DiffSegmentationAgent';
import { ReviewerAlignmentAgent } from './ReviewerAlignmentAgent';
import type { 
  AgentConfig, 
  DiffItem, 
  OverallAnalysis,
  AgentStatus,
  AgentResult
} from '@/types';
import {
  DEFAULT_AGENT_CONFIGS
} from './base/AgentTypes';
import type {
  AgentType,
  DiffSegmentationOutput,
  ReviewerAlignmentOutput
} from './base/AgentTypes';

/**
 * Orchestrates multiple AI agents for comprehensive manuscript analysis
 */
export class AnalysisOrchestrator {
  private agents: Map<AgentType, any> = new Map();
  private agentStatuses: Map<AgentType, AgentStatus> = new Map();
  private executionResults: Map<AgentType, AgentResult<any>> = new Map();

  constructor(configs?: Partial<Record<AgentType, AgentConfig>>) {
    this.initializeAgents(configs);
  }

  /**
   * Initialize all agents with their configurations
   */
  private initializeAgents(configs?: Partial<Record<AgentType, AgentConfig>>): void {
    // Initialize Diff Segmentation Agent
    const diffSegConfig = configs?.['diff-segmentation'] || DEFAULT_AGENT_CONFIGS['diff-segmentation'];
    this.agents.set('diff-segmentation', new DiffSegmentationAgent(diffSegConfig));

    // Initialize Reviewer Alignment Agent
    const reviewerConfig = configs?.['reviewer-alignment'] || DEFAULT_AGENT_CONFIGS['reviewer-alignment'];
    this.agents.set('reviewer-alignment', new ReviewerAlignmentAgent(reviewerConfig));

    // Initialize agent statuses
    this.agents.forEach((agent, type) => {
      this.agentStatuses.set(type, agent.getStatus());
    });
  }

  /**
   * Run comprehensive analysis using all available agents
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
      const segmentationResult = await this.runAgent('diff-segmentation', { diffs });
      
      // Run reviewer alignment analysis (if requests provided)
      let alignmentResult: AgentResult<ReviewerAlignmentOutput>;
      if (reviewerRequests && reviewerRequests.trim()) {
        alignmentResult = await this.runAgent('reviewer-alignment', { diffs, reviewerRequests });
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
              averageAlignmentScore: 0
            }
          },
          executionTime: 0,
          usedFallback: false,
          confidence: 0
        };
      }

      // Create overall analysis
      const overallAnalysis = this.createOverallAnalysis(
        segmentationResult, 
        alignmentResult, 
        diffs.length
      );

      // Create execution summary
      const executionSummary = this.createExecutionSummary(startTime);

      return {
        segmentationResult,
        alignmentResult,
        overallAnalysis,
        executionSummary
      };

    } catch (error) {
      console.error('Comprehensive analysis failed:', error);
      throw new Error(`Analysis orchestration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Run a specific agent
   */
  async runAgent<T = any>(agentType: AgentType, input: any): Promise<AgentResult<T>> {
    const agent = this.agents.get(agentType);
    if (!agent) {
      throw new Error(`Agent ${agentType} not found`);
    }

    if (!agent.isAvailable()) {
      throw new Error(`Agent ${agentType} is not available`);
    }

    try {
      const result = await agent.execute(input);
      this.executionResults.set(agentType, result);
      this.agentStatuses.set(agentType, agent.getStatus());
      return result;
    } catch (error) {
      const errorResult: AgentResult<T> = {
        success: false,
        data: agent.getEmptyResult(),
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: 0,
        usedFallback: false,
        confidence: 0
      };
      this.executionResults.set(agentType, errorResult);
      this.agentStatuses.set(agentType, agent.getStatus());
      throw error;
    }
  }

  /**
   * Get status of all agents
   */
  getAllAgentStatuses(): Record<AgentType, AgentStatus> {
    const statuses: Partial<Record<AgentType, AgentStatus>> = {};
    this.agentStatuses.forEach((status, type) => {
      statuses[type] = status;
    });
    return statuses as Record<AgentType, AgentStatus>;
  }

  /**
   * Get specific agent status
   */
  getAgentStatus(agentType: AgentType): AgentStatus | undefined {
    return this.agentStatuses.get(agentType);
  }

  /**
   * Update agent configuration
   */
  updateAgentConfig(agentType: AgentType, config: Partial<AgentConfig>): void {
    const agent = this.agents.get(agentType);
    if (agent) {
      agent.updateConfig(config);
    }
  }

  /**
   * Reset all agents
   */
  resetAgents(): void {
    this.agents.forEach(agent => agent.reset());
    this.resetExecution();
  }

  /**
   * Check if any agent is currently running
   */
  isAnyAgentRunning(): boolean {
    return Array.from(this.agentStatuses.values()).some(status => status.status === 'running');
  }

  /**
   * Get execution results for all agents
   */
  getExecutionResults(): Record<AgentType, AgentResult<any> | undefined> {
    const results: Partial<Record<AgentType, AgentResult<any>>> = {};
    this.executionResults.forEach((result, type) => {
      results[type] = result;
    });
    return results as Record<AgentType, AgentResult<any> | undefined>;
  }

  /**
   * Reset execution state
   */
  private resetExecution(): void {
    this.executionResults.clear();
    this.agents.forEach((agent, type) => {
      this.agentStatuses.set(type, agent.getStatus());
    });
  }

  /**
   * Create overall analysis summary
   */
  private createOverallAnalysis(
    segmentationResult: AgentResult<DiffSegmentationOutput>,
    alignmentResult: AgentResult<ReviewerAlignmentOutput>,
    totalChanges: number
  ): OverallAnalysis {
    const analyses = segmentationResult.success ? segmentationResult.data.analyses : [];
    // Note: alignedAnalyses not used in current implementation but kept for future enhancements
    // const alignedAnalyses = alignmentResult.success ? alignmentResult.data.alignedAnalyses : [];

    // Section breakdown
    const sectionBreakdown: Record<string, number> = {};
    analyses.forEach(analysis => {
      sectionBreakdown[analysis.section] = (sectionBreakdown[analysis.section] || 0) + 1;
    });

    // Priority breakdown
    const priorityBreakdown: Record<string, number> = {};
    analyses.forEach(analysis => {
      priorityBreakdown[analysis.priority] = (priorityBreakdown[analysis.priority] || 0) + 1;
    });

    // Assessment breakdown
    const assessmentBreakdown: Record<string, number> = {};
    analyses.forEach(analysis => {
      assessmentBreakdown[analysis.assessment] = (assessmentBreakdown[analysis.assessment] || 0) + 1;
    });

    // Calculate average confidence
    const averageConfidence = analyses.length > 0
      ? analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length
      : 0;

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      segmentationResult,
      alignmentResult,
      totalChanges
    );

    // Create summary
    const summary = this.createAnalysisSummary(
      segmentationResult,
      alignmentResult,
      totalChanges
    );

    return {
      summary,
      totalChanges,
      sectionBreakdown,
      priorityBreakdown,
      assessmentBreakdown,
      averageConfidence,
      recommendations
    };
  }

  /**
   * Create analysis summary text
   */
  private createAnalysisSummary(
    segmentationResult: AgentResult<DiffSegmentationOutput>,
    alignmentResult: AgentResult<ReviewerAlignmentOutput>,
    totalChanges: number
  ): string {
    const parts: string[] = [];

    parts.push(`Analyzed ${totalChanges} changes in the manuscript revision.`);

    if (segmentationResult.success) {
      const topSection = Object.entries(segmentationResult.data.summary.sectionBreakdown)
        .sort(([,a], [,b]) => b - a)[0];
      
      if (topSection) {
        parts.push(`Most changes were in the ${topSection[0]} section (${topSection[1]} changes).`);
      }
    }

    if (alignmentResult.success && alignmentResult.data.summary.alignmentPercentage > 0) {
      parts.push(`${alignmentResult.data.summary.alignmentPercentage}% of changes align with reviewer requests.`);
    }

    return parts.join(' ');
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    segmentationResult: AgentResult<DiffSegmentationOutput>,
    alignmentResult: AgentResult<ReviewerAlignmentOutput>,
    totalChanges: number
  ): string[] {
    const recommendations: string[] = [];

    // Segmentation recommendations
    if (segmentationResult.success) {
      const { priorityBreakdown } = segmentationResult.data.summary;
      const total = Object.values(priorityBreakdown).reduce((sum, count) => sum + count, 0);

      if (priorityBreakdown['high'] && priorityBreakdown['high'] / total > 0.3) {
        recommendations.push('Consider reviewing high-priority changes for potential quality improvements');
      }

      if (segmentationResult.data.summary.averageConfidence < 0.7) {
        recommendations.push('Some changes may need clearer documentation or context');
      }
    }

    // Alignment recommendations
    if (alignmentResult.success) {
      const { alignmentPercentage, topRequests } = alignmentResult.data.summary;

      if (alignmentPercentage < 50) {
        recommendations.push('Consider addressing more specific reviewer requests in future revisions');
      }

      if (topRequests.length > 0) {
        recommendations.push(`Key areas addressed: ${topRequests.slice(0, 3).join(', ')}`);
      }
    }

    // General recommendations
    if (totalChanges > 100) {
      recommendations.push('Large number of changes detected - consider organizing into themed revision rounds');
    }

    return recommendations;
  }

  /**
   * Create execution summary
   */
  private createExecutionSummary(startTime: number): {
    totalTime: number;
    successfulAgents: number;
    failedAgents: number;
    usedFallback: boolean;
  } {
    const totalTime = Date.now() - startTime;
    let successfulAgents = 0;
    let failedAgents = 0;
    let usedFallback = false;

    this.executionResults.forEach(result => {
      if (result.success) {
        successfulAgents++;
        if (result.usedFallback) {
          usedFallback = true;
        }
      } else {
        failedAgents++;
      }
    });

    return {
      totalTime,
      successfulAgents,
      failedAgents,
      usedFallback
    };
  }
}