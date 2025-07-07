import { diff_match_patch } from 'diff-match-patch';
import type { DiffItem, ValidationResult } from '../types';

export class DiffMatchPatchEngine {
  private dmp: diff_match_patch;
  private static readonly MAX_TEXT_LENGTH = 1000000;
  private static readonly MIN_DIFF_LENGTH = 3;

  constructor() {
    this.dmp = new diff_match_patch();
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
    const sentenceRegex = /(?<=[.!?])\s+(?=[A-Z])|(?<=\w\.)\s+(?=[A-Z][a-z])|(?<=[0-9]\.)\s+(?=[A-Z])/g;
    
    return text
      .split(sentenceRegex)
      .map(s => s.trim())
      .filter(s => s.length >= DiffMatchPatchEngine.MIN_DIFF_LENGTH)
      .filter(s => !this.isBoilerplate(s));
  }

  private tokenizeWords(text: string): string[] {
    return text
      .split(/\s+/)
      .map(w => w.trim())
      .filter(w => w.length >= DiffMatchPatchEngine.MIN_DIFF_LENGTH)
      .filter(w => !this.isBoilerplate(w));
  }

  private isBoilerplate(text: string): boolean {
    const boilerplatePatterns = [
      /^(the|and|or|but|in|on|at|to|for|of|with|by)$/i,
      /^(figure|table|section|chapter|page|ref|cite)$/i,
      /^\d+$/,
      /^[a-z]$/i
    ];
    
    return boilerplatePatterns.some(pattern => pattern.test(text.trim()));
  }

  private calculateConfidence(text: string, type: 'word' | 'sentence'): number {
    const baseConfidence = type === 'sentence' ? 0.8 : 0.6;
    const lengthBonus = Math.min(text.length / 50, 0.2);
    return Math.min(baseConfidence + lengthBonus, 1.0);
  }


  private convertDmpDiffsToItems(dmpDiffs: [number, string][], type: 'word' | 'sentence'): DiffItem[] {
    const items: DiffItem[] = [];
    let diffId = 0;
    let originalPos = 0;
    let revisedPos = 0;

    for (const [operation, text] of dmpDiffs) {
      if (text.trim().length < DiffMatchPatchEngine.MIN_DIFF_LENGTH) {
        continue;
      }

      const confidence = this.calculateConfidence(text, type);
      
      switch (operation) {
        case this.dmp.DIFF_DELETE:
          items.push({
            id: `${type}-del-${diffId++}`,
            text: text.trim(),
            originalPos,
            revisedPos,
            type: 'deletion',
            confidence,
            context: ''
          });
          originalPos += text.length;
          break;
          
        case this.dmp.DIFF_INSERT:
          items.push({
            id: `${type}-add-${diffId++}`,
            text: text.trim(),
            originalPos,
            revisedPos,
            type: 'addition',
            confidence,
            context: ''
          });
          revisedPos += text.length;
          break;
          
        case this.dmp.DIFF_EQUAL:
          originalPos += text.length;
          revisedPos += text.length;
          break;
      }
    }

    return items;
  }

  generateWordDiffs(original: string, revised: string): DiffItem[] {
    try {
      const processedOriginal = this.preprocessText(original);
      const processedRevised = this.preprocessText(revised);
      
      const originalWords = this.tokenizeWords(processedOriginal);
      const revisedWords = this.tokenizeWords(processedRevised);
      
      const originalText = originalWords.join(' ');
      const revisedText = revisedWords.join(' ');
      
      const diffs = this.dmp.diff_main(originalText, revisedText);
      this.dmp.diff_cleanupSemantic(diffs);
      
      return this.convertDmpDiffsToItems(diffs, 'word');
    } catch (error) {
      console.error('Error generating word diffs:', error);
      return [];
    }
  }

  generateSentenceDiffs(original: string, revised: string): DiffItem[] {
    try {
      const processedOriginal = this.preprocessText(original);
      const processedRevised = this.preprocessText(revised);
      
      const originalSentences = this.tokenizeSentences(processedOriginal);
      const revisedSentences = this.tokenizeSentences(processedRevised);
      
      const originalText = originalSentences.join('\n');
      const revisedText = revisedSentences.join('\n');
      
      const diffs = this.dmp.diff_main(originalText, revisedText);
      this.dmp.diff_cleanupSemantic(diffs);
      
      return this.convertDmpDiffsToItems(diffs, 'sentence');
    } catch (error) {
      console.error('Error generating sentence diffs:', error);
      return [];
    }
  }

  validateInput(text: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!text || text.trim().length === 0) {
      errors.push('Text cannot be empty');
      return { isValid: false, errors, warnings };
    }

    if (text.length > DiffMatchPatchEngine.MAX_TEXT_LENGTH) {
      errors.push(`Text too long (${text.length} chars). Maximum: ${DiffMatchPatchEngine.MAX_TEXT_LENGTH}`);
    }

    if (text.trim().length < 50) {
      warnings.push('Text is very short and may not produce meaningful analysis');
    }

    const wordCount = text.split(/\s+/).length;
    if (wordCount < 10) {
      warnings.push('Text has very few words and may not be suitable for analysis');
    }

    if (!/[.!?]/.test(text)) {
      warnings.push('Text appears to lack sentence structure');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
