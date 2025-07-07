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

const PERFORMANCE_THRESHOLD_MS = 50;
const PERFORMANCE_RATIO_THRESHOLD = 0.8;
const ACCURACY_DIFFERENCE_THRESHOLD = 0.05;
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
