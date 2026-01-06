import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkScenarioData() {
  console.log('=== Current Scenario and Video Data ===\n');
  
  const { data: sims } = await supabase
    .from('simulations')
    .select('id, display_name, difficulty, status')
    .limit(5);

  console.log('Simulations:', sims ? sims.length : 0);
  if (sims && sims.length > 0) {
    for (const sim of sims) {
      console.log('\n--- Simulation: ' + sim.display_name + ' [' + sim.difficulty + '] ---');
      
      const { data: simScenarios } = await supabase
        .from('simulation_scenarios')
        .select('scenario_id, sequence_order, is_entry_point, is_exit_point')
        .eq('simulation_id', sim.id)
        .order('sequence_order');

      console.log('  Linked scenarios: ' + (simScenarios ? simScenarios.length : 0));
      
      if (simScenarios) {
        for (const ss of simScenarios) {
          const { data: scenario } = await supabase
            .from('scenarios')
            .select('id, title, introduction_video_url, prompt_video_url')
            .eq('id', ss.scenario_id)
            .single();

          if (scenario) {
            console.log('\n  Scenario ' + ss.sequence_order + ': ' + scenario.title);
            console.log('    Entry: ' + ss.is_entry_point + ', Exit: ' + ss.is_exit_point);
            console.log('    Intro video: ' + (scenario.introduction_video_url ? 'YES' : 'NO'));
            console.log('    Prompt video: ' + (scenario.prompt_video_url ? 'YES' : 'NO'));

            const { data: options } = await supabase
              .from('scenario_options')
              .select('*')
              .eq('scenario_id', scenario.id)
              .order('option_order');

            console.log('    Options: ' + (options ? options.length : 0));
            
            if (options) {
              options.forEach((opt, idx) => {
                console.log('\n    Option ' + String.fromCharCode(65 + idx) + ': ' + opt.option_text.substring(0, 40) + '...');
                console.log('      Next scenario: ' + (opt.next_scenario_id || 'END'));
                console.log('      Feedback text (beginner): ' + (opt.feedback_beginner ? opt.feedback_beginner.substring(0, 40) + '...' : 'MISSING'));
                console.log('      Feedback VIDEO URLs:');
                console.log('        Beginner: ' + (opt.feedback_video_url_beginner || 'NONE'));
                console.log('        Intermediate: ' + (opt.feedback_video_url_intermediate || 'NONE'));
                console.log('        Advanced: ' + (opt.feedback_video_url_advanced || 'NONE'));
                console.log('      Transition video: ' + (opt.transition_video_url || 'NONE'));
              });
            }
          }
        }
      }
    }
  }
}

checkScenarioData().catch(console.error);
