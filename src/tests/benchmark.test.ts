import { DiffEngine } from '../services/diffEngine';
import { DiffMatchPatchEngine } from '../services/diffMatchPatchEngine';
import type { DiffItem } from '../types';

interface BenchmarkResult {
  engine: string;
  textSize: string;
  granularity: 'word' | 'sentence';
  computationTime: number;
  memoryUsage: number;
  diffCount: number;
  accuracy: number;
}

interface PerformanceMetrics {
  startTime: number;
  endTime: number;
  startMemory: number;
  endMemory: number;
}

describe('Diff Engine Benchmarks', () => {
  let lcsEngine: DiffEngine;
  let dmpEngine: DiffMatchPatchEngine;

  beforeAll(() => {
    lcsEngine = new DiffEngine();
    dmpEngine = new DiffMatchPatchEngine();
  });

  const measurePerformance = (): PerformanceMetrics => {
    const startMemory = process.memoryUsage().heapUsed;
    const startTime = performance.now();

    return {
      startTime,
      endTime: 0,
      startMemory,
      endMemory: 0,
    };
  };

  const finishMeasurement = (metrics: PerformanceMetrics): PerformanceMetrics => {
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;

    return {
      ...metrics,
      endTime,
      endMemory,
    };
  };

  const calculateAccuracy = (diffs1: DiffItem[], diffs2: DiffItem[]): number => {
    if (diffs1.length === 0 && diffs2.length === 0) return 1.0;
    if (diffs1.length === 0 || diffs2.length === 0) return 0.0;

    const totalChanges = Math.max(diffs1.length, diffs2.length);
    let matchingChanges = 0;

    for (const diff1 of diffs1) {
      const match = diffs2.find(
        (diff2) =>
          diff2.type === diff1.type &&
          diff2.text.toLowerCase().trim() === diff1.text.toLowerCase().trim()
      );
      if (match) matchingChanges++;
    }

    return matchingChanges / totalChanges;
  };

  const runBenchmark = async (
    original: string,
    revised: string,
    granularity: 'word' | 'sentence',
    textSize: string
  ): Promise<BenchmarkResult[]> => {
    const results: BenchmarkResult[] = [];

    const lcsMetrics = measurePerformance();
    const lcsDiffs =
      granularity === 'word'
        ? lcsEngine.generateWordDiffs(original, revised)
        : lcsEngine.generateSentenceDiffs(original, revised);
    const lcsFinished = finishMeasurement(lcsMetrics);

    const dmpMetrics = measurePerformance();
    const dmpDiffs =
      granularity === 'word'
        ? dmpEngine.generateWordDiffs(original, revised)
        : dmpEngine.generateSentenceDiffs(original, revised);
    const dmpFinished = finishMeasurement(dmpMetrics);

    const accuracy = calculateAccuracy(lcsDiffs, dmpDiffs);

    results.push({
      engine: 'LCS',
      textSize,
      granularity,
      computationTime: lcsFinished.endTime - lcsFinished.startTime,
      memoryUsage: lcsFinished.endMemory - lcsFinished.startMemory,
      diffCount: lcsDiffs.length,
      accuracy: 1.0, // LCS is baseline
    });

    results.push({
      engine: 'DiffMatchPatch',
      textSize,
      granularity,
      computationTime: dmpFinished.endTime - dmpFinished.startTime,
      memoryUsage: dmpFinished.endMemory - dmpFinished.startMemory,
      diffCount: dmpDiffs.length,
      accuracy,
    });

    return results;
  };

  const generateTestText = (
    size: 'small' | 'medium' | 'large'
  ): { original: string; revised: string } => {
    const baseText = {
      small: {
        original: `Introduction
This study examines machine learning algorithms for data processing.
Our methodology involved statistical analysis of collected data.
Results show significant improvements in processing efficiency.
Conclusion demonstrates the effectiveness of our approach.`,
        revised: `Introduction
This comprehensive study examines advanced machine learning algorithms for efficient data processing.
Our rigorous methodology involved detailed statistical analysis of extensively collected data.
Experimental results demonstrate highly significant improvements in processing efficiency and accuracy.
Our conclusion clearly demonstrates the remarkable effectiveness of our innovative approach.`,
      },
      medium: {
        original: `Abstract
Machine learning has revolutionized data processing across multiple domains. This research investigates the application of novel algorithms to enhance computational efficiency in large-scale data analysis tasks.

Introduction
The exponential growth of data in modern applications necessitates sophisticated processing techniques. Traditional methods often fail to scale effectively with increasing data volumes. Our study addresses this challenge by developing and evaluating advanced machine learning approaches.

Methodology
We employed a comprehensive experimental design involving multiple datasets and algorithmic variations. Statistical analysis was conducted using established protocols. Performance metrics included processing time, accuracy, and resource utilization.

Results
Our findings demonstrate substantial improvements across all measured parameters. Processing efficiency increased by an average of 45% compared to baseline methods. Accuracy improvements ranged from 12% to 28% depending on the specific application domain.

Discussion
The results indicate that our proposed approach offers significant advantages over existing methods. The improvements are particularly pronounced in scenarios involving complex data structures and high-dimensional feature spaces.

Conclusion
This research contributes to the advancement of machine learning applications in data processing. Future work will explore additional optimization strategies and broader application domains.`,
        revised: `Abstract
Advanced machine learning techniques have fundamentally revolutionized data processing methodologies across numerous application domains. This comprehensive research investigates the systematic application of innovative algorithms to significantly enhance computational efficiency in complex large-scale data analysis tasks.

Introduction
The unprecedented exponential growth of data in contemporary applications absolutely necessitates highly sophisticated processing techniques and methodologies. Traditional computational methods consistently fail to scale effectively with rapidly increasing data volumes and complexity. Our extensive study directly addresses this critical challenge by developing and rigorously evaluating cutting-edge machine learning approaches.

Methodology
We employed a thoroughly comprehensive experimental design involving extensive multiple datasets and sophisticated algorithmic variations. Rigorous statistical analysis was meticulously conducted using well-established protocols and best practices. Key performance metrics included processing time, computational accuracy, and comprehensive resource utilization analysis.

Results
Our extensive findings demonstrate truly substantial improvements across all carefully measured parameters and metrics. Processing efficiency increased by an impressive average of 65% compared to established baseline methods. Accuracy improvements ranged significantly from 18% to 35% depending on the specific application domain and use case.

Discussion
The comprehensive results clearly indicate that our innovative proposed approach offers remarkable advantages over existing conventional methods. The improvements are particularly pronounced and significant in complex scenarios involving intricate data structures and high-dimensional feature spaces.

Conclusion
This groundbreaking research makes substantial contributions to the advancement of machine learning applications in sophisticated data processing. Future research directions will explore additional optimization strategies and investigate broader application domains.`,
      },
      large: {
        original: `Abstract
Machine learning has revolutionized data processing across multiple domains. This research investigates the application of novel algorithms to enhance computational efficiency in large-scale data analysis tasks. Our study demonstrates significant improvements in processing speed and accuracy through innovative algorithmic approaches.

Introduction
The exponential growth of data in modern applications necessitates sophisticated processing techniques. Traditional methods often fail to scale effectively with increasing data volumes. Our study addresses this challenge by developing and evaluating advanced machine learning approaches that can handle complex datasets efficiently.

Literature Review
Previous research in this field has focused primarily on incremental improvements to existing algorithms. Smith et al. (2020) demonstrated modest gains through parameter optimization. Johnson and Williams (2021) explored parallel processing approaches with limited success. Our work builds upon these foundations while introducing fundamentally new concepts.

Methodology
We employed a comprehensive experimental design involving multiple datasets and algorithmic variations. Statistical analysis was conducted using established protocols. Performance metrics included processing time, accuracy, and resource utilization. The experimental setup involved controlled conditions to ensure reproducible results.

Data Collection
Our dataset comprised information from various sources including academic databases, industry repositories, and synthetic data generators. Quality control measures were implemented to ensure data integrity. Preprocessing steps included normalization, feature selection, and outlier detection.

Algorithm Development
The core algorithm incorporates novel optimization techniques based on gradient descent variations. Implementation details include memory management strategies and parallel processing capabilities. Extensive testing was conducted to validate algorithmic correctness and performance characteristics.

Results
Our findings demonstrate substantial improvements across all measured parameters. Processing efficiency increased by an average of 45% compared to baseline methods. Accuracy improvements ranged from 12% to 28% depending on the specific application domain. Memory utilization was reduced by approximately 20% through optimized data structures.

Statistical Analysis
Comprehensive statistical testing confirmed the significance of our results. P-values consistently fell below 0.01 for all major performance metrics. Confidence intervals were calculated using bootstrap methods. Effect sizes were substantial across all experimental conditions.

Discussion
The results indicate that our proposed approach offers significant advantages over existing methods. The improvements are particularly pronounced in scenarios involving complex data structures and high-dimensional feature spaces. Limitations include computational overhead during initial setup phases.

Implications
These findings have important implications for practitioners in the field. The improved efficiency enables processing of larger datasets within existing computational constraints. The enhanced accuracy provides more reliable results for critical applications.

Future Work
Several avenues for future research emerge from this study. Extension to real-time processing scenarios represents a promising direction. Integration with emerging hardware architectures could yield additional performance gains.

Conclusion
This research contributes to the advancement of machine learning applications in data processing. The demonstrated improvements in efficiency and accuracy provide practical benefits for real-world applications. Future work will explore additional optimization strategies and broader application domains.

Acknowledgments
We thank our colleagues for valuable feedback and suggestions. Funding was provided by the National Science Foundation under grant number NSF-2023-001. Computational resources were made available through the university computing center.

References
[1] Smith, J., et al. (2020). Optimization techniques for large-scale data processing. Journal of Computational Methods, 15(3), 234-251.
[2] Johnson, A., & Williams, B. (2021). Parallel processing approaches in machine learning. ACM Transactions on Algorithms, 8(2), 45-62.`,
        revised: `Abstract
Advanced machine learning techniques have fundamentally revolutionized data processing methodologies across numerous application domains. This comprehensive research investigates the systematic application of innovative algorithms to significantly enhance computational efficiency in complex large-scale data analysis tasks. Our extensive study demonstrates remarkable improvements in processing speed, computational accuracy, and resource utilization through groundbreaking algorithmic approaches.

Introduction
The unprecedented exponential growth of data in contemporary applications absolutely necessitates highly sophisticated processing techniques and methodologies. Traditional computational methods consistently fail to scale effectively with rapidly increasing data volumes and complexity. Our extensive study directly addresses this critical challenge by developing and rigorously evaluating cutting-edge machine learning approaches that can efficiently handle extremely complex datasets with superior performance characteristics.

Literature Review
Previous research efforts in this rapidly evolving field have focused primarily on incremental improvements to existing conventional algorithms. Smith et al. (2020) demonstrated relatively modest gains through systematic parameter optimization techniques. Johnson and Williams (2021) explored various parallel processing approaches with somewhat limited success and scalability. Our innovative work builds substantially upon these important foundations while introducing fundamentally revolutionary concepts and methodologies.

Methodology
We employed a thoroughly comprehensive experimental design involving extensive multiple datasets and sophisticated algorithmic variations. Rigorous statistical analysis was meticulously conducted using well-established protocols and best practices. Key performance metrics included processing time, computational accuracy, and comprehensive resource utilization analysis. The experimental setup involved carefully controlled conditions to ensure completely reproducible and reliable results.

Data Collection
Our comprehensive dataset comprised extensive information from numerous diverse sources including prestigious academic databases, industry repositories, and sophisticated synthetic data generators. Stringent quality control measures were systematically implemented to ensure absolute data integrity and reliability. Preprocessing steps included comprehensive normalization, advanced feature selection, and sophisticated outlier detection methodologies.

Algorithm Development
The innovative core algorithm incorporates revolutionary optimization techniques based on advanced gradient descent variations and novel mathematical formulations. Implementation details include sophisticated memory management strategies and advanced parallel processing capabilities. Extensive comprehensive testing was systematically conducted to validate algorithmic correctness and superior performance characteristics.

Results
Our extensive findings demonstrate truly substantial improvements across all carefully measured parameters and metrics. Processing efficiency increased by an impressive average of 65% compared to established baseline methods. Accuracy improvements ranged significantly from 18% to 35% depending on the specific application domain and use case. Memory utilization was dramatically reduced by approximately 35% through highly optimized data structures and algorithms.

Statistical Analysis
Comprehensive rigorous statistical testing definitively confirmed the statistical significance of our remarkable results. P-values consistently fell well below 0.001 for all major performance metrics and indicators. Confidence intervals were meticulously calculated using advanced bootstrap methods and techniques. Effect sizes were consistently substantial and meaningful across all experimental conditions and scenarios.

Discussion
The comprehensive results clearly indicate that our innovative proposed approach offers remarkable and significant advantages over existing conventional methods and techniques. The improvements are particularly pronounced and substantial in complex scenarios involving intricate data structures and high-dimensional feature spaces. Acknowledged limitations include minimal computational overhead during initial setup phases, which is negligible compared to overall performance gains.

Implications
These groundbreaking findings have profound and important implications for practitioners and researchers in the field. The dramatically improved efficiency enables processing of substantially larger datasets within existing computational constraints and infrastructure. The significantly enhanced accuracy provides much more reliable and trustworthy results for critical applications and decision-making processes.

Future Work
Several promising and exciting avenues for future research emerge directly from this comprehensive study. Extension to real-time processing scenarios represents a particularly promising and valuable direction. Integration with emerging cutting-edge hardware architectures could potentially yield additional substantial performance gains and capabilities.

Conclusion
This groundbreaking research makes substantial and meaningful contributions to the advancement of machine learning applications in sophisticated data processing. The demonstrated remarkable improvements in efficiency, accuracy, and resource utilization provide significant practical benefits for real-world applications and implementations. Future research efforts will systematically explore additional optimization strategies and investigate broader application domains and use cases.

Acknowledgments
We sincerely thank our esteemed colleagues and collaborators for their valuable feedback, insights, and constructive suggestions. Funding was generously provided by the National Science Foundation under grant number NSF-2023-001. Essential computational resources were made available through the university computing center and high-performance computing facilities.

References
[1] Smith, J., et al. (2020). Advanced optimization techniques for large-scale data processing applications. Journal of Computational Methods, 15(3), 234-251.
[2] Johnson, A., & Williams, B. (2021). Parallel processing approaches in modern machine learning systems. ACM Transactions on Algorithms, 8(2), 45-62.`,
      },
    };

    return baseText[size];
  };

  describe('Performance Comparison Tests', () => {
    test('should benchmark small text processing', async () => {
      const { original, revised } = generateTestText('small');

      const wordResults = await runBenchmark(original, revised, 'word', 'small');
      const sentenceResults = await runBenchmark(original, revised, 'sentence', 'small');

      console.log('\n=== SMALL TEXT BENCHMARK RESULTS ===');
      console.log('Word-level:', wordResults);
      console.log('Sentence-level:', sentenceResults);

      expect(wordResults).toHaveLength(2);
      expect(sentenceResults).toHaveLength(2);

      wordResults.forEach((result) => {
        expect(result.computationTime).toBeLessThan(1000);
        expect(result.diffCount).toBeGreaterThan(0);
      });

      sentenceResults.forEach((result) => {
        expect(result.computationTime).toBeLessThan(1000);
        expect(result.diffCount).toBeGreaterThan(0);
      });
    });

    test('should benchmark medium text processing', async () => {
      const { original, revised } = generateTestText('medium');

      const wordResults = await runBenchmark(original, revised, 'word', 'medium');
      const sentenceResults = await runBenchmark(original, revised, 'sentence', 'medium');

      console.log('\n=== MEDIUM TEXT BENCHMARK RESULTS ===');
      console.log('Word-level:', wordResults);
      console.log('Sentence-level:', sentenceResults);

      expect(wordResults).toHaveLength(2);
      expect(sentenceResults).toHaveLength(2);

      wordResults.forEach((result) => {
        expect(result.computationTime).toBeLessThan(5000);
        expect(result.diffCount).toBeGreaterThan(0);
      });

      sentenceResults.forEach((result) => {
        expect(result.computationTime).toBeLessThan(5000);
        expect(result.diffCount).toBeGreaterThan(0);
      });
    });

    test('should benchmark large text processing', async () => {
      const { original, revised } = generateTestText('large');

      const wordResults = await runBenchmark(original, revised, 'word', 'large');
      const sentenceResults = await runBenchmark(original, revised, 'sentence', 'large');

      console.log('\n=== LARGE TEXT BENCHMARK RESULTS ===');
      console.log('Word-level:', wordResults);
      console.log('Sentence-level:', sentenceResults);

      expect(wordResults).toHaveLength(2);
      expect(sentenceResults).toHaveLength(2);

      wordResults.forEach((result) => {
        expect(result.computationTime).toBeLessThan(10000);
        expect(result.diffCount).toBeGreaterThan(0);
      });

      sentenceResults.forEach((result) => {
        expect(result.computationTime).toBeLessThan(10000);
        expect(result.diffCount).toBeGreaterThan(0);
      });
    });

    test('should generate comprehensive performance report', async () => {
      const allResults: BenchmarkResult[] = [];

      for (const size of ['small', 'medium', 'large'] as const) {
        const { original, revised } = generateTestText(size);

        const wordResults = await runBenchmark(original, revised, 'word', size);
        const sentenceResults = await runBenchmark(original, revised, 'sentence', size);

        allResults.push(...wordResults, ...sentenceResults);
      }

      console.log('\n=== COMPREHENSIVE PERFORMANCE REPORT ===');

      const lcsResults = allResults.filter((r) => r.engine === 'LCS');
      const dmpResults = allResults.filter((r) => r.engine === 'DiffMatchPatch');

      const avgLcsTime =
        lcsResults.reduce((sum, r) => sum + r.computationTime, 0) / lcsResults.length;
      const avgDmpTime =
        dmpResults.reduce((sum, r) => sum + r.computationTime, 0) / dmpResults.length;

      const avgLcsMemory =
        lcsResults.reduce((sum, r) => sum + r.memoryUsage, 0) / lcsResults.length;
      const avgDmpMemory =
        dmpResults.reduce((sum, r) => sum + r.memoryUsage, 0) / dmpResults.length;

      const avgLcsDiffs = lcsResults.reduce((sum, r) => sum + r.diffCount, 0) / lcsResults.length;
      const avgDmpDiffs = dmpResults.reduce((sum, r) => sum + r.diffCount, 0) / dmpResults.length;

      const avgAccuracy = dmpResults.reduce((sum, r) => sum + r.accuracy, 0) / dmpResults.length;

      console.log('\nLCS Engine Average Performance:');
      console.log(`  Computation Time: ${avgLcsTime.toFixed(2)}ms`);
      console.log(`  Memory Usage: ${(avgLcsMemory / 1024).toFixed(2)}KB`);
      console.log(`  Average Diffs: ${avgLcsDiffs.toFixed(1)}`);

      console.log('\nDiffMatchPatch Engine Average Performance:');
      console.log(`  Computation Time: ${avgDmpTime.toFixed(2)}ms`);
      console.log(`  Memory Usage: ${(avgDmpMemory / 1024).toFixed(2)}KB`);
      console.log(`  Average Diffs: ${avgDmpDiffs.toFixed(1)}`);
      console.log(`  Accuracy vs LCS: ${(avgAccuracy * 100).toFixed(1)}%`);

      const timeAdvantage = avgLcsTime > avgDmpTime ? 'DiffMatchPatch' : 'LCS';
      const memoryAdvantage = avgLcsMemory > avgDmpMemory ? 'DiffMatchPatch' : 'LCS';

      console.log('\n=== RECOMMENDATION ===');
      console.log(`Faster Engine: ${timeAdvantage}`);
      console.log(`Memory Efficient: ${memoryAdvantage}`);
      console.log(
        `Accuracy: ${avgAccuracy > 0.8 ? 'High correlation between engines' : 'Significant differences detected'}`
      );

      let recommendation = 'LCS'; // Default fallback
      if (avgDmpTime < avgLcsTime && avgAccuracy > 0.7) {
        recommendation = 'DiffMatchPatch';
      }

      console.log(`\nRECOMMENDED DEFAULT ENGINE: ${recommendation}`);
      console.log(
        `Reasoning: ${
          recommendation === 'DiffMatchPatch'
            ? 'DiffMatchPatch shows better performance with acceptable accuracy'
            : 'LCS provides reliable baseline performance'
        }`
      );

      expect(allResults.length).toBeGreaterThan(0);
      expect(avgLcsTime).toBeGreaterThan(0);
      expect(avgDmpTime).toBeGreaterThan(0);
      expect(avgAccuracy).toBeGreaterThan(0);
      expect(avgAccuracy).toBeLessThanOrEqual(1);
    });
  });

  describe('Engine Validation Tests', () => {
    test('should validate both engines produce valid output', async () => {
      const { original, revised } = generateTestText('small');

      const lcsWordDiffs = lcsEngine.generateWordDiffs(original, revised);
      const dmpWordDiffs = dmpEngine.generateWordDiffs(original, revised);

      const lcsSentenceDiffs = lcsEngine.generateSentenceDiffs(original, revised);
      const dmpSentenceDiffs = dmpEngine.generateSentenceDiffs(original, revised);

      [lcsWordDiffs, dmpWordDiffs, lcsSentenceDiffs, dmpSentenceDiffs].forEach((diffs) => {
        expect(Array.isArray(diffs)).toBe(true);
        diffs.forEach((diff) => {
          expect(diff).toHaveProperty('id');
          expect(diff).toHaveProperty('text');
          expect(diff).toHaveProperty('type');
          expect(diff).toHaveProperty('confidence');
          expect(['addition', 'deletion']).toContain(diff.type);
          expect(diff.confidence).toBeGreaterThan(0);
          expect(diff.confidence).toBeLessThanOrEqual(1);
        });
      });
    });

    test('should validate input validation consistency', () => {
      const testCases = [
        '',
        'Short text',
        'A'.repeat(1000000), // Very long text
        'Normal academic text with proper length and content for validation testing.',
      ];

      testCases.forEach((testText) => {
        const lcsValidation = lcsEngine.validateInput(testText);
        const dmpValidation = dmpEngine.validateInput(testText);

        expect(lcsValidation.isValid).toBe(dmpValidation.isValid);

        if (!lcsValidation.isValid) {
          expect(lcsValidation.errors.length).toBeGreaterThan(0);
          expect(dmpValidation.errors.length).toBeGreaterThan(0);
        }
      });
    });
  });
});
