/*
  # Add customizable question text to scenarios

  1. Changes
    - Add `question_text` column to `scenarios` table
    - Set default value to "How would you respond?"
    - Backfill existing scenarios with the default text

  2. Purpose
    - Allow scenario creators to customize the question displayed to learners
    - Provides flexibility for different scenario contexts and question phrasings
    - Maintains backward compatibility with existing scenarios

  3. Notes
    - Column is NOT NULL with a default value for data integrity
    - All existing scenarios will automatically get the default question text
    - Future scenarios can override with custom questions during creation
*/

-- Add question_text column to scenarios table
ALTER TABLE scenarios
ADD COLUMN IF NOT EXISTS question_text text NOT NULL DEFAULT 'How would you respond?';

-- Update any existing scenarios that might have NULL (though shouldn't happen with default)
UPDATE scenarios
SET question_text = 'How would you respond?'
WHERE question_text IS NULL OR question_text = '';

-- Add index for potential future filtering/searching
CREATE INDEX IF NOT EXISTS idx_scenarios_question_text ON scenarios USING gin(to_tsvector('english', question_text));
