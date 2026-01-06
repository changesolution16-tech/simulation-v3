#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

let totalIssues = 0;
let criticalIssues = 0;
let warnings = 0;

function logError(message) {
  console.error(`  ❌ ${message}`);
  criticalIssues++;
  totalIssues++;
}

function logWarning(message) {
  console.warn(`  ⚠️  ${message}`);
  warnings++;
  totalIssues++;
}

function logSuccess(message) {
  console.log(`  ✅ ${message}`);
}

function logInfo(message) {
  console.log(`  ℹ️  ${message}`);
}

async function validateSimulations() {
  console.log('\n🔍 Validating Simulations...\n');

  const { data: simulations, error } = await supabase
    .from('simulations')
    .select('*')
    .eq('status', 'published');

  if (error) {
    logError(`Failed to fetch simulations: ${error.message}`);
    return;
  }

  if (!simulations || simulations.length === 0) {
    logWarning('No published simulations found for demo');
    return;
  }

  logSuccess(`Found ${simulations.length} published simulation(s)`);

  for (const sim of simulations) {
    console.log(`\n  📋 Simulation: ${sim.display_name || sim.name}`);

    if (sim.landing_page_enabled && sim.landing_intro_video_url) {
      if (UUID_PATTERN.test(sim.landing_intro_video_url)) {
        logError(`Landing video URL contains UUID: ${sim.landing_intro_video_url}`);
      } else {
        logSuccess('Landing video URL is valid');
      }
    }

    if (sim.introduction_page_enabled && sim.introduction_video_url) {
      if (UUID_PATTERN.test(sim.introduction_video_url)) {
        logError(`Introduction video URL contains UUID: ${sim.introduction_video_url}`);
      } else {
        logSuccess('Introduction video URL is valid');
      }
    }

    if (!sim.entry_scenario_id) {
      logError('No entry scenario defined');
    } else {
      logSuccess(`Entry scenario: ${sim.entry_scenario_id}`);
    }

    const { data: simScenarios, error: simScenariosError } = await supabase
      .from('simulation_scenarios')
      .select('scenario_id')
      .eq('simulation_id', sim.id);

    if (simScenariosError) {
      logError(`Failed to fetch simulation scenarios: ${simScenariosError.message}`);
    } else if (!simScenarios || simScenarios.length === 0) {
      logError('Simulation has no scenarios');
    } else {
      logSuccess(`Contains ${simScenarios.length} scenario(s)`);
      await validateScenarios(simScenarios.map(s => s.scenario_id));
    }
  }
}

async function validateScenarios(scenarioIds) {
  const { data: scenarios, error } = await supabase
    .from('scenarios')
    .select('*')
    .in('id', scenarioIds);

  if (error) {
    logError(`Failed to fetch scenarios: ${error.message}`);
    return;
  }

  for (const scenario of scenarios) {
    console.log(`\n    📄 Scenario: ${scenario.title}`);

    if (scenario.prompt_video_url && UUID_PATTERN.test(scenario.prompt_video_url)) {
      logError(`Prompt video URL contains UUID in scenario "${scenario.title}"`);
    }

    if (scenario.introduction_video_url && UUID_PATTERN.test(scenario.introduction_video_url)) {
      logError(`Introduction video URL contains UUID in scenario "${scenario.title}"`);
    }

    const { data: options, error: optionsError } = await supabase
      .from('scenario_options')
      .select('*')
      .eq('scenario_id', scenario.id)
      .order('option_order');

    if (optionsError) {
      logError(`Failed to fetch options for scenario "${scenario.title}": ${optionsError.message}`);
      continue;
    }

    if (!options || options.length === 0) {
      if (!scenario.is_end_scenario) {
        logError(`Scenario "${scenario.title}" has no options and is not marked as end scenario`);
      } else {
        logSuccess(`End scenario (no options required)`);
      }
      continue;
    }

    logInfo(`Has ${options.length} option(s)`);

    let connectionsCount = 0;
    for (const option of options) {
      if (option.feedback_beginner && UUID_PATTERN.test(option.feedback_beginner)) {
        logError(`Option "${option.option_text}" has UUID in beginner feedback`);
      }
      if (option.feedback_intermediate && UUID_PATTERN.test(option.feedback_intermediate)) {
        logError(`Option "${option.option_text}" has UUID in intermediate feedback`);
      }
      if (option.feedback_advanced && UUID_PATTERN.test(option.feedback_advanced)) {
        logError(`Option "${option.option_text}" has UUID in advanced feedback`);
      }

      if (option.feedback_video_url_beginner && UUID_PATTERN.test(option.feedback_video_url_beginner)) {
        logError(`Option "${option.option_text}" has UUID in beginner feedback video URL`);
      }
      if (option.feedback_video_url_intermediate && UUID_PATTERN.test(option.feedback_video_url_intermediate)) {
        logError(`Option "${option.option_text}" has UUID in intermediate feedback video URL`);
      }
      if (option.feedback_video_url_advanced && UUID_PATTERN.test(option.feedback_video_url_advanced)) {
        logError(`Option "${option.option_text}" has UUID in advanced feedback video URL`);
      }

      if (option.transition_video_url && UUID_PATTERN.test(option.transition_video_url)) {
        logError(`Option "${option.option_text}" has UUID in transition video URL`);
      }

      if (option.next_scenario_id) {
        connectionsCount++;
      }
    }

    if (connectionsCount === 0 && !scenario.is_end_scenario) {
      logWarning(`Scenario "${scenario.title}" has no connections to next scenarios`);
    } else if (connectionsCount > 0) {
      logSuccess(`Has ${connectionsCount} connection(s) to next scenarios`);
    }
  }
}

async function validateConnectionIntegrity() {
  console.log('\n🔗 Validating Connection Integrity...\n');

  const { data: scenarios, error: scenariosError } = await supabase
    .from('scenarios')
    .select('id, title, is_end_scenario');

  if (scenariosError) {
    logError(`Failed to fetch scenarios: ${scenariosError.message}`);
    return;
  }

  const { data: options, error: optionsError } = await supabase
    .from('scenario_options')
    .select('id, scenario_id, option_text, next_scenario_id');

  if (optionsError) {
    logError(`Failed to fetch options: ${optionsError.message}`);
    return;
  }

  const scenarioMap = new Map(scenarios.map(s => [s.id, s]));
  let brokenConnections = 0;

  for (const option of options) {
    if (option.next_scenario_id) {
      const targetScenario = scenarioMap.get(option.next_scenario_id);
      if (!targetScenario) {
        const sourceScenario = scenarioMap.get(option.scenario_id);
        logError(
          `Broken connection: Option "${option.option_text}" in scenario "${sourceScenario?.title}" ` +
          `points to non-existent scenario: ${option.next_scenario_id}`
        );
        brokenConnections++;
      }
    }
  }

  if (brokenConnections === 0) {
    logSuccess('All scenario connections are valid');
  } else {
    logError(`Found ${brokenConnections} broken connection(s)`);
  }
}

async function validateDatabase() {
  console.log('\n💾 Validating Database Connection...\n');

  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      logError(`Database connection failed: ${error.message}`);
      return false;
    }
    logSuccess('Database connection successful');
    return true;
  } catch (error) {
    logError(`Database connection error: ${error.message}`);
    return false;
  }
}

async function validateRLSPolicies() {
  console.log('\n🔒 Checking RLS Policy Issues...\n');

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .limit(5);

    if (error && error.message.includes('infinite recursion')) {
      logError('Infinite recursion detected in profiles RLS policies!');
      logInfo('Run the FIX_RLS_POLICIES.md script to resolve this');
    } else if (error) {
      logWarning(`RLS policy check returned: ${error.message}`);
    } else {
      logSuccess('No RLS policy recursion detected');
    }
  } catch (error) {
    logError(`RLS policy check failed: ${error.message}`);
  }
}

async function checkVideoFiles() {
  console.log('\n🎬 Checking Video Files...\n');

  const { data: videoFiles, error } = await supabase
    .from('video_files')
    .select('id, original_filename, upload_status, storage_path')
    .eq('upload_status', 'failed');

  if (error) {
    logWarning(`Could not check video files: ${error.message}`);
  } else if (videoFiles && videoFiles.length > 0) {
    logWarning(`Found ${videoFiles.length} failed video upload(s)`);
    videoFiles.forEach(file => {
      logInfo(`  - ${file.original_filename} (${file.id})`);
    });
  } else {
    logSuccess('No failed video uploads');
  }

  const { data: processingFiles } = await supabase
    .from('video_files')
    .select('id, original_filename, upload_status')
    .in('upload_status', ['uploading', 'processing']);

  if (processingFiles && processingFiles.length > 0) {
    logWarning(`Found ${processingFiles.length} video(s) still processing`);
  }
}

async function runFullValidation() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║       Demo Simulation Validation Tool                   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  const dbConnected = await validateDatabase();
  if (!dbConnected) {
    console.log('\n❌ Cannot continue validation without database connection\n');
    process.exit(1);
  }

  await validateRLSPolicies();
  await validateSimulations();
  await validateConnectionIntegrity();
  await checkVideoFiles();

  console.log('\n' + '═'.repeat(60));
  console.log('📊 VALIDATION SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Total Issues: ${totalIssues}`);
  console.log(`Critical Errors: ${criticalIssues}`);
  console.log(`Warnings: ${warnings}`);
  console.log('═'.repeat(60) + '\n');

  if (criticalIssues === 0 && warnings === 0) {
    console.log('🎉 All validation checks passed! Ready for demo.\n');
    process.exit(0);
  } else if (criticalIssues === 0) {
    console.log('⚠️  No critical errors, but review warnings before demo.\n');
    process.exit(0);
  } else {
    console.log('❌ Critical errors found. Please fix before demo.\n');
    process.exit(1);
  }
}

runFullValidation().catch(error => {
  console.error('\n❌ Validation script failed:', error);
  process.exit(1);
});
