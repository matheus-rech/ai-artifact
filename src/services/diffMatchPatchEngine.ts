import { diff_match_patch } from 'diff-match-patch';
import type { DiffItem } from '../types';
import { generateId } from '../utils';

export class DiffMatchPatchEngine {
  private dmp: InstanceType<typeof diff_match_patch>;
  private readonly SEP = '\u0001';

  constructor() {
    this.dmp = new diff_match_patch();
  }

  private toSentences(text: string): string[] {
    return text
.split(/(?<=[.!?])\s+(?=[A-Z])|(?<=\w\.)\s+(?=[A-Z][a-z])|(?<=[0-9]\.)\s+(?=[A-Z])/g)
      .map(s => s.trim())
      .filter(Boolean);
  }

  generateWordDiffs(original: string, revised: string): DiffItem[] {
    const raw = this.dmp.diff_main(original, revised);
    this.dmp.diff_cleanupSemantic(raw);
    return this.mapToItems(raw, 'word');
  }

  generateSentenceDiffs(original: string, revised: string): DiffItem[] {
    const origSentences = this.toSentences(original).join(this.SEP);
    const revSentences = this.toSentences(revised).join(this.SEP);
    const raw = this.dmp.diff_main(origSentences, revSentences);
    this.dmp.diff_cleanupSemantic(raw);
    return this.mapToItems(raw, 'sentence');
  }

  private mapToItems(diffs: Array<[number, string]>, type: 'word' | 'sentence'): DiffItem[] {
    const items: DiffItem[] = [];
    let originalPos = 0;
    let revisedPos = 0;

    for (const [operation, text] of diffs) {
      if (text.length === 0) continue;

      const content = type === 'sentence' ? text.split(this.SEP).filter(Boolean) : [text];
      
      for (const segment of content) {
        if (segment.trim().length === 0) continue;

        let diffType: DiffItem['type'];
        switch (operation) {
          case diff_match_patch.DIFF_DELETE:
            diffType = 'deletion';
            break;
          case diff_match_patch.DIFF_INSERT:
            diffType = 'addition';
            break;
          case diff_match_patch.DIFF_EQUAL:
            diffType = 'equal';
            break;
          default:
            diffType = 'modification';
        }

        const item: DiffItem = {
          id: generateId('dmp'),
          text: segment.trim(),
          originalPos: originalPos,
          revisedPos: revisedPos,
          type: diffType,
          confidence: 0.95,
          context: this.getContext(segment, type)
        };

        items.push(item);

        if (operation !== diff_match_patch.DIFF_INSERT) {
          originalPos += segment.length;
        }
        if (operation !== diff_match_patch.DIFF_DELETE) {
          revisedPos += segment.length;
        }
      }
    }

    return items;
  }

  private getContext(text: string, type: 'word' | 'sentence'): string {
    if (type === 'sentence') {
      return 'sentence-level';
    }
    return text.length > 50 ? 'long-text' : 'short-text';
  }
}
