import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('=== Frontend Auth Check ===\n');

// Sign in
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: 'admin@example.com',
  password: 'admin123'
});

if (authError) {
  console.error('Auth failed:', authError.message);
  process.exit(1);
}

console.log('✅ Logged in as:', authData.user.email);
console.log('User ID:', authData.user.id);

// Get profile
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('id, email, role')
  .eq('id', authData.user.id)
  .single();

if (profileError) {
  console.error('Profile fetch failed:', profileError.message);
  process.exit(1);
}

console.log('\n✅ Profile loaded:');
console.log('  Role:', profile.role);
console.log('  Email:', profile.email);

// Check if can create simulations
const canCreate = profile.role === 'admin' || profile.role === 'instructor';
console.log('\n✅ Can create simulations:', canCreate);

if (!canCreate) {
  console.error('\n❌ ERROR: User does not have permission to create simulations');
  console.error('Required role: admin or instructor');
  console.error('Current role:', profile.role);
}
