import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function diagnoseLevelTracking() {
  console.log('=== Level Tracking Diagnostics ===\n');

  // 1. Check if function exists
  console.log('1. Testing get_simulation_max_level function...');
  const { data: funcTest, error: funcError } = await supabase.rpc('get_simulation_max_level', {
    p_simulation_id: '00000000-0000-0000-0000-000000000000'
  });

  if (funcError) {
    console.log('   ❌ Function error:', funcError.message);
  } else {
    console.log('   ✓ Function exists and returns:', funcTest);
  }

  // 2. Check simulations
  console.log('\n2. Checking simulations...');
  const { data: sims, error: simError } = await supabase
    .from('simulations')
    .select('id, display_name, status')
    .limit(5);

  if (simError) {
    console.log('   ❌ Error:', simError.message);
  } else if (!sims || sims.length === 0) {
    console.log('   ⚠️  No simulations found in database');
  } else {
    console.log(`   ✓ Found ${sims.length} simulations`);

    for (const sim of sims) {
      console.log(`\n   Simulation: ${sim.display_name}`);

      // Get scenarios for this simulation
      const { data: simScenarios } = await supabase
        .from('simulation_scenarios')
        .select(`
          scenario_id,
          scenarios (
            id,
            title,
            hierarchy_level,
            is_end_scenario
          )
        `)
        .eq('simulation_id', sim.id);

      if (simScenarios && simScenarios.length > 0) {
        console.log(`   - Has ${simScenarios.length} scenarios`);

        const levels = simScenarios
          .map(s => s.scenarios?.hierarchy_level)
          .filter(l => l !== null && l !== undefined);

        const maxLevel = levels.length > 0 ? Math.max(...levels) : null;
        const endScenarios = simScenarios.filter(s => s.scenarios?.is_end_scenario);

        console.log(`   - Hierarchy levels present: ${levels.length > 0 ? levels.sort((a, b) => a - b).join(', ') : 'NONE'}`);
        console.log(`   - Max level: ${maxLevel ?? 'NOT SET'}`);
        console.log(`   - End scenarios: ${endScenarios.length}`);

        // Test the function with this simulation
        const { data: maxLevelFunc } = await supabase.rpc('get_simulation_max_level', {
          p_simulation_id: sim.id
        });
        console.log(`   - Function returns max_level: ${maxLevelFunc}`);

        // Show scenario details
        console.log('   - Scenario breakdown:');
        simScenarios.slice(0, 5).forEach((s, i) => {
          console.log(`     ${i + 1}. "${s.scenarios?.title?.substring(0, 40)}" - Level: ${s.scenarios?.hierarchy_level ?? 'NULL'} ${s.scenarios?.is_end_scenario ? '(END)' : ''}`);
        });
        if (simScenarios.length > 5) {
          console.log(`     ... and ${simScenarios.length - 5} more`);
        }
      } else {
        console.log('   - No scenarios linked to this simulation');
      }
    }
  }

  // 3. Check simulation_instances
  console.log('\n3. Checking recent simulation instances...');
  const { data: instances } = await supabase
    .from('simulation_instances')
    .select('id, simulation_id, max_level, levels_completed, decision_count, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (!instances || instances.length === 0) {
    console.log('   ⚠️  No simulation instances found');
  } else {
    console.log(`   ✓ Found ${instances.length} recent instances:`);
    instances.forEach((inst, i) => {
      console.log(`   ${i + 1}. Status: ${inst.status}, Max Level: ${inst.max_level}, Levels Completed: ${inst.levels_completed}, Decisions: ${inst.decision_count}`);
    });
  }

  // 4. Check if scenarios table has hierarchy_level column
  console.log('\n4. Checking scenarios table structure...');
  const { data: scenarios } = await supabase
    .from('scenarios')
    .select('id, title, hierarchy_level, is_end_scenario')
    .limit(5);

  if (scenarios && scenarios.length > 0) {
    console.log(`   ✓ Found ${scenarios.length} scenarios`);
    const withLevels = scenarios.filter(s => s.hierarchy_level !== null && s.hierarchy_level !== undefined).length;
    console.log(`   - Scenarios with hierarchy_level set: ${withLevels}/${scenarios.length}`);

    if (withLevels === 0) {
      console.log('   ⚠️  WARNING: No scenarios have hierarchy_level set!');
      console.log('   💡 You need to set hierarchy levels on your scenarios');
    }
  } else {
    console.log('   ⚠️  No scenarios found in database');
  }

  console.log('\n=== Diagnosis Complete ===\n');
  console.log('Summary:');
  console.log('- If you see "Level 1 of 2", it means max_level is calculated as 1 (0-indexed)');
  console.log('- If you see "0 levels completed", it means levels_completed was not incremented');
  console.log('- Make sure your scenarios have hierarchy_level values set (0, 1, 2, 3, etc.)');
  console.log('- The system will show "Level X of Y" where X = hierarchy_level + 1 and Y = max_level + 1');
}

diagnoseLevelTracking().catch(console.error);
