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

async function checkAllData() {
  console.log('\n=== Checking All Simulation and Scenario Data ===\n');

  // Check simulations
  const { data: sims, error: simError } = await supabase
    .from('simulations')
    .select('id, name, display_name, status')
    .limit(10);

  if (simError) {
    console.error('Error fetching simulations:', simError);
  } else {
    console.log(`Found ${sims.length} simulations:`);
    sims.forEach((sim, idx) => {
      console.log(`  ${idx + 1}. ${sim.display_name || sim.name} (${sim.id}) - ${sim.status}`);
    });
  }

  // Check simulation_scenarios
  const { data: simScenarios, error: simScenError } = await supabase
    .from('simulation_scenarios')
    .select('id, simulation_id, scenario_id, is_entry_point')
    .limit(10);

  if (simScenError) {
    console.error('Error fetching simulation_scenarios:', simScenError);
  } else {
    console.log(`\nFound ${simScenarios.length} simulation_scenarios mappings:`);
    simScenarios.forEach((ss, idx) => {
      console.log(`  ${idx + 1}. Sim: ${ss.simulation_id}, Scenario: ${ss.scenario_id}, Entry: ${ss.is_entry_point}`);
    });
  }

  // Check scenarios
  const { data: scenarios, error: scenError } = await supabase
    .from('scenarios')
    .select('id, title, timer_enabled, timer_visible, timer_display_location, timer_type')
    .limit(10);

  if (scenError) {
    console.error('Error fetching scenarios:', scenError);
  } else {
    console.log(`\nFound ${scenarios.length} scenarios:`);
    scenarios.forEach((sc, idx) => {
      console.log(`  ${idx + 1}. ${sc.title} (${sc.id})`);
      console.log(`     Timer: enabled=${sc.timer_enabled}, visible=${sc.timer_visible}, location=${sc.timer_display_location}, type=${sc.timer_type}`);
    });
  }

  // Get one full simulation with scenarios
  if (sims && sims.length > 0) {
    const simId = sims[0].id;
    console.log(`\n=== Detailed view of simulation: ${sims[0].display_name || sims[0].name} ===\n`);

    const { data: fullSim, error: fullError } = await supabase
      .from('simulation_scenarios')
      .select(`
        id,
        simulation_id,
        scenario_id,
        is_entry_point,
        sequence_order,
        scenarios (
          id,
          title,
          timer_enabled,
          timer_visible,
          timer_display_location,
          timer_type,
          timer_limit_seconds,
          timer_warning_threshold_seconds
        )
      `)
      .eq('simulation_id', simId);

    if (fullError) {
      console.error('Error fetching full simulation:', fullError);
    } else {
      console.log(`Found ${fullSim.length} scenarios in this simulation:`);
      fullSim.forEach((ss, idx) => {
        const sc = ss.scenarios;
        console.log(`\n  ${idx + 1}. ${sc.title}`);
        console.log(`     Entry Point: ${ss.is_entry_point}`);
        console.log(`     Sequence: ${ss.sequence_order}`);
        console.log(`     Timer Config:`);
        console.log(`       - Enabled: ${sc.timer_enabled}`);
        console.log(`       - Visible: ${sc.timer_visible}`);
        console.log(`       - Location: ${sc.timer_display_location}`);
        console.log(`       - Type: ${sc.timer_type}`);
        console.log(`       - Limit: ${sc.timer_limit_seconds} seconds`);
        console.log(`       - Warning: ${sc.timer_warning_threshold_seconds} seconds`);

        const shouldShow = sc.timer_enabled &&
                           sc.timer_visible &&
                           (sc.timer_display_location === 'question_page' ||
                            sc.timer_display_location === 'all');
        console.log(`       - Should show: ${shouldShow ? '✓ YES' : '✗ NO'}`);
      });
    }
  }
}

checkAllData();
