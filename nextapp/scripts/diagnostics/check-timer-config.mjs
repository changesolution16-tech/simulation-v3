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

async function checkTimerConfiguration() {
  console.log('\n=== Checking Timer Configuration ===\n');

  const { data: scenarios, error } = await supabase
    .from('scenarios')
    .select(`
      id,
      title,
      timer_enabled,
      timer_visible,
      timer_display_location,
      timer_type,
      timer_limit_seconds,
      timer_warning_threshold_seconds,
      show_timer_in_feedback
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching scenarios:', error);
    return;
  }

  console.log(`Found ${scenarios.length} scenarios\n`);

  scenarios.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario.title}`);
    console.log(`   ID: ${scenario.id}`);
    console.log(`   Timer Enabled: ${scenario.timer_enabled}`);
    console.log(`   Timer Visible: ${scenario.timer_visible}`);
    console.log(`   Display Location: ${scenario.timer_display_location}`);
    console.log(`   Timer Type: ${scenario.timer_type}`);
    console.log(`   Time Limit: ${scenario.timer_limit_seconds} seconds`);
    console.log(`   Warning Threshold: ${scenario.timer_warning_threshold_seconds} seconds`);
    console.log(`   Show in Feedback: ${scenario.show_timer_in_feedback}`);

    const shouldShow = scenario.timer_enabled &&
                       scenario.timer_visible &&
                       (scenario.timer_display_location === 'question_page' ||
                        scenario.timer_display_location === 'all');
    console.log(`   ✓ Should show on question page: ${shouldShow ? 'YES' : 'NO'}`);
    console.log('');
  });

  const { data: simulations, error: simError } = await supabase
    .from('simulations')
    .select(`
      id,
      name,
      display_name,
      status
    `)
    .eq('status', 'published')
    .limit(5);

  if (!simError && simulations) {
    console.log('\n=== Published Simulations ===\n');
    simulations.forEach((sim, index) => {
      console.log(`${index + 1}. ${sim.display_name || sim.name} (${sim.id})`);
    });
  }
}

checkTimerConfiguration();
