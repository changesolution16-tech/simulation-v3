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
  console.log('TRANSLATION AUDIT REPORT');
  console.log('='.repeat(80));

  // 1. Check simulation_categories
  console.log('\n1. SIMULATION CATEGORIES');
  console.log('-'.repeat(80));
  const { data: categories, error: catError } = await supabase
    .from('simulation_categories')
    .select('id, name, name_en, name_es, description, description_en, description_es');

  if (catError) {
    console.error('Error:', catError);
  } else {
    console.log('Total categories:', categories.length);
    let translated = 0;
    categories.forEach(cat => {
      const hasSpanish = cat.name_es || cat.description_es;
      if (hasSpanish) translated++;
      console.log('\nCategory:', cat.name || cat.name_en);
      console.log('  EN Name:', cat.name_en || cat.name);
      console.log('  ES Name:', cat.name_es || 'NOT TRANSLATED');
    });
    console.log('\nCoverage:', translated, '/', categories.length);
  }

  // 2. Check simulations
  console.log('\n\n2. SIMULATIONS');
  console.log('-'.repeat(80));
  const { data: simulations, error: simError } = await supabase
    .from('simulations')
    .select('id, name, display_name, display_name_en, display_name_es, landing_title_es, closing_title_es, description_es');

  if (simError) {
    console.error('Error:', simError);
  } else {
    console.log('Total simulations:', simulations.length);
    simulations.forEach(sim => {
      console.log('\nSimulation:', sim.name || sim.display_name);
      console.log('  Display Name ES:', sim.display_name_es || 'NOT TRANSLATED');
      console.log('  Landing Title ES:', sim.landing_title_es || 'NOT TRANSLATED');
      console.log('  Closing Title ES:', sim.closing_title_es || 'NOT TRANSLATED');
      console.log('  Description ES:', sim.description_es ? 'YES' : 'NO');
    });
  }

  // 3. Check scenarios
  console.log('\n\n3. SCENARIOS');
  console.log('-'.repeat(80));
  const { data: scenarios, error: scenError } = await supabase
    .from('scenarios')
    .select('id, title, title_en, title_es, question_text_es')
    .order('title');

  if (scenError) {
    console.error('Error:', scenError);
  } else {
    console.log('Total scenarios:', scenarios.length);
    let translated = 0;
    scenarios.forEach((scen, idx) => {
      const hasSpanish = scen.title_es || scen.question_text_es;
      if (hasSpanish) translated++;
      console.log('\n[' + (idx + 1) + ']', scen.title || scen.title_en);
      console.log('  Title ES:', scen.title_es || 'NOT TRANSLATED');
      console.log('  Question ES:', scen.question_text_es || 'NOT TRANSLATED');
    });
    console.log('\nCoverage:', translated, '/', scenarios.length);
  }

  // 4. Check scenario_options
  console.log('\n\n4. SCENARIO OPTIONS');
  console.log('-'.repeat(80));
  const { data: options, error: optError } = await supabase
    .from('scenario_options')
    .select('id, scenario_id, option_text, option_text_es, feedback_beginner_es, feedback_intermediate_es, feedback_advanced_es')
    .order('scenario_id');

  if (optError) {
    console.error('Error:', optError);
  } else {
    console.log('Total options:', options.length);
    let translated = 0;
    options.forEach((opt) => {
      const hasSpanish = opt.option_text_es && opt.feedback_beginner_es && opt.feedback_intermediate_es && opt.feedback_advanced_es;
      if (hasSpanish) translated++;
    });
    console.log('Fully translated options:', translated, '/', options.length);
    
    // Group by scenario
    const byScenario = {};
    options.forEach(opt => {
      if (!byScenario[opt.scenario_id]) byScenario[opt.scenario_id] = [];
      byScenario[opt.scenario_id].push(opt);
    });
    
    Object.keys(byScenario).forEach(scenId => {
      const opts = byScenario[scenId];
      const translatedCount = opts.filter(o => o.option_text_es && o.feedback_beginner_es).length;
      console.log('\nScenario', scenId + ':', translatedCount, '/', opts.length, 'options translated');
    });
  }

  console.log('\n' + '='.repeat(80));
}

checkTranslations().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
