import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const sqlStatements = [
  `DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles`,
  `DROP POLICY IF EXISTS "Instructors can view all profiles" ON profiles`,
  `DROP POLICY IF EXISTS "Users can view own profile" ON profiles`,
  `DROP POLICY IF EXISTS "Users can update own profile" ON profiles`,
  `DROP POLICY IF EXISTS "Allow profile creation" ON profiles`,
  `DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles`,
  `DROP POLICY IF EXISTS "Admins can create profiles" ON profiles`,
  `DROP POLICY IF EXISTS "Admins can update profiles" ON profiles`,
  `DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles`,
  `DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles`,
  `DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles`,
  `CREATE POLICY "Authenticated users can view all profiles" ON profiles FOR SELECT TO authenticated USING (true)`,
  `CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id)`,
  `CREATE POLICY "Service role has full access" ON profiles FOR ALL TO service_role USING (true) WITH CHECK (true)`,
  `CREATE POLICY "Users can create own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id)`
];

console.log('\n⚠️  Note: This script requires service role key to apply policies.');
console.log('Please apply the following SQL directly in Supabase Dashboard SQL Editor:\n');
console.log('----------------------------------------');
console.log(sqlStatements.join(';\n\n') + ';');
console.log('----------------------------------------\n');
