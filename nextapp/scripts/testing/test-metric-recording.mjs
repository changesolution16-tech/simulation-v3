import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testMetricRecording() {
  console.log('=== METRIC RECORDING TEST ===\n');

  // Step 1: Get a recent simulation instance
  console.log('Step 1: Finding recent simulation instance...');
  const { data: instances, error: instanceError } = await supabase
    .from('simulation_instances')
    .select('id, learner_id, simulation_id, status, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  if (instanceError) {
    console.error('Error fetching instances:', instanceError);
    return;
  }

  if (!instances || instances.length === 0) {
    console.log('No simulation instances found. Please run a simulation first.');
    return;
  }

  console.log(`Found ${instances.length} recent instances:\n`);
  instances.forEach((inst, idx) => {
    console.log(`${idx + 1}. Instance: ${inst.id.substring(0, 8)}...`);
    console.log(`   Status: ${inst.status}`);
    console.log(`   Created: ${new Date(inst.created_at).toLocaleString()}\n`);
  });

  const testInstance = instances[0];

  // Step 2: Get a response from this instance
  console.log(`\nStep 2: Getting responses for instance ${testInstance.id.substring(0, 8)}...`);
  const { data: responses, error: responseError } = await supabase
    .from('learner_responses')
    .select('id, scenario_id, option_id, responded_at')
    .eq('instance_id', testInstance.id)
    .order('responded_at', { ascending: false })
    .limit(1);

  if (responseError) {
    console.error('Error fetching responses:', responseError);
    return;
  }

  if (!responses || responses.length === 0) {
    console.log('No responses found for this instance.');
    return;
  }

  const testResponse = responses[0];
  console.log(`Found response:`);
  console.log(`  Response ID: ${testResponse.id.substring(0, 8)}...`);
  console.log(`  Scenario ID: ${testResponse.scenario_id.substring(0, 8)}...`);
  console.log(`  Option ID: ${testResponse.option_id.substring(0, 8)}...`);
  console.log(`  Responded at: ${new Date(testResponse.responded_at).toLocaleString()}\n`);

  // Step 3: Check current metric assessments
  console.log('Step 3: Checking current metric assessments...');
  const { data: existingAssessments, error: existingError } = await supabase
    .from('learner_metric_assessments')
    .select('id, created_at')
    .eq('simulation_instance_id', testInstance.id)
    .eq('scenario_id', testResponse.scenario_id)
    .eq('option_id', testResponse.option_id);

  if (existingError) {
    console.error('Error checking existing assessments:', existingError);
  } else {
    console.log(`Existing assessments: ${existingAssessments?.length || 0}\n`);
  }

  // Step 4: Check if scenario has metrics configured
  console.log('Step 4: Checking scenario option metrics configuration...');
  const { data: configuredMetrics, error: metricsError } = await supabase
    .from('scenario_option_metrics')
    .select('id, metric_id, score_value')
    .eq('scenario_id', testResponse.scenario_id)
    .eq('option_id', testResponse.option_id);

  if (metricsError) {
    console.error('Error checking configured metrics:', metricsError);
    return;
  }

  console.log(`Configured metrics for this option: ${configuredMetrics?.length || 0}`);
  if (configuredMetrics && configuredMetrics.length > 0) {
    console.log('Metrics configured:');
    configuredMetrics.forEach((m, idx) => {
      console.log(`  ${idx + 1}. Metric ID: ${m.metric_id.substring(0, 8)}... Score: ${m.score_value}`);
    });
  } else {
    console.log('⚠️  WARNING: No metrics configured for this scenario option!');
    console.log('   This is why metrics are not being recorded.');
    return;
  }

  // Step 5: Test the record_metric_assessment function
  console.log('\n Step 5: Testing record_metric_assessment function...');
  console.log('Parameters:');
  console.log(`  learner_id: ${testInstance.learner_id}`);
  console.log(`  instance_id: ${testInstance.id}`);
  console.log(`  scenario_id: ${testResponse.scenario_id}`);
  console.log(`  option_id: ${testResponse.option_id}\n`);

  const { data: rpcResult, error: rpcError } = await supabase.rpc('record_metric_assessment', {
    p_learner_id: testInstance.learner_id,
    p_simulation_instance_id: testInstance.id,
    p_scenario_id: testResponse.scenario_id,
    p_option_id: testResponse.option_id
  });

  if (rpcError) {
    console.error('❌ ERROR calling record_metric_assessment:');
    console.error('   Message:', rpcError.message);
    console.error('   Details:', rpcError.details);
    console.error('   Hint:', rpcError.hint);
    console.error('\nThis indicates the RLS policy fix may not have been applied correctly.');
  } else {
    console.log('✓ Function executed successfully!\n');
  }

  // Step 6: Verify new assessments were created
  console.log('Step 6: Verifying new assessments were created...');
  const { data: newAssessments, error: verifyError } = await supabase
    .from('learner_metric_assessments')
    .select('id, metric_id, score_achieved, created_at')
    .eq('simulation_instance_id', testInstance.id)
    .eq('scenario_id', testResponse.scenario_id)
    .eq('option_id', testResponse.option_id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (verifyError) {
    console.error('Error verifying assessments:', verifyError);
  } else {
    console.log(`Total assessments now: ${newAssessments?.length || 0}`);
    if (newAssessments && newAssessments.length > 0) {
      console.log('\nRecent assessments:');
      newAssessments.slice(0, 5).forEach((a, idx) => {
        console.log(`  ${idx + 1}. Score: ${a.score_achieved}, Created: ${new Date(a.created_at).toLocaleString()}`);
      });

      // Check if any were created just now (within last 10 seconds)
      const recentCount = newAssessments.filter(a =>
        new Date(a.created_at) > new Date(Date.now() - 10000)
      ).length;

      if (recentCount > 0) {
        console.log(`\n✓ SUCCESS! ${recentCount} new assessment(s) were just created!`);
      } else {
        console.log('\n⚠️  No new assessments created in the last 10 seconds.');
      }
    }
  }

  // Step 7: Check all instances for missing assessments
  console.log('\n\nStep 7: Checking ALL instances for missing assessments...');
  const { data: allInstances } = await supabase
    .from('simulation_instances')
    .select('id')
    .neq('status', 'abandoned')
    .order('created_at', { ascending: false })
    .limit(5);

  if (allInstances) {
    for (const inst of allInstances) {
      const { data: responses } = await supabase
        .from('learner_responses')
        .select('id')
        .eq('instance_id', inst.id);

      const { data: assessments } = await supabase
        .from('learner_metric_assessments')
        .select('id')
        .eq('simulation_instance_id', inst.id);

      const responseCount = responses?.length || 0;
      const assessmentCount = assessments?.length || 0;

      console.log(`Instance ${inst.id.substring(0, 8)}...:`);
      console.log(`  Responses: ${responseCount}, Assessments: ${assessmentCount}`);

      if (responseCount > 0 && assessmentCount === 0) {
        console.log(`  ⚠️  MISSING ALL ASSESSMENTS!`);
      } else if (responseCount > assessmentCount) {
        console.log(`  ⚠️  Missing ${responseCount - assessmentCount} assessment(s)`);
      } else {
        console.log(`  ✓ OK`);
      }
    }
  }

  console.log('\n=== TEST COMPLETE ===\n');
  console.log('Summary:');
  console.log('- If you see "SUCCESS" above, the RLS fix is working!');
  console.log('- If you see errors, the issue may still exist.');
  console.log('- Check for "MISSING ASSESSMENTS" warnings to identify which instances need backfilling.\n');
}

testMetricRecording().catch(console.error);
