import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// You need to add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env file
// Get it from: https://supabase.com/dashboard/project/gglzmggwifbkxtxjclcw/settings/api

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing VITE_SUPABASE_URL in .env file');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('❌ Missing VITE_SUPABASE_SERVICE_ROLE_KEY in .env file');
  console.error('\nPlease add it to your .env file:');
  console.error('1. Go to https://supabase.com/dashboard/project/gglzmggwifbkxtxjclcw/settings/api');
  console.error('2. Copy the "service_role" key (secret)');
  console.error('3. Add to .env: VITE_SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createJudithAdmin() {
  try {
    console.log('🔍 Checking if admin user already exists...\n');

    // Check if user exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('email', 'judithdavy@changesltd.com')
      .maybeSingle();

    if (existingProfile) {
      console.log('✅ User already exists:', existingProfile);

      if (existingProfile.role !== 'admin') {
        console.log('\n🔄 Updating role to admin...');

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', existingProfile.id);

        if (updateError) {
          console.error('❌ Error updating role:', updateError);
        } else {
          console.log('✅ Role updated to admin successfully!');
        }
      } else {
        console.log('✅ User is already an admin!');
      }
      return;
    }

    console.log('📝 Creating new admin user...\n');

    // Create auth user
    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email: 'judithdavy@changesltd.com',
      password: 'ChangeAdmin2024!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Judith Davy',
        role: 'admin'
      }
    });

    if (createError) {
      console.error('❌ Failed to create auth user:', createError);
      return;
    }

    console.log('✅ Auth user created with ID:', authData.user.id);

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: 'judithdavy@changesltd.com',
        full_name: 'Judith Davy',
        role: 'admin',
        institution: 'Change Solutions Hub'
      });

    if (profileError) {
      console.error('❌ Failed to create profile:', profileError);
      console.log('🗑️  Rolling back auth user...');
      await supabase.auth.admin.deleteUser(authData.user.id);
      return;
    }

    console.log('\n✅ SUCCESS! Admin user created:\n');
    console.log('   Email: judithdavy@changesltd.com');
    console.log('   Password: ChangeAdmin2024!');
    console.log('   Role: admin');
    console.log('   Institution: Change Solutions Hub');
    console.log('\n🔐 Please change the password after first login!');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

createJudithAdmin();
