import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function verifyBravinTables() {
  console.log('=== Verifying BRAVIN Metrics Tables ===\n');

  const tables = [
    'bravin_dimensions',
    'bravin_learner_scores',
    'bravin_decision_assessments',
    'bravin_scenario_option_mappings',
    'trust_impact_events',
    'ethical_decision_quality_assessments',
    'emotional_intelligence_assessments',
    'cultural_stewardship_logs'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✓ ${table}: Table exists`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }

  console.log('\n=== Checking BRAVIN Dimensions ===\n');
  const { data: dimensions, error: dimError } = await supabase
    .from('bravin_dimensions')
    .select('code, name, is_active')
    .eq('is_active', true)
    .order('display_order');

  if (dimensions) {
    dimensions.forEach(dim => {
      console.log(`  ${dim.code}: ${dim.name}`);
    });
  } else {
    console.log('No dimensions found');
  }

  console.log('\n=== Checking BRAVIN Scenario Mappings ===\n');
  const { data: mappings, error: mapError } = await supabase
    .from('bravin_scenario_option_mappings')
    .select('scenario_id, option_id, boldness_impact, responsibility_impact')
    .limit(5);

  if (mappings && mappings.length > 0) {
    console.log(`Found ${mappings.length} mappings (showing first 5)`);
    mappings.forEach(m => {
      console.log(`  Scenario: ${m.scenario_id}, Option: ${m.option_id}`);
      console.log(`    Boldness: ${m.boldness_impact}, Responsibility: ${m.responsibility_impact}`);
    });
  } else {
    console.log('⚠️  No BRAVIN mappings found - scenarios need BRAVIN configuration');
  }

  console.log('\n=== Checking Assessment Metrics ===\n');
  const { data: metrics, error: metricError } = await supabase
    .from('assessment_metrics')
    .select('id, name, metric_type')
    .in('metric_type', [
      'bravin_alignment',
      'trust_impact',
      'ethical_decision_quality',
      'emotional_intelligence_index',
      'cultural_stewardship'
    ]);

  if (metrics && metrics.length > 0) {
    console.log('BRAVIN-related metrics:');
    metrics.forEach(m => {
      console.log(`  ${m.metric_type}: ${m.name}`);
    });
  } else {
    console.log('⚠️  No BRAVIN metrics found in assessment_metrics table');
  }
}

verifyBravinTables().then(() => {
  console.log('\n=== Verification Complete ===');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
