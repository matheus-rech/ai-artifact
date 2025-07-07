import DiffMatchPatch from 'diff-match-patch';
import type { DiffItem, ValidationResult } from '../types';

/**
 * Google's diff-match-patch engine implementation for academic manuscript analysis
 * Uses the diff-match-patch library for text comparison
 */
export class DiffMatchPatchEngine {
  private static readonly MAX_TEXT_LENGTH = 1000000; // 1MB limit
  private static readonly MIN_DIFF_LENGTH = 3; // Minimum meaningful diff length
  private dmp: DiffMatchPatch;

  constructor() {
    this.dmp = new DiffMatchPatch();
  }

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
      .filter((s) => s.length >= DiffMatchPatchEngine.MIN_DIFF_LENGTH)
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
   * Generate word-level diffs with context using diff-match-patch
   */
  generateWordDiffs(original: string, revised: string): DiffItem[] {
    const preprocessedOrig = this.preprocessText(original);
    const preprocessedRev = this.preprocessText(revised);

    const origWords = preprocessedOrig.split(/(\s+)/);
    const revWords = preprocessedRev.split(/(\s+)/);

    const origText = origWords.join('');
    const revText = revWords.join('');

    const diffs = this.dmp.diff_main(origText, revText);
    this.dmp.diff_cleanupSemantic(diffs);

    return this.convertDiffsToItems(diffs, 'word');
  }

  /**
   * Generate sentence-level diffs with context using diff-match-patch
   */
  generateSentenceDiffs(original: string, revised: string): DiffItem[] {
    const origSentences = this.tokenizeSentences(original);
    const revSentences = this.tokenizeSentences(revised);

    const origText = origSentences.join('\n');
    const revText = revSentences.join('\n');

    const diffs = this.dmp.diff_main(origText, revText);
    this.dmp.diff_cleanupSemantic(diffs);

    return this.convertDiffsToItems(diffs, 'sentence');
  }

  /**
   * Convert diff-match-patch diffs to DiffItem format
   */
  private convertDiffsToItems(diffs: Array<[number, string]>, type: 'word' | 'sentence'): DiffItem[] {
    const diffItems: DiffItem[] = [];
    let diffId = 0;
    let originalPos = 0;
    let revisedPos = 0;

    for (const [operation, text] of diffs) {
      if (text.trim().length < DiffMatchPatchEngine.MIN_DIFF_LENGTH) {
        if (operation === -1) originalPos += text.length;
        if (operation === 1) revisedPos += text.length;
        if (operation === 0) {
          originalPos += text.length;
          revisedPos += text.length;
        }
        continue;
      }

      if (operation === -1) {
        // Deletion
        diffItems.push({
          id: `${type}-del-${diffId++}`,
          text: text.trim(),
          originalPos,
          revisedPos,
          type: 'deletion',
          confidence: this.calculateConfidence(text, type),
          context: this.getContext(text, type),
        });
        originalPos += text.length;
      } else if (operation === 1) {
        // Addition
        diffItems.push({
          id: `${type}-add-${diffId++}`,
          text: text.trim(),
          originalPos,
          revisedPos,
          type: 'addition',
          confidence: this.calculateConfidence(text, type),
          context: this.getContext(text, type),
        });
        revisedPos += text.length;
      } else {
        originalPos += text.length;
        revisedPos += text.length;
      }
    }

    return diffItems;
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
  private getContext(text: string, _type: 'word' | 'sentence'): string {
    return text.trim();
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

    if (text.length > DiffMatchPatchEngine.MAX_TEXT_LENGTH) {
      errors.push(`Text too long (${text.length} chars). Maximum: ${DiffMatchPatchEngine.MAX_TEXT_LENGTH}`);
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
