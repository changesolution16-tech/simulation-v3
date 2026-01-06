import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gglzmggwifbkxtxjclcw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.log('Please run: export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateAdminEmail() {
  const oldEmail = 'admin@example.com';
  const newEmail = 'JUDITHDAVY@CHANGESLTD.COM';

  console.log(`Updating admin email from ${oldEmail} to ${newEmail}...`);

  try {
    const { data: users, error: findError } = await supabase.auth.admin.listUsers();
    
    if (findError) {
      throw new Error(`Error finding users: ${findError.message}`);
    }

    const adminUser = users.users.find(u => u.email === oldEmail);
    
    if (!adminUser) {
      console.log('Admin user not found. Checking if new email already exists...');
      const newEmailUser = users.users.find(u => u.email?.toLowerCase() === newEmail.toLowerCase());
      if (newEmailUser) {
        console.log('User with new email already exists. Updating role to admin...');
        
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', newEmailUser.id);
        
        if (profileError) {
          throw new Error(`Error updating profile: ${profileError.message}`);
        }
        
        console.log('✓ User updated to admin successfully!');
        return;
      }
      
      throw new Error('Admin user not found and new email does not exist');
    }

    console.log(`Found admin user: ${adminUser.id}`);

    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      adminUser.id,
      { 
        email: newEmail,
        email_confirm: true
      }
    );

    if (updateError) {
      throw new Error(`Error updating auth user: ${updateError.message}`);
    }

    console.log('✓ Auth user email updated');

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ email: newEmail })
      .eq('id', adminUser.id);

    if (profileError) {
      throw new Error(`Error updating profile: ${profileError.message}`);
    }

    console.log('✓ Profile email updated');
    console.log(`\n✓ Admin email successfully changed to: ${newEmail}`);
    console.log('\nYou can now login with:');
    console.log(`Email: ${newEmail}`);
    console.log('Password: admin123 (please change this after logging in)');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

updateAdminEmail();
