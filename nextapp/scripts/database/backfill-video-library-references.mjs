#!/usr/bin/env node

/**
 * Backfill Video Library References
 *
 * This script identifies scenarios using videos that match entries in the video_library
 * and updates them to use library references instead of direct URLs.
 *
 * This enables automatic updates when library videos are changed.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERROR: Missing required environment variables');
  console.error('Required: VITE_SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('Starting video library reference backfill...\n');

async function backfillScenarioVideos() {
  console.log('Backfilling scenario video references...');

  // Get all library videos
  const { data: libraryVideos, error: libraryError } = await supabase
    .from('video_library')
    .select('id, video_url');

  if (libraryError) {
    console.error('Error fetching library videos:', libraryError);
    return { updated: 0, errors: 0 };
  }

  console.log(`Found ${libraryVideos.length} videos in library`);

  // Create a map of URL -> library ID
  const urlToLibraryId = new Map();
  libraryVideos.forEach(video => {
    if (video.video_url) {
      // Normalize URL by trimming and lowercasing for comparison
      const normalizedUrl = video.video_url.trim().toLowerCase();
      urlToLibraryId.set(normalizedUrl, video.id);
    }
  });

  let updated = 0;
  let errors = 0;

  // Get all scenarios
  const { data: scenarios, error: scenariosError } = await supabase
    .from('scenarios')
    .select('id, introduction_video_url, prompt_video_url, transition_video_url, introduction_video_source, prompt_video_source, transition_video_source');

  if (scenariosError) {
    console.error('Error fetching scenarios:', scenariosError);
    return { updated: 0, errors: 0 };
  }

  console.log(`Checking ${scenarios.length} scenarios...\n`);

  for (const scenario of scenarios) {
    const updates = {};

    // Check introduction video
    if (scenario.introduction_video_url && scenario.introduction_video_source !== 'library') {
      const normalizedUrl = scenario.introduction_video_url.trim().toLowerCase();
      const libraryId = urlToLibraryId.get(normalizedUrl);
      if (libraryId) {
        updates.introduction_video_library_id = libraryId;
        updates.introduction_video_source = 'library';
        console.log(`  ✓ Linking scenario "${scenario.id}" introduction video to library`);
      }
    }

    // Check prompt video
    if (scenario.prompt_video_url && scenario.prompt_video_source !== 'library') {
      const normalizedUrl = scenario.prompt_video_url.trim().toLowerCase();
      const libraryId = urlToLibraryId.get(normalizedUrl);
      if (libraryId) {
        updates.prompt_video_library_id = libraryId;
        updates.prompt_video_source = 'library';
        console.log(`  ✓ Linking scenario "${scenario.id}" prompt video to library`);
      }
    }

    // Check transition video
    if (scenario.transition_video_url && scenario.transition_video_source !== 'library') {
      const normalizedUrl = scenario.transition_video_url.trim().toLowerCase();
      const libraryId = urlToLibraryId.get(normalizedUrl);
      if (libraryId) {
        updates.transition_video_library_id = libraryId;
        updates.transition_video_source = 'library';
        console.log(`  ✓ Linking scenario "${scenario.id}" transition video to library`);
      }
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('scenarios')
        .update(updates)
        .eq('id', scenario.id);

      if (updateError) {
        console.error(`  ✗ Error updating scenario ${scenario.id}:`, updateError);
        errors++;
      } else {
        updated++;
      }
    }
  }

  return { updated, errors };
}

async function backfillOptionVideos() {
  console.log('\nBackfilling scenario option video references...');

  // Get all library videos
  const { data: libraryVideos, error: libraryError } = await supabase
    .from('video_library')
    .select('id, video_url');

  if (libraryError) {
    console.error('Error fetching library videos:', libraryError);
    return { updated: 0, errors: 0 };
  }

  // Create a map of URL -> library ID
  const urlToLibraryId = new Map();
  libraryVideos.forEach(video => {
    if (video.video_url) {
      const normalizedUrl = video.video_url.trim().toLowerCase();
      urlToLibraryId.set(normalizedUrl, video.id);
    }
  });

  let updated = 0;
  let errors = 0;

  // Get all scenario options
  const { data: options, error: optionsError } = await supabase
    .from('scenario_options')
    .select(`
      id,
      feedback_video_url_beginner,
      feedback_video_url_intermediate,
      feedback_video_url_advanced,
      transition_video_url,
      feedback_video_source_beginner,
      feedback_video_source_intermediate,
      feedback_video_source_advanced,
      transition_video_source
    `);

  if (optionsError) {
    console.error('Error fetching scenario options:', optionsError);
    return { updated: 0, errors: 0 };
  }

  console.log(`Checking ${options.length} scenario options...\n`);

  for (const option of options) {
    const updates = {};

    // Check beginner feedback video
    if (option.feedback_video_url_beginner && option.feedback_video_source_beginner !== 'library') {
      const normalizedUrl = option.feedback_video_url_beginner.trim().toLowerCase();
      const libraryId = urlToLibraryId.get(normalizedUrl);
      if (libraryId) {
        updates.feedback_video_library_id_beginner = libraryId;
        updates.feedback_video_source_beginner = 'library';
        console.log(`  ✓ Linking option "${option.id}" beginner feedback video to library`);
      }
    }

    // Check intermediate feedback video
    if (option.feedback_video_url_intermediate && option.feedback_video_source_intermediate !== 'library') {
      const normalizedUrl = option.feedback_video_url_intermediate.trim().toLowerCase();
      const libraryId = urlToLibraryId.get(normalizedUrl);
      if (libraryId) {
        updates.feedback_video_library_id_intermediate = libraryId;
        updates.feedback_video_source_intermediate = 'library';
        console.log(`  ✓ Linking option "${option.id}" intermediate feedback video to library`);
      }
    }

    // Check advanced feedback video
    if (option.feedback_video_url_advanced && option.feedback_video_source_advanced !== 'library') {
      const normalizedUrl = option.feedback_video_url_advanced.trim().toLowerCase();
      const libraryId = urlToLibraryId.get(normalizedUrl);
      if (libraryId) {
        updates.feedback_video_library_id_advanced = libraryId;
        updates.feedback_video_source_advanced = 'library';
        console.log(`  ✓ Linking option "${option.id}" advanced feedback video to library`);
      }
    }

    // Check transition video
    if (option.transition_video_url && option.transition_video_source !== 'library') {
      const normalizedUrl = option.transition_video_url.trim().toLowerCase();
      const libraryId = urlToLibraryId.get(normalizedUrl);
      if (libraryId) {
        updates.transition_video_library_id = libraryId;
        updates.transition_video_source = 'library';
        console.log(`  ✓ Linking option "${option.id}" transition video to library`);
      }
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('scenario_options')
        .update(updates)
        .eq('id', option.id);

      if (updateError) {
        console.error(`  ✗ Error updating option ${option.id}:`, updateError);
        errors++;
      } else {
        updated++;
      }
    }
  }

  return { updated, errors };
}

async function generateReport() {
  console.log('\n\n=== Video Library Usage Report ===\n');

  // Get usage summary
  const { data: usageSummary, error: summaryError } = await supabase
    .from('video_library_usage_summary')
    .select('*')
    .order('total_usage_count', { ascending: false })
    .limit(10);

  if (summaryError) {
    console.error('Error fetching usage summary:', summaryError);
    return;
  }

  console.log('Top 10 Most Used Library Videos:\n');
  usageSummary.forEach((video, idx) => {
    console.log(`${idx + 1}. ${video.title}`);
    console.log(`   Usage Count: ${video.total_usage_count}`);
    console.log(`   Platform: ${video.video_platform}`);
    console.log(`   Type: ${video.video_type}`);
    console.log('');
  });

  // Get unused videos
  const unusedVideos = usageSummary.filter(v => v.total_usage_count === 0);
  if (unusedVideos.length > 0) {
    console.log(`\n⚠️  Found ${unusedVideos.length} unused library videos`);
  }
}

// Main execution
async function main() {
  try {
    const scenarioResults = await backfillScenarioVideos();
    const optionResults = await backfillOptionVideos();

    console.log('\n\n=== Backfill Complete ===\n');
    console.log(`Scenarios updated: ${scenarioResults.updated}`);
    console.log(`Options updated: ${optionResults.updated}`);
    console.log(`Total updated: ${scenarioResults.updated + optionResults.updated}`);
    console.log(`Errors: ${scenarioResults.errors + optionResults.errors}`);

    await generateReport();

    console.log('\n✓ Video library backfill completed successfully!');
    console.log('\nNote: From now on, any updates to library videos will automatically');
    console.log('propagate to all scenarios using them.');

  } catch (error) {
    console.error('\n✗ Fatal error during backfill:', error);
    process.exit(1);
  }
}

main();
