#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Diagnostic Script: Introduction Field Persistence\n');
console.log('=====================================\n');

async function testIntroductionFields() {
  console.log('Step 1: Checking database schema...');

  // Check if we can query the fields
  const { data: schemaCheck, error: schemaError } = await supabase
    .from('simulations')
    .select('introduction_title, introduction_description, introduction_video_url, introduction_video_type, introduction_page_enabled')
    .limit(0);

  if (schemaError) {
    console.error('❌ Schema check failed:', schemaError.message);
    return false;
  }

  console.log('✅ All introduction fields exist in database schema\n');

  console.log('Step 2: Checking existing simulations...');

  const { data: simulations, error: fetchError } = await supabase
    .from('simulations')
    .select('id, display_name, introduction_title, introduction_description, introduction_video_url, introduction_page_enabled')
    .order('created_at', { ascending: false })
    .limit(5);

  if (fetchError) {
    console.error('❌ Failed to fetch simulations:', fetchError.message);
    return false;
  }

  console.log(`Found ${simulations.length} recent simulations:\n`);

  if (simulations.length === 0) {
    console.log('⚠️  No simulations found in database');
    return true;
  }

  simulations.forEach((sim, index) => {
    console.log(`${index + 1}. ${sim.display_name || 'Unnamed'} (ID: ${sim.id.substring(0, 8)}...)`);
    console.log(`   Introduction Page Enabled: ${sim.introduction_page_enabled ? 'Yes' : 'No'}`);
    console.log(`   Introduction Title: ${sim.introduction_title || '(not set)'}`);
    console.log(`   Introduction Description: ${sim.introduction_description ? sim.introduction_description.substring(0, 50) + '...' : '(not set)'}`);
    console.log(`   Introduction Video URL: ${sim.introduction_video_url || '(not set)'}`);
    console.log('');
  });

  const hasIntroData = simulations.some(sim =>
    sim.introduction_title || sim.introduction_description || sim.introduction_video_url
  );

  if (!hasIntroData) {
    console.log('⚠️  WARNING: None of the recent simulations have introduction field data!');
    console.log('   This indicates the fields are not being saved during simulation creation/update.\n');
  } else {
    console.log('✅ Some simulations have introduction field data\n');
  }

  console.log('Step 3: Testing field update capability...');
  console.log('   (This requires authentication, so will check RLS policies)\n');

  // Try to check current auth state
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    console.log('⚠️  Not authenticated - cannot test update capability');
    console.log('   To fully test, please:');
    console.log('   1. Run the application');
    console.log('   2. Log in as an admin');
    console.log('   3. Try to edit a simulation and save introduction fields');
    console.log('   4. Check browser console for any errors\n');
  } else {
    console.log('✅ Authenticated as:', session.user.email);
    console.log('   Can proceed with update test\n');
  }

  return true;
}

async function generateRecommendations() {
  console.log('=====================================');
  console.log('📋 Recommendations:\n');

  console.log('1. CHECK THE ADMIN UI:');
  console.log('   - Open SimulationBuilder in the admin panel');
  console.log('   - Navigate to the "Introduction" step');
  console.log('   - Fill in: Title, Video URL, Description');
  console.log('   - Click Save and watch browser console\n');

  console.log('2. LOOK FOR THESE CONSOLE MESSAGES:');
  console.log('   - [SimulationBuilder] Saving simulation...');
  console.log('   - [SimulationService] Updating simulation: {id}');
  console.log('   - [SimulationService] Update data: {...}');
  console.log('   - [IntroductionPage] Video input changed: {...}\n');

  console.log('3. VERIFY THE PAYLOAD:');
  console.log('   - Check if introduction_title appears in the update data');
  console.log('   - Check if introduction_video_url appears in the update data');
  console.log('   - Check if introduction_description appears in the update data\n');

  console.log('4. CHECK FOR ERRORS:');
  console.log('   - RLS policy violations (error code 42501)');
  console.log('   - Column does not exist errors');
  console.log('   - Permission denied errors\n');

  console.log('5. VERIFY DATA AFTER SAVE:');
  console.log('   - Refresh the SimulationBuilder');
  console.log('   - Navigate back to Introduction step');
  console.log('   - Check if your entered values are still there\n');
}

async function main() {
  try {
    await testIntroductionFields();
    await generateRecommendations();

    console.log('=====================================');
    console.log('✅ Diagnostic complete!');
    console.log('\nNext step: Test the save workflow in the UI');
    console.log('and compare the console output with the');
    console.log('recommendations above.\n');

  } catch (error) {
    console.error('❌ Diagnostic failed with error:', error);
    process.exit(1);
  }
}

main();
