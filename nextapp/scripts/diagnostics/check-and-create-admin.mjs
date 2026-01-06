import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCreateAdmin() {
  try {
    // Check all users
    console.log('Checking all users in database...\n');

    const { data: allUsers, error: allError } = await supabase
      .from('profiles')
      .select('id, email, role, full_name');

    if (allError) {
      console.error('Error querying profiles:', allError);
      return;
    }

    console.log('Found users:');
    console.log(JSON.stringify(allUsers, null, 2));

    // Check if judithdavy@changesltd.com already exists
    const judith = allUsers?.find(u => u.email === 'judithdavy@changesltd.com');

    if (judith) {
      console.log('\n✅ Found user with email judithdavy@changesltd.com');
      console.log('Current role:', judith.role);

      if (judith.role !== 'admin') {
        console.log('Updating role to admin...');

        const { data: updated, error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', judith.id)
          .select();

        if (updateError) {
          console.error('Error updating role:', updateError);
        } else {
          console.log('✅ Role updated to admin successfully!');
        }
      } else {
        console.log('✅ User is already an admin!');
      }
    } else {
      console.log('\n❌ No user found with email judithdavy@changesltd.com');
      console.log('\nYou need to:');
      console.log('1. Create a user account with this email through the app signup');
      console.log('2. OR use Supabase dashboard to create the user');
      console.log('3. Then run this script again to make them admin');
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkAndCreateAdmin();
