/*
  # Create "More than a Meeting" - Level 1: The Alignment Meeting Scenario
  
  ## Overview
  This migration creates the Level 1 scenario "The Alignment Meeting" with automated
  scoring based on BRAVIN metrics and competency-weighted calculations per the provided logic table.
  
  ## Scenario Details
  **Context**: Two teams arrive at a quarterly alignment meeting with conflicting proposals.
  The Product team prioritizes feature velocity; Customer Success demands stability.
  
  **Response Options & Metric Scores** (0-100 scale):
  - R1: Push for consensus (30, 25, 20, 40) → Awareness level
  - R2: Ask teams to present separately (50, 50, 40, 60) → Developing level
  - R3: Pause and name emotional tone (80, 75, 80, 80) → Proficient level
  - R4: Invite shared storytelling (100, 100, 100, 100) → Advanced level
  
  ## Competency Weightings
  Each of five competencies uses a weighted formula:
  - TBR-03: BRAVIN×0.3 + Trust×0.5 + EI×0.2
  - AC-06: BRAVIN×0.2 + Trust×0.3 + EI×0.5
  - EI-02: BRAVIN×0.2 + Trust×0.3 + EI×0.5
  - EL-05: BRAVIN×0.3 + Trust×0.1 + EI×0.1 + Ethics×0.5
  - VBD-01: BRAVIN×0.4 + Trust×0.1 + EI×0.1 + Ethics×0.4
  
  ## Proficiency Mapping
  - 0-29: Awareness
  - 30-59: Developing
  - 60-79: Proficient
  - 80-100: Advanced
*/

DO $$
DECLARE
  v_simulation_id uuid;
  v_topic_id uuid := '53a8da92-285e-4fb0-904d-f56b88bc492d'; -- Effective Communication topic
  v_scenario_id uuid;
  
  v_option_r1_id uuid;
  v_option_r2_id uuid;
  v_option_r3_id uuid;
  v_option_r4_id uuid;
  
  v_bravin_metric_id uuid;
  v_trust_metric_id uuid;
  v_ei_metric_id uuid;
  v_ethical_metric_id uuid;
  
  v_tbr03_id uuid;
  v_ac06_id uuid;
  v_ei02_id uuid;
  v_el05_id uuid;
  v_vbd01_id uuid;
BEGIN
  -- Fetch metric IDs
  SELECT id INTO v_bravin_metric_id FROM assessment_metrics WHERE metric_type = 'bravin_alignment' LIMIT 1;
  SELECT id INTO v_trust_metric_id FROM assessment_metrics WHERE metric_type = 'trust_impact' LIMIT 1;
  SELECT id INTO v_ei_metric_id FROM assessment_metrics WHERE metric_type = 'emotional_intelligence_index' LIMIT 1;
  SELECT id INTO v_ethical_metric_id FROM assessment_metrics WHERE metric_type = 'ethical_decision_quality' LIMIT 1;
  
  -- Fetch competency IDs
  SELECT id INTO v_tbr03_id FROM competencies WHERE code = 'TBR-03';
  SELECT id INTO v_ac06_id FROM competencies WHERE code = 'AC-06';
  SELECT id INTO v_ei02_id FROM competencies WHERE code = 'EI-02';
  SELECT id INTO v_el05_id FROM competencies WHERE code = 'EL-05';
  SELECT id INTO v_vbd01_id FROM competencies WHERE code = 'VBD-01';
  
  -- Create simulation
  INSERT INTO simulations (
    name,
    display_name,
    description,
    difficulty,
    estimated_duration_minutes,
    status,
    landing_page_enabled,
    landing_title,
    landing_description,
    landing_objectives
  ) VALUES (
    'more-than-a-meeting',
    'More than a Meeting',
    'Master the art of facilitation by navigating conflicting team perspectives with emotional intelligence and values-based leadership.',
    'intermediate',
    15,
    'published',
    true,
    'More than a Meeting: The Alignment Challenge',
    'Two teams arrive at your quarterly alignment meeting with conflicting proposals. The Product team wants feature velocity. Customer Success demands stability. Tension fills the room. As the facilitator, your response will determine whether this becomes a breakthrough or a breakdown.',
    jsonb_build_array(
      'Build and repair trust in high-stakes situations',
      'Adapt communication to emotionally charged contexts',
      'Demonstrate emotional intelligence by naming group dynamics',
      'Practice ethical leadership balancing stakeholder needs',
      'Make values-based decisions aligned with BRAVIN principles'
    )
  ) RETURNING id INTO v_simulation_id;
  
  -- Create scenario
  v_scenario_id := gen_random_uuid();
  INSERT INTO scenarios (
    id,
    topic_id,
    title,
    description,
    difficulty,
    level_number,
    is_end_scenario,
    is_published,
    version
  ) VALUES (
    v_scenario_id,
    v_topic_id,
    'The Alignment Meeting',
    'The Product team wants to prioritize feature velocity. The Customer Success team insists on stability and bug fixes. Both teams are visibly frustrated—arms crossed, avoiding eye contact. The room is tense. As facilitator, how do you respond?',
    'intermediate',
    1,
    true,
    true,
    1
  );
  
  -- Link to simulation
  INSERT INTO simulation_scenarios (simulation_id, scenario_id, is_entry_point, is_exit_point, sequence_order)
  VALUES (v_simulation_id, v_scenario_id, true, true, 1);
  
  -- ============================================================================
  -- Create response options with feedback
  -- ============================================================================
  
  -- R1: Push for consensus quickly (Awareness: 30.5, 27.5, 27.5, 35.5, 35.5)
  v_option_r1_id := gen_random_uuid();
  INSERT INTO scenario_options (
    id, scenario_id, option_text, option_order, is_optimal_choice,
    feedback_beginner, feedback_intermediate, feedback_advanced
  ) VALUES (
    v_option_r1_id, v_scenario_id,
    'Push for consensus quickly—we need to move forward',
    1, false,
    'While urgency matters, rushing suppresses perspectives and harms psychological safety. Scores: BRAVIN 30%, Trust 25%, EI 20%, Ethics 40%. All competencies at Awareness level (27-36%). When we prioritize speed over understanding, what gets lost?',
    'This shows awareness of time pressure but misses emotional dynamics. Your competency scores (TBR-03: 30.5%, AC-06: 27.5%, EI-02: 27.5%, EL-05: 35.5%, VBD-01: 35.5%) indicate you recognize the need for action but haven''t yet developed the skills to create psychological safety while driving outcomes.',
    'From an advanced perspective, this reveals a fundamental misunderstanding of how high-performing teams work. Trust and psychological safety aren''t obstacles to speed—they''re accelerants. Your awareness-level scores suggest studying facilitation frameworks like Skilled Facilitator and psychological safety research by Amy Edmondson.'
  );
  
  -- R2: Ask teams to present separately (Developing: 49%, 49%, 49%, 59%, 59%)
  v_option_r2_id := gen_random_uuid();
  INSERT INTO scenario_options (
    id, scenario_id, option_text, option_order, is_optimal_choice,
    feedback_beginner, feedback_intermediate, feedback_advanced
  ) VALUES (
    v_option_r2_id, v_scenario_id,
    'Ask each team to present their proposals separately to ensure fair hearing',
    2, false,
    'Good structure! You''re creating fairness through equal time. Scores: BRAVIN 50%, Trust 50%, EI 40%, Ethics 60%. All competencies at Developing level (49-59%). This works, but consider: what emotional needs exist before we dive into solutions?',
    'This demonstrates developing competency—you''re applying facilitation techniques with some success. Your scores (TBR-03: 49%, AC-06: 49%, EI-02: 49%, EL-05: 59%, VBD-01: 59%) show you''re building skills in ethical process design. The next level requires reading the emotional field and addressing it before structure.',
    'You''re using a classic facilitation pattern: separate presentations prevent escalation. However, at the advanced level, we recognize that unaddressed emotional tension will contaminate even the best-structured process. The art is naming the emotion first, then choosing structure.'
  );
  
  -- R3: Pause and name emotional tone (Proficient: 77.5%, 78.5%, 78.5%, 79.5%, 79.5%)
  v_option_r3_id := gen_random_uuid();
  INSERT INTO scenario_options (
    id, scenario_id, option_text, option_order, is_optimal_choice,
    feedback_beginner, feedback_intermediate, feedback_advanced
  ) VALUES (
    v_option_r3_id, v_scenario_id,
    'Pause to acknowledge and name the emotional tone in the room',
    3, true,
    'Excellent! Naming emotions creates safety and models vulnerability. Scores: BRAVIN 80%, Trust 75%, EI 80%, Ethics 80%. All competencies Proficient (77.5-79.5%). You''re leaning into discomfort—hallmark of emotionally intelligent leadership aligned with BRAVIN values of Nurturance and Integrity.',
    'Outstanding emotional intelligence! By naming the reality others feel but fear speaking, you''ve created an invitation for authentic dialogue. Your proficient-level scores (TBR-03: 77.5%, AC-06: 78.5%, EI-02: 78.5%, EL-05: 79.5%, VBD-01: 79.5%) demonstrate mastery of foundational leadership practices.',
    'This is textbook psychological safety creation. You''ve recognized that surface-level conflict often masks deeper concerns about respect, autonomy, and fairness. By naming the emotion, you''re modeling the vulnerability that makes truth-telling possible. This reflects deep understanding of Kegan''s immunity to change and Edmondson''s fearless organization principles.'
  );
  
  -- R4: Invite shared storytelling (Advanced: 100%, 100%, 100%, 100%, 100%)
  v_option_r4_id := gen_random_uuid();
  INSERT INTO scenario_options (
    id, scenario_id, option_text, option_order, is_optimal_choice,
    feedback_beginner, feedback_intermediate, feedback_advanced
  ) VALUES (
    v_option_r4_id, v_scenario_id,
    'Invite each team to share the story behind their proposal—what they care about and why it matters',
    4, true,
    'Outstanding! Perfect scores across all metrics (100%). Advanced competency in everything (all 100%). By inviting storytelling, you create space for vulnerability and connection. This embodies BRAVIN: Boldness (naming what matters), Responsibility (creating dialogue), Accountability (emotional safety), Vision (seeing beyond proposals), Integrity (honoring perspectives), Nurturance (caring for experience). You''re not just resolving conflict—you''re building organizational capacity for trust.',
    'Masterful facilitation. Storytelling transforms debate into dialogue by surfacing values, not just positions. Your advanced-level scores (all competencies 100%) reflect deep integration of facilitation theory and practice. You''ve recognized that sustainable agreements emerge from shared meaning, not negotiated positions.',
    'This demonstrates the highest form of leadership: creating conditions for collective sense-making. By inviting story, you''re employing narrative theory, polyvagal approaches to nervous system regulation, and constructive-developmental psychology. You understand that people don''t resist change—they resist being changed. Story gives them agency to discover new possibilities together. This is transformational leadership in action.'
  );
  
  -- ============================================================================
  -- Configure metric scores (using correct 0-100 scale, not 0-1)
  -- ============================================================================
  
  -- R1: Awareness Level
  INSERT INTO scenario_option_metrics (scenario_id, option_id, metric_id, score_value, weight, is_primary_metric) VALUES
    (v_scenario_id, v_option_r1_id, v_bravin_metric_id, 30, 1.0, true),
    (v_scenario_id, v_option_r1_id, v_trust_metric_id, 25, 1.0, false),
    (v_scenario_id, v_option_r1_id, v_ei_metric_id, 20, 1.0, false),
    (v_scenario_id, v_option_r1_id, v_ethical_metric_id, 40, 1.0, false);
  
  -- R2: Developing Level
  INSERT INTO scenario_option_metrics (scenario_id, option_id, metric_id, score_value, weight, is_primary_metric) VALUES
    (v_scenario_id, v_option_r2_id, v_bravin_metric_id, 50, 1.0, true),
    (v_scenario_id, v_option_r2_id, v_trust_metric_id, 50, 1.0, false),
    (v_scenario_id, v_option_r2_id, v_ei_metric_id, 40, 1.0, false),
    (v_scenario_id, v_option_r2_id, v_ethical_metric_id, 60, 1.0, false);
  
  -- R3: Proficient Level
  INSERT INTO scenario_option_metrics (scenario_id, option_id, metric_id, score_value, weight, is_primary_metric) VALUES
    (v_scenario_id, v_option_r3_id, v_bravin_metric_id, 80, 1.0, true),
    (v_scenario_id, v_option_r3_id, v_trust_metric_id, 75, 1.0, false),
    (v_scenario_id, v_option_r3_id, v_ei_metric_id, 80, 1.0, false),
    (v_scenario_id, v_option_r3_id, v_ethical_metric_id, 80, 1.0, false);
  
  -- R4: Advanced Level
  INSERT INTO scenario_option_metrics (scenario_id, option_id, metric_id, score_value, weight, is_primary_metric) VALUES
    (v_scenario_id, v_option_r4_id, v_bravin_metric_id, 100, 1.0, true),
    (v_scenario_id, v_option_r4_id, v_trust_metric_id, 100, 1.0, false),
    (v_scenario_id, v_option_r4_id, v_ei_metric_id, 100, 1.0, false),
    (v_scenario_id, v_option_r4_id, v_ethical_metric_id, 100, 1.0, false);
  
  -- Link competencies to simulation
  INSERT INTO simulation_competencies (simulation_id, competency_id, is_primary, target_level, show_in_results, display_order) VALUES
    (v_simulation_id, v_tbr03_id, true, 3, true, 1),
    (v_simulation_id, v_ac06_id, true, 3, true, 2),
    (v_simulation_id, v_ei02_id, true, 3, true, 3),
    (v_simulation_id, v_el05_id, true, 3, true, 4),
    (v_simulation_id, v_vbd01_id, true, 3, true, 5);
  
  RAISE NOTICE 'Created simulation: % (%)', v_simulation_id, 'More than a Meeting';
  RAISE NOTICE 'Created scenario: % (%)', v_scenario_id, 'The Alignment Meeting';
  RAISE NOTICE 'Configured 4 response options with metric scores and competency mappings';
END $$;