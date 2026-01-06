import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Spanish translations for category names
const categoryTranslations = {
  'Communication': 'Comunicación',
  'Teamwork': 'Trabajo en Equipo',
  'Conflict Resolution': 'Resolución de Conflictos',
  'Critical Thinking': 'Pensamiento Crítico',
  'Goal Setting': 'Establecimiento de Metas',
  'Leadership': 'Liderazgo',
  'Covey Leadership': 'Liderazgo Covey'
};

// Spanish translations for category descriptions
const categoryDescriptionTranslations = {
  'Learn to communicate clearly and effectively in various professional situations':
    'Aprende a comunicarte de manera clara y efectiva en diversas situaciones profesionales',
  'Develop skills to work effectively in team environments and collaborative projects':
    'Desarrolla habilidades para trabajar efectivamente en entornos de equipo y proyectos colaborativos',
  'Master techniques to address and resolve workplace conflicts professionally':
    'Domina técnicas para abordar y resolver conflictos laborales de manera profesional',
  'Enhance your ability to analyze situations and make sound decisions':
    'Mejora tu capacidad para analizar situaciones y tomar decisiones acertadas',
  'Learn to set and achieve meaningful professional and personal goals':
    'Aprende a establecer y alcanzar metas profesionales y personales significativas',
  'Develop the confidence and skills to lead teams and initiatives effectively':
    'Desarrolla la confianza y las habilidades para liderar equipos e iniciativas efectivamente',
  'Master Stephen Covey\'s 13 behaviors of high-trust leaders':
    'Domina los 13 comportamientos de líderes de alta confianza de Stephen Covey'
};

async function backfillTranslations() {
  console.log('Starting translation backfill...\n');

  // 1. Backfill simulation_categories
  console.log('1. Backfilling simulation_categories...');
  const { data: categories, error: catError } = await supabase
    .from('simulation_categories')
    .select('*');

  if (catError) {
    console.error('Error fetching categories:', catError);
  } else {
    console.log(`Found ${categories.length} categories`);

    for (const category of categories) {
      const updates = {
        name_en: category.name,
        name_es: categoryTranslations[category.name] || category.name,
        description_en: category.description,
        description_es: categoryDescriptionTranslations[category.description] || category.description
      };

      const { error: updateError } = await supabase
        .from('simulation_categories')
        .update(updates)
        .eq('id', category.id);

      if (updateError) {
        console.error(`  ✗ Error updating category "${category.name}":`, updateError.message);
      } else {
        console.log(`  ✓ Updated category: ${category.name} → ${updates.name_es}`);
      }
    }
  }

  // 2. Backfill simulations
  console.log('\n2. Backfilling simulations...');
  const { data: simulations, error: simError } = await supabase
    .from('simulations')
    .select('*');

  if (simError) {
    console.error('Error fetching simulations:', simError);
  } else {
    console.log(`Found ${simulations.length} simulations`);

    for (const sim of simulations) {
      const updates = {
        display_name_en: sim.display_name || sim.name,
        display_name_es: null, // To be manually translated
        description_en: sim.description,
        description_es: null, // To be manually translated
        landing_title_en: sim.landing_title,
        landing_title_es: null,
        landing_description_en: sim.landing_description,
        landing_description_es: null,
        landing_role_description_en: sim.landing_role_description,
        landing_role_description_es: null,
        closing_title_en: sim.closing_title || 'Simulation Complete',
        closing_title_es: 'Simulación Completada'
      };

      const { error: updateError } = await supabase
        .from('simulations')
        .update(updates)
        .eq('id', sim.id);

      if (updateError) {
        console.error(`  ✗ Error updating simulation "${sim.display_name}":`, updateError.message);
      } else {
        console.log(`  ✓ Updated simulation: ${sim.display_name}`);
      }
    }
  }

  // 3. Backfill scenarios
  console.log('\n3. Backfilling scenarios...');
  const { data: scenarios, error: scenError } = await supabase
    .from('scenarios')
    .select('*');

  if (scenError) {
    console.error('Error fetching scenarios:', scenError);
  } else {
    console.log(`Found ${scenarios.length} scenarios`);

    for (const scenario of scenarios) {
      const updates = {
        title_en: scenario.title,
        title_es: null, // To be manually translated
        description_en: scenario.description,
        description_es: null, // To be manually translated
        question_text_en: scenario.question_text,
        question_text_es: null // To be manually translated
      };

      const { error: updateError } = await supabase
        .from('scenarios')
        .update(updates)
        .eq('id', scenario.id);

      if (updateError) {
        console.error(`  ✗ Error updating scenario "${scenario.title}":`, updateError.message);
      } else {
        console.log(`  ✓ Updated scenario: ${scenario.title}`);
      }
    }
  }

  // 4. Backfill scenario_options
  console.log('\n4. Backfilling scenario_options...');
  const { data: options, error: optError } = await supabase
    .from('scenario_options')
    .select('*');

  if (optError) {
    console.error('Error fetching scenario options:', optError);
  } else {
    console.log(`Found ${options.length} scenario options`);

    for (const option of options) {
      const updates = {
        option_text_en: option.option_text,
        option_text_es: null, // To be manually translated
        feedback_beginner_en: option.feedback_beginner,
        feedback_beginner_es: null,
        feedback_intermediate_en: option.feedback_intermediate,
        feedback_intermediate_es: null,
        feedback_advanced_en: option.feedback_advanced,
        feedback_advanced_es: null
      };

      const { error: updateError } = await supabase
        .from('scenario_options')
        .update(updates)
        .eq('id', option.id);

      if (updateError) {
        console.error(`  ✗ Error updating option ${option.id}:`, updateError.message);
      } else {
        console.log(`  ✓ Updated option ${option.id}`);
      }
    }
  }

  console.log('\n✅ Translation backfill completed!');
  console.log('\nNext steps:');
  console.log('  - Spanish translations for simulations need to be added manually');
  console.log('  - Spanish translations for scenarios need to be added manually');
  console.log('  - Spanish translations for scenario options need to be added manually');
  console.log('  - Category translations have been automatically populated');
}

backfillTranslations().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
