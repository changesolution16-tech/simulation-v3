import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkJMMB() {
  console.log('Checking JMMB Leadership Development Programme\n');

  const { data: simulations } = await supabase
    .from('simulations')
    .select('*')
    .ilike('display_name', '%JMMB%');

  if (!simulations || simulations.length === 0) {
    console.log('JMMB simulation not found by name, searching all...');
    const { data: allSims } = await supabase
      .from('simulations')
      .select('id, display_name, internal_name')
      .limit(20);
    
    console.log('Available simulations:');
    if (allSims) {
      allSims.forEach(s => console.log(`  - ${s.display_name}`));
    }
    return;
  }

  const simulation = simulations[0];
  console.log(`Found: ${simulation.display_name}`);
  console.log(`ID: ${simulation.id}`);
  console.log(`Max Level: ${simulation.max_level}\n`);

  const { data: scenarios } = await supabase
    .from('scenarios')
    .select('*')
    .eq('simulation_id', simulation.id)
    .order('hierarchy_level', { ascending: true });

  const count = scenarios ? scenarios.length : 0;
  console.log(`Total Scenarios: ${count}`);
  
  if (scenarios) {
    const levels = scenarios.map(s => s.hierarchy_level).filter(l => l !== null);
    const uniqueLevels = [...new Set(levels)].sort((a, b) => a - b);
    
    console.log(`Hierarchy Levels: ${uniqueLevels.join(', ')}`);
    console.log(`Number of Unique Levels: ${uniqueLevels.length}`);
    console.log(`Max Hierarchy Level: ${Math.max(...levels)}\n`);
    
    console.log('Scenarios by Level:');
    uniqueLevels.forEach(level => {
      const scenariosAtLevel = scenarios.filter(s => s.hierarchy_level === level);
      console.log(`  Level ${level}: ${scenariosAtLevel.length} scenario(s)`);
    });
  }

  console.log('\nBRAVIN Metrics:');
  const { data: metrics } = await supabase
    .from('assessment_metrics')
    .select('*')
    .in('metric_type', ['bravin_alignment', 'trust_impact', 'ethical_decision_quality', 'emotional_intelligence_index', 'cultural_stewardship']);

  const metricCount = metrics ? metrics.length : 0;
  console.log(`Found ${metricCount} BRAVIN metrics`);
  if (metrics) {
    metrics.forEach(m => console.log(`  - ${m.name}`));
  }
}

checkJMMB()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
