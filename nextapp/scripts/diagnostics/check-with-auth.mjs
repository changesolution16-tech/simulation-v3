import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkWithDifferentQueries() {
  console.log('=== Checking with different query approaches ===\n');
  
  // Try without any filters
  const { data: allSims, error: err1, count } = await supabase
    .from('simulations')
    .select('*', { count: 'exact' });

  console.log('Query 1 - All simulations:');
  console.log('  Count:', count);
  console.log('  Error:', err1 ? err1.message : 'none');
  console.log('  Data rows:', allSims ? allSims.length : 0);

  // Try scenarios table
  const { data: allScen, error: err2, count: count2 } = await supabase
    .from('scenarios')
    .select('*', { count: 'exact' });

  console.log('\nQuery 2 - All scenarios:');
  console.log('  Count:', count2);
  console.log('  Error:', err2 ? err2.message : 'none');
  console.log('  Data rows:', allScen ? allScen.length : 0);

  // Check if tables exist by listing
  const { data: tables, error: err3 } = await supabase
    .from('simulations')
    .select('id')
    .limit(1);

  console.log('\nQuery 3 - Table accessibility:');
  console.log('  Error:', err3 ? err3.message : 'Table accessible');

  // Check profiles
  const { data: profiles, error: err4, count: count4 } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' });

  console.log('\nQuery 4 - Profiles:');
  console.log('  Count:', count4);
  console.log('  Error:', err4 ? err4.message : 'none');

  // Check topics
  const { data: topics, error: err5, count: count5 } = await supabase
    .from('topics')
    .select('*', { count: 'exact' });

  console.log('\nQuery 5 - Topics:');
  console.log('  Count:', count5);
  console.log('  Error:', err5 ? err5.message : 'none');
  if (topics && topics.length > 0) {
    topics.forEach(t => console.log('  - ' + t.title));
  }
}

checkWithDifferentQueries().catch(console.error);
