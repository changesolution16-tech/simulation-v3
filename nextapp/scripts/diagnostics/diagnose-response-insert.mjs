import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function diagnoseResponseInsert() {
  console.log('=== DIAGNOSING LEARNER RESPONSE INSERT ISSUE ===\n');

  // Step 1: Try to authenticate (simulate a logged-in user)
  console.log('Step 1: Checking authentication...');
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.log('❌ No authenticated user found');
    console.log('   This test needs to be run while authenticated');
    console.log('   Please log in via the browser first, then run this test.\n');

    // Try to get the most recent instance to simulate the scenario
    console.log('Attempting to check database state without auth...\n');
  } else {
    console.log('✓ Authenticated as:', user.id);
    console.log('   Email:', user.email, '\n');
  }

  // Step 2: Check recent simulation instances
  console.log('Step 2: Checking recent simulation instances...');
  const { data: instances, error: instanceError } = await supabase
    .from('simulation_instances')
    .select('id, learner_id, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (instanceError) {
    console.error('❌ Error fetching instances:', instanceError);
    return;
  }

  if (!instances || instances.length === 0) {
    console.log('❌ No simulation instances found');
    return;
  }

  console.log(`Found ${instances.length} recent instances:`);
  instances.forEach((inst, idx) => {
    console.log(`  ${idx + 1}. ${inst.id.substring(0, 8)}... - ${inst.status} - Learner: ${inst.learner_id.substring(0, 8)}...`);
  });
  console.log();

  const testInstance = instances[0];
  console.log(`Using most recent instance: ${testInstance.id}`);
  console.log(`  Learner ID: ${testInstance.learner_id}`);
  console.log(`  Status: ${testInstance.status}\n`);

  // Step 3: Check if this instance has a valid scenario
  console.log('Step 3: Getting a scenario from this simulation...');
  const { data: simulation, error: simError } = await supabase
    .from('simulations')
    .select('id, name, scenarios(id, title, options(id, text))')
    .eq('id', testInstance.simulation_id)
    .single();

  if (simError || !simulation) {
    console.error('❌ Error fetching simulation:', simError);
    return;
  }

  if (!simulation.scenarios || simulation.scenarios.length === 0) {
    console.log('❌ No scenarios found for this simulation');
    return;
  }

  const testScenario = simulation.scenarios[0];
  const testOption = testScenario.options?.[0];

  if (!testOption) {
    console.log('❌ No options found for this scenario');
    return;
  }

  console.log(`✓ Found scenario: ${testScenario.id.substring(0, 8)}...`);
  console.log(`  Option to use: ${testOption.id.substring(0, 8)}...\n`);

  // Step 4: Test the INSERT directly
  console.log('Step 4: Attempting to insert a test response...');
  console.log('Insert parameters:');
  console.log(`  instance_id: ${testInstance.id}`);
  console.log(`  scenario_id: ${testScenario.id}`);
  console.log(`  option_id: ${testOption.id}`);
  console.log(`  response_order: 1`);
  console.log(`  time_to_decision_seconds: 10`);
  console.log();

  const { data: insertData, error: insertError } = await supabase
    .from('learner_responses')
    .insert({
      instance_id: testInstance.id,
      scenario_id: testScenario.id,
      option_id: testOption.id,
      response_order: 1,
      time_to_decision_seconds: 10,
      viewed_videos: false,
      video_watch_time_seconds: 0,
      responded_at: new Date().toISOString()
    })
    .select();

  if (insertError) {
    console.error('❌ INSERT FAILED!');
    console.error('   Error code:', insertError.code);
    console.error('   Error message:', insertError.message);
    console.error('   Error details:', insertError.details);
    console.error('   Error hint:', insertError.hint);
    console.log();

    // Provide specific diagnosis based on error
    if (insertError.code === '42501') {
      console.log('DIAGNOSIS: RLS Policy Violation (42501)');
      console.log('The RLS policy "Learners can create responses via instance" is blocking this INSERT.');
      console.log();
      console.log('Possible causes:');
      console.log('1. Not authenticated (auth.uid() returns NULL)');
      console.log('2. The simulation_instance.learner_id does not match auth.uid()');
      console.log('3. The simulation_instances record does not exist');
      console.log();

      // Check if the instance belongs to the authenticated user
      if (user) {
        console.log(`Checking ownership: Does instance ${testInstance.id} belong to user ${user.id}?`);
        console.log(`  Instance learner_id: ${testInstance.learner_id}`);
        console.log(`  Authenticated user:  ${user.id}`);

        if (testInstance.learner_id === user.id) {
          console.log('  ✓ MATCH - Instance belongs to user');
          console.log('  BUT insert still failed - RLS policy may have an issue\n');
        } else {
          console.log('  ❌ MISMATCH - Instance does NOT belong to authenticated user');
          console.log('  This is the problem! You cannot insert responses for someone else\'s instance.\n');
        }
      } else {
        console.log('Not authenticated - cannot check ownership\n');
      }
    }

    // Try to check the RLS policy directly
    console.log('Checking RLS policy evaluation...');
    const { data: policyCheck, error: policyError } = await supabase.rpc('check_rls_policy_evaluation', {
      test_instance_id: testInstance.id
    }).catch(() => ({ data: null, error: { message: 'Function not available' } }));

    if (policyError) {
      console.log('(Could not evaluate policy directly - function may not exist)\n');
    }

    return;
  }

  console.log('✅ INSERT SUCCEEDED!');
  console.log('   Inserted record:', insertData);
  console.log();
  console.log('The RLS policy fix is working correctly!');
  console.log('The issue you experienced may have been:');
  console.log('- A cached auth state');
  console.log('- A different instance ID than expected');
  console.log('- Network connectivity issue');
  console.log();
  console.log('Try the simulation again now.');

  // Clean up test data
  if (insertData && insertData.length > 0) {
    console.log('\nCleaning up test data...');
    await supabase.from('learner_responses').delete().eq('id', insertData[0].id);
    console.log('✓ Test data removed');
  }
}

diagnoseResponseInsert().catch(console.error);
