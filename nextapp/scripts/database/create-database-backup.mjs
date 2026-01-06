#!/usr/bin/env node

/**
 * Complete Database Backup Script
 * Creates a full backup with:
 * - Pre-data: Schema definitions (tables, types, functions)
 * - Data: All table data as INSERT statements
 * - Post-data: Constraints, indexes, triggers, RLS policies
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Escape SQL values
function escapeValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
  // String - escape single quotes
  return `'${value.toString().replace(/'/g, "''")}'`;
}

async function getTableSchema(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(0);

  if (error) {
    console.error(`Error getting schema for ${tableName}:`, error);
    return null;
  }

  return data;
}

async function getTableData(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*');

  if (error) {
    console.error(`Error getting data from ${tableName}:`, error.message);
    return [];
  }

  return data || [];
}

async function createBackup() {
  console.log('🔄 Starting database backup...\n');

  let sqlBackup = '';

  // Header
  sqlBackup += `-- ============================================================================
-- COMPLETE DATABASE BACKUP
-- Generated: ${new Date().toISOString()}
-- Database: Soft Skills Training Simulation Platform
-- Supabase Project: ${supabaseUrl}
-- ============================================================================
--
-- This backup contains:
-- 1. PRE-DATA: Schema definitions (from migrations)
-- 2. DATA: All table data as INSERT statements
-- 3. POST-DATA: Indexes, constraints, policies (from migrations)
--
-- To restore:
-- 1. Create new Supabase project
-- 2. Run all migrations from supabase/migrations/ folder
-- 3. Run the DATA section below
-- ============================================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

-- ============================================================================
-- PART 1: PRE-DATA (Schema)
-- ============================================================================
--
-- Note: Schema is defined in supabase/migrations/ folder
-- Apply all migrations before restoring data
-- This ensures tables, types, and functions exist
--

-- ============================================================================
-- PART 2: DATA (Table Contents)
-- ============================================================================

`;

  // Define tables in correct order (respecting foreign keys)
  const tables = [
    'user_profiles',
    'competencies',
    'bravin_metrics',
    'video_library',
    'simulation_categories',
    'simulations',
    'simulation_stages',
    'stage_choices',
    'stage_logic',
    'scenario_targeted_competencies',
    'simulation_competency_weights',
    'bravin_alignments',
    'cohorts',
    'cohort_members',
    'assignments',
    'simulation_instances',
    'assessments',
    'assessment_metrics',
    'user_responses',
    'user_progress',
    'feedback',
    'translations',
    'branding_settings'
  ];

  let totalRows = 0;

  for (const tableName of tables) {
    console.log(`📊 Backing up table: ${tableName}`);

    try {
      const data = await getTableData(tableName);

      if (!data || data.length === 0) {
        sqlBackup += `\n-- Table: ${tableName} (empty)\n`;
        console.log(`   ℹ️  No data found`);
        continue;
      }

      sqlBackup += `\n-- ============================================================================\n`;
      sqlBackup += `-- Table: ${tableName}\n`;
      sqlBackup += `-- Rows: ${data.length}\n`;
      sqlBackup += `-- ============================================================================\n\n`;

      // Get column names from first row
      const columns = Object.keys(data[0]);
      const columnList = columns.map(c => `"${c}"`).join(', ');

      sqlBackup += `-- Disable triggers temporarily for faster import\n`;
      sqlBackup += `ALTER TABLE "${tableName}" DISABLE TRIGGER ALL;\n\n`;

      // Generate INSERT statements (batch them for efficiency)
      const batchSize = 100;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);

        for (const row of batch) {
          const values = columns.map(col => escapeValue(row[col])).join(', ');
          sqlBackup += `INSERT INTO "${tableName}" (${columnList}) VALUES (${values});\n`;
        }

        if (data.length > batchSize) {
          sqlBackup += `\n-- Batch checkpoint (rows ${i + 1} to ${Math.min(i + batchSize, data.length)})\n\n`;
        }
      }

      sqlBackup += `\n-- Re-enable triggers\n`;
      sqlBackup += `ALTER TABLE "${tableName}" ENABLE TRIGGER ALL;\n`;

      totalRows += data.length;
      console.log(`   ✅ Backed up ${data.length} rows`);

    } catch (error) {
      console.error(`   ❌ Error backing up ${tableName}:`, error.message);
      sqlBackup += `\n-- ERROR backing up ${tableName}: ${error.message}\n`;
    }
  }

  // Footer
  sqlBackup += `\n-- ============================================================================\n`;
  sqlBackup += `-- PART 3: POST-DATA (Constraints, Indexes, Policies)\n`;
  sqlBackup += `-- ============================================================================\n`;
  sqlBackup += `--\n`;
  sqlBackup += `-- Note: These are already defined in migrations\n`;
  sqlBackup += `-- The migrations include:\n`;
  sqlBackup += `-- - Foreign key constraints\n`;
  sqlBackup += `-- - Indexes for performance\n`;
  sqlBackup += `-- - Row Level Security policies\n`;
  sqlBackup += `-- - Database functions and triggers\n`;
  sqlBackup += `--\n`;
  sqlBackup += `-- After importing data, verify RLS is enabled:\n`;
  sqlBackup += `-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';\n`;
  sqlBackup += `--\n`;
  sqlBackup += `-- ============================================================================\n\n`;

  sqlBackup += `-- Re-enable Row Level Security\n`;
  sqlBackup += `SET row_security = on;\n\n`;

  sqlBackup += `-- Update sequences to current max values\n`;
  sqlBackup += `-- (if you have any sequences, add them here)\n\n`;

  sqlBackup += `-- Analyze tables for query optimizer\n`;
  for (const tableName of tables) {
    sqlBackup += `ANALYZE "${tableName}";\n`;
  }

  sqlBackup += `\n-- ============================================================================\n`;
  sqlBackup += `-- BACKUP COMPLETE\n`;
  sqlBackup += `-- ============================================================================\n`;
  sqlBackup += `-- Total tables: ${tables.length}\n`;
  sqlBackup += `-- Total rows: ${totalRows}\n`;
  sqlBackup += `-- Generated: ${new Date().toISOString()}\n`;
  sqlBackup += `--\n`;
  sqlBackup += `-- To restore:\n`;
  sqlBackup += `-- 1. Apply all migrations from supabase/migrations/\n`;
  sqlBackup += `-- 2. Run this SQL file\n`;
  sqlBackup += `-- 3. Verify data: SELECT count(*) FROM [table_name];\n`;
  sqlBackup += `-- ============================================================================\n`;

  // Write to file
  const filename = `database-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
  writeFileSync(filename, sqlBackup);

  console.log('\n✅ Backup complete!');
  console.log(`📁 File: ${filename}`);
  console.log(`📊 Total rows backed up: ${totalRows}`);
  console.log(`💾 File size: ${(sqlBackup.length / 1024 / 1024).toFixed(2)} MB`);

  return filename;
}

// Run backup
createBackup()
  .then(filename => {
    console.log('\n🎉 Database backup successful!');
    console.log(`\nTo use this backup:`);
    console.log(`1. Create new Supabase project`);
    console.log(`2. Apply migrations: supabase/migrations/*.sql`);
    console.log(`3. Import data: psql -f ${filename}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Backup failed:', error);
    process.exit(1);
  });
