import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkInstances() {
  console.log('=== Checking All Simulation Instances ===\n');

  const { data: instances, error } = await supabase
    .from('simulation_instances')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${instances?.length || 0} instances\n`);

  if (instances && instances.length > 0) {
    for (const inst of instances) {
      console.log(`Instance: ${inst.id}`);
      console.log(`  Status: ${inst.status}`);
      console.log(`  decision_count: ${inst.decision_count}`);
      console.log(`  stages_completed: ${inst.stages_completed}`);
      console.log(`  max_stage: ${inst.max_stage}`);
      
      // Count actual responses
      const { data: responses } = await supabase
        .from('learner_responses')
        .select('id')
        .eq('instance_id', inst.id);
      
      console.log(`  Actual responses: ${responses?.length || 0}`);
      
      // Count assessments
      const { data: assessments } = await supabase
        .from('metric_assessments')
        .select('id')
        .eq('instance_id', inst.id);
      
      console.log(`  Total assessments: ${assessments?.length || 0}`);
      
      if (assessments && assessments.length > 0 && responses && responses.length > 0) {
        console.log(`  Assessments per decision: ${(assessments.length / responses.length).toFixed(1)}`);
      }
      
      console.log('');
    }
  }
}

checkInstances()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
