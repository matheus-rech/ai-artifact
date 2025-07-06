import type { DiffItem, ValidationResult } from '@/types';

/**
 * Production-ready diff engine optimized for academic manuscript analysis
 * Uses Longest Common Subsequence (LCS) algorithm for accurate text comparison
 */
export class DiffEngine {
  private static readonly MAX_TEXT_LENGTH = 1000000; // 1MB limit
  private static readonly MIN_DIFF_LENGTH = 3; // Minimum meaningful diff length

  /**
   * Enhanced text preprocessing for academic content
   */
  private preprocessText(text: string): string {
    return text
      .trim()
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s\.\!\?\,\;\:\-\(\)]/g, '') // Remove special chars that might interfere
      .toLowerCase(); // Case-insensitive comparison
  }

  /**
   * Advanced sentence tokenization for academic papers
   */
  private tokenizeSentences(text: string): string[] {
    // Academic paper sentence boundaries (enhanced for scientific text)
    const sentenceRegex =
      /(?<=[.!?])\s+(?=[A-Z])|(?<=\w\.)\s+(?=[A-Z][a-z])|(?<=[0-9]\.)\s+(?=[A-Z])/g;

    return text
      .split(sentenceRegex)
      .map((s) => s.trim())
      .filter((s) => s.length >= DiffEngine.MIN_DIFF_LENGTH)
      .filter((s) => !this.isBoilerplate(s));
  }

  /**
   * Detect and filter boilerplate text
   */
  private isBoilerplate(text: string): boolean {
    const boilerplatePatterns = [
      /^(figure|table|equation|reference)\s*\d+/i,
      /^(see|cf\.|e\.g\.|i\.e\.)/i,
      /^\d+$/,
      /^[a-z]$/i,
    ];
    return boilerplatePatterns.some((pattern) => pattern.test(text.trim()));
  }

  /**
   * Generate word-level diffs with context
   */
  generateWordDiffs(original: string, revised: string): DiffItem[] {
    const preprocessedOrig = this.preprocessText(original);
    const preprocessedRev = this.preprocessText(revised);

    const origWords = preprocessedOrig.split(/(\s+)/);
    const revWords = preprocessedRev.split(/(\s+)/);

    return this.computeLCS(origWords, revWords, 'word');
  }

  /**
   * Generate sentence-level diffs with context
   */
  generateSentenceDiffs(original: string, revised: string): DiffItem[] {
    const origSentences = this.tokenizeSentences(original);
    const revSentences = this.tokenizeSentences(revised);

    return this.computeLCS(origSentences, revSentences, 'sentence');
  }

  /**
   * Production LCS (Longest Common Subsequence) implementation
   */
  private computeLCS(arr1: string[], arr2: string[], type: 'word' | 'sentence'): DiffItem[] {
    const m = arr1.length;
    const n = arr2.length;

    // Dynamic programming table
    const dp: number[][] = [];
    for (let i = 0; i <= m; i++) {
      dp[i] = new Array(n + 1).fill(0) as number[];
    }

    // Build LCS table
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (this.isSimilar(arr1[i - 1]!, arr2[j - 1]!)) {
          dp[i]![j] = dp[i - 1]![j - 1]! + 1;
        } else {
          dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
        }
      }
    }

    // Backtrack to find differences
    const diffs: DiffItem[] = [];
    let i = m,
      j = n,
      diffId = 0;
    let originalPos = 0,
      revisedPos = 0;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && this.isSimilar(arr1[i - 1]!, arr2[j - 1]!)) {
        // Equal - no diff needed unless we want to track context
        originalPos += arr1[i - 1]!.length;
        revisedPos += arr2[j - 1]!.length;
        i--;
        j--;
      } else if (i > 0 && (j === 0 || dp[i - 1]![j]! >= dp[i]![j - 1]!)) {
        // Deletion
        const text = arr1[i - 1]!;
        if (text.trim().length >= DiffEngine.MIN_DIFF_LENGTH) {
          diffs.unshift({
            id: `${type}-del-${diffId++}`,
            text: text.trim(),
            originalPos,
            revisedPos,
            type: 'deletion',
            confidence: this.calculateConfidence(text, type),
            context: this.getContext(arr1, i - 1, 2),
          });
        }
        originalPos += text.length;
        i--;
      } else {
        // Addition
        const text = arr2[j - 1]!;
        if (text.trim().length >= DiffEngine.MIN_DIFF_LENGTH) {
          diffs.unshift({
            id: `${type}-add-${diffId++}`,
            text: text.trim(),
            originalPos,
            revisedPos,
            type: 'addition',
            confidence: this.calculateConfidence(text, type),
            context: this.getContext(arr2, j - 1, 2),
          });
        }
        revisedPos += text.length;
        j--;
      }
    }

    return diffs;
  }

  /**
   * Semantic similarity check for academic text
   */
  private isSimilar(str1: string, str2: string): boolean {
    if (str1 === str2) return true;

    // Handle whitespace-only differences
    if (str1.trim() === str2.trim()) return true;

    // Semantic similarity for academic text
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);

    if (words1.length !== words2.length) return false;

    // Allow for minor variations (typos, punctuation)
    const similarity =
      words1.reduce((acc, word, idx) => {
        const otherWord = words2[idx]!;
        if (word === otherWord) return acc + 1;
        if (this.isTypo(word, otherWord)) return acc + 0.8;
        return acc;
      }, 0) / words1.length;

    return similarity > 0.85; // 85% similarity threshold
  }

  /**
   * Simple typo detection using Levenshtein distance
   */
  private isTypo(word1: string, word2: string): boolean {
    if (Math.abs(word1.length - word2.length) > 2) return false;

    // Levenshtein distance for small words
    if (word1.length <= 6 && word2.length <= 6) {
      return this.levenshteinDistance(word1, word2) <= 1;
    }

    return false;
  }

  /**
   * Levenshtein distance implementation
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: (number | null)[][] = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = new Array(str1.length + 1).fill(null) as (number | null)[];
    }

    for (let i = 0; i <= str1.length; i++) (matrix[0] as number[])[i] = i;
    for (let j = 0; j <= str2.length; j++) (matrix[j] as number[])[0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        (matrix[j] as number[])[i] = Math.min(
          ((matrix[j] as number[])[i - 1] as number) + 1, // deletion
          ((matrix[j - 1] as number[])[i] as number) + 1, // insertion
          ((matrix[j - 1] as number[])[i - 1] as number) + indicator // substitution
        );
      }
    }

    return (matrix[str2.length] as number[])[str1.length] as number;
  }

  /**
   * Calculate confidence score for diffs
   */
  private calculateConfidence(text: string, type: 'word' | 'sentence'): number {
    let confidence = 0.5; // Base confidence

    // Length factor
    if (type === 'sentence' && text.length > 50) confidence += 0.2;
    if (type === 'word' && text.length > 10) confidence += 0.1;

    // Academic keywords boost confidence
    const academicKeywords = [
      'hypothesis',
      'methodology',
      'analysis',
      'conclusion',
      'significant',
      'data',
      'results',
      'discussion',
      'literature',
      'research',
    ];

    const lowerText = text.toLowerCase();
    const keywordMatches = academicKeywords.filter((keyword) => lowerText.includes(keyword)).length;
    confidence += Math.min(keywordMatches * 0.1, 0.3);

    return Math.min(confidence, 1.0);
  }

  /**
   * Get surrounding context for a diff
   */
  private getContext(arr: string[], index: number, contextSize: number): string {
    const start = Math.max(0, index - contextSize);
    const end = Math.min(arr.length, index + contextSize + 1);
    return arr.slice(start, end).join(' ').trim();
  }

  /**
   * Validate input text before processing
   */
  validateInput(text: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!text || text.trim().length === 0) {
      errors.push('Text cannot be empty');
    }

    if (text.length > DiffEngine.MAX_TEXT_LENGTH) {
      errors.push(`Text too long (${text.length} chars). Maximum: ${DiffEngine.MAX_TEXT_LENGTH}`);
    }

    if (text.length < 50) {
      warnings.push('Text is very short. Analysis may be limited.');
    }

    // Check for academic content indicators
    const academicIndicators = [
      'abstract',
      'introduction',
      'methodology',
      'results',
      'discussion',
      'conclusion',
      'references',
      'figure',
      'table',
      'hypothesis',
      'data',
    ];

    const hasAcademicContent = academicIndicators.some((indicator) =>
      text.toLowerCase().includes(indicator)
    );

    if (!hasAcademicContent) {
      warnings.push('Text may not be academic content. Analysis optimized for research papers.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
