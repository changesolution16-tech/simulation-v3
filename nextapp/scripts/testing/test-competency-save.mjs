import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testCompetencySave() {
  console.log('Testing scenario competency save...\n');

  // 1. Get a test scenario
  const { data: scenarios, error: scenarioError } = await supabase
    .from('scenarios')
    .select('id, title')
    .limit(1);

  if (scenarioError) {
    console.error('Error fetching scenarios:', scenarioError);
    return;
  }

  if (!scenarios || scenarios.length === 0) {
    console.error('No scenarios found');
    return;
  }

  const testScenario = scenarios[0];
  console.log('Test scenario:', testScenario);

  // 2. Get available competencies
  const { data: competencies, error: compError } = await supabase
    .from('competencies')
    .select('id, code, name')
    .eq('competency_level', 2)
    .limit(3);

  if (compError) {
    console.error('Error fetching competencies:', compError);
    return;
  }

  console.log('\nAvailable competencies:', competencies);

  if (!competencies || competencies.length === 0) {
    console.error('No competencies found');
    return;
  }

  // 3. Try to insert a targeted competency
  const testCompetency = competencies[0];
  console.log('\n Attempting to insert targeted competency...');

  const { data: insertData, error: insertError } = await supabase
    .from('scenario_targeted_competencies')
    .insert({
      scenario_id: testScenario.id,
      competency_id: testCompetency.id,
      target_weight: 1.0,
      is_primary: true,
      development_priority: 'primary',
      notes: 'Test competency'
    })
    .select();

  if (insertError) {
    console.error('❌ Insert error:', insertError);
    console.error('Error details:', JSON.stringify(insertError, null, 2));
  } else {
    console.log('✅ Insert successful:', insertData);
  }

  // 4. Try to fetch using the RPC function
  console.log('\n Fetching via RPC function...');

  const { data: rpcData, error: rpcError } = await supabase
    .rpc('get_scenario_targeted_competencies', {
      p_scenario_id: testScenario.id
    });

  if (rpcError) {
    console.error('❌ RPC error:', rpcError);
  } else {
    console.log('✅ RPC result:', rpcData);
  }

  // 5. Check current user's role
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.error('❌ User error:', userError);
  } else if (user) {
    console.log('\n✅ Current user:', user.id, user.email);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile error:', profileError);
    } else {
      console.log('✅ User role:', profile?.role);
    }
  } else {
    console.error('❌ Not authenticated');
  }

  // 6. Clean up test data
  if (insertData && insertData.length > 0) {
    console.log('\n🧹 Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('scenario_targeted_competencies')
      .delete()
      .eq('id', insertData[0].id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
    } else {
      console.log('✅ Test data cleaned up');
    }
  }
}

testCompetencySave().catch(console.error);
