import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('=== Diagnosing Simulation Update Issue ===\n');

// Sign in
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: 'admin@example.com',
  password: 'admin123'
});

if (authError) {
  console.error('❌ Auth failed:', authError.message);
  process.exit(1);
}

console.log('✅ Logged in as:', authData.user.email);

// Get a simulation to test update
const { data: simulations, error: simError } = await supabase
  .from('simulations')
  .select('id, name, display_name, status')
  .limit(1);

if (simError) {
  console.error('❌ Error fetching simulations:', simError.message);
  process.exit(1);
}

if (!simulations || simulations.length === 0) {
  console.log('❌ No simulations found to test');
  process.exit(1);
}

const testSim = simulations[0];
console.log('\n✅ Found simulation to test:');
console.log('  ID:', testSim.id);
console.log('  Name:', testSim.display_name);

// Test update
console.log('\n📝 Testing update...');
const { data: updated, error: updateError } = await supabase
  .from('simulations')
  .update({ 
    description: 'Updated description at ' + new Date().toISOString()
  })
  .eq('id', testSim.id)
  .select();

if (updateError) {
  console.error('❌ Update failed:', updateError);
  console.error('Error code:', updateError.code);
  console.error('Error details:', updateError.details);
  console.error('Error hint:', updateError.hint);
} else {
  console.log('✅ Update successful');
  console.log('Updated data:', updated);
}

// Check auth status after update
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  console.error('\n❌ Session lost after update!');
} else {
  console.log('\n✅ Session still valid after update');
}
