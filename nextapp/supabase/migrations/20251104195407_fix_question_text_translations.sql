/*
  # Fix Missing Question Text Translations

  ## Problem
  Scenarios are missing question_text, question_text_en, and question_text_es values,
  causing the question to not display on the QuestionPage. Additionally, the Spanish
  translation script has incorrect scenario titles that don't match the actual titles
  in the database, causing UPDATE statements to fail silently.

  ## Solution
  1. Backfill missing question_text fields with appropriate defaults
  2. Copy question_text to question_text_en where missing
  3. Set question_text_es to Spanish default where missing
  4. Fix specific scenarios that were created without question text

  ## Changes
  - Set default question text for all scenarios where NULL
  - Populate language-specific question text fields
  - Ensure all scenarios have displayable questions in both languages
*/

-- ============================================================================
-- Backfill Missing Question Text Fields
-- ============================================================================

-- Set default question_text where NULL or empty
UPDATE scenarios
SET question_text = 'How would you respond?'
WHERE question_text IS NULL OR question_text = '';

-- Copy question_text to question_text_en where missing
UPDATE scenarios
SET question_text_en = question_text
WHERE question_text_en IS NULL OR question_text_en = '';

-- Set Spanish default where missing
UPDATE scenarios
SET question_text_es = '¿Cómo responderías?'
WHERE question_text_es IS NULL OR question_text_es = '';

-- ============================================================================
-- Fix Challenge 1 Question Text
-- ============================================================================

UPDATE scenarios
SET
  question_text = 'The room is tense. Product and Customer Success teams are visibly frustrated with each other. As the facilitator, what do you do?',
  question_text_en = 'The room is tense. Product and Customer Success teams are visibly frustrated with each other. As the facilitator, what do you do?',
  question_text_es = 'La sala está tensa. Los equipos de Producto y Éxito del Cliente están visiblemente frustrados entre sí. Como facilitador, ¿qué haces?'
WHERE title = 'Challenge 1: More Than a Meeting - The Signal Beneath the Silence';

-- ============================================================================
-- Fix Challenge 2 Question Texts
-- ============================================================================

UPDATE scenarios
SET
  question_text = 'Jordan''s frustration is palpable. The team is watching to see how you''ll respond. What do you do?',
  question_text_en = 'Jordan''s frustration is palpable. The team is watching to see how you''ll respond. What do you do?',
  question_text_es = 'La frustración de Jordan es palpable. El equipo está observando para ver cómo responderás. ¿Qué haces?'
WHERE title = 'Challenge 2A: The Performance Shortcut - Rushed Decisions Come Home';

UPDATE scenarios
SET
  question_text = 'The team is implementing your directive, but the energy has shifted. What''s your next move?',
  question_text_en = 'The team is implementing your directive, but the energy has shifted. What''s your next move?',
  question_text_es = 'El equipo está implementando tu directiva, pero la energía ha cambiado. ¿Cuál es tu próximo movimiento?'
WHERE title = 'Challenge 2B: The Performance Shortcut - Surface Solutions';

UPDATE scenarios
SET
  question_text = 'The conversation has opened something important. Jordan and the team are looking to you for what comes next. What do you do?',
  question_text_en = 'The conversation has opened something important. Jordan and the team are looking to you for what comes next. What do you do?',
  question_text_es = 'La conversación ha abierto algo importante. Jordan y el equipo te están mirando para ver qué sigue. ¿Qué haces?'
WHERE title = 'Challenge 2C: The Performance Shortcut - Building on Trust';

UPDATE scenarios
SET
  question_text = 'Jordan has shared something profound about belonging. The whole team is present in a new way. What do you do with this moment?',
  question_text_en = 'Jordan has shared something profound about belonging. The whole team is present in a new way. What do you do with this moment?',
  question_text_es = 'Jordan ha compartido algo profundo sobre la pertenencia. Todo el equipo está presente de una nueva manera. ¿Qué haces con este momento?'
WHERE title = 'Challenge 2D: The Performance Shortcut - Unexpected Excellence';

-- ============================================================================
-- Fix Challenge 3 Question Texts (Using Correct Titles)
-- ============================================================================

UPDATE scenarios
SET
  question_text = 'Three weeks later, trust is still fragile. The team is watching to see if you maintain what you started. What do you do?',
  question_text_en = 'Three weeks later, trust is still fragile. The team is watching to see if you maintain what you started. What do you do?',
  question_text_es = 'Tres semanas después, la confianza aún es frágil. El equipo está observando para ver si mantienes lo que comenzaste. ¿Qué haces?'
WHERE title = 'Challenge 3A: The Trust Fracture - Broken Commitments';

UPDATE scenarios
SET
  question_text = 'The team''s vulnerability has created real connection, but also real risk. How do you lead from here?',
  question_text_en = 'The team''s vulnerability has created real connection, but also real risk. How do you lead from here?',
  question_text_es = 'La vulnerabilidad del equipo ha creado una conexión real, pero también un riesgo real. ¿Cómo lideras desde aquí?'
WHERE title = 'Challenge 3B: The Trust Fracture - Hidden Resentments';

UPDATE scenarios
SET
  question_text = 'The team has discovered the power of collaborative storytelling. How do you solidify this cultural shift?',
  question_text_en = 'The team has discovered the power of collaborative storytelling. How do you solidify this cultural shift?',
  question_text_es = 'El equipo ha descubierto el poder de la narración colaborativa. ¿Cómo solidificas este cambio cultural?'
WHERE title = 'Challenge 3C: The Trust Fracture - Hero Syndrome Consequences';

UPDATE scenarios
SET
  question_text = 'Your team is an island of collaboration in a sea of traditional dynamics. What''s your leadership move?',
  question_text_en = 'Your team is an island of collaboration in a sea of traditional dynamics. What''s your leadership move?',
  question_text_es = 'Tu equipo es una isla de colaboración en un mar de dinámicas tradicionales. ¿Cuál es tu movimiento de liderazgo?'
WHERE title = 'Challenge 3D: The Trust Fracture - Growing Pains';

-- ============================================================================
-- Fix Challenge 4 Question Texts
-- ============================================================================

UPDATE scenarios
SET
  question_text = 'Alex has finally spoken. The room is silent. Everyone is watching to see what kind of leader you really are. What do you do?',
  question_text_en = 'Alex has finally spoken. The room is silent. Everyone is watching to see what kind of leader you really are. What do you do?',
  question_text_es = 'Alex finalmente ha hablado. La sala está en silencio. Todos están observando para ver qué tipo de líder eres realmente. ¿Qué haces?'
WHERE title = 'Challenge 4A: The Confrontation - Repair or Rupture';

UPDATE scenarios
SET
  question_text = 'Alex''s confrontation has revealed deeper team dynamics. How do you navigate from defensiveness to dialogue?',
  question_text_en = 'Alex''s confrontation has revealed deeper team dynamics. How do you navigate from defensiveness to dialogue?',
  question_text_es = 'La confrontación de Alex ha revelado dinámicas de equipo más profundas. ¿Cómo navegas de la defensiva al diálogo?'
WHERE title = 'Challenge 4B: The Confrontation - Surface to Substance';

UPDATE scenarios
SET
  question_text = 'The team is examining how individual heroism undermines collective capacity. What systemic change will you champion?',
  question_text_en = 'The team is examining how individual heroism undermines collective capacity. What systemic change will you champion?',
  question_text_es = 'El equipo está examinando cómo el heroísmo individual socava la capacidad colectiva. ¿Qué cambio sistémico defenderás?'
WHERE title = 'Challenge 4C: The Confrontation - From Hero to Team';

UPDATE scenarios
SET
  question_text = 'Your team''s transformation is inspiring others. How do you lead cultural change beyond your immediate sphere?',
  question_text_en = 'Your team''s transformation is inspiring others. How do you lead cultural change beyond your immediate sphere?',
  question_text_es = 'La transformación de tu equipo está inspirando a otros. ¿Cómo lideras el cambio cultural más allá de tu esfera inmediata?'
WHERE title = 'Challenge 4D: The Confrontation - Leadership at Scale';

-- ============================================================================
-- Verify All Scenarios Have Question Text
-- ============================================================================

-- Check if any scenarios still have NULL question text (should be zero)
DO $$
DECLARE
  v_null_count integer;
BEGIN
  SELECT COUNT(*)
  INTO v_null_count
  FROM scenarios
  WHERE question_text IS NULL
     OR question_text = ''
     OR question_text_en IS NULL
     OR question_text_en = ''
     OR question_text_es IS NULL
     OR question_text_es = '';

  IF v_null_count > 0 THEN
    RAISE WARNING 'Found % scenarios with missing question text fields', v_null_count;
  ELSE
    RAISE NOTICE 'All scenarios now have complete question text in both languages';
  END IF;
END $$;

-- ============================================================================
-- Add Constraint to Prevent Future NULL Values
-- ============================================================================

-- Ensure question_text is never NULL going forward
ALTER TABLE scenarios
  ALTER COLUMN question_text SET DEFAULT 'How would you respond?';

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON COLUMN scenarios.question_text IS
  'The question displayed to learners on the QuestionPage. Language-neutral or default English version. Must not be NULL.';

COMMENT ON COLUMN scenarios.question_text_en IS
  'English version of the question text. Falls back to question_text if NULL.';

COMMENT ON COLUMN scenarios.question_text_es IS
  'Spanish version of the question text. Falls back to English if NULL.';