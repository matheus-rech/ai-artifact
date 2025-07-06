import { useState, useCallback, useRef } from 'react';
import { AnalysisOrchestrator } from '@/agents/AnalysisOrchestrator';
import type { 
  DiffItem, 
  OverallAnalysis,
  AgentStatus,
  AgentResult,
  AnalysisMetrics
} from '@/types';
import type { 
  AgentType,
  DiffSegmentationOutput,
  ReviewerAlignmentOutput
} from '@/agents/base/AgentTypes';

interface UseMultiAgentAnalysisState {
  isAnalyzing: boolean;
  segmentationResult: AgentResult<DiffSegmentationOutput> | null;
  alignmentResult: AgentResult<ReviewerAlignmentOutput> | null;
  overallAnalysis: OverallAnalysis | null;
  agentStatuses: Record<AgentType, AgentStatus>;
  analysisMetrics: AnalysisMetrics;
  error: string | null;
}

interface UseMultiAgentAnalysisActions {
  runAnalysis: (diffs: DiffItem[], reviewerRequests?: string) => Promise<void>;
  resetAnalysis: () => void;
  getAgentStatus: (agentType: AgentType) => AgentStatus | undefined;
  isAnyAgentRunning: () => boolean;
}

/**
 * Hook for managing multi-agent manuscript analysis
 */
export function useMultiAgentAnalysis(): UseMultiAgentAnalysisState & UseMultiAgentAnalysisActions {
  const orchestratorRef = useRef<AnalysisOrchestrator | null>(null);
  
  const [state, setState] = useState<UseMultiAgentAnalysisState>({
    isAnalyzing: false,
    segmentationResult: null,
    alignmentResult: null,
    overallAnalysis: null,
    agentStatuses: {} as Record<AgentType, AgentStatus>,
    analysisMetrics: {
      totalTime: 0,
      diffCount: 0,
      apiCalls: 0,
      fallbackUsed: false
    },
    error: null
  });

  // Initialize orchestrator if not already done
  const getOrchestrator = useCallback((): AnalysisOrchestrator => {
    if (!orchestratorRef.current) {
      orchestratorRef.current = new AnalysisOrchestrator();
    }
    return orchestratorRef.current;
  }, []);

  /**
   * Run comprehensive analysis using all agents
   */
  const runAnalysis = useCallback(async (
    diffs: DiffItem[], 
    reviewerRequests?: string
  ): Promise<void> => {
    if (state.isAnalyzing) {
      console.warn('Analysis already in progress');
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isAnalyzing: true, 
      error: null,
      analysisMetrics: {
        ...prev.analysisMetrics,
        diffCount: diffs.length
      }
    }));

    try {
      const orchestrator = getOrchestrator();
      // const startTime = Date.now(); // Available for future performance tracking

      // Start analysis
      const result = await orchestrator.runComprehensiveAnalysis(diffs, reviewerRequests);

      // Update metrics
      const analysisMetrics: AnalysisMetrics = {
        totalTime: result.executionSummary.totalTime,
        diffCount: diffs.length,
        apiCalls: result.executionSummary.successfulAgents, // Approximation
        fallbackUsed: result.executionSummary.usedFallback
      };

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        segmentationResult: result.segmentationResult,
        alignmentResult: result.alignmentResult,
        overallAnalysis: result.overallAnalysis,
        agentStatuses: orchestrator.getAllAgentStatuses(),
        analysisMetrics,
        error: null
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown analysis error';
      console.error('Multi-agent analysis failed:', error);
      
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage
      }));
    }
  }, [state.isAnalyzing, getOrchestrator]);

  /**
   * Reset analysis state
   */
  const resetAnalysis = useCallback((): void => {
    const orchestrator = getOrchestrator();
    orchestrator.resetAgents();
    
    setState({
      isAnalyzing: false,
      segmentationResult: null,
      alignmentResult: null,
      overallAnalysis: null,
      agentStatuses: orchestrator.getAllAgentStatuses(),
      analysisMetrics: {
        totalTime: 0,
        diffCount: 0,
        apiCalls: 0,
        fallbackUsed: false
      },
      error: null
    });
  }, [getOrchestrator]);

  /**
   * Get status of specific agent
   */
  const getAgentStatus = useCallback((agentType: AgentType): AgentStatus | undefined => {
    const orchestrator = getOrchestrator();
    return orchestrator.getAgentStatus(agentType);
  }, [getOrchestrator]);

  /**
   * Check if any agent is currently running
   */
  const isAnyAgentRunning = useCallback((): boolean => {
    const orchestrator = getOrchestrator();
    return orchestrator.isAnyAgentRunning();
  }, [getOrchestrator]);

  return {
    ...state,
    runAnalysis,
    resetAnalysis,
    getAgentStatus,
    isAnyAgentRunning
  };
}