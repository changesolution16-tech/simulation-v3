import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file');
  console.error('Need: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const migrationFile = 'supabase/migrations/20251023000000_fix_infinite_recursion_profiles_policies.sql';
const sql = readFileSync(migrationFile, 'utf8');

console.log('Applying migration:', migrationFile);
console.log('---');

// Split by semicolon but keep statements together
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('/*') && !s.startsWith('--'));

for (const statement of statements) {
  if (!statement) continue;

  console.log('Executing:', statement.substring(0, 100) + '...');

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
    if (error) {
      // Try direct execution if rpc doesn't work
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ sql: statement + ';' })
      });

      if (!response.ok) {
        console.error('Failed:', await response.text());
      } else {
        console.log('✓ Success');
      }
    } else {
      console.log('✓ Success');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

console.log('\nMigration complete!');
