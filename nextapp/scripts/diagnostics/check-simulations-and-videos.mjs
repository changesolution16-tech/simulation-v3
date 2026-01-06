import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSimulationsAndVideos() {
  console.log('\n=== DATABASE VIDEO STATUS CHECK ===\n');

  try {
    // Check simulations
    const { data: simulations, error: simError } = await supabase
      .from('simulations')
      .select('id, title, is_published')
      .order('created_at', { ascending: false });

    if (simError) {
      console.log('❌ Error checking simulations:', simError.message);
    } else {
      console.log(`📁 Simulations: ${simulations.length}`);
      if (simulations.length > 0) {
        simulations.slice(0, 5).forEach(s => {
          console.log(`   - ${s.title} (${s.is_published ? 'Published' : 'Draft'})`);
        });
      }
      console.log();
    }

    // Check scenarios
    const { data: scenarios, error: scenError } = await supabase
      .from('scenarios')
      .select('id, title, prompt_video_url, prompt_video_source, prompt_video_library_id')
      .order('created_at', { ascending: false });

    if (scenError) {
      console.log('❌ Error checking scenarios:', scenError.message);
    } else {
      console.log(`📝 Scenarios: ${scenarios.length}`);
      if (scenarios.length > 0) {
        const withVideos = scenarios.filter(s => s.prompt_video_url);
        const libraryLinked = scenarios.filter(s => s.prompt_video_source === 'library' && s.prompt_video_library_id);
        console.log(`   - With videos: ${withVideos.length}`);
        console.log(`   - Linked to library: ${libraryLinked.length}`);
        console.log();

        console.log('Sample scenarios:');
        scenarios.slice(0, 3).forEach(s => {
          console.log(`   - ${s.title}`);
          console.log(`     Video: ${s.prompt_video_url ? 'Yes' : 'No'}`);
          console.log(`     Source: ${s.prompt_video_source || 'N/A'}`);
          console.log(`     Library ID: ${s.prompt_video_library_id || 'N/A'}`);
        });
      }
      console.log();
    }

    // Check video library
    const { data: library, error: libError } = await supabase
      .from('video_library')
      .select('id, title, video_url, video_type, created_at')
      .order('created_at', { ascending: false });

    if (libError) {
      console.log('❌ Error checking video library:', libError.message);
    } else {
      console.log(`📹 Video Library: ${library.length} videos`);
      if (library.length > 0) {
        console.log('\nRecent library videos:');
        library.slice(0, 5).forEach(v => {
          console.log(`   - ${v.title} (${v.video_type})`);
          console.log(`     URL: ${v.video_url.substring(0, 60)}...`);
        });
      }
      console.log();
    }

    // Check if automatic update function exists
    const { data: functions, error: funcError } = await supabase
      .rpc('pg_get_functiondef', { funcid: 'preview_video_library_update_impact' })
      .maybeSingle();

    console.log('🔧 Automatic Update System:');
    if (funcError || !functions) {
      console.log('   ⚠️ preview_video_library_update_impact function: NOT FOUND');
      console.log('   Status: Automatic updates may not be configured');
    } else {
      console.log('   ✓ preview_video_library_update_impact function: EXISTS');
      console.log('   Status: Automatic updates are configured');
    }
    console.log();

    // Check trigger
    const { data: triggers, error: trigError } = await supabase
      .from('pg_trigger')
      .select('tgname')
      .eq('tgname', 'trigger_auto_update_scenario_videos_from_library')
      .maybeSingle();

    if (!trigError && triggers) {
      console.log('   ✓ Auto-update trigger: ACTIVE');
    } else {
      console.log('   ⚠️ Auto-update trigger: NOT FOUND');
    }
    console.log();

    // Overall status
    console.log('=== CONCLUSION ===\n');

    if (scenarios.length === 0) {
      console.log('📌 STATUS: No scenarios exist yet');
      console.log('   This appears to be a new database or scenarios haven\'t been created.');
      console.log('   Once you create scenarios with videos from the library,');
      console.log('   they will automatically update when library videos change.\n');
    } else {
      const withLibraryLinks = scenarios.filter(s => s.prompt_video_source === 'library');
      const percentage = Math.round((withLibraryLinks.length / scenarios.length) * 100);

      if (percentage === 100) {
        console.log('✅ STATUS: All scenarios are properly connected to the video library!');
        console.log('   Any updates to library videos will automatically propagate to scenarios.\n');
      } else if (percentage > 0) {
        console.log(`⚠️ STATUS: ${percentage}% of scenarios are connected to the library`);
        console.log(`   ${scenarios.length - withLibraryLinks.length} scenarios use direct URLs and won't auto-update.`);
        console.log('   Run: node backfill-video-library-references.mjs to fix this.\n');
      } else {
        console.log('⚠️ STATUS: No scenarios are connected to the video library');
        console.log('   All scenarios use direct URLs and won\'t auto-update.');
        console.log('   Run: node backfill-video-library-references.mjs to enable auto-updates.\n');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

checkSimulationsAndVideos();
