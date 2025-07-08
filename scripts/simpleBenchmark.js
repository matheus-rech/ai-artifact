const { DiffEngine } = require('../src/services/diffEngine');
const { DiffMatchPatchEngine } = require('../src/services/diffMatchPatchEngine');

async function runSimpleBenchmark() {
  console.log('🚀 Running Simple Diff Engine Benchmark...\n');
  
  const originalText = `
Introduction

This study examines the effects of machine learning algorithms on data processing efficiency. 
Our research methodology involved collecting data from various sources and applying statistical analysis.
The results demonstrate significant improvements in processing speed and accuracy.
We conclude that machine learning approaches offer substantial benefits for data processing tasks.
  `;
  
  const revisedText = `
Introduction

This comprehensive study examines the effects of advanced machine learning algorithms on data processing efficiency. 
Our rigorous research methodology involved collecting extensive data from various validated sources and applying robust statistical analysis.
The experimental results demonstrate highly significant improvements in processing speed, accuracy, and reliability.
We conclude that modern machine learning approaches offer substantial and measurable benefits for complex data processing tasks.
  `;
  
  try {
    console.log('📊 Testing LCS Engine...');
    const lcsEngine = new DiffEngine();
    const lcsStart = Date.now();
    const lcsWordDiffs = lcsEngine.generateWordDiffs(originalText, revisedText);
    const lcsSentenceDiffs = lcsEngine.generateSentenceDiffs(originalText, revisedText);
    const lcsEnd = Date.now();
    const lcsTime = lcsEnd - lcsStart;
    
    console.log(`✅ LCS Results: ${lcsTime}ms, ${lcsWordDiffs.length + lcsSentenceDiffs.length} total diffs`);
    
    console.log('📊 Testing DiffMatchPatch Engine...');
    const dmpEngine = new DiffMatchPatchEngine();
    const dmpStart = Date.now();
    const dmpWordDiffs = dmpEngine.generateWordDiffs(originalText, revisedText);
    const dmpSentenceDiffs = dmpEngine.generateSentenceDiffs(originalText, revisedText);
    const dmpEnd = Date.now();
    const dmpTime = dmpEnd - dmpStart;
    
    console.log(`✅ DiffMatchPatch Results: ${dmpTime}ms, ${dmpWordDiffs.length + dmpSentenceDiffs.length} total diffs`);
    
    const recommendation = dmpTime < lcsTime ? 'DiffMatchPatch' : 'LCS';
    console.log(`\n🏆 Recommendation: ${recommendation}`);
    console.log(`Performance difference: ${Math.abs(lcsTime - dmpTime)}ms`);
    
    return recommendation;
    
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    console.log('🏆 Defaulting to DiffMatchPatch (Google library)');
    return 'DiffMatchPatch';
  }
}

if (require.main === module) {
  runSimpleBenchmark()
    .then(recommendation => {
      console.log('\n✨ Simple benchmark complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Benchmark failed:', error);
      process.exit(1);
    });
}

module.exports = { runSimpleBenchmark };
