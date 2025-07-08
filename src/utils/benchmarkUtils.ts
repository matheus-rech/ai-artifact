export interface BenchmarkResult {
  engineName: string;
  testCase: string;
  executionTime: number;
  diffCount: number;
  memoryUsage?: number;
  accuracy?: number;
}

export interface BenchmarkTestCase {
  name: string;
  original: string;
  revised: string;
  expectedDiffTypes: string[];
}

export const benchmarkTestCases: BenchmarkTestCase[] = [
  {
    name: 'small_text_changes',
    original: 'This is a simple test sentence with basic content.',
    revised: 'This is a modified test sentence with enhanced content.',
    expectedDiffTypes: ['modification', 'modification']
  },
  {
    name: 'medium_text_restructuring',
    original: `
      Introduction: This paper presents a novel approach to machine learning.
      Methods: We used a dataset of 1000 samples for training.
      Results: The accuracy achieved was 95% on the test set.
      Discussion: These results demonstrate the effectiveness of our approach.
    `,
    revised: `
      Introduction: This paper presents an innovative approach to machine learning.
      Methods: We utilized a comprehensive dataset of 1500 samples for training.
      Results: The accuracy achieved was 97% on the validation set.
      Discussion: These outstanding results clearly demonstrate the superior effectiveness of our novel approach.
    `,
    expectedDiffTypes: ['modification', 'modification', 'modification', 'modification']
  },
  {
    name: 'large_text_processing',
    original: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(500),
    revised: 'Modified lorem ipsum dolor sit amet, updated consectetur adipiscing elit. '.repeat(500),
    expectedDiffTypes: ['modification']
  },
  {
    name: 'sentence_reordering',
    original: 'First sentence here. Second sentence follows. Third sentence concludes.',
    revised: 'Third sentence concludes. First sentence here. Second sentence follows.',
    expectedDiffTypes: ['deletion', 'addition', 'deletion', 'addition']
  },
  {
    name: 'academic_paper_revision',
    original: `
      Abstract: This study investigates the impact of climate change on biodiversity.
      Introduction: Climate change poses significant threats to global ecosystems.
      Methods: We analyzed data from 50 research sites over 10 years.
      Results: Species diversity decreased by 15% in affected areas.
      Conclusion: Immediate action is required to mitigate these effects.
    `,
    revised: `
      Abstract: This comprehensive study investigates the profound impact of climate change on global biodiversity patterns.
      Introduction: Anthropogenic climate change poses unprecedented threats to worldwide ecosystems and species survival.
      Methods: We systematically analyzed longitudinal data from 75 research sites over 15 years using advanced statistical models.
      Results: Species diversity decreased significantly by 23% in climate-affected areas, with particularly severe impacts on endemic species.
      Conclusion: Urgent and coordinated international action is critically required to mitigate these devastating ecological effects.
    `,
    expectedDiffTypes: ['modification', 'modification', 'modification', 'modification', 'modification']
  }
];

export class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];

  async runBenchmark(
    engineName: string,
    testCase: BenchmarkTestCase,
    diffFunction: (original: string, revised: string) => Promise<unknown[]> | unknown[]
  ): Promise<BenchmarkResult> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    try {
      const diffs = await diffFunction(testCase.original, testCase.revised);
      
      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();
      
      const result: BenchmarkResult = {
        engineName,
        testCase: testCase.name,
        executionTime: endTime - startTime,
        diffCount: diffs.length,
        memoryUsage: endMemory - startMemory,
        accuracy: this.calculateAccuracy(diffs as Array<{ type?: string }>, testCase.expectedDiffTypes)
      };

      this.results.push(result);
      return result;
    } catch (error) {
      console.error(`Benchmark failed for ${engineName} on ${testCase.name}:`, error);
      const result: BenchmarkResult = {
        engineName,
        testCase: testCase.name,
        executionTime: -1,
        diffCount: 0,
        accuracy: 0
      };
      this.results.push(result);
      return result;
    }
  }

  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as unknown as { memory: { usedJSHeapSize: number } })) {
      return (window.performance as unknown as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize;
    }
    return 0;
  }

  private calculateAccuracy(diffs: Array<{ type?: string }>, expectedTypes: string[]): number {
    if (diffs.length === 0 && expectedTypes.length === 0) return 1.0;
    if (diffs.length === 0 || expectedTypes.length === 0) return 0.0;
    
    const actualTypes = diffs.map(d => d.type ?? 'unknown');
    const matches = actualTypes.filter(type => expectedTypes.includes(type)).length;
    return matches / Math.max(actualTypes.length, expectedTypes.length);
  }

  getResults(): BenchmarkResult[] {
    return [...this.results];
  }

  generateReport(): string {
    if (this.results.length === 0) {
      return 'No benchmark results available.';
    }

    const groupedResults = this.groupResultsByTestCase();
    let report = '# Diff Engine Performance Benchmark Report\n\n';

    for (const [testCase, results] of Object.entries(groupedResults)) {
      report += `## Test Case: ${testCase}\n\n`;
      report += '| Engine | Execution Time (ms) | Diff Count | Memory Usage (bytes) | Accuracy |\n';
      report += '|--------|-------------------|------------|---------------------|----------|\n';
      
      for (const result of results) {
        const memoryStr = result.memoryUsage ? result.memoryUsage.toLocaleString() : 'N/A';
        const accuracyStr = result.accuracy ? (result.accuracy * 100).toFixed(1) + '%' : 'N/A';
        report += `| ${result.engineName} | ${result.executionTime.toFixed(2)} | ${result.diffCount} | ${memoryStr} | ${accuracyStr} |\n`;
      }
      report += '\n';
    }

    report += this.generateSummary();
    return report;
  }

  private groupResultsByTestCase(): Record<string, BenchmarkResult[]> {
    return this.results.reduce((acc, result) => {
      if (!acc[result.testCase]) {
        acc[result.testCase] = [];
      }
      acc[result.testCase]!.push(result);
      return acc;
    }, {} as Record<string, BenchmarkResult[]>);
  }

  private generateSummary(): string {
    const engines = [...new Set(this.results.map(r => r.engineName))];
    let summary = '## Summary\n\n';

    for (const engine of engines) {
      const engineResults = this.results.filter(r => r.engineName === engine);
      const avgTime = engineResults.reduce((sum, r) => sum + r.executionTime, 0) / engineResults.length;
      const avgAccuracy = engineResults.reduce((sum, r) => sum + (r.accuracy || 0), 0) / engineResults.length;
      
      summary += `### ${engine} Engine\n`;
      summary += `- Average Execution Time: ${avgTime.toFixed(2)}ms\n`;
      summary += `- Average Accuracy: ${(avgAccuracy * 100).toFixed(1)}%\n`;
      summary += `- Total Test Cases: ${engineResults.length}\n\n`;
    }

    return summary;
  }

  clear(): void {
    this.results = [];
  }
}
