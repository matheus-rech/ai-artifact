import { diff_match_patch } from 'diff-match-patch';
import type { DiffItem, ValidationResult } from '../types';
import { generateId } from '../utils';

export class DiffMatchPatchEngine {
  private dmp: InstanceType<typeof diff_match_patch>;
  private static readonly MAX_TEXT_LENGTH = 1000000;
  private static readonly MIN_DIFF_LENGTH = 3;

  constructor() {
    this.dmp = new diff_match_patch();
    this.dmp.Diff_Timeout = 1.0;
    this.dmp.Diff_EditCost = 4;
  }

  /**
   * Generate word-level diffs using Google's diff-match-patch
   */
  generateWordDiffs(original: string, revised: string): DiffItem[] {
    return this.generateDiffs(original, revised, 'word');
  }

  /**
   * Generate sentence-level diffs using Google's diff-match-patch
   */
  generateSentenceDiffs(original: string, revised: string): DiffItem[] {
    return this.generateDiffs(original, revised, 'sentence');
  }

  /**
   * Core diff generation logic
   */
  private generateDiffs(original: string, revised: string, type: 'word' | 'sentence'): DiffItem[] {
    let preparedOriginal: string;
    let preparedRevised: string;

    if (type === 'sentence') {
      // For sentence-level diffs, we need to handle sentence boundaries carefully
      const originalSentences = this.splitIntoSentences(original);
      const revisedSentences = this.splitIntoSentences(revised);
      
      preparedOriginal = originalSentences.join('\n');
      preparedRevised = revisedSentences.join('\n');
    } else {
      // For word-level diffs, use the text as-is
      preparedOriginal = original;
      preparedRevised = revised;
    }

    // Compute diffs
    const diffs = this.dmp.diff_main(preparedOriginal, preparedRevised);
    this.dmp.diff_cleanupSemantic(diffs);
    this.dmp.diff_cleanupEfficiency(diffs);

    // Convert to our format
    return this.convertToItems(diffs, type);
  }

  /**
   * Split text into sentences for sentence-level analysis
   */
  private splitIntoSentences(text: string): string[] {
    // Enhanced sentence splitting for academic text
    const sentences = text
      .split(/(?<=[.!?])\s+(?=[A-Z])|(?<=\w\.)\s+(?=[A-Z][a-z])|(?<=[0-9]\.)\s+(?=[A-Z])/g)
      .map(s => s.trim())
      .filter(s => s.length >= DiffMatchPatchEngine.MIN_DIFF_LENGTH);

    return sentences;
  }

  /**
   * Convert diff-match-patch output to our DiffItem format
   */
  private convertToItems(diffs: Array<[number, string]>, type: 'word' | 'sentence'): DiffItem[] {
    const items: DiffItem[] = [];
    let originalPos = 0;
    let revisedPos = 0;

    diffs.forEach(([operation, text]) => {
      if (text.trim().length < DiffMatchPatchEngine.MIN_DIFF_LENGTH) {
        // Skip very short diffs but still update positions
        if (operation !== diff_match_patch.DIFF_INSERT) {
          originalPos += text.length;
        }
        if (operation !== diff_match_patch.DIFF_DELETE) {
          revisedPos += text.length;
        }
        return;
      }

      let diffType: 'addition' | 'deletion' | 'modification';
      if (operation === diff_match_patch.DIFF_INSERT) {
        diffType = 'addition';
      } else if (operation === diff_match_patch.DIFF_DELETE) {
        diffType = 'deletion';
      } else {
        // For EQUAL operations, we might want to skip or handle differently
        if (operation !== diff_match_patch.DIFF_INSERT) {
          originalPos += text.length;
        }
        if (operation !== diff_match_patch.DIFF_DELETE) {
          revisedPos += text.length;
        }
        return;
      }

      // Handle sentence vs word level differences
      if (type === 'sentence' && text.includes('\n')) {
        // Split multi-line diffs into individual sentences
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        lines.forEach(line => {
          const item: DiffItem = {
            id: generateId('dmp-sent'),
            text: line.trim(),
            originalPos,
            revisedPos,
            type: diffType,
            confidence: this.calculateConfidence(line, type),
            context: this.getContext(line, type)
          };
          items.push(item);
        });
      } else {
        const item: DiffItem = {
          id: generateId('dmp'),
          text: text.trim(),
          originalPos,
          revisedPos,
          type: diffType,
          confidence: this.calculateConfidence(text, type),
          context: this.getContext(text, type)
        };
        items.push(item);
      }

      // Update positions
      if (operation !== diff_match_patch.DIFF_INSERT) {
        originalPos += text.length;
      }
      if (operation !== diff_match_patch.DIFF_DELETE) {
        revisedPos += text.length;
      }
    });

    return items;
  }

  /**
   * Calculate confidence score for a diff
   */
  private calculateConfidence(text: string, type: 'word' | 'sentence'): number {
    let confidence = 0.95; // Base high confidence for Google's algorithm

    // Adjust based on text length
    if (type === 'sentence' && text.length > 100) {
      confidence = Math.min(confidence + 0.03, 1.0);
    }

    // Academic keywords boost confidence
    const academicKeywords = ['hypothesis', 'methodology', 'analysis', 'conclusion', 'significant', 'data', 'results'];
    const keywordMatches = academicKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    ).length;

    confidence = Math.min(confidence + (keywordMatches * 0.01), 1.0);

    return confidence;
  }

  /**
   * Get context for a diff item
   */
  private getContext(text: string, _type: 'word' | 'sentence'): string {
    // For Google's diff-match-patch, context is simpler
    return text.substring(0, 50) + (text.length > 50 ? '...' : '');
  }

  /**
   * Validate input text
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
    const academicIndicators = ['abstract', 'introduction', 'methodology', 'results', 'discussion', 'conclusion'];
    const hasAcademicContent = academicIndicators.some(indicator => 
      text.toLowerCase().includes(indicator)
    );

    if (!hasAcademicContent) {
      warnings.push('Text may not be academic content. Analysis optimized for research papers.');
    }

    // Check for proper sentence structure
    const sentenceCount = (text.match(/[.!?]+/g) || []).length;
    const wordCount = text.split(/\s+/).length;
    
    if (wordCount > 100 && sentenceCount < 3) {
      warnings.push('Text appears to lack sentence structure');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}