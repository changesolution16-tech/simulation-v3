import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('=== Testing Update with Session Monitoring ===\n');

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

// Check session before update
let { data: { session: sessionBefore } } = await supabase.auth.getSession();
console.log('\n📋 Session BEFORE update:');
console.log('  Session exists:', !!sessionBefore);
console.log('  User ID:', sessionBefore?.user?.id);
console.log('  Expires at:', sessionBefore?.expires_at);

// Get a simulation
const { data: sims } = await supabase
  .from('simulations')
  .select('id, name, display_name')
  .limit(1);

if (!sims || sims.length === 0) {
  console.log('❌ No simulations found');
  process.exit(1);
}

const testSim = sims[0];
console.log('\n✅ Testing with simulation:', testSim.display_name);

// Perform update
console.log('\n📝 Updating simulation...');
const { data: updated, error: updateError } = await supabase
  .from('simulations')
  .update({ 
    description: 'Test update at ' + new Date().toISOString()
  })
  .eq('id', testSim.id)
  .select();

if (updateError) {
  console.error('❌ Update failed:', updateError);
} else {
  console.log('✅ Update successful');
}

// Check session after update
let { data: { session: sessionAfter } } = await supabase.auth.getSession();
console.log('\n📋 Session AFTER update:');
console.log('  Session exists:', !!sessionAfter);
console.log('  User ID:', sessionAfter?.user?.id);
console.log('  Expires at:', sessionAfter?.expires_at);
console.log('  Same session:', sessionBefore?.access_token === sessionAfter?.access_token);

if (!sessionAfter) {
  console.error('\n❌ SESSION LOST AFTER UPDATE!');
} else {
  console.log('\n✅ Session maintained successfully');
}
