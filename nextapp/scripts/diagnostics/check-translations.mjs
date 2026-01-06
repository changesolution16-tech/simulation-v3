import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTranslations() {
  console.log('='.repeat(80));
  console.log('TRANSLATION AUDIT REPORT');
  console.log('='.repeat(80));
  console.log('\n');

  // 1. Check simulation_categories
  console.log('1. SIMULATION CATEGORIES');
  console.log('-'.repeat(80));
  const { data: categories, error: catError } = await supabase
    .from('simulation_categories')
    .select('id, name, name_en, name_es, description, description_en, description_es');

  if (catError) {
    console.error('Error fetching categories:', catError);
  } else {
    console.log(`Total categories: ${categories.length}\n`);
    
    let translated = 0;
    categories.forEach(cat => {
      const hasSpanish = cat.name_es || cat.description_es;
      if (hasSpanish) translated++;
      
      console.log(`Category: ${cat.name || cat.name_en}`);
      console.log(`  EN Name: ${cat.name_en || cat.name}`);
      console.log(`  ES Name: ${cat.name_es || 'NOT TRANSLATED'}`);
      console.log(`  EN Desc: ${(cat.description_en || cat.description || '').substring(0, 60)}...`);
      console.log(`  ES Desc: ${cat.description_es ? cat.description_es.substring(0, 60) + '...' : 'NOT TRANSLATED'}`);
      console.log('');
    });
    
    console.log(`Translation Coverage: ${translated}/${categories.length} (${Math.round(translated/categories.length*100)}%)`);
  }

  // 2. Check simulations
  console.log('\n2. SIMULATIONS');
  console.log('-'.repeat(80));
  const { data: simulations, error: simError } = await supabase
    .from('simulations')
    .select('id, name, display_name, display_name_en, display_name_es, description, description_en, description_es, landing_title_en, landing_title_es, closing_title_en, closing_title_es');

  if (simError) {
    console.error('Error fetching simulations:', simError);
  } else {
    console.log(`Total simulations: ${simulations.length}\n`);
    
    simulations.forEach(sim => {
      const hasSpanish = sim.display_name_es || sim.description_es || sim.landing_title_es || sim.closing_title_es;
      
      console.log(`Simulation: ${sim.name || sim.display_name}`);
      console.log(`  Display Name EN: ${sim.display_name_en || sim.display_name}`);
      console.log(`  Display Name ES: ${sim.display_name_es || 'NOT TRANSLATED'}`);
      console.log(`  Landing Title EN: ${sim.landing_title_en || 'N/A'}`);
      console.log(`  Landing Title ES: ${sim.landing_title_es || 'NOT TRANSLATED'}`);
      console.log(`  Closing Title EN: ${sim.closing_title_en || 'N/A'}`);
      console.log(`  Closing Title ES: ${sim.closing_title_es || 'NOT TRANSLATED'}`);
      console.log(`  Description ES: ${sim.description_es ? 'YES (' + sim.description_es.substring(0, 40) + '...)' : 'NOT TRANSLATED'}`);
      console.log(`  Status: ${hasSpanish ? '✓ Has Spanish' : '✗ Missing Spanish'}`);
      console.log('');
    });
  }

  // 3. Check scenarios
  console.log('\n3. SCENARIOS');
  console.log('-'.repeat(80));
  const { data: scenarios, error: scenError } = await supabase
    .from('scenarios')
    .select('id, title, title_en, title_es, description, description_en, description_es, question_text, question_text_en, question_text_es')
    .order('title');

  if (scenError) {
    console.error('Error fetching scenarios:', scenError);
  } else {
    console.log(`Total scenarios: ${scenarios.length}\n`);
    
    let translated = 0;
    scenarios.forEach((scen, idx) => {
      const hasSpanish = scen.title_es || scen.description_es || scen.question_text_es;
      if (hasSpanish) translated++;
      
      console.log(`[${idx + 1}] ${scen.title || scen.title_en}`);
      console.log(`    Title ES: ${scen.title_es || 'NOT TRANSLATED'}`);
      console.log(`    Desc ES: ${scen.description_es ? 'YES' : 'NO'}`);
      console.log(`    Question ES: ${scen.question_text_es || 'NOT TRANSLATED'}`);
      console.log(`    Status: ${hasSpanish ? '✓' : '✗'}`);
      console.log('');
    });
    
    console.log(`Translation Coverage: ${translated}/${scenarios.length} (${Math.round(translated/scenarios.length*100)}%)`);
  }

  // 4. Check scenario_options
  console.log('\n4. SCENARIO OPTIONS');
  console.log('-'.repeat(80));
  const { data: options, error: optError } = await supabase
    .from('scenario_options')
    .select('id, scenario_id, option_text, option_text_en, option_text_es, feedback_beginner_en, feedback_beginner_es, feedback_intermediate_en, feedback_intermediate_es, feedback_advanced_en, feedback_advanced_es')
    .order('scenario_id');

  if (optError) {
    console.error('Error fetching scenario options:', optError);
  } else {
    console.log(`Total options: ${options.length}\n`);
    
    let translated = 0;
    let currentScenarioId = null;
    let scenarioOptionsCount = 0;
    
    options.forEach((opt, idx) => {
      if (opt.scenario_id !== currentScenarioId) {
        if (currentScenarioId !== null) {
          console.log('');
        }
        currentScenarioId = opt.scenario_id;
        scenarioOptionsCount = 0;
        console.log(`Scenario ID: ${opt.scenario_id}`);
      }
      
      scenarioOptionsCount++;
      const hasSpanish = opt.option_text_es || opt.feedback_beginner_es || opt.feedback_intermediate_es || opt.feedback_advanced_es;
      if (hasSpanish) translated++;
      
      const optionPreview = (opt.option_text || opt.option_text_en || '').substring(0, 50);
      console.log(`  [${scenarioOptionsCount}] ${optionPreview}...`);
      console.log(`      Text ES: ${opt.option_text_es ? '✓' : '✗'}`);
      console.log(`      Feedback Beginner ES: ${opt.feedback_beginner_es ? '✓' : '✗'}`);
      console.log(`      Feedback Intermediate ES: ${opt.feedback_intermediate_es ? '✓' : '✗'}`);
      console.log(`      Feedback Advanced ES: ${opt.feedback_advanced_es ? '✓' : '✗'}`);
    });
    
    console.log(`\nTranslation Coverage: ${translated}/${options.length} (${Math.round(translated/options.length*100)}%)`);
  }

  // Summary
  console.log('\n');
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log('\nTranslation Status:');
  console.log(`  Categories: Check report above`);
  console.log(`  Simulations: Check report above`);
  console.log(`  Scenarios: Check report above`);
  console.log(`  Options: Check report above`);
  console.log('\n');
}

checkTranslations().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
