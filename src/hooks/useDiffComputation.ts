import { useState, useCallback, useMemo, useRef } from 'react';
import { DiffEngine } from '../services/diffEngine';
import { DiffMatchPatchEngine } from '../services/diffMatchPatchEngine';
import type { DiffItem, ValidationResult, DiffGranularity } from '../types';

interface UseDiffComputationState {
  diffs: DiffItem[];
  isComputing: boolean;
  computationTime: number;
  error: string | null;
}

interface UseDiffComputationActions {
  computeDiffs: (
    original: string,
    revised: string,
    granularity: DiffGranularity
  ) => Promise<DiffItem[]>;
  resetDiffs: () => void;
  validateTexts: (original: string, revised: string) => ValidationResult;
}

/**
 * Hook for managing diff computation with performance optimization
 */
export function useDiffComputation(
  useDiffMatchPatch: boolean = false
): UseDiffComputationState & UseDiffComputationActions {
  const [state, setState] = useState<UseDiffComputationState>({
    diffs: [],
    isComputing: false,
    computationTime: 0,
    error: null,
  });

  // Memoized diff engine instance - switches between engines based on config
  const diffEngine = useMemo(() => {
    return useDiffMatchPatch ? new DiffMatchPatchEngine() : new DiffEngine();
  }, [useDiffMatchPatch]);

  // Ref to track whether a diff computation is currently running.
  // Using a ref avoids issues with stale closures when `computeDiffs` is invoked
  // multiple times in quick succession (e.g. double-clicks) before React state
  // updates have propagated.
  const isComputingRef = useRef(false);

  /**
   * Compute diffs between original and revised text
   */
  const computeDiffs = useCallback(
    async (
      original: string,
      revised: string,
      granularity: DiffGranularity
    ): Promise<DiffItem[]> => {
      // Guard against parallel execution using the ref instead of state.
      if (isComputingRef.current) {
        throw new Error('Diff computation already in progress');
      }

      // Mark as running _before_ any work starts to avoid race conditions
      // where two calls could pass the check above before `setState` completes.
      isComputingRef.current = true;

      setState(
        (prev: UseDiffComputationState): UseDiffComputationState => ({
          ...prev,
          isComputing: true,
          error: null,
        })
      );

      try {
        const startTime = performance.now();

        // Validate inputs
        const originalValidation = diffEngine.validateInput(original);
        const revisedValidation = diffEngine.validateInput(revised);

        if (!originalValidation.isValid) {
          throw new Error(
            `Original text validation failed: ${originalValidation.errors.join(', ')}`
          );
        }

        if (!revisedValidation.isValid) {
          throw new Error(`Revised text validation failed: ${revisedValidation.errors.join(', ')}`);
        }

        // Compute diffs based on granularity (using Promise.resolve to make it async)
        const diffs: DiffItem[] = await Promise.resolve(
          granularity === 'word'
            ? diffEngine.generateWordDiffs(original, revised)
            : diffEngine.generateSentenceDiffs(original, revised)
        );

        const computationTime = performance.now() - startTime;

        setState(
          (prev: UseDiffComputationState): UseDiffComputationState => ({
            ...prev,
            diffs,
            isComputing: false,
            computationTime,
            error: null,
          })
        );

        isComputingRef.current = false;

        console.warn(
          `Diff computation completed: ${diffs.length} changes in ${computationTime.toFixed(2)}ms using ${useDiffMatchPatch ? 'DiffMatchPatch' : 'LCS'} engine`
        );

        return diffs;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown diff computation error';
        console.error('Diff computation failed:', error);

        setState(
          (prev: UseDiffComputationState): UseDiffComputationState => ({
            ...prev,
            isComputing: false,
            error: errorMessage,
          })
        );

        isComputingRef.current = false;

        throw error;
      }
    },
    [diffEngine]
  );

  /**
   * Reset diff computation state
   */
  const resetDiffs = useCallback((): void => {
    const resetState: UseDiffComputationState = {
      diffs: [],
      isComputing: false,
      computationTime: 0,
      error: null,
    };
    setState(resetState);

    // Ensure the ref flag is also reset so that new computations can be started.
    isComputingRef.current = false;
  }, []);

  /**
   * Validate text inputs without computing diffs
   */
  const validateTexts = useCallback(
    (original: string, revised: string): ValidationResult => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate original text
      const originalValidation = diffEngine.validateInput(original);
      errors.push(...originalValidation.errors);
      warnings.push(...originalValidation.warnings);

      // Validate revised text
      const revisedValidation = diffEngine.validateInput(revised);
      errors.push(...revisedValidation.errors);
      warnings.push(...revisedValidation.warnings);

      // Check for identical texts
      if (original.trim() === revised.trim()) {
        warnings.push('Original and revised texts appear identical');
      }

      // Check for significant size differences
      const sizeDifference = Math.abs(original.length - revised.length);
      const averageSize = (original.length + revised.length) / 2;
      if (sizeDifference / averageSize > 0.5) {
        warnings.push('Large difference in text sizes detected');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    },
    [diffEngine]
  );

  return {
    ...state,
    computeDiffs,
    resetDiffs,
    validateTexts,
  };
}
