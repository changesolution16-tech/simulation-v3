import { VideoInput } from '../types';

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export interface VideoValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FeedbackValidationResult {
  isValid: boolean;
  fieldErrors: {
    beginner?: string[];
    intermediate?: string[];
    advanced?: string[];
  };
}

export function validateVideoUrl(url: string | null | undefined, fieldName: string = 'Video URL'): VideoValidationResult {
  const result: VideoValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!url || url.trim() === '') {
    return result;
  }

  if (UUID_PATTERN.test(url)) {
    result.isValid = false;
    result.errors.push(`${fieldName} contains a UUID instead of a valid URL. This indicates data corruption.`);
  }

  const cleanUrl = url.trim();

  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    if (!isValidHttpUrl(cleanUrl)) {
      result.isValid = false;
      result.errors.push(`${fieldName} is not a valid HTTP/HTTPS URL.`);
    }
  } else if (cleanUrl.startsWith('blob:')) {
    result.warnings.push(`${fieldName} is a blob URL which may not persist after page reload.`);
  }

  return result;
}

export function validateFeedbackText(feedback: any, fieldName: string = 'Feedback'): VideoValidationResult {
  const result: VideoValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!feedback) {
    return result;
  }

  if (typeof feedback === 'string') {
    if (UUID_PATTERN.test(feedback)) {
      result.isValid = false;
      result.errors.push(`${fieldName} contains a UUID instead of text. This indicates data corruption.`);
    }
  } else if (typeof feedback === 'object') {
    ['beginner', 'intermediate', 'advanced'].forEach(level => {
      const text = feedback[level];
      if (text && typeof text === 'string' && UUID_PATTERN.test(text)) {
        result.isValid = false;
        result.errors.push(`${fieldName}.${level} contains a UUID instead of text. This indicates data corruption.`);
      }
    });
  }

  return result;
}

export function validateVideoMetadata(metadata: any, difficultyLevel?: string): VideoValidationResult {
  const result: VideoValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!metadata) {
    return result;
  }

  const label = difficultyLevel ? `Video metadata (${difficultyLevel})` : 'Video metadata';

  if (metadata.url) {
    const urlValidation = validateVideoUrl(metadata.url, `${label} URL`);
    result.isValid = result.isValid && urlValidation.isValid;
    result.errors.push(...urlValidation.errors);
    result.warnings.push(...urlValidation.warnings);
  }

  if (metadata.embedCode && typeof metadata.embedCode === 'string') {
    if (UUID_PATTERN.test(metadata.embedCode) && !metadata.embedCode.includes('<')) {
      result.isValid = false;
      result.errors.push(`${label} embed code contains a UUID instead of HTML. This indicates data corruption.`);
    }
  }

  if (metadata.source === 'url' && !metadata.url) {
    result.warnings.push(`${label} source is 'url' but no URL is provided.`);
  }

  if (metadata.source === 'embed' && !metadata.embedCode) {
    result.warnings.push(`${label} source is 'embed' but no embed code is provided.`);
  }

  if (metadata.source === 'library' && !metadata.libraryId) {
    result.warnings.push(`${label} source is 'library' but no library ID is provided.`);
  }

  if (metadata.source === 'upload' && !metadata.fileId) {
    result.warnings.push(`${label} source is 'upload' but no file ID is provided.`);
  }

  return result;
}

export function validateScenarioOptionFeedback(option: any): FeedbackValidationResult {
  const result: FeedbackValidationResult = {
    isValid: true,
    fieldErrors: {}
  };

  const levels = ['beginner', 'intermediate', 'advanced'] as const;

  levels.forEach(level => {
    const errors: string[] = [];

    const feedbackKey = `feedback_${level}`;
    if (option[feedbackKey]) {
      const feedbackValidation = validateFeedbackText(option[feedbackKey], `Feedback ${level}`);
      if (!feedbackValidation.isValid) {
        result.isValid = false;
        errors.push(...feedbackValidation.errors);
      }
    }

    const videoUrlKey = `feedback_video_url_${level}`;
    if (option[videoUrlKey]) {
      const urlValidation = validateVideoUrl(option[videoUrlKey], `Feedback video URL ${level}`);
      if (!urlValidation.isValid) {
        result.isValid = false;
        errors.push(...urlValidation.errors);
      }
    }

    if (option.feedbackVideoMetadata?.[level]) {
      const metadataValidation = validateVideoMetadata(option.feedbackVideoMetadata[level], level);
      if (!metadataValidation.isValid) {
        result.isValid = false;
        errors.push(...metadataValidation.errors);
      }
    }

    if (errors.length > 0) {
      result.fieldErrors[level] = errors;
    }
  });

  if (option.transitionVideoUrl) {
    const urlValidation = validateVideoUrl(option.transitionVideoUrl, 'Transition video URL');
    if (!urlValidation.isValid) {
      result.isValid = false;
      if (!result.fieldErrors.beginner) result.fieldErrors.beginner = [];
      result.fieldErrors.beginner.push(...urlValidation.errors);
    }
  }

  if (option.transitionVideoMetadata) {
    const metadataValidation = validateVideoMetadata(option.transitionVideoMetadata, 'transition');
    if (!metadataValidation.isValid) {
      result.isValid = false;
      if (!result.fieldErrors.beginner) result.fieldErrors.beginner = [];
      result.fieldErrors.beginner.push(...metadataValidation.errors);
    }
  }

  return result;
}

export function sanitizeVideoUrl(url: string | null | undefined): string | null {
  if (!url || url.trim() === '') {
    return null;
  }

  const cleanUrl = url.trim();

  if (UUID_PATTERN.test(cleanUrl) && !cleanUrl.includes('/') && !cleanUrl.includes('.')) {
    console.error(`[VideoValidation] Detected standalone UUID in video URL: ${cleanUrl}`);
    return null;
  }

  return cleanUrl;
}

export function sanitizeFeedbackText(text: string | null | undefined): string {
  if (!text || text.trim() === '') {
    return '';
  }

  const cleanText = text.trim();

  if (UUID_PATTERN.test(cleanText) && cleanText.length < 100 && !cleanText.includes(' ')) {
    console.error(`[VideoValidation] Detected UUID in feedback text: ${cleanText}`);
    return 'Feedback text contains corrupted data. Please re-enter the feedback.';
  }

  return cleanText;
}

export function logValidationErrors(errors: string[], context: string = 'Validation'): void {
  if (errors.length > 0) {
    console.error(`[${context}] Validation failed with ${errors.length} error(s):`);
    errors.forEach((error, index) => {
      console.error(`  ${index + 1}. ${error}`);
    });
  }
}

function isValidHttpUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function createSafeVideoMetadata(
  source: string | null,
  url: string | null,
  embedCode: string | null,
  libraryId: string | null,
  fileId: string | null
): any {
  const metadata: any = {
    source: source || 'url'
  };

  const sanitizedUrl = sanitizeVideoUrl(url);
  const sanitizedEmbedCode = embedCode?.trim() || null;

  if (sanitizedUrl) {
    metadata.url = sanitizedUrl;
  }

  if (sanitizedEmbedCode && !UUID_PATTERN.test(sanitizedEmbedCode)) {
    metadata.embedCode = sanitizedEmbedCode;
  }

  if (libraryId && !UUID_PATTERN.test(libraryId)) {
    metadata.libraryId = libraryId;
  } else if (libraryId) {
    console.warn(`[VideoValidation] Skipping invalid libraryId: ${libraryId}`);
  }

  if (fileId && !UUID_PATTERN.test(fileId)) {
    metadata.fileId = fileId;
  } else if (fileId) {
    console.warn(`[VideoValidation] Skipping invalid fileId: ${fileId}`);
  }

  return metadata;
}

export function validateScenarioBeforeSave(scenario: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (scenario.videoUrl) {
    const validation = validateVideoUrl(scenario.videoUrl, 'Scenario video URL');
    if (!validation.isValid) {
      errors.push(...validation.errors);
    }
  }

  if (scenario.promptVideoUrl) {
    const validation = validateVideoUrl(scenario.promptVideoUrl, 'Prompt video URL');
    if (!validation.isValid) {
      errors.push(...validation.errors);
    }
  }

  if (scenario.introductionVideoUrl) {
    const validation = validateVideoUrl(scenario.introductionVideoUrl, 'Introduction video URL');
    if (!validation.isValid) {
      errors.push(...validation.errors);
    }
  }

  if (scenario.transitionVideoUrl) {
    const validation = validateVideoUrl(scenario.transitionVideoUrl, 'Transition video URL');
    if (!validation.isValid) {
      errors.push(...validation.errors);
    }
  }

  if (scenario.options && Array.isArray(scenario.options)) {
    scenario.options.forEach((option: any, index: number) => {
      const optionValidation = validateScenarioOptionFeedback(option);
      if (!optionValidation.isValid) {
        Object.entries(optionValidation.fieldErrors).forEach(([level, fieldErrors]) => {
          if (fieldErrors) {
            errors.push(`Option ${index + 1} (${level}): ${fieldErrors.join(', ')}`);
          }
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
