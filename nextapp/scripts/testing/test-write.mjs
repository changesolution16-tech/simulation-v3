import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testWrite() {
  console.log('\n=== ATTEMPTING TO WRITE TEST DATA ===\n');
  console.log('Target DB:', process.env.VITE_SUPABASE_URL);
  
  // Try to insert a test topic
  const { data, error } = await supabase
    .from('topics')
    .insert({
      slug: 'test-topic-' + Date.now(),
      title: 'Test Topic',
      description: 'Testing database write',
      icon: 'MessageSquare',
      color: 'blue'
    })
    .select();
  
  if (error) {
    console.log('ERROR writing to database:', error.message);
    console.log('Error code:', error.code);
    console.log('\nThis might be a permissions issue.');
  } else {
    console.log('SUCCESS! Data written:', data);
    
    // Now try to read it back
    const { data: allTopics, error: readError } = await supabase
      .from('topics')
      .select('*');
    
    if (readError) {
      console.log('ERROR reading back:', readError.message);
    } else {
      console.log('\nAll topics in database:', allTopics.length);
      allTopics.forEach(t => console.log('  -', t.title));
    }
  }
}

testWrite().catch(console.error);
