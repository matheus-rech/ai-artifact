import { useState, useCallback, useRef } from 'react';
import type { DiffItem, DiffGranularity, AppConfig } from '../types';
import { DiffEngine } from '../services/diffEngine';
import { DiffMatchPatchEngine } from '../services/diffMatchPatchEngine';

interface DiffComputationState {
  diffs: DiffItem[];
  isComputing: boolean;
  computationTime: number;
  error: string | null;
  granularity: DiffGranularity;
}

/**
 * Custom hook for managing diff computation
 */
export function useDiffComputation(config: AppConfig) {
  const [state, setState] = useState<DiffComputationState>({
    diffs: [],
    isComputing: false,
    computationTime: 0,
    error: null,
    granularity: 'word',
  });

  // Use ref to track computing state for better race condition handling
  const isComputingRef = useRef(false);

  // Select diff engine based on config
  const diffEngineRef = useRef(
    config.useDiffMatchPatch ? new DiffMatchPatchEngine() : new DiffEngine()
  );

  /**
   * Update diff engine when config changes
   */
  const updateDiffEngine = useCallback((newConfig: AppConfig) => {
    diffEngineRef.current = newConfig.useDiffMatchPatch
      ? new DiffMatchPatchEngine()
      : new DiffEngine();
  }, []);

  /**
   * Compute diffs between original and revised text
   */
  const computeDiffs = useCallback(
    async (
      original: string,
      revised: string,
      granularity: DiffGranularity
    ): Promise<DiffItem[]> => {
      if (isComputingRef.current) {
        throw new Error('Diff computation already in progress');
      }

      // Mark as running before any work starts to avoid race conditions
      isComputingRef.current = true;

      setState((prev) => ({
        ...prev,
        isComputing: true,
        error: null,
        granularity,
      }));

      const startTime = performance.now();

      try {
        // Validate inputs
        if (!original && !revised) {
          throw new Error('Both texts cannot be empty');
        }

        if (original.length > config.maxTextLength || revised.length > config.maxTextLength) {
          throw new Error(
            `Text exceeds maximum length of ${config.maxTextLength} characters`
          );
        }

        // Compute diffs using selected engine
        const diffs = await diffEngineRef.current.computeDiffs(original, revised, {
          granularity,
          minDiffLength: config.minDiffLength,
        });

        const computationTime = performance.now() - startTime;

        setState((prev) => ({
          ...prev,
          diffs,
          isComputing: false,
          computationTime,
          error: null,
        }));

        isComputingRef.current = false;

        console.warn(
          `Diff computation completed: ${diffs.length} changes in ${computationTime.toFixed(2)}ms`
        );

        return diffs;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        setState((prev) => ({
          ...prev,
          isComputing: false,
          error: errorMessage,
        }));

        isComputingRef.current = false;

        throw error;
      }
    },
    [config.maxTextLength, config.minDiffLength]
  );

  /**
   * Clear all diffs and reset state
   */
  const clearDiffs = useCallback(() => {
    if (isComputingRef.current) {
      console.warn('Cannot clear diffs while computation is in progress');
      return;
    }

    setState({
      diffs: [],
      isComputing: false,
      computationTime: 0,
      error: null,
      granularity: 'word',
    });
  }, []);

  /**
   * Update granularity setting
   */
  const updateGranularity = useCallback((granularity: DiffGranularity) => {
    setState((prev) => ({
      ...prev,
      granularity,
    }));
  }, []);

  /**
   * Get summary statistics
   */
  const getDiffStats = useCallback(() => {
    const { diffs } = state;
    const additions = diffs.filter((d) => d.type === 'addition').length;
    const deletions = diffs.filter((d) => d.type === 'deletion').length;
    const modifications = diffs.filter((d) => d.type === 'modification').length;

    return {
      total: diffs.length,
      additions,
      deletions,
      modifications,
      averageConfidence:
        diffs.length > 0
          ? diffs.reduce((sum, d) => sum + (d.confidence || 0), 0) / diffs.length
          : 0,
    };
  }, [state.diffs]);

  /**
   * Export diffs to various formats
   */
  const exportDiffs = useCallback(
    (format: 'json' | 'csv' | 'markdown' = 'json'): string => {
      const { diffs } = state;

      switch (format) {
        case 'json':
          return JSON.stringify(diffs, null, 2);

        case 'csv':
          const headers = ['ID', 'Type', 'Text', 'Confidence', 'Original Position', 'Revised Position'];
          const rows = diffs.map((d) =>
            [d.id, d.type, `"${d.text.replace(/"/g, '""')}"`, d.confidence || 0, d.originalPos, d.revisedPos].join(',')
          );
          return [headers.join(','), ...rows].join('\n');

        case 'markdown':
          const mdRows = diffs.map(
            (d) =>
              `| ${d.id} | ${d.type} | ${d.text.substring(0, 50)}... | ${(
                (d.confidence || 0) * 100
              ).toFixed(0)}% |`
          );
          return [
            '| ID | Type | Text | Confidence |',
            '|---|---|---|---|',
            ...mdRows,
          ].join('\n');

        default:
          return JSON.stringify(diffs);
      }
    },
    [state.diffs]
  );

  return {
    diffs: state.diffs,
    isComputing: state.isComputing,
    computationTime: state.computationTime,
    error: state.error,
    granularity: state.granularity,
    computeDiffs,
    clearDiffs,
    updateGranularity,
    updateDiffEngine,
    getDiffStats,
    exportDiffs,
  };
}
