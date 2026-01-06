#!/usr/bin/env node

/**
 * Import Scenarios to Database
 *
 * This script imports scenarios from the exported JSON file into the Supabase database.
 *
 * Usage:
 *   node import-scenarios-to-database.mjs scenarios-export.json
 *
 * Or run without arguments and it will look for the most recent export file.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuthentication() {
  console.log('🔐 Checking authentication...');

  // Note: This script uses the anon key, which means RLS policies apply
  // The user must be logged in as admin in the browser for this to work
  // Or we need to use the service role key

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    console.log('⚠️  Not authenticated. Using anon key with RLS policies.');
    console.log('   Make sure RLS policies allow scenario creation.');
    return null;
  }

  console.log('✅ Authenticated as:', session.user.email);
  return session.user;
}

async function getOrCreateTopic(topicSlug = 'communication') {
  console.log('📚 Getting or creating topic...');

  // Try to get existing topic
  const { data: existingTopic } = await supabase
    .from('topics')
    .select('id, slug, title')
    .eq('slug', topicSlug)
    .maybeSingle();

  if (existingTopic) {
    console.log(`✅ Using existing topic: ${existingTopic.title} (${existingTopic.id})`);
    return existingTopic.id;
  }

  // Create new topic if it doesn't exist
  const { data: newTopic, error } = await supabase
    .from('topics')
    .insert({
      slug: topicSlug,
      title: 'Leadership Simulation',
      description: 'Leadership and decision-making scenarios',
      is_active: true,
      display_order: 1
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating topic:', error);
    throw error;
  }

  console.log(`✅ Created new topic: ${newTopic.title} (${newTopic.id})`);
  return newTopic.id;
}

async function importScenarios(exportData) {
  console.log('');
  console.log('📥 Starting import process...');
  console.log(`   - Scenarios to import: ${exportData.scenarios.length}`);
  console.log(`   - Connections: ${exportData.connections.length}`);
  console.log('');

  // Get or create topic
  const topicId = await getOrCreateTopic();

  // Map old IDs to new database IDs
  const idMapping = new Map();

  // Sort scenarios by hierarchy level to insert in order
  const sortedScenarios = [...exportData.scenarios].sort((a, b) => {
    const levelA = a.hierarchyLevel ?? 999;
    const levelB = b.hierarchyLevel ?? 999;
    return levelA - levelB;
  });

  console.log('📝 Inserting scenarios...');

  // Insert scenarios first (without connections)
  for (const scenario of sortedScenarios) {
    console.log(`   - ${scenario.title} (Level ${scenario.hierarchyLevel ?? 'unset'})`);

    const { data: newScenario, error: scenarioError } = await supabase
      .from('scenarios')
      .insert({
        title: scenario.title,
        description: scenario.description || 'Leadership scenario',
        difficulty: scenario.difficulty || 'intermediate',
        topic_id: topicId,
        is_end_scenario: scenario.isEndScenario || false,
        hierarchy_level: scenario.hierarchyLevel ?? null,
        auto_calculate_level: scenario.autoCalculateLevel ?? true,
        position_x: scenario.position?.x ?? 0,
        position_y: scenario.position?.y ?? 0,
        content_status: scenario.contentStatus || 'draft',
        is_published: true
      })
      .select()
      .single();

    if (scenarioError) {
      console.error(`   ❌ Error inserting scenario: ${scenario.title}`);
      console.error('   Error:', scenarioError);
      continue;
    }

    // Map old ID to new ID
    idMapping.set(scenario.id, newScenario.id);
    console.log(`   ✅ Inserted with ID: ${newScenario.id}`);
  }

  console.log('');
  console.log(`✅ Inserted ${idMapping.size} scenarios`);
  console.log('');
  console.log('🔗 Creating scenario options and connections...');

  // Now insert options with connections
  for (const scenario of exportData.scenarios) {
    const newScenarioId = idMapping.get(scenario.id);

    if (!newScenarioId) {
      console.log(`   ⚠️  Skipping options for ${scenario.title} (scenario not inserted)`);
      continue;
    }

    console.log(`   - Options for: ${scenario.title}`);

    for (let i = 0; i < scenario.options.length; i++) {
      const option = scenario.options[i];

      // Map the nextScenarioId to the new database ID
      const nextScenarioId = option.nextScenarioId
        ? idMapping.get(option.nextScenarioId)
        : null;

      const { data: newOption, error: optionError } = await supabase
        .from('scenario_options')
        .insert({
          scenario_id: newScenarioId,
          option_text: option.text || `Option ${i + 1}`,
          option_order: i,
          next_scenario_id: nextScenarioId,
          feedback_beginner: option.feedback?.beginner || '',
          feedback_intermediate: option.feedback?.intermediate || '',
          feedback_advanced: option.feedback?.advanced || '',
          skill_impacts: option.skillImpact || {}
        })
        .select()
        .single();

      if (optionError) {
        console.error(`   ❌ Error inserting option: ${option.text?.substring(0, 50)}`);
        console.error('   Error:', optionError);
        continue;
      }

      const connectionInfo = nextScenarioId
        ? ` -> ${exportData.scenarios.find(s => idMapping.get(s.id) === nextScenarioId)?.title || 'Unknown'}`
        : ' (no connection)';

      console.log(`     ✅ ${option.text?.substring(0, 40)}...${connectionInfo}`);
    }
  }

  console.log('');
  console.log('✅ Import complete!');
  console.log('');

  // Summary
  const { count: scenarioCount } = await supabase
    .from('scenarios')
    .select('*', { count: 'exact', head: true });

  const { count: optionCount } = await supabase
    .from('scenario_options')
    .select('*', { count: 'exact', head: true });

  console.log('📊 Database Summary:');
  console.log(`   - Total Scenarios: ${scenarioCount}`);
  console.log(`   - Total Options: ${optionCount}`);
  console.log('');
  console.log('🎉 Success! Your scenarios are now in the database.');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('   1. Refresh the Flow Builder to see your scenarios');
  console.log('   2. Create or link to a simulation');
  console.log('   3. Set the entry point scenario');
  console.log('   4. Test the simulation flow');

  return idMapping;
}

async function main() {
  console.log('🚀 Scenario Import Tool');
  console.log('========================');
  console.log('');

  // Find the export file
  let exportFilePath = process.argv[2];

  if (!exportFilePath) {
    // Look for the most recent export file
    console.log('📁 Looking for export files...');
    const files = readdirSync(__dirname);
    const exportFiles = files
      .filter(f => f.startsWith('scenarios-export-') && f.endsWith('.json'))
      .sort()
      .reverse();

    if (exportFiles.length === 0) {
      console.error('❌ No export files found!');
      console.log('');
      console.log('Please provide an export file:');
      console.log('  node import-scenarios-to-database.mjs path/to/export.json');
      console.log('');
      console.log('Or export your scenarios first using:');
      console.log('  - Browser console script (export-scenarios-from-browser.js)');
      console.log('  - Manual export instructions (export-scenarios-manual.md)');
      process.exit(1);
    }

    exportFilePath = join(__dirname, exportFiles[0]);
    console.log(`✅ Found: ${exportFiles[0]}`);
  }

  // Read the export file
  console.log('📖 Reading export file...');
  let exportData;

  try {
    const fileContent = readFileSync(exportFilePath, 'utf-8');
    exportData = JSON.parse(fileContent);
    console.log('✅ Export file loaded successfully');
  } catch (error) {
    console.error('❌ Error reading export file:', error.message);
    process.exit(1);
  }

  // Validate export data
  if (!exportData.scenarios || !Array.isArray(exportData.scenarios)) {
    console.error('❌ Invalid export file format: missing scenarios array');
    process.exit(1);
  }

  if (exportData.scenarios.length === 0) {
    console.error('❌ Export file contains no scenarios');
    process.exit(1);
  }

  // Check authentication
  await checkAuthentication();

  // Import scenarios
  try {
    await importScenarios(exportData);
  } catch (error) {
    console.error('');
    console.error('❌ Import failed:', error.message);
    console.error('');
    console.error('Full error:', error);
    process.exit(1);
  }
}

main();
