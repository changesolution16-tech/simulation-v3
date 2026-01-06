import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// We need the service role key to bypass RLS for seeding
// This should be in your .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('\n❌ ERROR: SUPABASE_SERVICE_ROLE_KEY not found in .env');
  console.error('   This key is needed to bypass RLS for seeding.');
  console.error('   Get it from: https://supabase.com/dashboard/project/gglzmggwifbkxtxjclcw/settings/api');
  console.error('   Add it to .env as: SUPABASE_SERVICE_ROLE_KEY=your_key_here\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('\n========================================');
console.log('   DATABASE SEEDING SCRIPT');
console.log('========================================\n');

async function seedTopics() {
  console.log('📚 Seeding topics...');
  
  const topics = [
    {
      slug: 'leadership',
      title: 'Leadership Skills',
      description: 'Develop essential leadership capabilities',
      icon: 'Users',
      is_active: true
    },
    {
      slug: 'communication',
      title: 'Communication',
      description: 'Master effective communication techniques',
      icon: 'MessageSquare',
      is_active: true
    },
    {
      slug: 'problem-solving',
      title: 'Problem Solving',
      description: 'Enhance critical thinking and problem-solving abilities',
      icon: 'Lightbulb',
      is_active: true
    },
    {
      slug: 'teamwork',
      title: 'Teamwork',
      description: 'Learn to collaborate effectively in teams',
      icon: 'Users2',
      is_active: true
    },
    {
      slug: 'time-management',
      title: 'Time Management',
      description: 'Optimize productivity and manage time effectively',
      icon: 'Clock',
      is_active: true
    },
    {
      slug: 'emotional-intelligence',
      title: 'Emotional Intelligence',
      description: 'Develop self-awareness and empathy',
      icon: 'Heart',
      is_active: true
    },
    {
      slug: 'conflict-resolution',
      title: 'Conflict Resolution',
      description: 'Navigate and resolve conflicts constructively',
      icon: 'Shield',
      is_active: true
    }
  ];

  const { data, error } = await supabase
    .from('topics')
    .upsert(topics, { onConflict: 'slug' })
    .select();

  if (error) {
    console.error('   ❌ Error seeding topics:', error.message);
    return false;
  }

  console.log(`   ✅ Seeded ${data.length} topics`);
  return true;
}

async function seedCategories() {
  console.log('📁 Seeding simulation categories...');
  
  const categories = [
    {
      name: 'Leadership Development',
      description: 'Scenarios focused on building leadership capabilities',
      slug: 'leadership-development',
      is_active: true,
      display_order: 1
    },
    {
      name: 'Workplace Communication',
      description: 'Professional communication scenarios',
      slug: 'workplace-communication',
      is_active: true,
      display_order: 2
    },
    {
      name: 'Team Management',
      description: 'Managing and leading teams effectively',
      slug: 'team-management',
      is_active: true,
      display_order: 3
    }
  ];

  const { data, error } = await supabase
    .from('simulation_categories')
    .upsert(categories, { onConflict: 'slug' })
    .select();

  if (error) {
    console.error('   ❌ Error seeding categories:', error.message);
    return false;
  }

  console.log(`   ✅ Seeded ${data.length} categories`);
  return true;
}

async function seedCompetencies() {
  console.log('🎯 Seeding competencies...');
  
  const competencies = [
    {
      name: 'Strategic Thinking',
      description: 'Ability to think strategically and plan for the future',
      category: 'leadership',
      level: 1,
      is_active: true
    },
    {
      name: 'Active Listening',
      description: 'Fully concentrating on and understanding others',
      category: 'communication',
      level: 1,
      is_active: true
    },
    {
      name: 'Decision Making',
      description: 'Making informed and timely decisions',
      category: 'problem-solving',
      level: 1,
      is_active: true
    },
    {
      name: 'Collaboration',
      description: 'Working effectively with others toward common goals',
      category: 'teamwork',
      level: 1,
      is_active: true
    },
    {
      name: 'Self-Awareness',
      description: 'Understanding own emotions and their impact',
      category: 'emotional-intelligence',
      level: 1,
      is_active: true
    }
  ];

  const { data, error } = await supabase
    .from('competencies')
    .upsert(competencies, { onConflict: 'name' })
    .select();

  if (error) {
    console.error('   ❌ Error seeding competencies:', error.message);
    return false;
  }

  console.log(`   ✅ Seeded ${data.length} competencies`);
  return true;
}

async function seedMetrics() {
  console.log('📊 Seeding assessment metrics...');
  
  const metrics = [
    {
      name: 'Trust',
      description: 'Building and maintaining trust with others',
      dimension: 'relationship',
      min_value: 0,
      max_value: 100,
      is_active: true
    },
    {
      name: 'Confidence',
      description: 'Demonstrating self-assurance in decisions',
      dimension: 'personal',
      min_value: 0,
      max_value: 100,
      is_active: true
    },
    {
      name: 'Influence',
      description: 'Ability to persuade and motivate others',
      dimension: 'leadership',
      min_value: 0,
      max_value: 100,
      is_active: true
    }
  ];

  const { data, error } = await supabase
    .from('assessment_metrics')
    .upsert(metrics, { onConflict: 'name' })
    .select();

  if (error) {
    console.error('   ❌ Error seeding metrics:', error.message);
    return false;
  }

  console.log(`   ✅ Seeded ${data.length} metrics`);
  return true;
}

async function checkExistingData() {
  console.log('🔍 Checking existing data...\n');
  
  const checks = [
    { table: 'topics', name: 'Topics' },
    { table: 'simulation_categories', name: 'Categories' },
    { table: 'competencies', name: 'Competencies' },
    { table: 'assessment_metrics', name: 'Metrics' },
    { table: 'simulations', name: 'Simulations' }
  ];
  
  for (const check of checks) {
    const { count, error } = await supabase
      .from(check.table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`   ❌ ${check.name}: Error - ${error.message}`);
    } else {
      console.log(`   ${count > 0 ? '✅' : '⚪'} ${check.name}: ${count} rows`);
    }
  }
  console.log('');
}

async function main() {
  await checkExistingData();
  
  console.log('Starting seed process...\n');
  
  const results = [];
  results.push(await seedTopics());
  results.push(await seedCategories());
  results.push(await seedCompetencies());
  results.push(await seedMetrics());
  
  console.log('\n========================================');
  if (results.every(r => r)) {
    console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
  } else {
    console.log('⚠️  SEEDING COMPLETED WITH ERRORS');
  }
  console.log('========================================\n');
  
  await checkExistingData();
}

main().catch(console.error);
