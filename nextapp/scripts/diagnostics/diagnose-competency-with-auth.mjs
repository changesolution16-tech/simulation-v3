import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseCompetencyIssue() {
  console.log('=== Diagnosing Scenario Competency Save Issue (Service Role) ===\n');

  // 1. Check for simulations
  const { data: simulations, error: simError } = await supabase
    .from('simulations')
    .select('id, name')
    .limit(5);

  if (simError) {
    console.error('❌ Error fetching simulations:', simError);
    return;
  }

  console.log(`📊 Found ${simulations?.length || 0} simulations`);
  if (simulations && simulations.length > 0) {
    simulations.forEach(sim => console.log(`  - ${sim.name} (${sim.id.substring(0, 8)}...)`));
  }

  // 2. Check for scenarios
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
    console.log('⚠️  No scenarios found.');
    return;
  }

  // 3. Check for competencies
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
    console.log('⚠️  No competencies found.');
    return;
  }

  // 4. Check table structure
  console.log('\n🔍 Checking scenario_targeted_competencies table structure...');

  const { data: tableCheck, error: tableError } = await supabase
    .from('scenario_targeted_competencies')
    .select('*')
    .limit(0);

  if (tableError) {
    console.error('❌ Table error:', tableError);
    console.log('   The table might not exist or RLS is blocking access.');
  } else {
    console.log('✅ Table is accessible');
  }

  // 5. Check existing records
  const { data: existing, error: existError } = await supabase
    .from('scenario_targeted_competencies')
    .select('*');

  if (existError) {
    console.error('❌ Error fetching existing records:', existError);
  } else {
    console.log(`\n📋 Found ${existing?.length || 0} existing targeted competency records`);
    if (existing && existing.length > 0) {
      existing.slice(0, 3).forEach(rec => {
        console.log(`   - Scenario: ${rec.scenario_id.substring(0, 8)}...`);
        console.log(`     Competency: ${rec.competency_id.substring(0, 8)}...`);
        console.log(`     Primary: ${rec.is_primary}, Priority: ${rec.development_priority}`);
      });
      if (existing.length > 3) {
        console.log(`   ... and ${existing.length - 3} more`);
      }
    }
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
      notes: 'Test insert from diagnostic'
    })
    .select();

  if (insertError) {
    console.error('\n❌ INSERT FAILED:');
    console.error('   Code:', insertError.code);
    console.error('   Message:', insertError.message);
    console.error('   Details:', insertError.details);
    console.error('   Hint:', insertError.hint);

    if (insertError.code === '23505') {
      console.log('\n💡 Duplicate key error - this combination already exists.');
      console.log('   Fetching existing record...');

      const { data: dup, error: dupError } = await supabase
        .from('scenario_targeted_competencies')
        .select('*')
        .eq('scenario_id', testScenario.id)
        .eq('competency_id', testCompetency.id)
        .maybeSingle();

      if (!dupError && dup) {
        console.log('   ✅ Existing record found:', {
          id: dup.id,
          target_weight: dup.target_weight,
          is_primary: dup.is_primary,
          development_priority: dup.development_priority,
          created_at: dup.created_at
        });
      }
    }
  } else {
    console.log('\n✅ INSERT SUCCESS');
    console.log('   Record ID:', insertData[0].id);
    console.log('   Created at:', insertData[0].created_at);

    // Clean up
    console.log('\n🧹 Cleaning up test record...');
    const { error: deleteError } = await supabase
      .from('scenario_targeted_competencies')
      .delete()
      .eq('id', insertData[0].id);

    if (deleteError) {
      console.error('   ❌ Delete failed:', deleteError.message);
    } else {
      console.log('   ✅ Test record deleted');
    }
  }

  // 7. Test the RPC function
  console.log('\n🔧 Testing RPC function get_scenario_targeted_competencies...');
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('get_scenario_targeted_competencies', {
      p_scenario_id: testScenario.id
    });

  if (rpcError) {
    console.error('❌ RPC error:', rpcError.message);
    console.error('   Code:', rpcError.code);
    console.error('   Details:', rpcError.details);
  } else {
    console.log(`✅ RPC returned ${rpcData?.length || 0} competencies for this scenario`);
    if (rpcData && rpcData.length > 0) {
      rpcData.forEach(comp => {
        console.log(`   - ${comp.competency_code}: ${comp.competency_name}`);
        console.log(`     Priority: ${comp.development_priority}, Weight: ${comp.target_weight}`);
      });
    }
  }

  // 8. Check RLS policies
  console.log('\n🔐 Checking RLS policies...');
  const { data: policies, error: policyError } = await supabase
    .rpc('pg_policies', {})
    .eq('tablename', 'scenario_targeted_competencies');

  if (policyError) {
    console.log('   Unable to fetch policies (this is normal)');
  } else if (policies) {
    console.log(`   Found ${policies.length} policies`);
  }

  console.log('\n=== Diagnosis Complete ===\n');
  console.log('Summary:');
  console.log(`  • Scenarios: ${scenarios?.length || 0}`);
  console.log(`  • Competencies: ${competencies?.length || 0}`);
  console.log(`  • Existing targeted competencies: ${existing?.length || 0}`);
  console.log(`  • Insert test: ${insertError ? '❌ Failed' : '✅ Success'}`);
  console.log(`  • RPC function: ${rpcError ? '❌ Failed' : '✅ Success'}`);
}

diagnoseCompetencyIssue().catch(console.error);
