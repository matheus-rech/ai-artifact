import { runBenchmarkSuite, BenchmarkResult } from '../src/utils/diffBenchmark';

const sampleTexts = {
  short: {
    original: `
Introduction

This study examines the effects of machine learning algorithms on data processing efficiency. 
Our research methodology involved collecting data from various sources and applying statistical analysis.
The results demonstrate significant improvements in processing speed and accuracy.
We conclude that machine learning approaches offer substantial benefits for data processing tasks.
    `,
    revised: `
Introduction

This comprehensive study examines the effects of advanced machine learning algorithms on data processing efficiency. 
Our rigorous research methodology involved collecting extensive data from various validated sources and applying robust statistical analysis.
The experimental results demonstrate highly significant improvements in processing speed, accuracy, and reliability.
We conclude that modern machine learning approaches offer substantial and measurable benefits for complex data processing tasks.
    `
  },
  medium: {
    original: `
Abstract

Machine learning has revolutionized data processing across multiple domains. This research investigates the comparative effectiveness of different algorithmic approaches in processing large datasets. We conducted experiments using three distinct machine learning models: neural networks, decision trees, and support vector machines. Our methodology included data collection from five different sources, preprocessing steps, and comprehensive statistical analysis. The results indicate that neural networks outperformed other approaches by 23% in accuracy and 15% in processing speed. These findings suggest that neural network implementations should be prioritized for large-scale data processing applications.

Introduction

The rapid growth of data generation in modern applications has created unprecedented challenges for data processing systems. Traditional approaches often fail to handle the volume, velocity, and variety of contemporary datasets. Machine learning algorithms have emerged as promising solutions to these challenges, offering adaptive and scalable processing capabilities.

Methods

Our experimental design involved three phases: data collection, model training, and performance evaluation. We collected datasets from academic repositories, commercial databases, and synthetic data generators. Each dataset was preprocessed using standardized normalization techniques. Model training utilized cross-validation with 80% training and 20% testing splits.
    `,
    revised: `
Abstract

Advanced machine learning techniques have fundamentally transformed data processing methodologies across multiple domains. This comprehensive research investigates the comparative effectiveness of different state-of-the-art algorithmic approaches in processing large-scale datasets. We conducted extensive experiments using three distinct machine learning models: deep neural networks, ensemble decision trees, and optimized support vector machines. Our rigorous methodology included data collection from five different validated sources, advanced preprocessing steps, and comprehensive statistical analysis with confidence intervals. The experimental results indicate that deep neural networks significantly outperformed other approaches by 28% in accuracy and 18% in processing speed. These compelling findings strongly suggest that neural network implementations should be prioritized for large-scale data processing applications in production environments.

Introduction

The exponential growth of data generation in modern applications has created unprecedented and complex challenges for data processing systems. Traditional computational approaches often fail to adequately handle the volume, velocity, variety, and veracity of contemporary datasets. Advanced machine learning algorithms have emerged as highly promising solutions to these multifaceted challenges, offering adaptive, scalable, and robust processing capabilities.

Methodology

Our comprehensive experimental design involved three distinct phases: systematic data collection, rigorous model training, and thorough performance evaluation. We systematically collected datasets from reputable academic repositories, validated commercial databases, and carefully designed synthetic data generators. Each dataset underwent preprocessing using standardized normalization and feature engineering techniques. Model training utilized stratified cross-validation with optimized 80% training and 20% testing splits.
    `
  }
};

interface BenchmarkResultWithSize {
  size: string;
  lcsResult: BenchmarkResult;
  diffMatchPatchResult: BenchmarkResult;
  recommendation: 'LCS' | 'DiffMatchPatch';
  performanceDifference: number;
}

async function runBenchmarks() {
  console.log('🚀 Starting Diff Engine Benchmarks...\n');
  
  const results: BenchmarkResultWithSize[] = [];
  
  for (const [size, texts] of Object.entries(sampleTexts)) {
    console.log(`📊 Benchmarking ${size} text (${texts.original.length} chars)...`);
    
    try {
      const result = await runBenchmarkSuite(texts.original, texts.revised, 3);
      results.push({ size, ...result });
      
      console.log(`✅ ${size} text results:`);
      console.log(`   LCS Engine: ${result.lcsResult.computationTime.toFixed(2)}ms, ${result.lcsResult.diffCount} diffs, ${(result.lcsResult.accuracy * 100).toFixed(1)}% accuracy`);
      console.log(`   DiffMatchPatch: ${result.diffMatchPatchResult.computationTime.toFixed(2)}ms, ${result.diffMatchPatchResult.diffCount} diffs, ${(result.diffMatchPatchResult.accuracy * 100).toFixed(1)}% accuracy`);
      console.log(`   Recommendation: ${result.recommendation}`);
      console.log(`   Performance difference: ${result.performanceDifference.toFixed(2)}ms\n`);
      
    } catch (error) {
      console.error(`❌ Error benchmarking ${size} text:`, error);
    }
  }
  
  const recommendations = results.map(r => r.recommendation);
  const diffMatchPatchCount = recommendations.filter(r => r === 'DiffMatchPatch').length;
  const lcsCount = recommendations.filter(r => r === 'LCS').length;
  
  const overallRecommendation = diffMatchPatchCount > lcsCount ? 'DiffMatchPatch' : 'LCS';
  
  console.log('🏆 FINAL BENCHMARK RESULTS:');
  console.log(`   Overall Recommendation: ${overallRecommendation}`);
  console.log(`   DiffMatchPatch wins: ${diffMatchPatchCount}/${results.length}`);
  console.log(`   LCS wins: ${lcsCount}/${results.length}`);
  
  const avgLcsTime = results.reduce((sum, r) => sum + r.lcsResult.computationTime, 0) / results.length;
  const avgDmpTime = results.reduce((sum, r) => sum + r.diffMatchPatchResult.computationTime, 0) / results.length;
  const avgLcsAccuracy = results.reduce((sum, r) => sum + r.lcsResult.accuracy, 0) / results.length;
  const avgDmpAccuracy = results.reduce((sum, r) => sum + r.diffMatchPatchResult.accuracy, 0) / results.length;
  
  console.log('\n📈 AVERAGE METRICS:');
  console.log(`   LCS: ${avgLcsTime.toFixed(2)}ms avg, ${(avgLcsAccuracy * 100).toFixed(1)}% avg accuracy`);
  console.log(`   DiffMatchPatch: ${avgDmpTime.toFixed(2)}ms avg, ${(avgDmpAccuracy * 100).toFixed(1)}% avg accuracy`);
  
  return {
    overallRecommendation,
    results,
    averages: {
      lcs: { time: avgLcsTime, accuracy: avgLcsAccuracy },
      diffMatchPatch: { time: avgDmpTime, accuracy: avgDmpAccuracy }
    }
  };
}

if (require.main === module) {
  runBenchmarks()
    .then(() => {
      console.log('\n✨ Benchmarking complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Benchmarking failed:', error);
      process.exit(1);
    });
}

export { runBenchmarks };
