/*
  # Seed Target Competencies and Default Weight Matrix

  ## Overview
  This migration seeds the five target competencies and populates the global weight matrix
  with the exact values from Judith's competency-to-metric mapping table.

  ## Target Competencies
  1. TBR-03: Trust Building & Repair
  2. AC-06: Adaptive Communication
  3. EI-02: Emotional Intelligence
  4. EL-05: Ethical Leadership
  5. VBD-01: Values-Based Decision-Making

  ## Weight Matrix
  Based on the provided mapping table with weights ranging from 0.0 to 1.0:

  | Competency | BRAVIN | Trust | EI Index | Ethical |
  |------------|--------|-------|----------|---------|
  | TBR-03     | 0.3    | 0.5   | 0.2      | 0.0     |
  | AC-06      | 0.2    | 0.3   | 0.5      | 0.0     |
  | EI-02      | 0.2    | 0.3   | 0.5      | 0.0     |
  | EL-05      | 0.3    | 0.1   | 0.1      | 0.5     |
  | VBD-01     | 0.4    | 0.1   | 0.1      | 0.4     |
*/

-- ============================================================================
-- SEED: Five Target Competencies
-- ============================================================================

INSERT INTO competencies (
  code,
  name,
  description,
  parent_competency_id,
  competency_level,
  proficiency_levels,
  industry_standard,
  tags,
  is_active
) VALUES
(
  'TBR-03',
  'Trust Building & Repair',
  'The ability to build, maintain, and repair trust in professional relationships through consistent demonstration of reliability, integrity, and accountability. Encompasses the BRAVING framework (Boundaries, Reliability, Accountability, Vault, Integrity, Non-judgment, Generosity).',
  NULL,
  1,
  '[
    {"level": 1, "name": "Awareness", "description": "Recognizes the importance of trust in relationships"},
    {"level": 2, "name": "Developing", "description": "Demonstrates basic trust-building behaviors"},
    {"level": 3, "name": "Proficient", "description": "Consistently builds and maintains trust"},
    {"level": 4, "name": "Advanced", "description": "Expertly repairs broken trust and models trust-building"}
  ]'::jsonb,
  'BRAVING Framework (Brené Brown)',
  ARRAY['trust', 'relationships', 'integrity', 'accountability'],
  true
),
(
  'AC-06',
  'Adaptive Communication',
  'The capacity to adjust communication style, tone, and approach based on audience, context, and situational demands. Includes active listening, empathy, and flexible message delivery.',
  NULL,
  1,
  '[
    {"level": 1, "name": "Awareness", "description": "Recognizes different communication styles exist"},
    {"level": 2, "name": "Developing", "description": "Attempts to adapt communication in simple contexts"},
    {"level": 3, "name": "Proficient", "description": "Effectively adapts communication across diverse situations"},
    {"level": 4, "name": "Advanced", "description": "Seamlessly adjusts communication and coaches others"}
  ]'::jsonb,
  'Situational Leadership Model',
  ARRAY['communication', 'adaptability', 'interpersonal', 'active-listening'],
  true
),
(
  'EI-02',
  'Emotional Intelligence',
  'The ability to recognize, understand, and manage one''s own emotions while also perceiving and influencing the emotions of others. Encompasses self-awareness, self-regulation, motivation, empathy, and social skills.',
  NULL,
  1,
  '[
    {"level": 1, "name": "Awareness", "description": "Recognizes emotions in self and others"},
    {"level": 2, "name": "Developing", "description": "Begins to regulate emotional responses"},
    {"level": 3, "name": "Proficient", "description": "Effectively manages emotions and responds empathetically"},
    {"level": 4, "name": "Advanced", "description": "Masters emotional regulation and guides others"}
  ]'::jsonb,
  'Goleman Emotional Intelligence Framework',
  ARRAY['emotional-intelligence', 'self-awareness', 'empathy', 'self-regulation'],
  true
),
(
  'EL-05',
  'Ethical Leadership',
  'The practice of leading with integrity, demonstrating ethical decision-making, and creating environments where values-based choices are encouraged and supported. Balances organizational needs with ethical principles.',
  NULL,
  1,
  '[
    {"level": 1, "name": "Awareness", "description": "Recognizes ethical dimensions of decisions"},
    {"level": 2, "name": "Developing", "description": "Attempts to align decisions with stated values"},
    {"level": 3, "name": "Proficient", "description": "Consistently demonstrates ethical leadership"},
    {"level": 4, "name": "Advanced", "description": "Champions ethical culture and navigates complex dilemmas"}
  ]'::jsonb,
  'Ethical Leadership Theory',
  ARRAY['ethics', 'leadership', 'integrity', 'values'],
  true
),
(
  'VBD-01',
  'Values-Based Decision-Making',
  'The capacity to make decisions that align personal and organizational values with actions, especially under pressure. Considers stakeholder impact, long-term consequences, and ethical implications.',
  NULL,
  1,
  '[
    {"level": 1, "name": "Awareness", "description": "Identifies personal and organizational values"},
    {"level": 2, "name": "Developing", "description": "Considers values when making routine decisions"},
    {"level": 3, "name": "Proficient", "description": "Consistently applies values framework to complex decisions"},
    {"level": 4, "name": "Advanced", "description": "Expertly navigates value conflicts and models values-based reasoning"}
  ]'::jsonb,
  'BRAVIN Values Framework',
  ARRAY['values', 'decision-making', 'ethics', 'judgment'],
  true
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  proficiency_levels = EXCLUDED.proficiency_levels,
  industry_standard = EXCLUDED.industry_standard,
  tags = EXCLUDED.tags,
  updated_at = now();

-- ============================================================================
-- SEED: Global Weight Matrix
-- ============================================================================

-- First, store competency IDs in temporary variables
DO $$
DECLARE
  v_tbr_03_id uuid;
  v_ac_06_id uuid;
  v_ei_02_id uuid;
  v_el_05_id uuid;
  v_vbd_01_id uuid;
BEGIN
  -- Get competency IDs
  SELECT id INTO v_tbr_03_id FROM competencies WHERE code = 'TBR-03';
  SELECT id INTO v_ac_06_id FROM competencies WHERE code = 'AC-06';
  SELECT id INTO v_ei_02_id FROM competencies WHERE code = 'EI-02';
  SELECT id INTO v_el_05_id FROM competencies WHERE code = 'EL-05';
  SELECT id INTO v_vbd_01_id FROM competencies WHERE code = 'VBD-01';

  -- TBR-03: Trust Building & Repair
  -- BRAVIN: 0.3, Trust: 0.5, EI: 0.2, Ethical: 0.0
  INSERT INTO competency_metric_weights_global (competency_id, metric_type, weight)
  VALUES
    (v_tbr_03_id, 'bravin_alignment', 0.3),
    (v_tbr_03_id, 'trust_impact', 0.5),
    (v_tbr_03_id, 'emotional_intelligence_index', 0.2),
    (v_tbr_03_id, 'ethical_decision_quality', 0.0)
  ON CONFLICT (competency_id, metric_type) DO UPDATE SET
    weight = EXCLUDED.weight,
    updated_at = now();

  -- AC-06: Adaptive Communication
  -- BRAVIN: 0.2, Trust: 0.3, EI: 0.5, Ethical: 0.0
  INSERT INTO competency_metric_weights_global (competency_id, metric_type, weight)
  VALUES
    (v_ac_06_id, 'bravin_alignment', 0.2),
    (v_ac_06_id, 'trust_impact', 0.3),
    (v_ac_06_id, 'emotional_intelligence_index', 0.5),
    (v_ac_06_id, 'ethical_decision_quality', 0.0)
  ON CONFLICT (competency_id, metric_type) DO UPDATE SET
    weight = EXCLUDED.weight,
    updated_at = now();

  -- EI-02: Emotional Intelligence
  -- BRAVIN: 0.2, Trust: 0.3, EI: 0.5, Ethical: 0.0
  INSERT INTO competency_metric_weights_global (competency_id, metric_type, weight)
  VALUES
    (v_ei_02_id, 'bravin_alignment', 0.2),
    (v_ei_02_id, 'trust_impact', 0.3),
    (v_ei_02_id, 'emotional_intelligence_index', 0.5),
    (v_ei_02_id, 'ethical_decision_quality', 0.0)
  ON CONFLICT (competency_id, metric_type) DO UPDATE SET
    weight = EXCLUDED.weight,
    updated_at = now();

  -- EL-05: Ethical Leadership
  -- BRAVIN: 0.3, Trust: 0.1, EI: 0.1, Ethical: 0.5
  INSERT INTO competency_metric_weights_global (competency_id, metric_type, weight)
  VALUES
    (v_el_05_id, 'bravin_alignment', 0.3),
    (v_el_05_id, 'trust_impact', 0.1),
    (v_el_05_id, 'emotional_intelligence_index', 0.1),
    (v_el_05_id, 'ethical_decision_quality', 0.5)
  ON CONFLICT (competency_id, metric_type) DO UPDATE SET
    weight = EXCLUDED.weight,
    updated_at = now();

  -- VBD-01: Values-Based Decision-Making
  -- BRAVIN: 0.4, Trust: 0.1, EI: 0.1, Ethical: 0.4
  INSERT INTO competency_metric_weights_global (competency_id, metric_type, weight)
  VALUES
    (v_vbd_01_id, 'bravin_alignment', 0.4),
    (v_vbd_01_id, 'trust_impact', 0.1),
    (v_vbd_01_id, 'emotional_intelligence_index', 0.1),
    (v_vbd_01_id, 'ethical_decision_quality', 0.4)
  ON CONFLICT (competency_id, metric_type) DO UPDATE SET
    weight = EXCLUDED.weight,
    updated_at = now();

END $$;

-- ============================================================================
-- VERIFICATION: Display Seeded Data
-- ============================================================================

-- Display competencies
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count FROM competencies WHERE code IN ('TBR-03', 'AC-06', 'EI-02', 'EL-05', 'VBD-01');
  RAISE NOTICE 'Seeded % target competencies', v_count;

  SELECT COUNT(*) INTO v_count FROM competency_metric_weights_global;
  RAISE NOTICE 'Seeded % weight mappings', v_count;
END $$;
