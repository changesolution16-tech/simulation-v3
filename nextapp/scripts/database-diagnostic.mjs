import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const pad = (str, len) => str + ' '.repeat(Math.max(0, len - str.length));

console.log('\n========================================================');
console.log('        DATABASE DIAGNOSTIC REPORT                     ');
console.log('========================================================\n');

async function checkTable(tableName, showSample = false) {
  try {
    const { data, count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' });
    
    if (error) {
      if (error.message.includes('does not exist') || error.code === '42P01') {
        return { exists: false, count: 0, error: 'TABLE DOES NOT EXIST' };
      }
      return { exists: false, count: 0, error: error.message };
    }
    
    const result = { exists: true, count: count || 0, data };
    
    if (showSample && data && data.length > 0) {
      result.sample = data.slice(0, 3);
    }
    
    return result;
  } catch (e) {
    return { exists: false, count: 0, error: e.message };
  }
}

async function main() {
  console.log('CONNECTION INFO:');
  console.log('URL:', process.env.VITE_SUPABASE_URL);
  console.log('Key:', process.env.VITE_SUPABASE_ANON_KEY ? 'Configured' : 'Missing');
  console.log('');

  const criticalTables = [
    { name: 'topics', critical: true, showSample: true },
    { name: 'simulation_categories', critical: true, showSample: true },
    { name: 'simulations', critical: true, showSample: false },
    { name: 'scenarios', critical: true, showSample: false },
    { name: 'scenario_options', critical: true, showSample: false },
    { name: 'simulation_scenarios', critical: false, showSample: false },
  ];

  const supportTables = [
    { name: 'competencies', critical: true, showSample: true },
    { name: 'assessment_metrics', critical: true, showSample: false },
    { name: 'scenario_option_metrics', critical: false, showSample: false },
  ];

  const userTables = [
    { name: 'profiles', critical: true, showSample: false },
    { name: 'cohorts', critical: false, showSample: false },
    { name: 'training_assignments', critical: false, showSample: false },
  ];

  const progressTables = [
    { name: 'simulation_instances', critical: false },
    { name: 'learner_attempts', critical: false },
    { name: 'learner_responses', critical: false },
  ];

  console.log('========================================================');
  console.log('1. CORE SIMULATION TABLES');
  console.log('========================================================\n');

  let missingTables = [];
  let emptyTables = [];

  for (const table of criticalTables) {
    const result = await checkTable(table.name, table.showSample);
    
    let status = 'OK';
    if (!result.exists) {
      status = 'MISSING';
      missingTables.push(table.name);
    } else if (result.count === 0 && table.critical) {
      status = 'EMPTY';
      emptyTables.push(table.name);
    }
    
    console.log(status, pad(table.name, 30), result.exists ? result.count + ' rows' : result.error);
    
    if (result.sample) {
      console.log('   Sample data:');
      result.sample.forEach(item => {
        if (table.name === 'topics') {
          console.log('     -', item.slug, ':', item.title);
        } else if (table.name === 'simulation_categories') {
          console.log('     -', item.name);
        } else if (table.name === 'competencies') {
          console.log('     -', item.name);
        }
      });
    }
  }

  console.log('\n========================================================');
  console.log('2. COMPETENCY AND METRICS TABLES');
  console.log('========================================================\n');

  for (const table of supportTables) {
    const result = await checkTable(table.name, table.showSample);
    
    let status = 'OK';
    if (!result.exists) {
      status = 'MISSING';
      missingTables.push(table.name);
    } else if (result.count === 0 && table.critical) {
      status = 'EMPTY';
      emptyTables.push(table.name);
    }
    
    console.log(status, pad(table.name, 30), result.exists ? result.count + ' rows' : result.error);
    
    if (result.sample) {
      console.log('   Sample data:');
      result.sample.forEach(item => {
        console.log('     -', item.name || item.metric_name || item.id);
      });
    }
  }

  console.log('\n========================================================');
  console.log('3. USER AND ASSIGNMENT TABLES');
  console.log('========================================================\n');

  for (const table of userTables) {
    const result = await checkTable(table.name);
    
    let status = 'OK';
    if (!result.exists) {
      status = 'MISSING';
      missingTables.push(table.name);
    } else if (result.count === 0 && table.critical) {
      status = 'EMPTY';
      emptyTables.push(table.name);
    }
    
    console.log(status, pad(table.name, 30), result.exists ? result.count + ' rows' : result.error);
  }

  console.log('\n========================================================');
  console.log('4. LEARNER PROGRESS TABLES');
  console.log('========================================================\n');

  for (const table of progressTables) {
    const result = await checkTable(table.name);
    let status = result.exists ? 'OK' : 'MISSING';
    console.log(status, pad(table.name, 30), result.exists ? result.count + ' rows' : result.error);
  }

  console.log('\n========================================================');
  console.log('ANALYSIS AND RECOMMENDATIONS');
  console.log('========================================================\n');

  if (missingTables.length > 0) {
    console.log('CRITICAL ERROR: The following tables DO NOT EXIST:');
    missingTables.forEach(t => console.log('   -', t));
    console.log('\nACTION REQUIRED:');
    console.log('Your database migrations have NOT been applied!');
    console.log('You need to apply migrations through Supabase.\n');
  }

  if (emptyTables.length > 0 && missingTables.length === 0) {
    console.log('WARNING: The following critical tables are EMPTY:');
    emptyTables.forEach(t => console.log('   -', t));
    console.log('\nACTION REQUIRED:');
    console.log('Tables exist but have no data.');
    console.log('Migrations ran but did not seed data.\n');
  }

  if (missingTables.length === 0 && emptyTables.length === 0) {
    console.log('SUCCESS: All tables exist and have data!\n');
  }

  const topicsResult = await checkTable('topics');
  const scenariosResult = await checkTable('scenarios');
  const simulationsResult = await checkTable('simulations');

  console.log('========================================================');
  console.log('DATA USAGE ANALYSIS');
  console.log('========================================================\n');

  if (topicsResult.exists && topicsResult.count === 0) {
    console.log('WARNING: Topics table is empty');
    console.log('Your app is using HARDCODED topics from:');
    console.log('FILE: src/data/topics.ts\n');
    console.log('This means:');
    console.log('- Topics will not persist changes');
    console.log('- New topics created in admin will not show');
    console.log('- Frontend always uses same 7 hardcoded topics\n');
  } else if (topicsResult.exists && topicsResult.count > 0) {
    console.log('SUCCESS: Topics table has', topicsResult.count, 'topics\n');
  }

  if (scenariosResult.exists && scenariosResult.count === 0 && 
      simulationsResult.exists && simulationsResult.count === 0) {
    console.log('WARNING: No simulations or scenarios in database');
    console.log('Your app may be using HARDCODED scenarios from:');
    console.log('FILE: src/data/scenarios.ts\n');
    console.log('This means:');
    console.log('- Simulations created in admin may not save');
    console.log('- Learners see hardcoded demo content');
    console.log('- Changes do not persist to database\n');
  }

  console.log('========================================================');
  console.log('NEXT STEPS');
  console.log('========================================================\n');

  if (missingTables.length > 0) {
    console.log('STEP 1: Apply database migrations');
    console.log('Check Supabase dashboard migrations panel\n');
  } else if (emptyTables.includes('topics')) {
    console.log('STEP 1: Seed the topics table');
    console.log('A seeding script can be created for you\n');
  } else if (emptyTables.includes('profiles')) {
    console.log('STEP 1: Create an admin user account\n');
  } else if (simulationsResult.count === 0) {
    console.log('STEP 1: Create your first simulation');
    console.log('Use the Admin UI\n');
  } else {
    console.log('STEP 1: Verify data flow');
    console.log('Check if app uses database or hardcoded data\n');
  }

  console.log('========================================================\n');
}

main().catch(console.error);
