import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('\n=== SIMULATION STATUS CHECK ===\n');

async function checkStatus() {
  // Check simulations
  const { data: sims, error: simError, count } = await supabase
    .from('simulations')
    .select('*', { count: 'exact' });

  if (simError) {
    console.error('Error:', simError.message);
    return;
  }

  console.log(`Simulations in database: ${count || 0}`);

  if (sims && sims.length > 0) {
    console.log('\nSimulation Details:');
    sims.forEach((sim, i) => {
      console.log(`\n${i + 1}. ${sim.display_name}`);
      console.log(`   ID: ${sim.id}`);
      console.log(`   Status: ${sim.status}`);
      console.log(`   Created: ${new Date(sim.created_at).toLocaleDateString()}`);
    });

    // Check if there are scenarios for first simulation
    const firstSim = sims[0];
    const { data: scenarios } = await supabase
      .from('simulation_scenarios')
      .select('count')
      .eq('simulation_id', firstSim.id);

    console.log(`\n   Scenarios linked: ${scenarios?.length || 0}`);

    // Check if metrics exist
    const { count: metricsCount } = await supabase
      .from('assessment_metrics')
      .select('*', { count: 'exact' });

    console.log(`\nAssessment Metrics in system: ${metricsCount || 0}`);

    // Check competencies
    const { count: compCount } = await supabase
      .from('competencies')
      .select('*', { count: 'exact' });

    console.log(`Competencies in system: ${compCount || 0}`);

  } else {
    console.log('\n⚠️  No simulations found!');
    console.log('\nThe database appears to be empty or migrations have not been applied.');
    console.log('\nTo fix this:');
    console.log('1. Ensure all migrations in supabase/migrations/ have been applied');
    console.log('2. Check Supabase dashboard > Table Editor to verify tables exist');
    console.log('3. The migration "20251103140000_create_leadership_challenges_beginner_simulation.sql" should create a sample simulation');
  }

  console.log('\n=== END CHECK ===\n');
}

checkStatus();
