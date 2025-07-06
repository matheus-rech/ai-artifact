import type { DiffItem, AnalysisItem, ManuscriptSection, Assessment, Priority } from '@/types';
import { generateId } from '@/utils';

/**
 * Fallback service for heuristic analysis when Claude API is unavailable
 */
export class FallbackService {
  /**
   * Heuristic diff segmentation analysis
   */
  analyzeDiffSegmentation(diffs: DiffItem[]): AnalysisItem[] {
    console.warn('Using fallback segmentation analysis');

    return diffs.map((d) => ({
      analysisId: generateId('fallback-seg'),
      diffId: d.id,
      section: this.inferSectionFromText(d.text, d.context),
      changeType: d.type,
      reviewerPoint: this.generateReviewerInsight(d.text, d.type),
      assessment: this.assessChangeQuality(d.text, d.type, d.confidence),
      comment: this.generateEditorialComment(d.text, d.type),
      relatedText: d.text.slice(0, 60),
      priority: this.assessPriority(d.text, d.type, d.confidence),
      confidence: d.confidence || 0.5,
      timestamp: new Date().toISOString(),
    }));
  }

  /**
   * Heuristic reviewer alignment analysis
   */
  analyzeReviewerAlignment(diffs: DiffItem[], requests: string): AnalysisItem[] {
    if (!requests) return [];

    console.warn('Using fallback reviewer alignment analysis');

    const requestsLower = requests.toLowerCase();
    const keywords = this.extractKeywords(requestsLower);

    return diffs
      .filter((d) => this.hasAlignment(d.text.toLowerCase(), keywords))
      .map((d) => ({
        analysisId: generateId('fallback-rev'),
        diffId: d.id,
        section: this.inferSectionFromText(d.text, d.context),
        changeType: d.type,
        reviewerPoint: `Potentially addresses: ${this.findBestKeywordMatch(d.text, keywords)}`,
        assessment: 'positive' as const,
        comment: `This change may respond to reviewer concerns about ${this.extractTopicFromText(d.text)}`,
        relatedText: d.text.slice(0, 60),
        priority: 'medium' as const,
        confidence: 0.6,
        timestamp: new Date().toISOString(),
      }));
  }

  /**
   * Enhanced section inference with confidence scoring
   */
  private inferSectionFromText(text: string, _context?: string): ManuscriptSection {
    const fullText = (text + ' ' + (_context || '')).toLowerCase();

    // Academic section indicators with confidence scoring
    const sectionIndicators = [
      {
        section: 'Abstract' as ManuscriptSection,
        patterns: ['abstract', 'summary', 'overview'],
        weight: 1.0,
      },
      {
        section: 'Introduction' as ManuscriptSection,
        patterns: ['introduction', 'background', 'motivation'],
        weight: 0.9,
      },
      {
        section: 'Literature Review' as ManuscriptSection,
        patterns: ['literature', 'related work', 'previous studies'],
        weight: 0.8,
      },
      {
        section: 'Methods' as ManuscriptSection,
        patterns: ['method', 'procedure', 'approach', 'design', 'protocol'],
        weight: 0.9,
      },
      {
        section: 'Results' as ManuscriptSection,
        patterns: ['result', 'finding', 'data', 'analysis', 'outcome'],
        weight: 0.9,
      },
      {
        section: 'Discussion' as ManuscriptSection,
        patterns: ['discussion', 'interpretation', 'implication'],
        weight: 0.8,
      },
      {
        section: 'Conclusion' as ManuscriptSection,
        patterns: ['conclusion', 'summary', 'future work'],
        weight: 0.8,
      },
      {
        section: 'References' as ManuscriptSection,
        patterns: ['reference', 'citation', 'bibliography'],
        weight: 1.0,
      },
    ];

    let bestMatch = { section: 'Body' as ManuscriptSection, score: 0 };

    for (const indicator of sectionIndicators) {
      const score = indicator.patterns.reduce((acc, pattern) => {
        return acc + (fullText.includes(pattern) ? indicator.weight : 0);
      }, 0);

      if (score > bestMatch.score) {
        bestMatch = { section: indicator.section, score };
      }
    }

    return bestMatch.section;
  }

  /**
   * Generate realistic editorial insights
   */
  private generateReviewerInsight(_text: string, type: string): string {
    const insights = {
      addition: [
        'Enhances manuscript completeness',
        'Addresses potential reviewer questions',
        'Provides necessary clarification',
        'Strengthens methodological rigor',
      ],
      deletion: [
        'Removes redundant content',
        'Improves manuscript focus',
        'Eliminates unnecessary detail',
        'Streamlines presentation',
      ],
      modification: [
        'Improves clarity and precision',
        'Enhances scientific accuracy',
        'Addresses reviewer concerns',
        'Strengthens argument',
      ],
    };

    const typeInsights = insights[type as keyof typeof insights] || insights.modification;
    return typeInsights[Math.floor(Math.random() * typeInsights.length)]!;
  }

  /**
   * Assess change quality based on content analysis
   */
  private assessChangeQuality(text: string, type: string, _confidence?: number): Assessment {
    const textLower = text.toLowerCase();

    // Positive indicators
    const positiveKeywords = [
      'significant',
      'important',
      'novel',
      'comprehensive',
      'rigorous',
      'validated',
      'confirmed',
      'demonstrated',
      'established',
    ];

    // Negative indicators
    const negativeKeywords = ['unclear', 'confusing', 'incomplete', 'insufficient', 'problematic'];

    const hasPositive = positiveKeywords.some((kw) => textLower.includes(kw));
    const hasNegative = negativeKeywords.some((kw) => textLower.includes(kw));

    if (hasPositive && !hasNegative) return 'positive';
    if (hasNegative && !hasPositive) return 'negative';
    if (type === 'addition' && text.length > 50) return 'positive';
    if (type === 'deletion' && text.length > 100) return 'negative';

    return 'neutral';
  }

  /**
   * Enhanced priority assessment
   */
  private assessPriority(text: string, type: string, confidence?: number): Priority {
    let score = 0;

    // Length factor
    if (text.length > 100) score += 2;
    else if (text.length > 30) score += 1;

    // Type factor
    if (type === 'modification') score += 2;
    else if (type === 'addition') score += 1;

    // Confidence factor
    if (confidence && confidence > 0.8) score += 1;

    // Content importance
    const importantKeywords = ['hypothesis', 'significant', 'conclusion', 'results', 'method'];

    if (importantKeywords.some((kw) => text.toLowerCase().includes(kw))) {
      score += 2;
    }

    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  /**
   * Extract meaningful keywords from text
   */
  private extractKeywords(text: string): string[] {
    return text
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .filter(
        (word) =>
          !/^(the|and|but|for|are|with|this|that|from|they|have|been|said|each|which|their|time|will|about|would|there|could|other|after|first|well|many|some|these|may|then|them|these|more|very|what|know|just|take|into|your|good|think|where|much|should|before|through|when|come|also|most|work|three|find|right|still|such|because|while|without)$/i.test(
            word
          )
      );
  }

  /**
   * Check alignment between text and keywords
   */
  private hasAlignment(text: string, keywords: string[]): boolean {
    const textWords = text.split(/\s+/);
    const matches = keywords.filter((keyword) =>
      textWords.some((word) => word.includes(keyword) || keyword.includes(word))
    );
    return matches.length > 0;
  }

  /**
   * Find best keyword match
   */
  private findBestKeywordMatch(text: string, keywords: string[]): string {
    const textLower = text.toLowerCase();
    const matches = keywords.filter((kw) => textLower.includes(kw));
    return matches[0] || 'reviewer concerns';
  }

  /**
   * Extract topic from text
   */
  private extractTopicFromText(text: string): string {
    const words = text.toLowerCase().split(/\s+/);
    const meaningfulWords = words.filter((word) => word.length > 5);
    return meaningfulWords[0] || 'content';
  }

  /**
   * Generate contextual editorial comment
   */
  private generateEditorialComment(text: string, type: string): string {
    const section = this.inferSectionFromText(text);
    const action =
      {
        addition: 'Enhanced',
        deletion: 'Streamlined',
        modification: 'Refined',
      }[type] || 'Updated';

    return `${action} ${section.toLowerCase()} content for improved manuscript quality and reviewer satisfaction.`;
  }
}
