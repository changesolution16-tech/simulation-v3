import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestData() {
  console.log('\n=== Creating Test Simulation with Timer ===\n');

  // First, log in as admin or create a user context
  // For now, we'll try to use the anon key and see what happens

  // Step 1: Create a simulation category
  console.log('1. Creating simulation category...');
  const { data: category, error: catError } = await supabase
    .from('simulation_categories')
    .insert({
      name: 'Test Category',
      slug: 'test-category',
      description: 'Test category for timer testing',
      icon: 'TestTube',
      color: '#3B82F6',
      display_order: 1,
      is_active: true
    })
    .select()
    .single();

  if (catError) {
    console.error('   Error creating category:', catError);
    console.log('   (This might be okay if category already exists)');
  } else {
    console.log('   ✓ Category created:', category.id);
  }

  // Step 2: Create a topic
  console.log('\n2. Creating topic...');
  const { data: topic, error: topicError } = await supabase
    .from('topics')
    .insert({
      slug: 'test-topic',
      title: 'Test Topic',
      description: 'Test topic for timer testing',
      icon: 'TestTube',
      is_active: true
    })
    .select()
    .single();

  if (topicError) {
    console.error('   Error creating topic:', topicError);
    console.log('   (This might be okay if topic already exists)');
  } else {
    console.log('   ✓ Topic created:', topic.id);
  }

  // Step 3: Create a simulation
  console.log('\n3. Creating simulation...');
  const { data: simulation, error: simError } = await supabase
    .from('simulations')
    .insert({
      name: 'test-timer-simulation',
      display_name: 'Test Timer Simulation',
      description: 'A test simulation to verify timer functionality',
      difficulty: 'beginner',
      estimated_duration_minutes: 10,
      status: 'published',
      landing_page_enabled: false,
      introduction_page_enabled: true,
      introduction_title: 'Timer Test',
      introduction_description: 'This simulation tests the decision timer',
      closing_page_enabled: false,
      closing_title: 'Results',
      closing_analysis_type: 'score',
      closing_recommendations_enabled: false,
      closing_page_show_before_results: false,
      closing_excellent_threshold: 80,
      closing_good_threshold: 60,
      landing_fiction_contract: 'I agree',
      landing_objectives: [],
      tags: ['test']
    })
    .select()
    .single();

  if (simError) {
    console.error('   Error creating simulation:', simError);
    return;
  }
  console.log('   ✓ Simulation created:', simulation.id);

  // Step 4: Create scenarios with timer enabled
  console.log('\n4. Creating scenario with timer enabled...');
  const { data: scenario, error: scenError } = await supabase
    .from('scenarios')
    .insert({
      title: 'Test Decision with Timer',
      description: 'Make a decision - the timer should be visible',
      topic_id: topic?.id || null,
      difficulty: 'beginner',
      is_end_scenario: true,
      content_status: 'complete',
      question_text: 'What would you do in this situation?',

      // Timer configuration - THIS IS THE KEY PART
      timer_enabled: true,
      timer_visible: true,
      timer_display_location: 'all',  // Show on all pages
      timer_type: 'count_up',
      timer_limit_seconds: null,
      timer_warning_threshold_seconds: 30,
      show_timer_in_feedback: true
    })
    .select()
    .single();

  if (scenError) {
    console.error('   Error creating scenario:', scenError);
    return;
  }
  console.log('   ✓ Scenario created:', scenario.id);
  console.log('   Timer Config:');
  console.log('     - Enabled:', scenario.timer_enabled);
  console.log('     - Visible:', scenario.timer_visible);
  console.log('     - Location:', scenario.timer_display_location);
  console.log('     - Type:', scenario.timer_type);

  // Step 5: Create scenario options
  console.log('\n5. Creating scenario options...');
  const options = [
    { text: 'Option A: Do this', feedback_beginner: 'Good choice!', order_index: 0 },
    { text: 'Option B: Do that', feedback_beginner: 'Interesting approach.', order_index: 1 },
    { text: 'Option C: Do something else', feedback_beginner: 'That works too.', order_index: 2 }
  ];

  for (const opt of options) {
    const { data: option, error: optError } = await supabase
      .from('scenario_options')
      .insert({
        scenario_id: scenario.id,
        text: opt.text,
        feedback_beginner: opt.feedback_beginner,
        feedback_intermediate: opt.feedback_beginner,
        feedback_advanced: opt.feedback_beginner,
        next_scenario_id: null,
        order_index: opt.order_index
      })
      .select()
      .single();

    if (optError) {
      console.error(`   Error creating option "${opt.text}":`, optError);
    } else {
      console.log(`   ✓ Option created: ${opt.text}`);
    }
  }

  // Step 6: Link scenario to simulation
  console.log('\n6. Linking scenario to simulation...');
  const { data: link, error: linkError } = await supabase
    .from('simulation_scenarios')
    .insert({
      simulation_id: simulation.id,
      scenario_id: scenario.id,
      is_entry_point: true,
      is_exit_point: true,
      sequence_order: 0,
      position_x: 100,
      position_y: 100
    })
    .select()
    .single();

  if (linkError) {
    console.error('   Error linking scenario:', linkError);
  } else {
    console.log('   ✓ Scenario linked to simulation');
  }

  console.log('\n========================================');
  console.log('✓ Test simulation created successfully!');
  console.log('========================================');
  console.log('\nSimulation ID:', simulation.id);
  console.log('Scenario ID:', scenario.id);
  console.log('\nYou can now test the timer by:');
  console.log('1. Starting this simulation');
  console.log('2. The timer should appear on the question page');
  console.log('\n');
}

createTestData().catch(console.error);
