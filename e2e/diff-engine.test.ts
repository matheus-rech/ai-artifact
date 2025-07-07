import { test, expect } from '@playwright/test';
import { DiffEngine } from '../src/services/diffEngine';

test.describe('DiffEngine', () => {
  let diffEngine: DiffEngine;

  test.beforeEach(() => {
    diffEngine = new DiffEngine();
  });

  test('should generate word-level diffs correctly', async () => {
    const original = 'The quick brown fox jumps over the lazy dog.';
    const revised = 'The quick red fox jumps over the sleeping dog.';
    
    const diffs = diffEngine.generateWordDiffs(original, revised);
    
    expect(diffs).toBeDefined();
    expect(diffs.length).toBeGreaterThan(0);
    
    // Check for expected changes
    const changes = diffs.filter(d => d.type !== 'equal');
    expect(changes.length).toBeGreaterThan(0);
  });

  test('should generate sentence-level diffs correctly', async () => {
    const original = 'This is the first sentence. This is the second sentence.';
    const revised = 'This is the first sentence. This is a modified second sentence.';
    
    const diffs = diffEngine.generateSentenceDiffs(original, revised);
    
    expect(diffs).toBeDefined();
    expect(diffs.length).toBeGreaterThan(0);
  });

  test('should handle complex diff scenarios', async () => {
    const testCases = [
      {
        name: 'simple addition',
        original: 'Hello world',
        revised: 'Hello beautiful world',
        expectedDiffs: 3
      },
      {
        name: 'simple deletion', 
        original: 'Hello beautiful world',
        revised: 'Hello world',
        expectedDiffs: 3
      },
      {
        name: 'modification',
        original: 'Hello world',
        revised: 'Hi world',
        expectedDiffs: 3
      }
    ];

    for (const { original, revised } of testCases) { {
      const diffs = diffEngine.generateWordDiffs(original, revised);
      expect(diffs).toBeDefined();
      
      const diffCount = diffs.filter(d => d.type !== 'equal').length;
      expect(diffCount).toBeGreaterThan(0);
    }
  });

  test('should validate input correctly', async () => {
    const validationResult = diffEngine.validateInput('Valid text');
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.errors).toHaveLength(0);
  });

  test('should handle empty strings', async () => {
    const diffs = diffEngine.generateWordDiffs('', '');
    expect(diffs).toBeDefined();
    expect(diffs).toHaveLength(0);
  });

  test('should handle identical texts', async () => {
    const text = 'Same text for both versions';
    const diffs = diffEngine.generateWordDiffs(text, text);
    expect(diffs).toBeDefined();
    
    const onlyEqualDiffs = diffs.every(d => d.type === 'equal');
    expect(onlyEqualDiffs).toBe(true);
  });
});