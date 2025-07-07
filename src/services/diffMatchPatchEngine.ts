import DiffMatchPatch from 'diff-match-patch';
import type { DiffItem, ValidationResult } from '../types';

export class DiffMatchPatchEngine {
  private static readonly MAX_TEXT_LENGTH = 1000000;
  private static readonly MIN_DIFF_LENGTH = 3;
  private dmp: DiffMatchPatch;

  constructor() {
    this.dmp = new DiffMatchPatch();
    this.dmp.Diff_Timeout = 1.0;
    this.dmp.Diff_EditCost = 4;
  }

  private preprocessText(text: string): string {
    return text
      .trim()
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\.\!\?\,\;\:\-\(\)]/g, '')
      .toLowerCase();
  }

  private tokenizeSentences(text: string): string[] {
    const sentenceRegex =
      /(?<=[.!?])\s+(?=[A-Z])|(?<=\w\.)\s+(?=[A-Z][a-z])|(?<=[0-9]\.)\s+(?=[A-Z])/g;

    return text
      .split(sentenceRegex)
      .map((s) => s.trim())
      .filter((s) => s.length >= DiffMatchPatchEngine.MIN_DIFF_LENGTH)
      .filter((s) => !this.isBoilerplate(s));
  }

  private isBoilerplate(text: string): boolean {
    const boilerplatePatterns = [
      /^(figure|table|equation|reference)\s*\d+/i,
      /^(see|cf\.|e\.g\.|i\.e\.)/i,
      /^\d+$/,
      /^[a-z]$/i,
    ];
    return boilerplatePatterns.some((pattern) => pattern.test(text.trim()));
  }

  generateWordDiffs(original: string, revised: string): DiffItem[] {
    const preprocessedOrig = this.preprocessText(original);
    const preprocessedRev = this.preprocessText(revised);

    const origWords = preprocessedOrig.split(/(\s+)/);
    const revWords = preprocessedRev.split(/(\s+)/);

    return this.computeDiffMatchPatch(origWords, revWords, 'word');
  }

  generateSentenceDiffs(original: string, revised: string): DiffItem[] {
    const origSentences = this.tokenizeSentences(original);
    const revSentences = this.tokenizeSentences(revised);

    return this.computeDiffMatchPatch(origSentences, revSentences, 'sentence');
  }

  private computeDiffMatchPatch(
    arr1: string[],
    arr2: string[],
    type: 'word' | 'sentence'
  ): DiffItem[] {
    const text1 = arr1.join('');
    const text2 = arr2.join('');

    const diffs = this.dmp.diff_main(text1, text2);
    this.dmp.diff_cleanupSemantic(diffs);

    const diffItems: DiffItem[] = [];
    let diffId = 0;
    let originalPos = 0;
    let revisedPos = 0;

    for (const [operation, text] of diffs) {
      if (text.trim().length < DiffMatchPatchEngine.MIN_DIFF_LENGTH) {
        if (operation === 0) {
          originalPos += text.length;
          revisedPos += text.length;
        } else if (operation === -1) {
          originalPos += text.length;
        } else if (operation === 1) {
          revisedPos += text.length;
        }
        continue;
      }

      if (operation === -1) {
        diffItems.push({
          id: `${type}-del-${diffId++}`,
          text: text.trim(),
          originalPos,
          revisedPos,
          type: 'deletion',
          confidence: this.calculateConfidence(text, type),
          context: this.getContext(text, arr1),
        });
        originalPos += text.length;
      } else if (operation === 1) {
        diffItems.push({
          id: `${type}-add-${diffId++}`,
          text: text.trim(),
          originalPos,
          revisedPos,
          type: 'addition',
          confidence: this.calculateConfidence(text, type),
          context: this.getContext(text, arr2),
        });
        revisedPos += text.length;
      } else if (operation === 0) {
        originalPos += text.length;
        revisedPos += text.length;
      }
    }

    return diffItems;
  }

  private calculateConfidence(text: string, type: 'word' | 'sentence'): number {
    let confidence = 0.5;

    if (type === 'sentence' && text.length > 50) confidence += 0.2;
    if (type === 'word' && text.length > 10) confidence += 0.1;

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

  private getContext(text: string, arr: string[]): string {
    const contextSize = 2;
    const index = arr.findIndex((item) => item.includes(text));
    if (index === -1) return text;

    const start = Math.max(0, index - contextSize);
    const end = Math.min(arr.length, index + contextSize + 1);
    return arr.slice(start, end).join(' ').trim();
  }

  validateInput(text: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!text || text.trim().length === 0) {
      errors.push('Text cannot be empty');
    }

    if (text.length > DiffMatchPatchEngine.MAX_TEXT_LENGTH) {
      errors.push(
        `Text too long (${text.length} chars). Maximum: ${DiffMatchPatchEngine.MAX_TEXT_LENGTH}`
      );
    }

    if (text.length < 50) {
      warnings.push('Text is very short. Analysis may be limited.');
    }

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
