import type { DiffItem, AnalysisItem, AgentConfig } from '@/types';

/**
 * Input and output types for different agents
 */

// Diff Segmentation Agent
export interface DiffSegmentationInput {
  diffs: DiffItem[];
}

export interface DiffSegmentationOutput {
  analyses: AnalysisItem[];
  summary: {
    totalAnalyzed: number;
    sectionBreakdown: Record<string, number>;
    priorityBreakdown: Record<string, number>;
    averageConfidence: number;
  };
}

// Reviewer Alignment Agent
export interface ReviewerAlignmentInput {
  diffs: DiffItem[];
  reviewerRequests: string;
}

export interface ReviewerAlignmentOutput {
  alignedAnalyses: AnalysisItem[];
  summary: {
    totalChanges: number;
    alignedChanges: number;
    alignmentPercentage: number;
    topRequests: string[];
    averageAlignmentScore: number;
  };
}

// Section Inference Agent
export interface SectionInferenceInput {
  text: string;
  context?: string;
  previousAnalyses?: AnalysisItem[];
}

export interface SectionInferenceOutput {
  inferredSection: string;
  confidence: number;
  reasoning: string;
  alternatives: Array<{
    section: string;
    confidence: number;
    reasoning: string;
  }>;
}

// Priority Assessment Agent
export interface PriorityAssessmentInput {
  analysisItems: AnalysisItem[];
  manuscriptContext?: string;
}

export interface PriorityAssessmentOutput {
  prioritizedAnalyses: AnalysisItem[];
  summary: {
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
    recommendations: string[];
  };
}

// Agent factory type
export type AgentType = 
  | 'diff-segmentation'
  | 'reviewer-alignment'
  | 'section-inference'
  | 'priority-assessment';

// Default configurations for each agent type
export const DEFAULT_AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
  'diff-segmentation': {
    name: 'Diff Segmentation Agent',
    enabled: true,
    timeout: 30000,
    maxRetries: 3,
    fallbackEnabled: true
  },
  'reviewer-alignment': {
    name: 'Reviewer Alignment Agent',
    enabled: true,
    timeout: 30000,
    maxRetries: 3,
    fallbackEnabled: true
  },
  'section-inference': {
    name: 'Section Inference Agent',
    enabled: true,
    timeout: 15000,
    maxRetries: 2,
    fallbackEnabled: true
  },
  'priority-assessment': {
    name: 'Priority Assessment Agent',
    enabled: true,
    timeout: 15000,
    maxRetries: 2,
    fallbackEnabled: true
  }
};

// Agent execution order for orchestration
export const AGENT_EXECUTION_ORDER: AgentType[] = [
  'diff-segmentation',
  'section-inference',
  'priority-assessment',
  'reviewer-alignment'
];

// Agent dependencies (which agents need output from others)
export const AGENT_DEPENDENCIES: Record<AgentType, AgentType[]> = {
  'diff-segmentation': [],
  'section-inference': ['diff-segmentation'],
  'priority-assessment': ['diff-segmentation', 'section-inference'],
  'reviewer-alignment': ['diff-segmentation']
};