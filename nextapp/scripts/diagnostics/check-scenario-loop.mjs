import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Get any simulation
const { data: sim } = await supabase
  .from('simulations')
  .select('id, display_name, status')
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();

if (!sim) {
  console.log('No simulations found');
  process.exit(0);
}

console.log('Simulation:', sim.display_name, '(' + sim.id + ')');
console.log('Status:', sim.status);
console.log('');

// Get scenarios in this simulation
const { data: simScenarios } = await supabase
  .from('simulation_scenarios')
  .select('scenario_id, sequence_order, is_entry_point, is_exit_point')
  .eq('simulation_id', sim.id)
  .order('sequence_order');

if (!simScenarios || simScenarios.length === 0) {
  console.log('No scenarios in simulation');
  process.exit(0);
}

console.log('Scenarios in simulation:', simScenarios.length);
console.log('');

// Get details for each scenario
for (const ss of simScenarios) {
  const { data: scenario } = await supabase
    .from('scenarios')
    .select('id, title, is_end_scenario')
    .eq('id', ss.scenario_id)
    .maybeSingle();
  
  if (!scenario) continue;
  
  console.log('---');
  console.log('Scenario:', scenario.title);
  console.log('  ID:', scenario.id);
  console.log('  Sequence:', ss.sequence_order);
  console.log('  Entry Point:', ss.is_entry_point);
  console.log('  Exit Point:', ss.is_exit_point);
  console.log('  End Scenario:', scenario.is_end_scenario);
  
  // Get options and their connections
  const { data: options } = await supabase
    .from('scenario_options')
    .select('id, option_text, next_scenario_id')
    .eq('scenario_id', scenario.id);
  
  if (options && options.length > 0) {
    console.log('  Options:', options.length);
    for (const opt of options) {
      console.log('    -', opt.option_text?.substring(0, 50) + '...');
      console.log('      Next Scenario ID:', opt.next_scenario_id || 'NONE');
      
      if (opt.next_scenario_id) {
        const { data: nextScen } = await supabase
          .from('scenarios')
          .select('title')
          .eq('id', opt.next_scenario_id)
          .maybeSingle();
        
        if (nextScen) {
          console.log('      Next Scenario:', nextScen.title);
        } else {
          console.log('      ERROR: Next scenario not found!');
        }
      }
    }
  } else {
    console.log('  Options: NONE');
  }
}
