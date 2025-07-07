import { DiffEngine } from '../services/diffEngine';
import { DiffMatchPatchEngine } from '../services/diffMatchPatchEngine';
import type { DiffItem } from '../types';

export interface BenchmarkResult {
  engine: 'LCS' | 'DiffMatchPatch';
  computationTime: number;
  memoryUsage: number;
  diffCount: number;
  accuracy: number;
}

export interface BenchmarkComparison {
  lcsResult: BenchmarkResult;
  diffMatchPatchResult: BenchmarkResult;
  recommendation: 'LCS' | 'DiffMatchPatch';
  performanceDifference: number;
}

/**
 * Measures memory usage before and after an operation
 */
function measureMemoryUsage(): number {
  if (typeof process?.memoryUsage === 'function') {
    return process.memoryUsage().heapUsed; // For Node.js
  }
  // The browser-specific implementation was removed as this util is run in Node.
  return 0;
}

/**
 * Calculates accuracy score based on diff quality metrics
 */
function calculateAccuracy(diffs: DiffItem[]): number {
  if (diffs.length === 0) return 0;
  
  const avgConfidence = diffs.reduce((sum, diff) => sum + (diff.confidence || 0), 0) / diffs.length;
  const contextQuality = diffs.filter(diff => diff.context && diff.context.length > 0).length / diffs.length;
  
  return (avgConfidence * 0.7) + (contextQuality * 0.3);
}

/**
 * Benchmarks a single diff engine with given text inputs
 */
async function benchmarkEngine(
  engine: DiffEngine | DiffMatchPatchEngine,
  engineName: 'LCS' | 'DiffMatchPatch',
  original: string,
  revised: string
): Promise<BenchmarkResult> {
  const memoryBefore = measureMemoryUsage();
  const startTime = performance.now();
  
  try {
    const wordDiffs = engine.generateWordDiffs(original, revised);
    const sentenceDiffs = engine.generateSentenceDiffs(original, revised);
    
    const endTime = performance.now();
    const memoryAfter = measureMemoryUsage();
    
    const totalDiffs = [...wordDiffs, ...sentenceDiffs];
    const computationTime = endTime - startTime;
    const memoryUsage = memoryAfter - memoryBefore;
    const accuracy = calculateAccuracy(totalDiffs);
    
    return {
      engine: engineName,
      computationTime,
      memoryUsage,
      diffCount: totalDiffs.length,
      accuracy
    };
  } catch (error) {
    console.error(`Error benchmarking ${engineName} engine:`, error);
    return {
      engine: engineName,
      computationTime: Infinity,
      memoryUsage: Infinity,
      diffCount: 0,
      accuracy: 0
    };
  }
}

/**
 * Benchmarks both diff engines and returns comparison results
 */
export async function benchmarkDiffEngines(
  original: string,
  revised: string
): Promise<BenchmarkComparison> {
  const lcsEngine = new DiffEngine();
  const diffMatchPatchEngine = new DiffMatchPatchEngine();
  
  // Validate inputs
  const lcsValidation = lcsEngine.validateInput(original);
  const dmpValidation = diffMatchPatchEngine.validateInput(original);
  
  if (!lcsValidation.isValid || !dmpValidation.isValid) {
    throw new Error('Invalid input text for benchmarking');
  }
  
  const lcsResult = await benchmarkEngine(lcsEngine, 'LCS', original, revised);
  const diffMatchPatchResult = await benchmarkEngine(diffMatchPatchEngine, 'DiffMatchPatch', original, revised);
  
  const performanceDifference = lcsResult.computationTime - diffMatchPatchResult.computationTime;
  
  let recommendation: 'LCS' | 'DiffMatchPatch';
  
  const lcsScore = (1 / Math.max(lcsResult.computationTime, 1)) * 0.4 +
                   lcsResult.accuracy * 0.4 +
                   (1 / Math.max(lcsResult.memoryUsage, 1)) * 0.2;
                   
  const dmpScore = (1 / Math.max(diffMatchPatchResult.computationTime, 1)) * 0.4 +
                   diffMatchPatchResult.accuracy * 0.4 +
                   (1 / Math.max(diffMatchPatchResult.memoryUsage, 1)) * 0.2;
  
  recommendation = dmpScore > lcsScore ? 'DiffMatchPatch' : 'LCS';
  
  return {
    lcsResult,
    diffMatchPatchResult,
    recommendation,
    performanceDifference
  };
}

/**
 * Runs multiple benchmark iterations and returns averaged results
 */
export async function runBenchmarkSuite(
  original: string,
  revised: string,
  iterations: number = 3
): Promise<BenchmarkComparison> {
  const results: BenchmarkComparison[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const result = await benchmarkDiffEngines(original, revised);
    results.push(result);
  }
  
  const avgLcsTime = results.reduce((sum, r) => sum + r.lcsResult.computationTime, 0) / iterations;
  const avgDmpTime = results.reduce((sum, r) => sum + r.diffMatchPatchResult.computationTime, 0) / iterations;
  const avgLcsMemory = results.reduce((sum, r) => sum + r.lcsResult.memoryUsage, 0) / iterations;
  const avgDmpMemory = results.reduce((sum, r) => sum + r.diffMatchPatchResult.memoryUsage, 0) / iterations;
  const avgLcsAccuracy = results.reduce((sum, r) => sum + r.lcsResult.accuracy, 0) / iterations;
  const avgDmpAccuracy = results.reduce((sum, r) => sum + r.diffMatchPatchResult.accuracy, 0) / iterations;
  
  const avgLcsDiffCount = Math.round(results.reduce((sum, r) => sum + r.lcsResult.diffCount, 0) / iterations);
  const avgDmpDiffCount = Math.round(results.reduce((sum, r) => sum + r.diffMatchPatchResult.diffCount, 0) / iterations);
  
  const finalLcsScore = (1 / Math.max(avgLcsTime, 1)) * 0.4 +
                        avgLcsAccuracy * 0.4 +
                        (1 / Math.max(avgLcsMemory, 1)) * 0.2;
                        
  const finalDmpScore = (1 / Math.max(avgDmpTime, 1)) * 0.4 +
                        avgDmpAccuracy * 0.4 +
                        (1 / Math.max(avgDmpMemory, 1)) * 0.2;
  
  const finalRecommendation = finalDmpScore > finalLcsScore ? 'DiffMatchPatch' : 'LCS';
  
  return {
    lcsResult: {
      engine: 'LCS',
      computationTime: avgLcsTime,
      memoryUsage: avgLcsMemory,
      diffCount: avgLcsDiffCount,
      accuracy: avgLcsAccuracy
    },
    diffMatchPatchResult: {
      engine: 'DiffMatchPatch',
      computationTime: avgDmpTime,
      memoryUsage: avgDmpMemory,
      diffCount: avgDmpDiffCount,
      accuracy: avgDmpAccuracy
    },
    recommendation: finalRecommendation,
    performanceDifference: avgLcsTime - avgDmpTime
  };
}
