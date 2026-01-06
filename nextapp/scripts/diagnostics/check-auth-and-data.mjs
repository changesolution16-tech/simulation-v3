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

async function checkSystem() {
  console.log('\n=== System Status Check ===\n');

  // Check for users
  console.log('1. Checking for users...');
  try {
    const { data: users, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.log('   Cannot list users (admin API not available with anon key)');
    } else {
      console.log(`   Found ${users.users.length} users`);
    }
  } catch (e) {
    console.log('   Admin API not accessible with anon key (expected)');
  }

  // Check profiles table
  console.log('\n2. Checking profiles...');
  const { data: profiles, error: profError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .limit(5);

  if (profError) {
    console.log('   Error:', profError.message);
  } else {
    console.log(`   Found ${profiles.length} profiles:`);
    profiles.forEach(p => console.log(`     - ${p.email} (${p.role})`));
  }

  // Check simulations
  console.log('\n3. Checking simulations...');
  const { data: sims, error: simError } = await supabase
    .from('simulations')
    .select('id, name, display_name, status')
    .limit(5);

  if (simError) {
    console.log('   Error:', simError.message);
  } else {
    console.log(`   Found ${sims.length} simulations`);
    if (sims.length > 0) {
      sims.forEach(s => console.log(`     - ${s.display_name || s.name} (${s.status})`));
    }
  }

  // Check scenarios
  console.log('\n4. Checking scenarios...');
  const { data: scenarios, error: scenError } = await supabase
    .from('scenarios')
    .select('id, title, timer_enabled, timer_visible, timer_display_location')
    .limit(5);

  if (scenError) {
    console.log('   Error:', scenError.message);
  } else {
    console.log(`   Found ${scenarios.length} scenarios`);
    if (scenarios.length > 0) {
      scenarios.forEach(s => {
        console.log(`     - ${s.title}`);
        console.log(`       Timer: enabled=${s.timer_enabled}, visible=${s.timer_visible}, location=${s.timer_display_location}`);
      });
    }
  }

  // Test login with a known email
  console.log('\n5. Testing authentication...');
  console.log('   Try logging in with admin credentials:');
  console.log('   - Email: admin@example.com');
  console.log('   - Or: judith@vr-lead.com');
  console.log('   You need to log in through the app UI to access data.');

  console.log('\n========================================');
  console.log('Summary:');
  console.log('========================================');
  console.log('The database exists but may be empty or protected by RLS.');
  console.log('You need to:');
  console.log('1. Log in to the application as an admin user');
  console.log('2. Create simulations through the admin UI');
  console.log('3. Enable timer settings when creating/editing scenarios');
  console.log('\nOr provide the SUPABASE_SERVICE_ROLE_KEY to seed data directly.');
  console.log('');
}

checkSystem().catch(console.error);
