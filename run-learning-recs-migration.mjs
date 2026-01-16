#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import postgres from 'postgres';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Read the RDS CA certificate
const caPath = join(__dirname, 'src', 'lib', 'rds-us-east-1-ca.pem');
const caCert = readFileSync(caPath, 'utf-8');

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 30,
  ssl: {
    ca: caCert,
    rejectUnauthorized: true
  },
  onnotice: () => {},
});

async function runMigration() {
  try {
    console.log('🔄 Reading migration file...');
    const migrationPath = join(__dirname, 'add-learning-recommendations-schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('🔄 Executing migration...');
    await sql.unsafe(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('\n📊 Verifying installation...');

    // Verify schema changes
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'scenario_options'
        AND column_name IN ('practice_exercises', 'next_steps')
      ORDER BY column_name
    `;

    console.log('\n✅ New columns in scenario_options:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });

    // Check new tables
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('learning_resources', 'option_learning_resources')
      ORDER BY table_name
    `;

    console.log('\n✅ New tables created:');
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

    // Count sample resources
    const [count] = await sql`
      SELECT COUNT(*) as count FROM learning_resources
    `;

    console.log(`\n✅ Sample learning resources inserted: ${count.count}`);

    // Show sample resources by type
    const resourcesByType = await sql`
      SELECT resource_type, COUNT(*) as count
      FROM learning_resources
      GROUP BY resource_type
      ORDER BY count DESC
    `;

    console.log('\n📚 Resources by type:');
    resourcesByType.forEach(row => {
      console.log(`   - ${row.resource_type}: ${row.count}`);
    });

    console.log('\n🎉 Learning Recommendations System is ready!');
    console.log('\nNext steps:');
    console.log('   1. Update API routes to handle new fields');
    console.log('   2. Create admin UI components');
    console.log('   3. Create learner display components');
    console.log('   4. Test with a sample scenario');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
