import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env file');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVideoLibraryConnections() {
  console.log('\n=== VIDEO LIBRARY CONNECTION DIAGNOSTIC ===\n');

  try {
    // 1. Check scenarios table for video library connections
    console.log('1. Checking Scenarios Table...\n');

    const { data: scenarios, error: scenariosError } = await supabase
      .from('scenarios')
      .select(`
        id,
        title,
        prompt_video_url,
        prompt_video_source,
        prompt_video_library_id,
        introduction_video_url,
        introduction_video_source,
        introduction_video_library_id,
        transition_video_url,
        transition_video_source,
        transition_video_library_id
      `)
      .order('title');

    if (scenariosError) throw scenariosError;

    console.log(`Total Scenarios: ${scenarios.length}\n`);

    // Analyze scenario video connections
    let scenariosWithPromptVideos = 0;
    let scenariosWithPromptLibraryLinks = 0;
    let scenariosWithPromptDirectUrls = 0;
    let scenariosWithIntroVideos = 0;
    let scenariosWithIntroLibraryLinks = 0;
    let scenariosWithTransitionVideos = 0;
    let scenariosWithTransitionLibraryLinks = 0;

    scenarios.forEach(s => {
      if (s.prompt_video_url) {
        scenariosWithPromptVideos++;
        if (s.prompt_video_source === 'library' && s.prompt_video_library_id) {
          scenariosWithPromptLibraryLinks++;
        } else {
          scenariosWithPromptDirectUrls++;
        }
      }

      if (s.introduction_video_url) {
        scenariosWithIntroVideos++;
        if (s.introduction_video_source === 'library' && s.introduction_video_library_id) {
          scenariosWithIntroLibraryLinks++;
        }
      }

      if (s.transition_video_url) {
        scenariosWithTransitionVideos++;
        if (s.transition_video_source === 'library' && s.transition_video_library_id) {
          scenariosWithTransitionLibraryLinks++;
        }
      }
    });

    console.log('📊 Scenario Video Statistics:');
    console.log(`   Prompt Videos: ${scenariosWithPromptVideos}`);
    console.log(`   - Linked to library: ${scenariosWithPromptLibraryLinks} ✓`);
    console.log(`   - Direct URLs: ${scenariosWithPromptDirectUrls} ⚠️`);
    console.log(`   Introduction Videos: ${scenariosWithIntroVideos}`);
    console.log(`   - Linked to library: ${scenariosWithIntroLibraryLinks} ✓`);
    console.log(`   Transition Videos: ${scenariosWithTransitionVideos}`);
    console.log(`   - Linked to library: ${scenariosWithTransitionLibraryLinks} ✓`);
    console.log();

    // 2. Check scenario_options for video library connections
    console.log('2. Checking Scenario Options Table...\n');

    const { data: options, error: optionsError } = await supabase
      .from('scenario_options')
      .select(`
        id,
        scenario_id,
        option_text,
        feedback_video_url_beginner,
        feedback_video_source_beginner,
        feedback_video_library_id_beginner,
        feedback_video_url_intermediate,
        feedback_video_source_intermediate,
        feedback_video_library_id_intermediate,
        feedback_video_url_advanced,
        feedback_video_source_advanced,
        feedback_video_library_id_advanced,
        transition_video_url,
        transition_video_source,
        transition_video_library_id
      `);

    if (optionsError) throw optionsError;

    console.log(`Total Scenario Options: ${options.length}\n`);

    let optionsWithFeedbackVideos = 0;
    let optionsWithFeedbackLibraryLinks = 0;
    let optionsWithFeedbackDirectUrls = 0;
    let optionsWithTransitionVideos = 0;
    let optionsWithTransitionLibraryLinks = 0;

    options.forEach(o => {
      const hasFeedback = o.feedback_video_url_beginner ||
                          o.feedback_video_url_intermediate ||
                          o.feedback_video_url_advanced;

      if (hasFeedback) {
        optionsWithFeedbackVideos++;

        const hasLibraryLink =
          (o.feedback_video_source_beginner === 'library' && o.feedback_video_library_id_beginner) ||
          (o.feedback_video_source_intermediate === 'library' && o.feedback_video_library_id_intermediate) ||
          (o.feedback_video_source_advanced === 'library' && o.feedback_video_library_id_advanced);

        if (hasLibraryLink) {
          optionsWithFeedbackLibraryLinks++;
        } else {
          optionsWithFeedbackDirectUrls++;
        }
      }

      if (o.transition_video_url) {
        optionsWithTransitionVideos++;
        if (o.transition_video_source === 'library' && o.transition_video_library_id) {
          optionsWithTransitionLibraryLinks++;
        }
      }
    });

    console.log('📊 Option Video Statistics:');
    console.log(`   Feedback Videos: ${optionsWithFeedbackVideos}`);
    console.log(`   - Linked to library: ${optionsWithFeedbackLibraryLinks} ✓`);
    console.log(`   - Direct URLs: ${optionsWithFeedbackDirectUrls} ⚠️`);
    console.log(`   Transition Videos: ${optionsWithTransitionVideos}`);
    console.log(`   - Linked to library: ${optionsWithTransitionLibraryLinks} ✓`);
    console.log();

    // 3. Check video library and usage
    console.log('3. Checking Video Library...\n');

    const { data: libraryVideos, error: libraryError } = await supabase
      .from('video_library_usage_summary')
      .select('*')
      .order('total_usage_count', { ascending: false });

    if (libraryError) {
      console.log('   ⚠️ Could not load usage summary (view might not exist)');

      // Fallback to basic library query
      const { data: basicLibrary } = await supabase
        .from('video_library')
        .select('id, title, video_url, video_type')
        .order('created_at', { ascending: false });

      console.log(`   Total Library Videos: ${basicLibrary?.length || 0}`);
    } else {
      console.log(`Total Library Videos: ${libraryVideos.length}\n`);

      const usedVideos = libraryVideos.filter(v => v.total_usage_count > 0);
      const unusedVideos = libraryVideos.filter(v => v.total_usage_count === 0);

      console.log('📊 Library Video Usage:');
      console.log(`   Videos in use: ${usedVideos.length} ✓`);
      console.log(`   Unused videos: ${unusedVideos.length}`);
      console.log();

      if (usedVideos.length > 0) {
        console.log('Top 5 Most Used Library Videos:');
        usedVideos.slice(0, 5).forEach(v => {
          console.log(`   - "${v.title}" (${v.video_type}): ${v.total_usage_count} uses`);
        });
        console.log();
      }
    }

    // 4. Find scenarios with videos that COULD be linked to library
    console.log('4. Finding Potential Library Matches...\n');

    const { data: allLibraryVideos } = await supabase
      .from('video_library')
      .select('id, title, video_url');

    const libraryUrlMap = new Map(allLibraryVideos?.map(v => [v.video_url, v]) || []);

    const unmatchedScenarios = scenarios.filter(s => {
      return (s.prompt_video_url && s.prompt_video_source !== 'library' && libraryUrlMap.has(s.prompt_video_url)) ||
             (s.introduction_video_url && s.introduction_video_source !== 'library' && libraryUrlMap.has(s.introduction_video_url));
    });

    const unmatchedOptions = options.filter(o => {
      return (o.feedback_video_url_beginner && o.feedback_video_source_beginner !== 'library' && libraryUrlMap.has(o.feedback_video_url_beginner)) ||
             (o.feedback_video_url_intermediate && o.feedback_video_source_intermediate !== 'library' && libraryUrlMap.has(o.feedback_video_url_intermediate)) ||
             (o.feedback_video_url_advanced && o.feedback_video_source_advanced !== 'library' && libraryUrlMap.has(o.feedback_video_url_advanced));
    });

    console.log('🔍 Scenarios that could be linked to library:');
    console.log(`   Scenarios: ${unmatchedScenarios.length}`);
    console.log(`   Options: ${unmatchedOptions.length}`);
    console.log();

    if (unmatchedScenarios.length > 0 || unmatchedOptions.length > 0) {
      console.log('💡 Recommendation: Run backfill script to link these videos');
      console.log('   Command: node backfill-video-library-references.mjs\n');
    }

    // 5. Test trigger functionality
    console.log('5. Checking Automatic Update System...\n');

    const { data: triggerCheck } = await supabase
      .rpc('preview_video_library_update_impact', {
        library_video_id: allLibraryVideos?.[0]?.id
      })
      .maybeSingle();

    if (triggerCheck !== null && triggerCheck !== undefined) {
      console.log('✓ Automatic update functions are working');
      console.log('✓ Video library trigger system is operational\n');
    } else {
      console.log('⚠️ Could not verify automatic update system');
      console.log('   The preview_video_library_update_impact function may not exist\n');
    }

    // Summary
    console.log('\n=== SUMMARY ===\n');

    const totalVideosInScenarios = scenariosWithPromptVideos + scenariosWithIntroVideos + scenariosWithTransitionVideos;
    const totalLibraryLinked = scenariosWithPromptLibraryLinks + scenariosWithIntroLibraryLinks + scenariosWithTransitionLibraryLinks;
    const totalDirectUrls = scenariosWithPromptDirectUrls + (scenariosWithIntroVideos - scenariosWithIntroLibraryLinks) + (scenariosWithTransitionVideos - scenariosWithTransitionLibraryLinks);

    console.log(`📹 Total Videos in Scenarios: ${totalVideosInScenarios}`);
    console.log(`   ✓ Linked to library: ${totalLibraryLinked} (${totalVideosInScenarios > 0 ? Math.round(totalLibraryLinked/totalVideosInScenarios*100) : 0}%)`);
    console.log(`   ⚠️ Direct URLs: ${totalDirectUrls} (${totalVideosInScenarios > 0 ? Math.round(totalDirectUrls/totalVideosInScenarios*100) : 0}%)`);
    console.log();

    console.log(`📹 Total Videos in Options: ${optionsWithFeedbackVideos + optionsWithTransitionVideos}`);
    console.log(`   ✓ Linked to library: ${optionsWithFeedbackLibraryLinks + optionsWithTransitionLibraryLinks}`);
    console.log(`   ⚠️ Direct URLs: ${optionsWithFeedbackDirectUrls + (optionsWithTransitionVideos - optionsWithTransitionLibraryLinks)}`);
    console.log();

    if (totalDirectUrls > 0 || optionsWithFeedbackDirectUrls > 0) {
      console.log('⚠️ STATUS: Some videos are NOT connected to the library');
      console.log('   These videos will NOT auto-update when library videos change.');
      console.log('   Run: node backfill-video-library-references.mjs to fix this.\n');
    } else if (totalLibraryLinked === 0 && optionsWithFeedbackLibraryLinks === 0) {
      console.log('⚠️ STATUS: No videos are connected to the library');
      console.log('   All videos are using direct URLs.');
      console.log('   Run: node backfill-video-library-references.mjs to enable auto-updates.\n');
    } else {
      console.log('✓ STATUS: All videos are properly connected to the library!');
      console.log('  Videos will automatically update when library videos change.\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkVideoLibraryConnections();
