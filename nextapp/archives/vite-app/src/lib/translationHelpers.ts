/**
 * Translation Helper Utilities
 *
 * These utilities help fetch and display translated content from the database
 * with proper fallback logic.
 */

type Language = 'en' | 'es';

/**
 * Get translated field with fallback logic
 * Priority: language-specific field -> English field -> default field
 */
export function getTranslatedField<T extends Record<string, any>>(
  obj: T,
  fieldName: string,
  language: Language
): string {
  if (!obj) return '';

  // Try language-specific field first
  const langField = `${fieldName}_${language}`;
  if (obj[langField] && typeof obj[langField] === 'string') {
    return obj[langField];
  }

  // Fallback to English if not the current language
  if (language !== 'en') {
    const enField = `${fieldName}_en`;
    if (obj[enField] && typeof obj[enField] === 'string') {
      return obj[enField];
    }
  }

  // Fallback to default field (no suffix)
  if (obj[fieldName] && typeof obj[fieldName] === 'string') {
    return obj[fieldName];
  }

  return '';
}

/**
 * Get translated simulation display name
 */
export function getSimulationDisplayName(
  simulation: any,
  language: Language
): string {
  return getTranslatedField(simulation, 'display_name', language) ||
         simulation.name ||
         'Untitled Simulation';
}

/**
 * Get translated simulation description
 */
export function getSimulationDescription(
  simulation: any,
  language: Language
): string {
  return getTranslatedField(simulation, 'description', language);
}

/**
 * Get translated simulation landing title
 */
export function getSimulationLandingTitle(
  simulation: any,
  language: Language
): string {
  return getTranslatedField(simulation, 'landing_title', language) ||
         getSimulationDisplayName(simulation, language);
}

/**
 * Get translated simulation landing description
 */
export function getSimulationLandingDescription(
  simulation: any,
  language: Language
): string {
  return getTranslatedField(simulation, 'landing_description', language) ||
         getSimulationDescription(simulation, language);
}

/**
 * Get translated simulation landing role description
 */
export function getSimulationLandingRoleDescription(
  simulation: any,
  language: Language
): string {
  return getTranslatedField(simulation, 'landing_role_description', language);
}

/**
 * Get translated simulation closing title
 */
export function getSimulationClosingTitle(
  simulation: any,
  language: Language
): string {
  return getTranslatedField(simulation, 'closing_title', language) ||
         (language === 'es' ? 'Simulación Completada' : 'Simulation Complete');
}

/**
 * Get translated category name
 */
export function getCategoryName(
  category: any,
  language: Language
): string {
  return getTranslatedField(category, 'name', language);
}

/**
 * Get translated category description
 */
export function getCategoryDescription(
  category: any,
  language: Language
): string {
  return getTranslatedField(category, 'description', language);
}

/**
 * Get translated scenario title
 */
export function getScenarioTitle(
  scenario: any,
  language: Language
): string {
  return getTranslatedField(scenario, 'title', language);
}

/**
 * Get translated scenario description
 */
export function getScenarioDescription(
  scenario: any,
  language: Language
): string {
  return getTranslatedField(scenario, 'description', language);
}

/**
 * Get translated scenario question text
 */
export function getScenarioQuestionText(
  scenario: any,
  language: Language
): string {
  return getTranslatedField(scenario, 'question_text', language);
}

/**
 * Get translated scenario option text
 */
export function getScenarioOptionText(
  option: any,
  language: Language
): string {
  return getTranslatedField(option, 'option_text', language);
}

/**
 * Get translated scenario option feedback
 */
export function getScenarioOptionFeedback(
  option: any,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  language: Language
): string {
  const fieldName = `feedback_${difficulty}`;
  return getTranslatedField(option, fieldName, language);
}

/**
 * Translate array of objects with specific fields
 */
export function translateObjects<T extends Record<string, any>>(
  objects: T[],
  fields: string[],
  language: Language
): T[] {
  return objects.map(obj => {
    const translated = { ...obj };
    fields.forEach(field => {
      const translatedValue = getTranslatedField(obj, field, language);
      if (translatedValue) {
        translated[field] = translatedValue;
      }
    });
    return translated;
  });
}

/**
 * Get difficulty label translation key
 */
export function getDifficultyTranslationKey(difficulty: string): string {
  const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
  const normalized = difficulty.toLowerCase();

  if (validDifficulties.includes(normalized)) {
    return `difficulty.${normalized}`;
  }

  return 'difficulty.beginner';
}
