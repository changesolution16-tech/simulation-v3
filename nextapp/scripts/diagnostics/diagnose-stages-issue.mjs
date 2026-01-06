import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function diagnoseStagesIssue() {
  console.log('=== Diagnosing Stages Completed Issue ===\n');

  // Get the most recent simulation instances (any status)
  const { data: instances, error: instError } = await supabase
    .from('simulation_instances')
    .select('*')
    .in('status', ['completed', 'in_progress'])
    .order('started_at', { ascending: false })
    .limit(5);

  if (instError) {
    console.error('Error fetching instances:', instError);
    return;
  }

  if (!instances || instances.length === 0) {
    console.log('No completed instances found');
    return;
  }

  console.log(`Found ${instances.length} recent completed instances\n`);

  for (const instance of instances) {
    console.log(`\n--- Instance ID: ${instance.id} ---`);
    console.log(`  Learner ID: ${instance.learner_id}`);
    console.log(`  Simulation ID: ${instance.simulation_id}`);
    console.log(`  Status: ${instance.status}`);
    console.log(`  Completed: ${instance.completed_at}`);
    console.log(`\n  STORED VALUES:`);
    console.log(`    decision_count: ${instance.decision_count}`);
    console.log(`    stages_completed: ${instance.stages_completed}`);
    console.log(`    max_stage: ${instance.max_stage}`);

    // Count actual responses
    const { data: responses, error: respError } = await supabase
      .from('learner_responses')
      .select('id, scenario_id')
      .eq('instance_id', instance.id);

    if (respError) {
      console.error('  Error counting responses:', respError);
    } else {
      console.log(`\n  ACTUAL VALUES FROM learner_responses:`);
      console.log(`    Total responses: ${responses?.length || 0}`);

      // Get hierarchy levels from scenarios
      if (responses && responses.length > 0) {
        const scenarioIds = responses.map(r => r.scenario_id);
        const { data: scenarios } = await supabase
          .from('scenarios')
          .select('id, hierarchy_level')
          .in('id', scenarioIds);

        if (scenarios) {
          const levels = scenarios.map(s => s.hierarchy_level).filter(l => l !== null);
          const uniqueLevels = [...new Set(levels)];
          const maxLevel = Math.max(...levels.filter(l => l !== null && l !== undefined));

          console.log(`    Unique hierarchy levels visited: ${uniqueLevels.sort((a, b) => a - b).join(', ')}`);
          console.log(`    Highest hierarchy level reached: ${maxLevel}`);
          console.log(`    Count of unique levels: ${uniqueLevels.length}`);
        }
      }
    }

    console.log(`\n  DISCREPANCY CHECK:`);
    const actualCount = responses?.length || 0;
    if (instance.decision_count === actualCount) {
      console.log(`    ✓ decision_count matches actual responses (${actualCount})`);
    } else {
      console.log(`    ✗ decision_count (${instance.decision_count}) != actual responses (${actualCount})`);
      console.log(`    → MISMATCH BY: ${Math.abs(instance.decision_count - actualCount)}`);
    }
  }

  console.log('\n=== Summary ===');
  console.log('The UI should display: decision_count (number of decisions made)');
  console.log('NOT: stages_completed (which stores the highest hierarchy level number)');
  console.log('\nIf you see a high number like 13 or 16, the UI is incorrectly showing stages_completed');
  console.log('If you see the correct low number like 4, the UI is correctly showing decision_count');
}

diagnoseStagesIssue()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
