#!/usr/bin/env node

/**
 * Verify Scenarios in Database
 *
 * This script checks the database for scenarios and displays them organized by hierarchy level.
 *
 * Usage:
 *   node verify-scenarios-in-database.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyScenarios() {
  console.log('🔍 Checking Database for Scenarios');
  console.log('===================================');
  console.log('');

  // Get all scenarios
  const { data: scenarios, error: scenariosError } = await supabase
    .from('scenarios')
    .select('id, title, description, difficulty, hierarchy_level, is_end_scenario, created_at')
    .order('hierarchy_level', { ascending: true });

  if (scenariosError) {
    console.error('❌ Error fetching scenarios:', scenariosError);
    return;
  }

  if (!scenarios || scenarios.length === 0) {
    console.log('❌ No scenarios found in database!');
    console.log('');
    console.log('This means:');
    console.log('  1. Scenarios have not been imported yet, OR');
    console.log('  2. There was an error during import, OR');
    console.log('  3. RLS policies are preventing you from seeing them');
    console.log('');
    console.log('Next steps:');
    console.log('  - Run the import script: node import-scenarios-to-database.mjs');
    console.log('  - Check import script output for errors');
    console.log('  - Verify you have proper authentication/permissions');
    return;
  }

  console.log(`✅ Found ${scenarios.length} scenarios in database`);
  console.log('');

  // Get scenario options
  const { data: options, error: optionsError } = await supabase
    .from('scenario_options')
    .select('id, scenario_id, option_text, next_scenario_id, option_order')
    .order('scenario_id')
    .order('option_order');

  if (optionsError) {
    console.error('❌ Error fetching options:', optionsError);
    return;
  }

  console.log(`✅ Found ${options?.length || 0} scenario options`);
  console.log('');

  // Organize by hierarchy level
  const byLevel = {};
  scenarios.forEach(s => {
    const level = s.hierarchy_level ?? 'unset';
    if (!byLevel[level]) byLevel[level] = [];
    byLevel[level].push(s);
  });

  // Display scenarios by level
  console.log('📊 Scenarios by Hierarchy Level:');
  console.log('================================');
  console.log('');

  const levels = Object.keys(byLevel).sort((a, b) => {
    if (a === 'unset') return 1;
    if (b === 'unset') return -1;
    return parseInt(a) - parseInt(b);
  });

  levels.forEach(level => {
    console.log(`📍 Level ${level}:`);
    console.log('');

    byLevel[level].forEach((scenario, index) => {
      console.log(`   ${index + 1}. ${scenario.title}`);
      console.log(`      ID: ${scenario.id}`);
      console.log(`      Difficulty: ${scenario.difficulty}`);
      console.log(`      End Scenario: ${scenario.is_end_scenario ? 'Yes' : 'No'}`);

      // Show options for this scenario
      const scenarioOptions = options?.filter(opt => opt.scenario_id === scenario.id) || [];
      if (scenarioOptions.length > 0) {
        console.log(`      Options (${scenarioOptions.length}):`);
        scenarioOptions.forEach((opt, optIndex) => {
          const connectionText = opt.next_scenario_id
            ? ` → ${scenarios.find(s => s.id === opt.next_scenario_id)?.title || 'Unknown'}`
            : ' (no connection)';
          console.log(`         ${optIndex + 1}. ${opt.option_text.substring(0, 50)}...${connectionText}`);
        });
      } else {
        console.log(`      Options: None`);
      }

      console.log('');
    });
  });

  // Connection analysis
  console.log('🔗 Connection Analysis:');
  console.log('======================');
  console.log('');

  let totalConnections = 0;
  let scenariosWithConnections = new Set();
  let entryPointCandidates = [];
  let endScenarios = [];

  scenarios.forEach(scenario => {
    const scenarioOptions = options?.filter(opt => opt.scenario_id === scenario.id) || [];
    const hasOutgoingConnections = scenarioOptions.some(opt => opt.next_scenario_id);
    const hasIncomingConnections = options?.some(opt => opt.next_scenario_id === scenario.id) || false;

    if (hasOutgoingConnections) {
      scenariosWithConnections.add(scenario.id);
      totalConnections += scenarioOptions.filter(opt => opt.next_scenario_id).length;
    }

    if (!hasIncomingConnections && hasOutgoingConnections) {
      entryPointCandidates.push(scenario);
    }

    if (scenario.is_end_scenario || (!hasOutgoingConnections && hasIncomingConnections)) {
      endScenarios.push(scenario);
    }
  });

  console.log(`Total connections: ${totalConnections}`);
  console.log(`Scenarios with connections: ${scenariosWithConnections.size} / ${scenarios.length}`);
  console.log('');

  if (entryPointCandidates.length > 0) {
    console.log('🚪 Entry Point Candidates (no incoming connections):');
    entryPointCandidates.forEach(s => {
      console.log(`   - ${s.title} (Level ${s.hierarchy_level ?? 'unset'})`);
    });
    console.log('');
  }

  if (endScenarios.length > 0) {
    console.log('🏁 End Scenarios (no outgoing connections or marked as end):');
    endScenarios.forEach(s => {
      console.log(`   - ${s.title} (Level ${s.hierarchy_level ?? 'unset'})`);
    });
    console.log('');
  }

  // Check simulations
  const { data: simulations } = await supabase
    .from('simulations')
    .select('id, name, display_name, entry_scenario_id')
    .order('created_at', { ascending: false });

  console.log('🎮 Simulations:');
  console.log('==============');
  console.log('');

  if (!simulations || simulations.length === 0) {
    console.log('⚠️  No simulations found');
    console.log('');
    console.log('Next steps:');
    console.log('   1. Go to Admin Dashboard → Simulations');
    console.log('   2. Create a new simulation or edit existing one');
    console.log('   3. Link your scenarios to the simulation');
    console.log('   4. Set the entry point to a Level 0 scenario');
  } else {
    simulations.forEach(sim => {
      console.log(`📱 ${sim.display_name || sim.name}`);
      console.log(`   ID: ${sim.id}`);

      if (sim.entry_scenario_id) {
        const entryScenario = scenarios.find(s => s.id === sim.entry_scenario_id);
        console.log(`   Entry Point: ${entryScenario?.title || 'Unknown'}`);
      } else {
        console.log(`   Entry Point: Not set ⚠️`);
      }
      console.log('');
    });
  }

  // Summary
  console.log('📋 Summary:');
  console.log('==========');
  console.log('');
  console.log(`✅ Scenarios imported: ${scenarios.length}`);
  console.log(`✅ Options created: ${options?.length || 0}`);
  console.log(`✅ Connections: ${totalConnections}`);
  console.log(`✅ Simulations: ${simulations?.length || 0}`);
  console.log('');

  // Recommendations
  console.log('💡 Recommendations:');
  console.log('==================');
  console.log('');

  if (scenarios.length === 13) {
    console.log('✅ All 13 scenarios are in the database!');
  } else if (scenarios.length < 13) {
    console.log(`⚠️  Only ${scenarios.length} of 13 scenarios found`);
    console.log('   - Check import script output for errors');
    console.log('   - Re-run import if needed');
  }

  if (entryPointCandidates.length === 0) {
    console.log('⚠️  No entry point candidates found');
    console.log('   - Make sure you have a Level 0 scenario');
    console.log('   - Verify scenario connections');
  }

  if (!simulations || simulations.length === 0) {
    console.log('⚠️  No simulation found');
    console.log('   - Create a simulation to use these scenarios');
  } else if (simulations.some(s => !s.entry_scenario_id)) {
    console.log('⚠️  Simulation exists but no entry point set');
    console.log('   - Set entry point in simulation settings');
  }

  console.log('');
  console.log('🎉 Verification complete!');
}

verifyScenarios().catch(error => {
  console.error('');
  console.error('❌ Verification failed:', error.message);
  console.error('');
  console.error('Full error:', error);
  process.exit(1);
});
