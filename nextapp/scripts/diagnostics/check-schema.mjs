import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkSchema() {
  console.log('\n=== CHECKING ACTUAL DATABASE SCHEMA ===\n');
  
  // Try to query with minimal columns
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('Error:', error.message);
    console.log('Code:', error.code);
  } else {
    console.log('Topics table query successful');
    console.log('Rows returned:', data ? data.length : 0);
    
    if (data && data.length > 0) {
      console.log('\nColumns in topics table:');
      Object.keys(data[0]).forEach(col => console.log('  -', col));
    } else {
      console.log('\nTable is empty, cannot determine columns from data');
      console.log('Trying insert with minimal fields...');
      
      const { error: insertError } = await supabase
        .from('topics')
        .insert({ slug: 'test', title: 'Test' })
        .select();
      
      if (insertError) {
        console.log('Insert error:', insertError.message);
        if (insertError.message.includes('column')) {
          console.log('\nMissing required columns detected');
        }
      }
    }
  }
}

checkSchema().catch(console.error);
