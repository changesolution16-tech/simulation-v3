DO $$
DECLARE
  v_simulation_id uuid;
  v_topic_id uuid := '53a8da92-285e-4fb0-904d-f56b88bc492d';
  v_scenario_1_id uuid;
  v_opt_1a_id uuid;
  v_opt_1b_id uuid;
  v_opt_1c_id uuid;
  v_opt_1d_id uuid;
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
  SELECT id INTO v_bravin_metric_id FROM assessment_metrics WHERE metric_type = 'bravin_alignment' LIMIT 1;
  SELECT id INTO v_trust_metric_id FROM assessment_metrics WHERE metric_type = 'trust_impact' LIMIT 1;
  SELECT id INTO v_ei_metric_id FROM assessment_metrics WHERE metric_type = 'emotional_intelligence_index' LIMIT 1;
  SELECT id INTO v_ethical_metric_id FROM assessment_metrics WHERE metric_type = 'ethical_decision_quality' LIMIT 1;
  
  SELECT id INTO v_tbr03_id FROM competencies WHERE code = 'TBR-03';
  SELECT id INTO v_ac06_id FROM competencies WHERE code = 'AC-06';
  SELECT id INTO v_ei02_id FROM competencies WHERE code = 'EI-02';
  SELECT id INTO v_el05_id FROM competencies WHERE code = 'EL-05';
  SELECT id INTO v_vbd01_id FROM competencies WHERE code = 'VBD-01';

  INSERT INTO simulations (
    name, display_name, description, difficulty, estimated_duration_minutes, status,
    landing_page_enabled, landing_title, landing_description, landing_objectives,
    landing_role_description, landing_fiction_contract,
    introduction_page_enabled, introduction_title, introduction_description,
    closing_page_enabled, closing_title, closing_analysis_type,
    closing_recommendations_enabled, closing_page_show_before_results,
    closing_excellent_threshold, closing_good_threshold
  ) VALUES (
    'leadership-challenges-beginner',
    'Leadership Challenges: Navigating Team Dynamics',
    'Master essential leadership skills by navigating four interconnected challenges.',
    'beginner', 20, 'published',
    true, 'Leadership Challenges: Your Journey Begins',
    'Navigate complex team dynamics through four challenges.',
    jsonb_build_array('Build trust', 'Adapt communication', 'Show emotional intelligence'),
    'You are a newly promoted team lead.',
    'I agree to engage fully in this simulation.',
    true, 'Welcome to Your Leadership Journey',
    'Leadership is about creating conditions for teams to succeed.',
    true, 'Leadership Reflection and Growth', 'comprehensive',
    true, false, 80, 60
  ) RETURNING id INTO v_simulation_id;

  INSERT INTO simulation_competencies (simulation_id, competency_id, is_primary, target_level, show_in_results, display_order) VALUES
    (v_simulation_id, v_tbr03_id, true, 2, true, 1),
    (v_simulation_id, v_ac06_id, true, 2, true, 2),
    (v_simulation_id, v_ei02_id, true, 2, true, 3),
    (v_simulation_id, v_el05_id, true, 2, true, 4),
    (v_simulation_id, v_vbd01_id, true, 2, true, 5);

  RAISE NOTICE 'Created simulation: %', v_simulation_id;
END $$;