#!/usr/bin/env node

/**
 * Fix Profile Table UUID Default
 *
 * This script updates the profiles table to automatically generate UUIDs
 * for the id column using gen_random_uuid() as the default value.
 */

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env file');
  process.exit(1);
}

console.log('🔧 Starting profile table UUID default fix...\n');

// Read the RDS CA certificate
const caPath = join(__dirname, 'src', 'lib', 'rds-us-east-1-ca.pem');
const caCert = readFileSync(caPath, 'utf-8');

// Create database connection
const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  ssl: {
    ca: caCert,
    rejectUnauthorized: true
  }
});

async function fixProfileUuidDefault() {
  try {
    console.log('Step 1: Checking current table structure...');

    // Check if table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
      ) as exists
    `;

    if (!tableExists[0].exists) {
      console.log('❌ profiles table does not exist!');
      console.log('   Please run your migrations first.');
      process.exit(1);
    }

    console.log('✓ profiles table exists');

    console.log('\nStep 2: Checking if gen_random_uuid extension is enabled...');

    // Enable uuid generation extension if not already enabled
    await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;
    console.log('✓ pgcrypto extension is enabled');

    console.log('\nStep 3: Checking current default value for id column...');

    const columnInfo = await sql`
      SELECT column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'id'
    `;

    if (columnInfo.length === 0) {
      console.log('❌ id column not found in profiles table!');
      process.exit(1);
    }

    const currentDefault = columnInfo[0].column_default;
    console.log(`   Current default: ${currentDefault || '(none)'}`);

    if (currentDefault && currentDefault.includes('gen_random_uuid')) {
      console.log('\n✅ The id column already has gen_random_uuid() as default!');
      console.log('   No changes needed.');
      return;
    }

    console.log('\nStep 4: Updating profiles table to add UUID default...');

    // Alter the table to add the default value
    await sql`
      ALTER TABLE profiles
      ALTER COLUMN id SET DEFAULT gen_random_uuid()
    `;

    console.log('✓ Default value added successfully!');

    console.log('\nStep 5: Verifying the change...');

    const updatedColumnInfo = await sql`
      SELECT column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'id'
    `;

    console.log(`   New default: ${updatedColumnInfo[0].column_default}`);

    console.log('\n✅ Fix completed successfully!');
    console.log('   The profiles table id column will now automatically generate UUIDs.');

  } catch (error) {
    console.error('\n❌ Error occurred:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the fix
fixProfileUuidDefault();
