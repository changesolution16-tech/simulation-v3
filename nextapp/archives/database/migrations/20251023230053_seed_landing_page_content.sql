/*
  # Seed Default Landing Page Content

  1. Updates
    - Add default landing page content for all existing scenarios
    - Provide difficulty-specific titles, descriptions, and objectives
    - Set role descriptions and estimated durations

  2. Content Structure
    - Beginner: More detailed guidance and support
    - Intermediate: Balanced challenge and guidance
    - Advanced: Minimal guidance, higher expectations
*/

-- Add default content for beginner scenarios
UPDATE scenarios
SET
  landing_page_title_beginner = COALESCE(landing_page_title_beginner, title || ' - Beginner'),
  landing_page_description_beginner = COALESCE(landing_page_description_beginner, 'Welcome to this beginner-level simulation. You will learn fundamental skills with comprehensive guidance and support.'),
  landing_page_objectives_beginner = COALESCE(landing_page_objectives_beginner, '[
    {"text": "Understand key concepts and principles"},
    {"text": "Practice essential skills in a supportive environment"},
    {"text": "Build confidence through guided scenarios"}
  ]'::jsonb),
  role_description_beginner = COALESCE(role_description_beginner, 'You will play the role of someone new to this skill area, learning the fundamentals step by step.'),
  estimated_duration_beginner = COALESCE(estimated_duration_beginner, 15)
WHERE difficulty = 'beginner';

-- Add default content for intermediate scenarios
UPDATE scenarios
SET
  landing_page_title_intermediate = COALESCE(landing_page_title_intermediate, title || ' - Intermediate'),
  landing_page_description_intermediate = COALESCE(landing_page_description_intermediate, 'Enhance your skills through moderately complex scenarios that challenge you with balanced guidance.'),
  landing_page_objectives_intermediate = '[
    {"text": "Apply skills in more complex situations"},
    {"text": "Navigate nuanced challenges with moderate guidance"},
    {"text": "Develop deeper understanding and competence"}
  ]'::jsonb,
  role_description_intermediate = COALESCE(role_description_intermediate, 'You will play the role of an experienced practitioner handling diverse and moderately complex challenges.'),
  estimated_duration_intermediate = COALESCE(estimated_duration_intermediate, 20)
WHERE difficulty = 'intermediate';

-- Add default content for advanced scenarios
UPDATE scenarios
SET
  landing_page_title_advanced = COALESCE(landing_page_title_advanced, title || ' - Advanced'),
  landing_page_description_advanced = COALESCE(landing_page_description_advanced, 'Master advanced skills through sophisticated scenarios requiring strategic thinking and minimal guidance.'),
  landing_page_objectives_advanced = COALESCE(landing_page_objectives_advanced, '[
    {"text": "Demonstrate mastery in complex, high-stakes situations"},
    {"text": "Apply strategic thinking and advanced techniques"},
    {"text": "Handle sophisticated challenges with minimal guidance"}
  ]'::jsonb),
  role_description_advanced = COALESCE(role_description_advanced, 'You will play the role of a senior professional or expert managing complex challenges with strategic impact.'),
  estimated_duration_advanced = COALESCE(estimated_duration_advanced, 25)
WHERE difficulty = 'advanced';
