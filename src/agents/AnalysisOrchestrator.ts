import { DiffSegmentationAgent } from './DiffSegmentationAgent';
import { ReviewerAlignmentAgent } from './ReviewerAlignmentAgent';
import { DEFAULT_AGENT_CONFIGS } from './base/AgentTypes';
import type {
  AgentType,
  AgentConfig,
  AgentResult,
  AgentStatus,
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
  private agentStatuses: Map<AgentType, AgentStatus> = new Map();
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
        data: { analyses: [] },
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
        data: { analyses: [] },
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
  getAgentStatus(agentType: AgentType): AgentStatus {
    return this.agentStatuses.get(agentType) || 'idle';
  }

  /**
   * Get all agent statuses
   */
  getAllStatuses(): Record<AgentType, AgentStatus> {
    return Object.fromEntries(this.agentStatuses) as Record<AgentType, AgentStatus>;
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
   * Reset all agents
   */
  resetAll(): void {
    this.agentStatuses.forEach((_, agentType) => {
      this.agentStatuses.set(agentType, 'idle');
    });
    this.executionResults.clear();
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
