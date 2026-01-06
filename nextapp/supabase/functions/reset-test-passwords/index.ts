import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const testUsers = [
      { email: 'admin@example.com', password: 'admin123', role: 'admin', name: 'System Admin' },
      { email: 'teacher@example.edu', password: 'teacher123', role: 'instructor', name: 'Test Teacher' },
      { email: 'student@university.edu', password: 'student123', role: 'learner', name: 'Test Student' }
    ];

    const results = [];

    for (const user of testUsers) {
      try {
        const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
        const userExists = existingUser.users.find(u => u.email === user.email);

        if (userExists) {
          console.log(`Updating password for ${user.email}`);
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            userExists.id,
            { password: user.password }
          );

          if (updateError) {
            results.push({ email: user.email, status: 'error', message: updateError.message });
          } else {
            results.push({ email: user.email, status: 'updated' });
          }
        } else {
          console.log(`Creating user ${user.email}`);
          const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true,
            user_metadata: {
              full_name: user.name,
              role: user.role
            }
          });

          if (createError) {
            results.push({ email: user.email, status: 'error', message: createError.message });
            continue;
          }

          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
              id: authData.user.id,
              email: user.email,
              full_name: user.name,
              role: user.role,
              institution: user.role === 'admin' ? 'System' : 'Test Institution'
            });

          if (profileError) {
            results.push({ email: user.email, status: 'error', message: profileError.message });
          } else {
            results.push({ email: user.email, status: 'created' });
          }
        }
      } catch (error) {
        results.push({ email: user.email, status: 'error', message: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password reset complete',
        results
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Reset passwords error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});