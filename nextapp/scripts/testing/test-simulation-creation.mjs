import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSimulationCreation() {
  console.log('=== Testing Simulation Creation ===\n');

  // Test 1: Sign in as admin
  console.log('Test 1: Signing in as admin...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@example.com',
    password: 'admin123'
  });

  if (authError) {
    console.error('❌ Auth error:', authError.message);
    return;
  }

  console.log('✅ Signed in as:', authData.user.email);

  // Test 2: Check user profile
  console.log('\nTest 2: Checking user profile...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    console.error('❌ Profile error:', profileError.message);
    return;
  }

  console.log('✅ Profile:', profile);

  // Test 3: Check categories
  console.log('\nTest 3: Fetching categories...');
  const { data: categories, error: catError } = await supabase
    .from('simulation_categories')
    .select('id, name')
    .eq('is_active', true)
    .limit(1);

  if (catError) {
    console.error('❌ Category error:', catError.message);
    return;
  }

  if (!categories || categories.length === 0) {
    console.error('❌ No active categories found');
    return;
  }

  console.log('✅ Found category:', categories[0]);

  // Test 4: Create simulation
  console.log('\nTest 4: Creating simulation...');
  const simulationData = {
    name: 'test-simulation-' + Date.now(),
    display_name: 'Test Simulation ' + Date.now(),
    description: 'This is a test simulation',
    category_id: categories[0].id,
    difficulty: 'beginner',
    estimated_duration_minutes: 30,
    created_by: authData.user.id,
    status: 'draft',
    
    landing_page_enabled: true,
    landing_intro_video_url: null,
    landing_intro_video_type: 'synthesia',
    landing_title: null,
    landing_description: null,
    landing_objectives: [],
    landing_role_description: null,
    landing_fiction_contract: 'I agree to fully engage in this simulation as if it were real.',
    
    closing_page_enabled: true,
    closing_video_url: null,
    closing_video_type: 'synthesia',
    closing_title: 'Simulation Complete',
    closing_analysis_type: 'comprehensive',
    closing_recommendations_enabled: true,
    
    tags: []
  };

  const { data: simulation, error: simError } = await supabase
    .from('simulations')
    .insert(simulationData)
    .select()
    .single();

  if (simError) {
    console.error('❌ Simulation creation error:', simError);
    console.error('Error details:', JSON.stringify(simError, null, 2));
    return;
  }

  console.log('✅ Simulation created successfully!');
  console.log('Simulation ID:', simulation.id);
  console.log('Display Name:', simulation.display_name);

  // Clean up
  console.log('\nTest 5: Cleaning up test simulation...');
  const { error: deleteError } = await supabase
    .from('simulations')
    .delete()
    .eq('id', simulation.id);

  if (deleteError) {
    console.error('❌ Delete error:', deleteError.message);
  } else {
    console.log('✅ Test simulation deleted');
  }

  console.log('\n=== All Tests Completed Successfully ===');
}

testSimulationCreation().catch(console.error);
