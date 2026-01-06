const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function diagnoseFeedbackIssue() {
  console.log('=== Feedback Issue Diagnostic Tool ===\n');

  // 1. Check if there are any scenarios
  const { data: scenarios, error: scenError } = await supabase
    .from('scenarios')
    .select('id, title')
    .limit(10);

  if (scenError) {
    console.error('Error fetching scenarios:', scenError);
    return;
  }

  console.log(`Found ${scenarios?.length || 0} scenarios in database\n`);

  if (!scenarios || scenarios.length === 0) {
    console.log('No scenarios found. Please create a scenario through the admin interface first.\n');
    return;
  }

  // 2. Get scenario options with feedback
  for (const scenario of scenarios) {
    console.log(`\n--- Scenario: "${scenario.title}" (${scenario.id}) ---`);

    const { data: options, error: optError } = await supabase
      .from('scenario_options')
      .select('*')
      .eq('scenario_id', scenario.id);

    if (optError) {
      console.error(`Error fetching options:`, optError);
      continue;
    }

    if (!options || options.length === 0) {
      console.log('  No options found for this scenario\n');
      continue;
    }

    console.log(`  Found ${options.length} options:`);

    options.forEach((opt, idx) => {
      console.log(`\n  Option ${idx + 1} (${String.fromCharCode(65 + idx)}): "${opt.option_text}"`);
      console.log(`    ID: ${opt.id}`);

      // Check feedback fields
      console.log(`\n    Feedback Beginner:`);
      console.log(`      Type: ${typeof opt.feedback_beginner}`);
      console.log(`      Length: ${opt.feedback_beginner?.length || 0}`);
      console.log(`      Content: ${opt.feedback_beginner?.substring(0, 100) || 'NULL'}${opt.feedback_beginner?.length > 100 ? '...' : ''}`);

      // Check for UUID pattern
      const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
      const beginnerHasUUID = opt.feedback_beginner && uuidPattern.test(opt.feedback_beginner);
      const intermediateHasUUID = opt.feedback_intermediate && uuidPattern.test(opt.feedback_intermediate);
      const advancedHasUUID = opt.feedback_advanced && uuidPattern.test(opt.feedback_advanced);

      if (beginnerHasUUID || intermediateHasUUID || advancedHasUUID) {
        console.log(`\n    ⚠️  WARNING: UUID DETECTED IN FEEDBACK!`);
        if (beginnerHasUUID) console.log(`      Beginner: ${opt.feedback_beginner}`);
        if (intermediateHasUUID) console.log(`      Intermediate: ${opt.feedback_intermediate}`);
        if (advancedHasUUID) console.log(`      Advanced: ${opt.feedback_advanced}`);
      }

      // Check video URLs
      console.log(`\n    Video URLs:`);
      console.log(`      Beginner: ${opt.feedback_video_url_beginner || 'NULL'}`);
      console.log(`      Intermediate: ${opt.feedback_video_url_intermediate || 'NULL'}`);
      console.log(`      Advanced: ${opt.feedback_video_url_advanced || 'NULL'}`);

      // Check video sources
      console.log(`\n    Video Sources:`);
      console.log(`      Beginner: ${opt.feedback_video_source_beginner || 'NULL'}`);
      console.log(`      Intermediate: ${opt.feedback_video_source_intermediate || 'NULL'}`);
      console.log(`      Advanced: ${opt.feedback_video_advanced || 'NULL'}`);

      // Check library IDs
      console.log(`\n    Video Library IDs:`);
      console.log(`      Beginner: ${opt.feedback_video_library_id_beginner || 'NULL'}`);
      console.log(`      Intermediate: ${opt.feedback_video_library_id_intermediate || 'NULL'}`);
      console.log(`      Advanced: ${opt.feedback_video_library_id_advanced || 'NULL'}`);
    });
  }

  console.log('\n\n=== Diagnostic Complete ===');
  console.log('\nIf you see UUIDs in the feedback fields above, those are corrupted and need to be fixed.');
  console.log('You can fix them by:');
  console.log('1. Going to Admin Dashboard → Scenarios');
  console.log('2. Editing the affected scenario');
  console.log('3. Re-entering proper feedback text in the corrupted fields');
  console.log('4. Saving the scenario\n');
}

diagnoseFeedbackIssue().catch(console.error);
