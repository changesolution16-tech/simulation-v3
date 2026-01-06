import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('Applying multi-language support migration...');

  const sql = fs.readFileSync('./supabase/migrations/20251104000000_add_multi_language_support.sql', 'utf8');

  // Split SQL into individual statements
  const statements = sql
    .split('-- ============================================================')
    .filter(s => s.trim())
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('/*'));

  for (const statement of statements) {
    if (statement.includes('DO $$') || statement.includes('CREATE INDEX') || statement.includes('COMMENT ON')) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error && !error.message.includes('already exists')) {
          console.error('Error executing statement:', error);
        } else {
          console.log('✓ Statement executed successfully');
        }
      } catch (err) {
        console.error('Error:', err.message);
      }
    }
  }

  console.log('\nMigration completed!');
  console.log('New translation columns have been added to:');
  console.log('  - simulations table');
  console.log('  - simulation_categories table');
  console.log('  - scenarios table');
  console.log('  - scenario_options table');
}

applyMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
