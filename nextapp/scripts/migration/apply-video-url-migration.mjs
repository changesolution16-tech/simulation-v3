import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('Reading migration file...');
  const migrationSql = readFileSync('./supabase/migrations/20251030210000_backfill_video_library_urls.sql', 'utf8');

  // Replace the current_setting call with the actual URL for the UPDATE statement
  const processedSql = migrationSql.replace(
    /(SELECT current_setting\('app\.settings\.supabase_url', true\))/g,
    `'${supabaseUrl}'`
  );

  console.log('Applying migration to backfill video library URLs...');
  const { data, error } = await supabase.rpc('execute_sql', { query: processedSql });

  if (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }

  console.log('✅ Migration applied successfully!');

  // Query to check results
  console.log('\nChecking video_library entries...');
  const { data: videos, error: queryError } = await supabase
    .from('video_library')
    .select('id, title, video_url, video_file_id')
    .limit(10);

  if (queryError) {
    console.error('Query error:', queryError);
  } else {
    console.log('\nSample video library entries:');
    videos.forEach(v => {
      const hasUrl = v.video_url ? '✅ HAS URL' : '❌ NO URL';
      const hasFileId = v.video_file_id ? '(has file_id)' : '(no file_id)';
      console.log(`  ${v.title.substring(0, 40)}: ${hasUrl} ${hasFileId}`);
    });
  }

  // Check for any remaining issues
  const { data: missingUrls, error: countError } = await supabase
    .from('video_library')
    .select('id', { count: 'exact', head: true })
    .is('video_url', null)
    .not('video_file_id', 'is', null);

  if (!countError) {
    console.log(`\n⚠️  Videos with file_id but still missing URL: ${missingUrls?.length || 0}`);
  }
}

applyMigration().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
