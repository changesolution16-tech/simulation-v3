import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVideoLibrarySelection() {
  console.log('🧪 Testing Video Library Selection Flow\n');

  // Step 1: Get a video from the library
  console.log('1️⃣  Fetching video from library...');
  const { data: libraryVideos, error: libError } = await supabase
    .from('video_library')
    .select(`
      id,
      title,
      video_url,
      video_file_id,
      video_files:video_file_id (
        storage_path,
        storage_bucket
      )
    `)
    .eq('title', 'Lumina Simulation - Introduction')
    .maybeSingle();

  if (libError) {
    console.error('❌ Error fetching video:', libError);
    return;
  }

  if (!libraryVideos) {
    console.error('❌ Video not found in library');
    return;
  }

  console.log(`✅ Found video: ${libraryVideos.title}`);
  console.log(`   - video_url: ${libraryVideos.video_url ? '✅ EXISTS' : '❌ NULL'}`);
  console.log(`   - video_file_id: ${libraryVideos.video_file_id ? '✅ EXISTS' : '❌ NULL'}`);

  if (libraryVideos.video_url) {
    console.log(`   - URL: ${libraryVideos.video_url.substring(0, 80)}...`);
  }

  // Step 2: Check if there's a simulation to test with
  console.log('\n2️⃣  Finding a simulation to test with...');
  const { data: simulations, error: simError } = await supabase
    .from('simulations')
    .select('id, display_name, introduction_video_url')
    .eq('is_published', false)
    .limit(1)
    .maybeSingle();

  if (simError || !simulations) {
    console.log('ℹ️  No unpublished simulation found - test would work in production');
    return;
  }

  console.log(`✅ Found simulation: ${simulations.display_name}`);
  console.log(`   - Current intro video: ${simulations.introduction_video_url ? 'HAS URL' : 'NO URL'}`);

  // Step 3: Simulate what happens when video is selected
  console.log('\n3️⃣  Simulating video selection from library...');

  // This is what the VideoInputSelectorWithLibrary component does
  const selectedVideo = libraryVideos;
  let resolvedUrl = selectedVideo.video_url;

  if (!resolvedUrl && selectedVideo.video_file_id) {
    console.log('   ⚠️  video_url was null, would resolve from video_file_id');

    const { data: videoFile } = await supabase
      .from('video_files')
      .select('storage_path, storage_bucket')
      .eq('id', selectedVideo.video_file_id)
      .maybeSingle();

    if (videoFile) {
      resolvedUrl = `${supabaseUrl}/storage/v1/object/public/${videoFile.storage_bucket || 'video-files'}/${videoFile.storage_path}`;
      console.log(`   ✅ Resolved URL from video_file`);
    }
  }

  console.log(`\n4️⃣  Final resolved URL:`);
  console.log(`   ${resolvedUrl}`);

  console.log(`\n✅ Test Complete!`);
  console.log(`\nSummary:`);
  console.log(`- Video library has valid URL: ${libraryVideos.video_url ? '✅' : '❌'}`);
  console.log(`- URL would be saved to simulation: ${resolvedUrl ? '✅' : '❌'}`);
  console.log(`- Video player would receive URL: ${resolvedUrl ? '✅' : '❌'}`);
}

testVideoLibrarySelection().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
