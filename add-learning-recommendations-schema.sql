/*
  # Add Learning Recommendations System

  This migration adds comprehensive learning recommendations support to the scenario system,
  matching the sophisticated learning features from the original Vite app.

  ## New Features
  - Learning resources (books, articles, courses, videos) with metadata
  - Practice exercises for skill reinforcement
  - Next steps for continued growth
  - Resource reusability across multiple options
  - Tracking and analytics support

  ## Approach
  Hybrid model combining:
  - Simple text arrays in scenario_options for quick access
  - Normalized learning_resources table for rich, reusable content
*/

-- ============================================================================
-- STEP 1: Add simple fields to scenario_options
-- ============================================================================

-- Add practice exercises as text array (simple, fast access)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'practice_exercises'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN practice_exercises text[] DEFAULT '{}';
    COMMENT ON COLUMN scenario_options.practice_exercises IS 'Array of practice exercises to reinforce learning';
  END IF;
END $$;

-- Add next steps as text array (simple, fast access)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_options' AND column_name = 'next_steps'
  ) THEN
    ALTER TABLE scenario_options ADD COLUMN next_steps text[] DEFAULT '{}';
    COMMENT ON COLUMN scenario_options.next_steps IS 'Array of recommended next steps for continued growth';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Create learning_resources table (reusable resources)
-- ============================================================================

CREATE TABLE IF NOT EXISTS learning_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  resource_type text NOT NULL CHECK (
    resource_type IN ('book', 'article', 'course', 'video', 'podcast', 'tool', 'framework', 'assessment')
  ),
  url text,
  description text,

  -- Additional metadata
  author text,
  publisher text,
  published_date date,
  duration_minutes integer, -- For videos/courses
  difficulty_level text CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),

  -- Organization
  tags text[] DEFAULT '{}',
  category text, -- e.g., 'communication', 'leadership', 'emotional_intelligence'

  -- Flexible metadata storage
  metadata jsonb DEFAULT '{}',

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Tracking
  view_count integer DEFAULT 0,
  click_count integer DEFAULT 0,
  rating decimal(3,2), -- Average rating
  rating_count integer DEFAULT 0
);

-- Add comments
COMMENT ON TABLE learning_resources IS 'Reusable learning resources (books, articles, courses, videos) that can be assigned to multiple scenario options';
COMMENT ON COLUMN learning_resources.resource_type IS 'Type of learning resource';
COMMENT ON COLUMN learning_resources.url IS 'Direct URL to the resource (if available online)';
COMMENT ON COLUMN learning_resources.metadata IS 'Flexible JSON storage for additional resource-specific data (ISBN, DOI, etc.)';
COMMENT ON COLUMN learning_resources.tags IS 'Tags for categorization and search';

-- ============================================================================
-- STEP 3: Create junction table linking options to resources
-- ============================================================================

CREATE TABLE IF NOT EXISTS option_learning_resources (
  option_id uuid NOT NULL REFERENCES scenario_options(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,

  -- Display and relevance
  display_order integer DEFAULT 0,
  relevance_level text DEFAULT 'recommended' CHECK (
    relevance_level IN ('required', 'recommended', 'optional', 'supplementary')
  ),

  -- Context for this specific assignment
  context_note text, -- Why this resource is relevant for this option
  estimated_completion_time_minutes integer,

  -- Timestamps
  created_at timestamptz DEFAULT now(),

  PRIMARY KEY (option_id, resource_id)
);

COMMENT ON TABLE option_learning_resources IS 'Links scenario options to learning resources with context';
COMMENT ON COLUMN option_learning_resources.relevance_level IS 'How important this resource is for this specific option';
COMMENT ON COLUMN option_learning_resources.context_note IS 'Explanation of why this resource is relevant to this decision';

-- ============================================================================
-- STEP 4: Create indexes for performance
-- ============================================================================

-- Learning resources indexes
CREATE INDEX IF NOT EXISTS idx_learning_resources_type ON learning_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_learning_resources_category ON learning_resources(category);
CREATE INDEX IF NOT EXISTS idx_learning_resources_difficulty ON learning_resources(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_learning_resources_tags ON learning_resources USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_learning_resources_created_at ON learning_resources(created_at DESC);

-- Junction table indexes
CREATE INDEX IF NOT EXISTS idx_option_learning_resources_option ON option_learning_resources(option_id);
CREATE INDEX IF NOT EXISTS idx_option_learning_resources_resource ON option_learning_resources(resource_id);
CREATE INDEX IF NOT EXISTS idx_option_learning_resources_order ON option_learning_resources(option_id, display_order);

-- ============================================================================
-- STEP 5: Create helper views
-- ============================================================================

-- View for most popular resources
CREATE OR REPLACE VIEW popular_learning_resources AS
SELECT
  lr.*,
  COUNT(DISTINCT olr.option_id) as usage_count
FROM learning_resources lr
LEFT JOIN option_learning_resources olr ON olr.resource_id = lr.id
GROUP BY lr.id
ORDER BY usage_count DESC, lr.click_count DESC;

COMMENT ON VIEW popular_learning_resources IS 'Learning resources sorted by popularity and usage';

-- View for resources by category
CREATE OR REPLACE VIEW resources_by_category AS
SELECT
  category,
  resource_type,
  COUNT(*) as resource_count,
  AVG(rating) as average_rating
FROM learning_resources
WHERE category IS NOT NULL
GROUP BY category, resource_type
ORDER BY category, resource_count DESC;

COMMENT ON VIEW resources_by_category IS 'Summary of resources grouped by category and type';

-- ============================================================================
-- STEP 6: Insert sample learning resources
-- ============================================================================

-- Sample books
INSERT INTO learning_resources (title, resource_type, description, author, category, tags, difficulty_level)
VALUES
  (
    'Crucial Conversations',
    'book',
    'Tools for talking when stakes are high. Learn to speak persuasively, not abrasively.',
    'Kerry Patterson, Joseph Grenny',
    'communication',
    ARRAY['communication', 'conflict resolution', 'dialogue'],
    'intermediate'
  ),
  (
    'Emotional Intelligence 2.0',
    'book',
    'Increase your EQ through practical strategies that immediately boost emotional intelligence.',
    'Travis Bradberry, Jean Greaves',
    'emotional_intelligence',
    ARRAY['emotional intelligence', 'self-awareness', 'relationship management'],
    'beginner'
  ),
  (
    'The Fearless Organization',
    'book',
    'Creating Psychological Safety in the Workplace for Learning, Innovation, and Growth.',
    'Amy Edmondson',
    'leadership',
    ARRAY['psychological safety', 'team dynamics', 'organizational learning'],
    'advanced'
  ),
  (
    'Radical Candor',
    'book',
    'How to be a kickass boss without losing your humanity. Balance caring personally with challenging directly.',
    'Kim Scott',
    'leadership',
    ARRAY['feedback', 'management', 'communication'],
    'intermediate'
  )
ON CONFLICT DO NOTHING;

-- Sample online courses
INSERT INTO learning_resources (title, resource_type, url, description, category, tags, duration_minutes, difficulty_level)
VALUES
  (
    'Active Listening in the Workplace',
    'course',
    'https://www.coursera.org/learn/active-listening',
    'Master the art of active listening to improve communication and build trust.',
    'communication',
    ARRAY['active listening', 'communication skills', 'workplace skills'],
    180,
    'beginner'
  ),
  (
    'Facilitating Group Discussions',
    'course',
    'https://www.linkedin.com/learning/facilitating-discussions',
    'Learn effective facilitation techniques for leading productive team meetings.',
    'facilitation',
    ARRAY['facilitation', 'meeting management', 'group dynamics'],
    120,
    'intermediate'
  ),
  (
    'Collaborative Problem Solving',
    'course',
    'https://www.coursera.org/learn/collaborative-problem-solving',
    'Learn effective collaboration techniques and structured problem-solving approaches.',
    'problem_solving',
    ARRAY['collaboration', 'problem solving', 'teamwork'],
    240,
    'intermediate'
  )
ON CONFLICT DO NOTHING;

-- Sample articles
INSERT INTO learning_resources (title, resource_type, url, description, category, tags, difficulty_level)
VALUES
  (
    'Why Employees Don''t Speak Up',
    'article',
    'https://hbr.org/2019/06/why-employees-dont-speak-up',
    'Research on employee voice and organizational silence from Harvard Business Review.',
    'communication',
    ARRAY['psychological safety', 'employee voice', 'organizational behavior'],
    'advanced'
  ),
  (
    'The Art of Timing in Leadership',
    'article',
    'https://hbr.org/2020/01/the-art-of-timing-in-leadership',
    'Understanding when and how to present challenging ideas effectively.',
    'leadership',
    ARRAY['timing', 'influence', 'strategic communication'],
    'intermediate'
  ),
  (
    'Building Trust in Virtual Teams',
    'article',
    'https://hbr.org/2021/08/building-trust-in-virtual-teams',
    'Strategies for creating psychological safety in remote work environments.',
    'teamwork',
    ARRAY['trust', 'virtual teams', 'remote work'],
    'intermediate'
  )
ON CONFLICT DO NOTHING;

-- Sample videos
INSERT INTO learning_resources (title, resource_type, url, description, category, tags, duration_minutes, difficulty_level)
VALUES
  (
    'The Power of Empathy',
    'video',
    'https://www.ted.com/talks/brene_brown_on_empathy',
    'Brené Brown on understanding and practicing empathy in leadership.',
    'emotional_intelligence',
    ARRAY['empathy', 'emotional intelligence', 'vulnerability'],
    15,
    'beginner'
  ),
  (
    'How to Give Difficult Feedback',
    'video',
    'https://www.youtube.com/watch?v=wtl5UrrgU8c',
    'Practical guide to giving constructive feedback that drives improvement.',
    'feedback',
    ARRAY['feedback', 'difficult conversations', 'management'],
    20,
    'intermediate'
  )
ON CONFLICT DO NOTHING;

-- Sample frameworks/tools
INSERT INTO learning_resources (title, resource_type, description, category, tags, difficulty_level, metadata)
VALUES
  (
    'GROW Coaching Model',
    'framework',
    'Goal, Reality, Options, Way Forward - A simple yet powerful framework for coaching conversations.',
    'coaching',
    ARRAY['coaching', 'goal setting', 'problem solving'],
    'beginner',
    '{"steps": ["Goal - Define the goal", "Reality - Explore current reality", "Options - Generate options", "Way Forward - Commit to action"]}'::jsonb
  ),
  (
    'SCARF Model',
    'framework',
    'Status, Certainty, Autonomy, Relatedness, Fairness - Understanding what drives human behavior.',
    'neuroscience',
    ARRAY['neuroscience', 'behavior', 'motivation', 'influence'],
    'intermediate',
    '{"components": ["Status", "Certainty", "Autonomy", "Relatedness", "Fairness"]}'::jsonb
  ),
  (
    'DESC Script',
    'tool',
    'Describe, Express, Specify, Consequences - A structured approach to assertive communication.',
    'communication',
    ARRAY['assertive communication', 'feedback', 'conflict resolution'],
    'beginner',
    '{"steps": ["Describe the situation", "Express your concerns", "Specify what you want", "Consequences - positive outcomes"]}'::jsonb
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 7: Create trigger for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_learning_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_learning_resources_updated_at ON learning_resources;
CREATE TRIGGER trigger_learning_resources_updated_at
  BEFORE UPDATE ON learning_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_learning_resources_updated_at();

-- ============================================================================
-- STEP 8: Add RLS policies (if using Row Level Security)
-- ============================================================================

-- Enable RLS on learning_resources
ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read learning resources
CREATE POLICY "Authenticated users can view learning resources"
  ON learning_resources
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins and instructors can create/update resources
CREATE POLICY "Admins and instructors can manage learning resources"
  ON learning_resources
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'instructor')
    )
  );

-- Enable RLS on option_learning_resources
ALTER TABLE option_learning_resources ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read assignments
CREATE POLICY "Authenticated users can view resource assignments"
  ON option_learning_resources
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins and instructors can manage assignments
CREATE POLICY "Admins and instructors can manage resource assignments"
  ON option_learning_resources
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'instructor')
    )
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify schema changes
SELECT
  'scenario_options' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'scenario_options'
  AND column_name IN ('practice_exercises', 'next_steps')

UNION ALL

SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('learning_resources', 'option_learning_resources')
ORDER BY table_name, column_name;

-- Verify sample data
SELECT
  resource_type,
  COUNT(*) as count,
  AVG(CASE WHEN difficulty_level IS NOT NULL THEN 1 ELSE 0 END)::decimal(3,2) * 100 as pct_with_difficulty
FROM learning_resources
GROUP BY resource_type
ORDER BY count DESC;

-- Show sample resources
SELECT
  id,
  title,
  resource_type,
  category,
  difficulty_level,
  array_length(tags, 1) as tag_count
FROM learning_resources
ORDER BY resource_type, title
LIMIT 10;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '
  ========================================
  Learning Recommendations Schema Added!
  ========================================

  ✅ Added practice_exercises to scenario_options
  ✅ Added next_steps to scenario_options
  ✅ Created learning_resources table
  ✅ Created option_learning_resources junction table
  ✅ Added indexes for performance
  ✅ Created helper views
  ✅ Inserted sample learning resources
  ✅ Configured RLS policies

  Sample Data Inserted:
  - 4 Books
  - 3 Online Courses
  - 3 Articles
  - 2 Videos
  - 3 Frameworks/Tools

  Next Steps:
  1. Review sample data: SELECT * FROM learning_resources;
  2. Update API routes to handle new fields
  3. Create UI components for managing resources
  4. Migrate data from Vite app scenarios

  See LEARNING_RECOMMENDATIONS_IMPLEMENTATION_GUIDE.md for details.
  ';
END $$;
