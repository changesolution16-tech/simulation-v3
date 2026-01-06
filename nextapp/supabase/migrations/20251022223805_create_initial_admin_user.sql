/*
  # Create Initial Admin User

  ## Overview
  This migration creates an initial admin user that can be used to log in and create other users.
  
  ## Details
  - Creates an admin user in auth.users
  - Creates corresponding profile with admin role
  - Email: admin@example.com
  - Password: admin123 (should be changed after first login)
  
  ## Security Note
  This is a development/demo admin account. In production, this should be changed immediately.
*/

-- Insert admin user into auth.users
-- This uses a known UUID so we can reference it
DO $$
DECLARE
  admin_user_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  encrypted_pw text;
BEGIN
  -- Check if admin already exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@example.com') THEN
    -- Create the admin user
    -- Note: The password is 'admin123' 
    -- Supabase will hash this with bcrypt
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud
    ) VALUES (
      admin_user_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@example.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"System Admin","role":"admin"}',
      false,
      'authenticated',
      'authenticated'
    );

    -- Create the profile
    INSERT INTO profiles (
      id,
      email,
      full_name,
      role,
      institution,
      created_at,
      updated_at
    ) VALUES (
      admin_user_id,
      'admin@example.com',
      'System Admin',
      'admin',
      'System',
      now(),
      now()
    );
  END IF;
END $$;
