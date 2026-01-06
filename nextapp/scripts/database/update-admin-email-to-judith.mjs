import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateAdminEmail() {
  try {
    console.log('Finding current admin user...');

    // Find the admin user
    const { data: admins, error: selectError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('email', 'admin@example.com')
      .maybeSingle();

    if (selectError) {
      console.error('Error finding admin:', selectError);
      return;
    }

    if (!admins) {
      console.log('No admin user found with email admin@example.com');
      console.log('Searching for any admin user...');

      const { data: anyAdmin, error: anyAdminError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle();

      if (anyAdminError) {
        console.error('Error:', anyAdminError);
        return;
      }

      if (anyAdmin) {
        console.log('Found admin:', anyAdmin);
      } else {
        console.log('No admin users found in database');
      }
      return;
    }

    console.log('Found admin user:', admins);
    console.log('Updating email to judithdavy@changesltd.com...');

    // Update the email
    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({ email: 'judithdavy@changesltd.com' })
      .eq('id', admins.id)
      .select();

    if (updateError) {
      console.error('Error updating admin email:', updateError);
      return;
    }

    console.log('✅ Admin email updated successfully!');
    console.log('Updated profile:', updated);

    // Also need to update auth.users table
    console.log('\n⚠️  IMPORTANT: You also need to update the email in Supabase Auth:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to Authentication → Users');
    console.log('4. Find admin@example.com');
    console.log('5. Click on the user and update email to: judithdavy@changesltd.com');

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

updateAdminEmail();
