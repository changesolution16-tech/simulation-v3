import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkLandingImages() {
  console.log('\n=== Checking Simulation Landing Images ===\n');

  const { data: simulations, error } = await supabase
    .from('simulations')
    .select('id, display_name, landing_image_url, landing_image_alt, status');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${simulations.length} published simulations:\n`);

  simulations.forEach((sim, index) => {
    console.log(`${index + 1}. ${sim.display_name}`);
    console.log(`   ID: ${sim.id}`);
    console.log(`   Has Image: ${sim.landing_image_url ? '✓ YES' : '✗ NO'}`);
    if (sim.landing_image_url) {
      console.log(`   Image URL: ${sim.landing_image_url}`);
      console.log(`   Alt Text: ${sim.landing_image_alt || 'None'}`);
    }
    console.log('');
  });

  const withImages = simulations.filter(s => s.landing_image_url).length;
  console.log(`\nSummary: ${withImages} of ${simulations.length} simulations have landing images`);
}

checkLandingImages();
