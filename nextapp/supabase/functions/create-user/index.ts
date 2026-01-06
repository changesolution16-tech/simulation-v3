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
    
    console.log('Creating supabase admin client');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Validating requesting user');
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized: ' + (authError?.message || 'Invalid token'));
    }

    console.log('Fetching profile for user:', requestingUser.id);
    const { data: profile, error: profileFetchError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', requestingUser.id)
      .single();

    if (profileFetchError) {
      console.error('Profile fetch error:', profileFetchError);
      throw new Error('Failed to verify admin status: ' + profileFetchError.message);
    }

    console.log('User profile:', profile);
    if (!profile || profile.role !== 'admin') {
      console.error('Access denied. User role:', profile?.role);
      throw new Error('Forbidden: Admin access required. Your role: ' + (profile?.role || 'unknown'));
    }

    const body = await req.json();
    const { email, password, full_name, role, institution, department, position, username } = body;

    console.log('Creating user with data:', { email, full_name, role, username, institution, department, position });

    if (!email || !password || !full_name || !role) {
      throw new Error('Missing required fields: email, password, full_name, role');
    }

    const dbRole = role === 'student' ? 'learner' : role;
    console.log('DB role will be:', dbRole);

    // Generate username from email if not provided
    const generatedUsername = username || email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
    console.log('Username will be:', generatedUsername);

    // Check if username already exists
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('username', generatedUsername)
      .maybeSingle();

    if (existingUser) {
      throw new Error(`Username '${generatedUsername}' is already taken. Please choose a different username.`);
    }

    console.log('Creating auth user...');
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role: dbRole
      }
    });

    if (createError) {
      console.error('Auth user creation error:', createError);
      throw new Error('Failed to create auth user: ' + createError.message);
    }

    console.log('Auth user created:', authData.user.id);
    console.log('Creating profile record...');

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email,
        full_name,
        username: generatedUsername,
        role: dbRole,
        is_active: true,
        institution: institution || null,
        department: department || null,
        position: position || null,
        password_last_changed: new Date().toISOString(),
        activation_history: [{
          action: 'activated',
          timestamp: new Date().toISOString(),
          reason: 'Initial account creation',
          changed_by: requestingUser.id
        }]
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error('Failed to create profile: ' + profileError.message);
    }

    console.log('User created successfully!');
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email,
          full_name,
          username: generatedUsername,
          role,
          is_active: true,
          institution,
          department,
          position,
          created_at: authData.user.created_at
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Edge function error:', error);
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