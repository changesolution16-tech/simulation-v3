import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

    // Check if admin already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', 'judithdavy@changesltd.com')
      .single();

    if (existingProfile) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Admin user already exists',
          email: 'judithdavy@changesltd.com'
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Create admin user with proper password
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: 'judithdavy@changesltd.com',
      password: 'ChangeAdmin2024!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Judith Davy',
        role: 'admin'
      }
    });

    if (createError) {
      throw new Error('Failed to create auth user: ' + createError.message);
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: 'judithdavy@changesltd.com',
        full_name: 'Judith Davy',
        role: 'admin',
        institution: 'Change Solutions Hub'
      });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error('Failed to create profile: ' + profileError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin user created successfully',
        email: 'judithdavy@changesltd.com',
        userId: authData.user.id
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Setup admin error:', error);
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