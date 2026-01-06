import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function diagnoseCompetencyIssue() {
  console.log('=== Diagnosing Scenario Competency Save Issue ===\n');

  // 1. Check auth status
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.log('❌ Not authenticated. Please log in first.');
    return;
  }

  console.log('✅ Authenticated as:', user.email);

  // 2. Check user role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('❌ Error fetching profile:', profileError);
    return;
  }

  console.log('✅ User role:', profile?.role || 'NONE');

  if (profile?.role !== 'admin') {
    console.log('⚠️  User is not an admin. Insert will likely fail due to RLS.');
  }

  // 3. Check for simulations
  const { data: simulations, error: simError } = await supabase
    .from('simulations')
    .select('id, name')
    .limit(5);

  if (simError) {
    console.error('❌ Error fetching simulations:', simError);
    return;
  }

  console.log(`\n📊 Found ${simulations?.length || 0} simulations`);
  if (simulations && simulations.length > 0) {
    simulations.forEach(sim => console.log(`  - ${sim.name} (${sim.id})`));
  }

  // 4. Check for scenarios
  const { data: scenarios, error: scenError } = await supabase
    .from('scenarios')
    .select('id, title, simulation_id')
    .limit(5);

  if (scenError) {
    console.error('❌ Error fetching scenarios:', scenError);
    return;
  }

  console.log(`\n📝 Found ${scenarios?.length || 0} scenarios`);
  if (scenarios && scenarios.length > 0) {
    scenarios.forEach(sc => console.log(`  - ${sc.title} (${sc.id.substring(0, 8)}...)`));
  } else {
    console.log('⚠️  No scenarios found. This might be why competencies cannot be added.');
    return;
  }

  // 5. Check for competencies
  const { data: competencies, error: compError } = await supabase
    .from('competencies')
    .select('id, code, name, competency_level')
    .eq('competency_level', 2)
    .limit(5);

  if (compError) {
    console.error('❌ Error fetching competencies:', compError);
    return;
  }

  console.log(`\n🎯 Found ${competencies?.length || 0} level 2 competencies`);
  if (competencies && competencies.length > 0) {
    competencies.forEach(comp => console.log(`  - ${comp.code}: ${comp.name}`));
  } else {
    console.log('⚠️  No competencies found. This might be the issue.');
    return;
  }

  // 6. Try a test insert
  const testScenario = scenarios[0];
  const testCompetency = competencies[0];

  console.log(`\n🧪 Testing insert for scenario "${testScenario.title}"`);
  console.log(`   with competency "${testCompetency.code}"`);

  const { data: insertData, error: insertError } = await supabase
    .from('scenario_targeted_competencies')
    .insert({
      scenario_id: testScenario.id,
      competency_id: testCompetency.id,
      target_weight: 1.0,
      is_primary: true,
      development_priority: 'primary',
      notes: 'Test insert'
    })
    .select();

  if (insertError) {
    console.error('\n❌ INSERT FAILED:');
    console.error('   Code:', insertError.code);
    console.error('   Message:', insertError.message);
    console.error('   Details:', insertError.details);
    console.error('   Hint:', insertError.hint);

    if (insertError.message?.includes('duplicate')) {
      console.log('\n💡 This combination already exists. Trying to fetch it...');

      const { data: existing, error: fetchError } = await supabase
        .from('scenario_targeted_competencies')
        .select('*')
        .eq('scenario_id', testScenario.id)
        .eq('competency_id', testCompetency.id);

      if (!fetchError && existing && existing.length > 0) {
        console.log('✅ Found existing record:', existing[0]);
      }
    }

    if (insertError.message?.includes('policy')) {
      console.log('\n💡 RLS policy violation. Checking RLS policies...');

      // Check the RLS policies
      const { data: policies, error: policyError } = await supabase
        .rpc('pg_policies')
        .eq('tablename', 'scenario_targeted_competencies');

      if (!policyError && policies) {
        console.log('📋 RLS Policies:', policies);
      }
    }
  } else {
    console.log('\n✅ INSERT SUCCESS:', insertData);

    // Clean up
    const { error: deleteError } = await supabase
      .from('scenario_targeted_competencies')
      .delete()
      .eq('id', insertData[0].id);

    if (!deleteError) {
      console.log('🧹 Test record cleaned up');
    }
  }

  // 7. Check existing targeted competencies
  console.log('\n📋 Checking existing targeted competencies...');
  const { data: existing, error: existError } = await supabase
    .from('scenario_targeted_competencies')
    .select(`
      id,
      scenario_id,
      competency_id,
      target_weight,
      is_primary,
      development_priority
    `)
    .limit(10);

  if (existError) {
    console.error('❌ Error fetching existing records:', existError);
  } else {
    console.log(`   Found ${existing?.length || 0} existing records`);
    if (existing && existing.length > 0) {
      existing.forEach(rec => {
        console.log(`   - Scenario ${rec.scenario_id.substring(0, 8)}... → Competency ${rec.competency_id.substring(0, 8)}...`);
      });
    }
  }

  // 8. Test the RPC function
  console.log('\n🔧 Testing RPC function...');
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('get_scenario_targeted_competencies', {
      p_scenario_id: testScenario.id
    });

  if (rpcError) {
    console.error('❌ RPC error:', rpcError);
  } else {
    console.log(`✅ RPC returned ${rpcData?.length || 0} competencies`);
    if (rpcData && rpcData.length > 0) {
      rpcData.forEach(comp => {
        console.log(`   - ${comp.competency_code}: ${comp.competency_name}`);
      });
    }
  }

  console.log('\n=== Diagnosis Complete ===');
}

diagnoseCompetencyIssue().catch(console.error);
