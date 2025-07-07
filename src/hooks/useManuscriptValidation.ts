import { useState, useCallback, useMemo } from 'react';
import type { ValidationResult, FileUploadState } from '@/types';

interface UseManuscriptValidationState {
  originalFile: FileUploadState;
  revisedFile: FileUploadState;
  reviewerRequests: {
    content: string;
    isValid: boolean;
    warnings: string[];
  };
  overallValidation: ValidationResult;
}

interface UseManuscriptValidationActions {
  setOriginalText: (content: string) => void;
  setRevisedText: (content: string) => void;
  setReviewerRequests: (content: string) => void;
  resetValidation: () => void;
  validateAll: () => ValidationResult;
}

/**
 * Hook for validating manuscript inputs and providing feedback
 */
export function useManuscriptValidation(): UseManuscriptValidationState &
  UseManuscriptValidationActions {
  const [originalFile, setOriginalFileState] = useState<FileUploadState>({
    content: '',
    isValid: false,
    errors: [],
    warnings: [],
  });

  const [revisedFile, setRevisedFileState] = useState<FileUploadState>({
    content: '',
    isValid: false,
    errors: [],
    warnings: [],
  });

  const [reviewerRequests, setReviewerRequestsState] = useState({
    content: '',
    isValid: true,
    warnings: [] as string[],
  });

  /**
   * Validate a single text input
   */
  const validateText = useCallback((text: string, label: string): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!text || text.trim().length === 0) {
      errors.push(`${label} text cannot be empty`);
    } else {
      // Length validation
      if (text.length < 100) {
        warnings.push(
          `${label} text is very short (${text.length} characters). Analysis quality may be limited.`
        );
      }

      if (text.length > 1000000) {
        // 1MB limit
        errors.push(
          `${label} text is too long (${text.length} characters). Maximum: 1,000,000 characters.`
        );
      }

      // Academic content validation
      const academicIndicators = [
        'abstract',
        'introduction',
        'methodology',
        'results',
        'discussion',
        'conclusion',
        'references',
        'hypothesis',
        'analysis',
        'data',
      ];

      const hasAcademicContent = academicIndicators.some((indicator) =>
        text.toLowerCase().includes(indicator)
      );

      if (!hasAcademicContent) {
        warnings.push(
          `${label} may not contain academic content. Analysis is optimized for research manuscripts.`
        );
      }

      // Check for common formatting issues
      if (text.includes('\t\t') || text.includes('    ')) {
        warnings.push(`${label} contains excessive whitespace that may affect analysis.`);
      }

      // Check for unusual characters
      const unusualChars = text.match(/[^\w\s\.\!\?\,\;\:\-\(\)\[\]\{\}\"\']/g);
      if (unusualChars && unusualChars.length > text.length * 0.05) {
        warnings.push(`${label} contains many special characters that may affect analysis.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, []);

  /**
   * Validate reviewer requests
   */
  const validateReviewerRequestsText = useCallback(
    (text: string): { isValid: boolean; warnings: string[] } => {
      const warnings: string[] = [];

      if (text.trim().length === 0) {
        return {
          isValid: true,
          warnings: ['No reviewer requests provided. Alignment analysis will be skipped.'],
        };
      }

      if (text.length < 20) {
        warnings.push('Reviewer requests are very short. Analysis quality may be limited.');
      }

      if (text.length > 10000) {
        warnings.push('Reviewer requests are very long. Consider summarizing key points.');
      }

      // Check for common request patterns
      const requestPatterns = [
        /clarif/i,
        /explain/i,
        /detail/i,
        /expand/i,
        /improve/i,
        /method/i,
        /result/i,
        /discussion/i,
        /limitation/i,
      ];

      const hasRequestPatterns = requestPatterns.some((pattern) => pattern.test(text));
      if (!hasRequestPatterns) {
        warnings.push('Text may not contain typical reviewer requests. Check formatting.');
      }

      return { isValid: true, warnings };
    },
    []
  );

  /**
   * Set and validate original text
   */
  const setOriginalText = useCallback(
    (content: string): void => {
      const validation = validateText(content, 'Original manuscript');
      setOriginalFileState({
        content,
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
      });
    },
    [validateText]
  );

  /**
   * Set and validate revised text
   */
  const setRevisedText = useCallback(
    (content: string): void => {
      const validation = validateText(content, 'Revised manuscript');
      setRevisedFileState({
        content,
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
      });
    },
    [validateText]
  );

  /**
   * Set and validate reviewer requests
   */
  const setReviewerRequests = useCallback(
    (content: string): void => {
      const validation = validateReviewerRequestsText(content);
      setReviewerRequestsState({
        content,
        isValid: validation.isValid,
        warnings: validation.warnings,
      });
    },
    [validateReviewerRequestsText]
  );

  /**
   * Comprehensive validation of all inputs
   */
  const overallValidation = useMemo((): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Combine individual validations
    errors.push(...originalFile.errors, ...revisedFile.errors);
    warnings.push(...originalFile.warnings, ...revisedFile.warnings, ...reviewerRequests.warnings);

    // Cross-validation checks
    if (originalFile.isValid && revisedFile.isValid) {
      // Check if texts are identical
      if (originalFile.content.trim() === revisedFile.content.trim()) {
        warnings.push(
          'Original and revised manuscripts appear identical. No changes will be detected.'
        );
      }

      // Check for significant size differences
      const sizeDifference = Math.abs(originalFile.content.length - revisedFile.content.length);
      const averageSize = (originalFile.content.length + revisedFile.content.length) / 2;

      if (sizeDifference / averageSize > 0.8) {
        warnings.push(
          'Large difference in manuscript sizes detected. Ensure both versions are complete.'
        );
      }

      // Check for major structural differences
      const originalLines = originalFile.content.split('\n').length;
      const revisedLines = revisedFile.content.split('\n').length;
      const lineDifference = Math.abs(originalLines - revisedLines);

      if (lineDifference > Math.max(originalLines, revisedLines) * 0.5) {
        warnings.push('Significant structural differences detected. Verify document formatting.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, [originalFile, revisedFile, reviewerRequests]);

  /**
   * Reset all validation state
   */
  const resetValidation = useCallback((): void => {
    setOriginalFileState({
      content: '',
      isValid: false,
      errors: [],
      warnings: [],
    });
    setRevisedFileState({
      content: '',
      isValid: false,
      errors: [],
      warnings: [],
    });
    setReviewerRequestsState({
      content: '',
      isValid: true,
      warnings: [],
    });
  }, []);

  /**
   * Validate all inputs and return result
   */
  const validateAll = useCallback((): ValidationResult => {
    return overallValidation;
  }, [overallValidation]);

  return {
    originalFile,
    revisedFile,
    reviewerRequests,
    overallValidation,
    setOriginalText,
    setRevisedText,
    setReviewerRequests,
    resetValidation,
    validateAll,
  };
}
