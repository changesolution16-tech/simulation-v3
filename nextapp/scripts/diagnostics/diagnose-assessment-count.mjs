import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function diagnoseAssessmentCount() {
  console.log('Assessment Count Diagnostic\n');

  const queryInstances = await supabase
    .from('simulation_instances')
    .select('id, simulation_id, learner_id, status, created_at, max_level, levels_completed, decision_count')
    .order('created_at', { ascending: false })
    .limit(5);

  if (queryInstances.error) {
    console.error('Error:', queryInstances.error);
    return;
  }

  const instances = queryInstances.data;
  console.log('Recent simulation instances:', instances.length, '\n');

  for (let i = 0; i < instances.length; i++) {
    const inst = instances[i];
    console.log('Instance', i + 1);
    console.log('  ID:', inst.id);
    console.log('  Status:', inst.status);
    console.log('  Levels:', inst.levels_completed + 1, '/', inst.max_level + 1);
    console.log('  Decision Count:', inst.decision_count);
    console.log('  Created:', new Date(inst.created_at).toLocaleString(), '\n');
  }

  console.log('Assessment Counts by Instance\n');
  
  for (const instance of instances) {
    const queryAssess = await supabase
      .from('learner_metric_assessments')
      .select('id, metric_id, scenario_id, option_id, score_achieved, created_at')
      .eq('simulation_instance_id', instance.id);

    if (queryAssess.error) {
      console.error('Error:', queryAssess.error);
      continue;
    }

    const assessments = queryAssess.data;
    console.log('Instance:', instance.id.substring(0, 8));
    console.log('  Total Assessments:', assessments.length);
    console.log('  Decision Count:', instance.decision_count);
    
    const uniqueScenarios = new Set(assessments.map(a => a.scenario_id));
    console.log('  Unique Scenarios:', uniqueScenarios.size);
    
    const uniqueMetrics = new Set(assessments.map(a => a.metric_id));
    console.log('  Unique Metrics:', uniqueMetrics.size);
    
    const expectedCount = instance.decision_count * uniqueMetrics.size;
    console.log('  Expected:', expectedCount, '\n');
  }
}

diagnoseAssessmentCount().catch(console.error);
