import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkJMMB() {
  console.log('=== Checking JMMB Leadership Development Programme ===\n');

  // Find the JMMB simulation
  const { data: simulations } = await supabase
    .from('simulations')
    .select('*')
    .ilike('display_name', '%JMMB%Trust%');

  if (!simulations || simulations.length === 0) {
    console.log('JMMB simulation not found by name, searching all...');
    const { data: allSims } = await supabase
      .from('simulations')
      .select('id, display_name, internal_name')
      .limit(20);
    
    console.log('\nAvailable simulations:');
    allSims?.forEach(s => console.log(`  - ${s.display_name} (${s.internal_name})`));
    return;
  }

  const simulation = simulations[0];
  console.log(`Found: ${simulation.display_name}`);
  console.log(`ID: ${simulation.id}`);
  console.log(`Max Level: ${simulation.max_level}\n`);

  // Get all scenarios for this simulation
  const { data: scenarios } = await supabase
    .from('scenarios')
    .select('*')
    .eq('simulation_id', simulation.id)
    .order('hierarchy_level', { ascending: true });

  console.log(`Total Scenarios: ${scenarios?.length || 0}`);
  
  if (scenarios) {
    const levels = scenarios.map(s => s.hierarchy_level).filter(l => l !== null);
    const uniqueLevels = [...new Set(levels)].sort((a, b) => a - b);
    
    console.log(`Hierarchy Levels: ${uniqueLevels.join(', ')}`);
    console.log(`Number of Unique Levels: ${uniqueLevels.length}`);
    console.log(`Max Hierarchy Level: ${Math.max(...levels)}\n`);
    
    // Show scenarios by level
    console.log('Scenarios by Level:');
    uniqueLevels.forEach(level => {
      const scenariosAtLevel = scenarios.filter(s => s.hierarchy_level === level);
      console.log(`  Level ${level}: ${scenariosAtLevel.length} scenario(s)`);
      scenariosAtLevel.forEach(s => {
        console.log(`    - ${s.title?.substring(0, 50) || 'Untitled'}`);
      });
    });
  }

  // Check BRAVIN metrics
  console.log('\n=== BRAVIN Metrics ===');
  const { data: metrics } = await supabase
    .from('assessment_metrics')
    .select('*')
    .in('metric_type', ['bravin_alignment', 'trust_impact', 'ethical_decision_quality', 'emotional_intelligence_index', 'cultural_stewardship']);

  console.log(`Found ${metrics?.length || 0} BRAVIN metrics`);
  if (metrics) {
    metrics.forEach(m => console.log(`  - ${m.name} (${m.metric_type})`));
  }
}

checkJMMB()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
