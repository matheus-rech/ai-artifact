// Core types for the manuscript diff analyzer

export interface DiffItem {
  id: string;
  text: string;
  originalPos: number;
  revisedPos: number;
  type: 'addition' | 'deletion' | 'modification' | 'equal';
  confidence?: number;
  context?: string;
}

export interface AnalysisItem {
  analysisId: string;
  diffId: string;
  section: string;
  changeType: string;
  reviewerPoint: string;
  assessment: 'positive' | 'negative' | 'neutral';
  comment: string;
  relatedText: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  timestamp: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AnalysisMetrics {
  totalTime: number;
  diffCount: number;
  apiCalls: number;
  fallbackUsed: boolean;
}

export interface OverallAnalysis {
  summary: string;
  totalChanges: number;
  sectionBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  assessmentBreakdown: Record<string, number>;
  averageConfidence: number;
  recommendations: string[];
}

// Agent-specific types
export interface AgentConfig {
  name: string;
  enabled: boolean;
  timeout: number;
  maxRetries: number;
  fallbackEnabled: boolean;
}

export interface AgentResult<T = AnalysisItem[]> {
  success: boolean;
  data: T;
  error?: string;
  executionTime: number;
  usedFallback: boolean;
  confidence: number;
}

export interface AgentStatus {
  agent: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  progress?: number;
  message?: string;
}

// API types
export interface ClaudeAPIRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
}

export interface ClaudeAPIResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

// UI types
export interface CommentPosition {
  top: number;
  left: number;
}

export interface FileUploadState {
  content: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export type DiffGranularity = 'word' | 'sentence';
export type AnalysisTab = 'upload' | 'analysis' | 'review';
export type AgentMode = 'production' | 'heuristic' | 'mixed';

// Configuration types
export interface AppConfig {
  useClaudeAPI: boolean;
  agentMode: AgentMode;
  apiTimeout: number;
  maxRetries: number;
  maxTextLength: number;
  minDiffLength: number;
}

// Manuscript section types
export type ManuscriptSection = 
  | 'Abstract'
  | 'Introduction' 
  | 'Literature Review'
  | 'Methods'
  | 'Methodology'
  | 'Results'
  | 'Discussion'
  | 'Conclusion'
  | 'References'
  | 'Appendix'
  | 'Body';

export type ChangeType = 'addition' | 'deletion' | 'modification' | 'equal';
export type Assessment = 'positive' | 'negative' | 'neutral';
export type Priority = 'high' | 'medium' | 'low';