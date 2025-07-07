import { DiffEngine } from '../services/diffEngine';
import { DiffMatchPatchEngine } from '../services/diffMatchPatchEngine';
import { PerformanceBenchmark, benchmarkTestCases, type BenchmarkResult } from './benchmarkUtils';

export async function runDiffEngineBenchmarks(): Promise<{
  results: BenchmarkResult[];
  report: string;
  recommendation: string;
}> {
  const benchmark = new PerformanceBenchmark();
  const diffEngine = new DiffEngine();
  const dmpEngine = new DiffMatchPatchEngine();

  console.warn('Starting diff engine benchmarks...');

  for (const testCase of benchmarkTestCases) {
    console.warn(`Running test case: ${testCase.name}`);
    
    await benchmark.runBenchmark(
      'LCS_Word',
      testCase,
      (original, revised) => diffEngine.generateWordDiffs(original, revised)
    );

    await benchmark.runBenchmark(
      'LCS_Sentence',
      testCase,
      (original, revised) => diffEngine.generateSentenceDiffs(original, revised)
    );

    await benchmark.runBenchmark(
      'DMP_Word',
      testCase,
      (original, revised) => dmpEngine.generateWordDiffs(original, revised)
    );

    await benchmark.runBenchmark(
      'DMP_Sentence',
      testCase,
      (original, revised) => dmpEngine.generateSentenceDiffs(original, revised)
    );
  }

  const results = benchmark.getResults();
  const report = benchmark.generateReport();
  const recommendation = generateRecommendation(results);

  console.warn('Benchmarks completed!');
  console.warn(report);
  console.warn('\nRecommendation:', recommendation);

  return { results, report, recommendation };
}

function generateRecommendation(results: BenchmarkResult[]): string {
  const lcsResults = results.filter(r => r.engineName.startsWith('LCS'));
  const dmpResults = results.filter(r => r.engineName.startsWith('DMP'));

  if (lcsResults.length === 0 || dmpResults.length === 0) {
    return 'Insufficient data to make a recommendation.';
  }

  const lcsAvgTime = lcsResults.reduce((sum, r) => sum + r.executionTime, 0) / lcsResults.length;
  const dmpAvgTime = dmpResults.reduce((sum, r) => sum + r.executionTime, 0) / dmpResults.length;
  
  const lcsAvgAccuracy = lcsResults.reduce((sum, r) => sum + (r.accuracy || 0), 0) / lcsResults.length;
  const dmpAvgAccuracy = dmpResults.reduce((sum, r) => sum + (r.accuracy || 0), 0) / dmpResults.length;

  let recommendation = '';

  if (Math.abs(lcsAvgTime - dmpAvgTime) < 50) {
    if (dmpAvgAccuracy > lcsAvgAccuracy + 0.1) {
      recommendation = 'RECOMMENDATION: Use diff-match-patch engine as default. Similar performance with better accuracy.';
    } else if (lcsAvgAccuracy > dmpAvgAccuracy + 0.1) {
      recommendation = 'RECOMMENDATION: Use LCS engine as default. Similar performance with better accuracy.';
    } else {
      recommendation = 'RECOMMENDATION: Use diff-match-patch engine as default. Similar performance and accuracy, but DMP has better semantic cleanup.';
    }
  } else if (dmpAvgTime < lcsAvgTime * 0.8) {
    recommendation = 'RECOMMENDATION: Use diff-match-patch engine as default. Significantly better performance.';
  } else if (lcsAvgTime < dmpAvgTime * 0.8) {
    recommendation = 'RECOMMENDATION: Use LCS engine as default. Significantly better performance.';
  } else {
    if (dmpAvgAccuracy > lcsAvgAccuracy + 0.05) {
      recommendation = 'RECOMMENDATION: Use diff-match-patch engine as default. Better accuracy outweighs moderate performance difference.';
    } else {
      recommendation = 'RECOMMENDATION: Use LCS engine as default. Better performance with acceptable accuracy.';
    }
  }

  recommendation += `\n\nPerformance Summary:`;
  recommendation += `\n- LCS Engine: ${lcsAvgTime.toFixed(2)}ms avg, ${(lcsAvgAccuracy * 100).toFixed(1)}% accuracy`;
  recommendation += `\n- DMP Engine: ${dmpAvgTime.toFixed(2)}ms avg, ${(dmpAvgAccuracy * 100).toFixed(1)}% accuracy`;

  return recommendation;
}

export async function runBenchmarksInConsole(): Promise<void> {
  try {
    const { report, recommendation } = await runDiffEngineBenchmarks();
    console.warn('\n' + '='.repeat(80));
    console.warn('DIFF ENGINE BENCHMARK RESULTS');
    console.warn('='.repeat(80));
    console.warn(report);
    console.warn('='.repeat(80));
    console.warn(recommendation);
    console.warn('='.repeat(80));
  } catch (error) {
    console.error('Benchmark execution failed:', error);
  }
}

import type { DiffItem } from '../types';

interface BenchmarkSuite {
  name: string;
  originalText: string;
  revisedText: string;
  results: BenchmarkResult[];
}

/**
 * Utility functions for running performance benchmarks on diff algorithms
 */
export class BenchmarkRunner {
  private diffEngine: DiffEngine;

  constructor() {
    this.diffEngine = new DiffEngine();
  }

  /**
   * Run a comprehensive benchmark suite
   */
  async runBenchmarkSuite(testCases: Array<{
    name: string;
    original: string;
    revised: string;
  }>): Promise<BenchmarkSuite[]> {
    const results: BenchmarkSuite[] = [];

    for (const testCase of testCases) {
      const suite: BenchmarkSuite = {
        name: testCase.name,
        originalText: testCase.original,
        revisedText: testCase.revised,
        results: []
      };

      // Benchmark word-level diffs
      const wordResult = await this.benchmarkWordDiffs(
        testCase.original,
        testCase.revised
      );
      suite.results.push(wordResult);

      // Benchmark sentence-level diffs
      const sentenceResult = await this.benchmarkSentenceDiffs(
        testCase.original,
        testCase.revised
      );
      suite.results.push(sentenceResult);

      results.push(suite);
    }

    // Performance thresholds and analysis constants
    // const PERFORMANCE_THRESHOLD_MS = 50;
    // const PERFORMANCE_RATIO_THRESHOLD = 0.8;
    // const ACCURACY_DIFFERENCE_THRESHOLD = 0.05;

    return results;
  }

  /**
   * Benchmark word-level diff generation
   */
  private async benchmarkWordDiffs(original: string, revised: string): Promise<BenchmarkResult> {
    const startTime = performance.now();
    
    const diffs = this.diffEngine.generateWordDiffs(original, revised);
    
    const endTime = performance.now();
    const duration = endTime - startTime;

    return {
      engineName: 'Custom LCS',
      testCase: 'word-level',
      executionTime: duration,
      diffCount: diffs.length,
      accuracy: this.calculateAccuracy(diffs, original, revised)
    };
  }

  /**
   * Benchmark sentence-level diff generation
   */
  private async benchmarkSentenceDiffs(original: string, revised: string): Promise<BenchmarkResult> {
    const startTime = performance.now();
    
    const diffs = this.diffEngine.generateSentenceDiffs(original, revised);
    
    const endTime = performance.now();
    const duration = endTime - startTime;

    return {
      engineName: 'Custom LCS',
      testCase: 'sentence-level',
      executionTime: duration,
      diffCount: diffs.length,
      accuracy: this.calculateAccuracy(diffs, original, revised)
    };
  }

  /**
   * Calculate accuracy score for diff results
   */
  private calculateAccuracy(diffs: DiffItem[], original: string, revised: string): number {
    // Simple accuracy calculation based on diff coverage
    const totalLength = Math.max(original.length, revised.length);
    const coveredLength = diffs.reduce((sum, diff) => sum + diff.text.length, 0);
    
    return totalLength > 0 ? coveredLength / totalLength : 1.0;
  }

  /**
   * Generate a performance report
   */
  generateReport(suites: BenchmarkSuite[]): string {
    let report = 'Diff Engine Performance Report\n';
    report += '================================\n\n';

    for (const suite of suites) {
      report += `Test Case: ${suite.name}\n`;
      report += '-'.repeat(suite.name.length + 12) + '\n';

      for (const result of suite.results) {
        report += `  ${result.engineName}:\n`;
        report += `    Duration: ${result.executionTime.toFixed(2)}ms\n`;
        report += `    Accuracy: ${((result.accuracy || 0) * 100).toFixed(1)}%\n`;
        report += `    Diffs: ${result.diffCount}\n\n`;
      }
    }

    return report;
  }
}

/**
 * Run benchmarks for the diff engine
 */
export async function runBenchmarks(): Promise<void> {
  const runner = new BenchmarkRunner();

  const testCases = [
    {
      name: 'Simple Text Change',
      original: 'The quick brown fox jumps over the lazy dog.',
      revised: 'The quick red fox jumps over the sleeping dog.'
    },
    {
      name: 'Academic Paper Abstract',
      original: 'This study examines the effects of machine learning on data processing. Our methodology involved statistical analysis of large datasets.',
      revised: 'This comprehensive study examines the effects of advanced machine learning algorithms on efficient data processing. Our rigorous methodology involved robust statistical analysis of extensive datasets.'
    },
    {
      name: 'Long Document',
      original: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(50),
      revised: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt. '.repeat(50)
    }
  ];

  const suites = await runner.runBenchmarkSuite(testCases);
  const report = runner.generateReport(suites);

  console.warn(report);
}
