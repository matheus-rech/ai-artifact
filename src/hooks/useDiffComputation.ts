import { useState, useCallback, useMemo } from 'react';
import { DiffEngine } from '@/services/diffEngine';
import { DiffMatchPatchEngine } from '@/services/diffMatchPatchEngine';
import type { DiffItem, ValidationResult, DiffGranularity, AppConfig } from '@/types';

interface UseDiffComputationState {
  diffs: DiffItem[];
  isComputing: boolean;
  computationTime: number;
  error: string | null;
}

interface UseDiffComputationActions {
  computeDiffs: (original: string, revised: string, granularity: DiffGranularity) => Promise<DiffItem[]>;
  resetDiffs: () => void;
  validateTexts: (original: string, revised: string) => ValidationResult;
}

/**
 * Hook for managing diff computation with performance optimization
 */
export function useDiffComputation(config: AppConfig): UseDiffComputationState & UseDiffComputationActions {
  const [state, setState] = useState<UseDiffComputationState>({
    diffs: [],
    isComputing: false,
    computationTime: 0,
    error: null
  });

  // Memoized diff engine instances
  const diffEngine = useMemo(() => new DiffEngine(), []);
  const diffMatchPatchEngine = useMemo(() => new DiffMatchPatchEngine(), []);
  
  const selectedEngine = config.useDiffMatchPatch ? diffMatchPatchEngine : diffEngine;

  /**
   * Compute diffs between original and revised text
   */
  const computeDiffs = useCallback(async (
    original: string,
    revised: string,
    granularity: DiffGranularity
  ): Promise<DiffItem[]> => {
    if (state.isComputing) {
      throw new Error('Diff computation already in progress');
    }

    setState(prev => ({ 
      ...prev, 
      isComputing: true, 
      error: null 
    }));

    try {
      const startTime = performance.now();

      // Validate inputs (only DiffEngine has validateInput method)
      const originalValidation = diffEngine.validateInput(original);
      const revisedValidation = diffEngine.validateInput(revised);

      if (!originalValidation.isValid) {
        throw new Error(`Original text validation failed: ${originalValidation.errors.join(', ')}`);
      }

      if (!revisedValidation.isValid) {
        throw new Error(`Revised text validation failed: ${revisedValidation.errors.join(', ')}`);
      }

      // Compute diffs based on granularity using selected engine
      let diffs: DiffItem[];
      if (granularity === 'word') {
        diffs = selectedEngine.generateWordDiffs(original, revised);
      } else {
        diffs = selectedEngine.generateSentenceDiffs(original, revised);
      }

      const computationTime = performance.now() - startTime;

      setState(prev => ({
        ...prev,
        diffs,
        isComputing: false,
        computationTime,
        error: null
      }));

      console.warn(`Diff computation completed: ${diffs.length} changes in ${computationTime.toFixed(2)}ms`);
      
      return diffs;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown diff computation error';
      console.error('Diff computation failed:', error);

      setState(prev => ({
        ...prev,
        isComputing: false,
        error: errorMessage
      }));

      throw error;
    }
  }, [state.isComputing, selectedEngine, diffEngine]);

  /**
   * Reset diff computation state
   */
  const resetDiffs = useCallback((): void => {
    setState({
      diffs: [],
      isComputing: false,
      computationTime: 0,
      error: null
    });
  }, []);

  /**
   * Validate text inputs without computing diffs
   */
  const validateTexts = useCallback((original: string, revised: string): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate original text (using DiffEngine for validation)
    const originalValidation = diffEngine.validateInput(original);
    errors.push(...originalValidation.errors);
    warnings.push(...originalValidation.warnings);

    // Validate revised text (using DiffEngine for validation)
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
      warnings
    };
  }, [diffEngine]);

  return {
    ...state,
    computeDiffs,
    resetDiffs,
    validateTexts
  };
}
