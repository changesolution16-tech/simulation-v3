import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkAll() {
  console.log('=== Comprehensive Database Check ===\n');
  
  const tables = [
    'simulations',
    'scenarios', 
    'simulation_scenarios',
    'scenario_options',
    'profiles',
    'topics'
  ];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(table + ': ERROR - ' + error.message);
    } else {
      console.log(table + ': ' + count + ' rows');
    }
  }

  console.log('\n=== Checking specific simulation data ===\n');

  const { data: pubSims, error: pubError } = await supabase
    .from('simulations')
    .select('id, display_name, status')
    .eq('status', 'published');

  console.log('Published simulations: ' + (pubSims ? pubSims.length : 0));
  if (pubSims && pubSims.length > 0) {
    pubSims.forEach(s => console.log('  - ' + s.display_name));
  }

  const { data: allSims, error: allError } = await supabase
    .from('simulations')
    .select('id, display_name, status');

  console.log('\nAll simulations (any status): ' + (allSims ? allSims.length : 0));
  if (allSims && allSims.length > 0) {
    allSims.forEach(s => console.log('  - ' + s.display_name + ' [' + s.status + ']'));
  }
}

checkAll().catch(console.error);
