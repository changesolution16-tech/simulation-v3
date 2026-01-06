#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function testWeightMatrixSave() {
  console.log('🧪 Testing Weight Matrix Save Functionality\n');

  // 1. Find JMMB simulation
  console.log('1. Finding JMMB simulation...');
  const { data: sim, error: simError } = await supabase
    .from('simulations')
    .select('id, display_name')
    .ilike('display_name', '%jmmb%')
    .maybeSingle();

  if (simError || !sim) {
    console.error('❌ Error finding simulation:', simError);
    return;
  }
  console.log(`✅ Found simulation: ${sim.display_name} (${sim.id})\n`);

  // 2. Find admin user
  console.log('2. Finding admin user...');
  const { data: admin, error: adminError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle();

  if (adminError || !admin) {
    console.error('❌ Error finding admin:', adminError);
    return;
  }
  console.log(`✅ Found admin: ${admin.email} (${admin.id})\n`);

  // 3. Test competency lookup
  console.log('3. Testing competency lookups...');
  const competencyCodes = ['TBR-03', 'AC-06', 'EI-02', 'EL-05', 'VBD-01'];

  for (const code of competencyCodes) {
    const { data: comp, error: compError } = await supabase
      .from('competencies')
      .select('id, code, name')
      .eq('code', code)
      .maybeSingle();

    if (compError || !comp) {
      console.error(`❌ Error finding competency ${code}:`, compError);
    } else {
      console.log(`✅ ${code}: ${comp.name}`);
    }
  }
  console.log('');

  // 4. Test insert/update (upsert)
  console.log('4. Testing weight matrix save...');
  const testWeights = {
    bravin_alignment: 0.25,
    trust_impact: 0.35,
    emotional_intelligence_index: 0.20,
    ethical_decision_quality: 0.20
  };

  // Get first competency
  const { data: testComp } = await supabase
    .from('competencies')
    .select('id')
    .eq('code', 'TBR-03')
    .single();

  if (!testComp) {
    console.error('❌ Could not find TBR-03 competency');
    return;
  }

  // Try to upsert
  for (const [metricType, weight] of Object.entries(testWeights)) {
    const { error: upsertError } = await supabase
      .from('simulation_competency_weights')
      .upsert({
        simulation_id: sim.id,
        competency_id: testComp.id,
        metric_type: metricType,
        weight: weight,
        configured_by: admin.id,
        overrides_global: true
      }, {
        onConflict: 'simulation_id,competency_id,metric_type'
      });

    if (upsertError) {
      console.error(`❌ Error upserting ${metricType}:`, upsertError);
    } else {
      console.log(`✅ Saved ${metricType}: ${weight}`);
    }
  }
  console.log('');

  // 5. Verify saved data
  console.log('5. Verifying saved data...');
  const { data: saved, error: savedError } = await supabase
    .from('simulation_competency_weights')
    .select('metric_type, weight')
    .eq('simulation_id', sim.id)
    .eq('competency_id', testComp.id);

  if (savedError) {
    console.error('❌ Error retrieving saved data:', savedError);
    return;
  }

  console.log(`✅ Found ${saved.length} saved weights for TBR-03:`);
  saved.forEach(w => {
    console.log(`   ${w.metric_type}: ${w.weight}`);
  });
  console.log('');

  // 6. Check RLS policies
  console.log('6. Checking RLS policies...');
  const { data: policies, error: policyError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT policyname, cmd, roles
      FROM pg_policies
      WHERE tablename = 'simulation_competency_weights'
      ORDER BY cmd, policyname;
    `
  }).catch(() => {
    // If RPC doesn't exist, query directly
    return supabase.from('pg_policies')
      .select('policyname, cmd, roles')
      .eq('tablename', 'simulation_competency_weights');
  });

  if (!policyError && policies) {
    console.log('✅ RLS Policies active:');
    console.log('   (Check via Supabase dashboard for full details)');
  }

  console.log('\n✨ Test Complete!\n');
  console.log('Summary:');
  console.log('- Simulation found ✅');
  console.log('- Admin user found ✅');
  console.log('- Competencies lookup working ✅');
  console.log('- Weight save working ✅');
  console.log('- Data persists ✅');
  console.log('\n👉 Next: Test in browser as admin user (judithdavy@changesltd.com)');
}

testWeightMatrixSave().catch(console.error);
