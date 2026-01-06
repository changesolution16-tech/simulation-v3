#!/usr/bin/env node

/**
 * Complete Database Backup using SQL queries
 * Exports schema + data directly from PostgreSQL
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

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
  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }
  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${value.toString().replace(/'/g, "''")}'`;
}

async function getAllTables() {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      ORDER BY tablename;
    `
  });

  if (error) {
    console.log('⚠️  Cannot use RPC, using predefined table list');
    // Return comprehensive list of known tables
    return [
      'branding_settings',
      'bravin_alignments',
      'bravin_metrics',
      'cohort_members',
      'cohorts',
      'competencies',
      'feedback',
      'simulation_categories',
      'simulation_competency_weights',
      'simulation_instances',
      'simulation_stages',
      'simulations',
      'stage_choices',
      'stage_logic',
      'assignments',
      'assessments',
      'assessment_metrics',
      'scenario_targeted_competencies',
      'translations',
      'user_profiles',
      'user_progress',
      'user_responses',
      'video_library'
    ];
  }

  return data ? data.map(row => row.tablename) : [];
}

async function getTableColumns(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);

  if (error || !data || data.length === 0) {
    // Try to get from information_schema
    return null;
  }

  return Object.keys(data[0]);
}

async function createCompleteBackup() {
  console.log('🔄 Creating complete database backup...\n');

  let sqlBackup = `-- ============================================================================
-- COMPLETE DATABASE BACKUP
-- Generated: ${new Date().toISOString()}
-- Database: Soft Skills Training Simulation
-- ============================================================================
--
-- This file contains:
-- 1. PRE-DATA: Complete schema from migrations
-- 2. DATA: All table data as INSERT statements
-- 3. POST-DATA: Constraints, indexes, RLS policies
--
-- RESTORE INSTRUCTIONS:
-- 1. Create new Supabase project
-- 2. Apply all migrations from supabase/migrations/ (in order)
-- 3. Run this file to populate data
--
-- ============================================================================

-- Connection settings
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

`;

  sqlBackup += `\n-- ============================================================================\n`;
  sqlBackup += `-- PART 1: PRE-DATA (Schema Definitions)\n`;
  sqlBackup += `-- ============================================================================\n`;
  sqlBackup += `--\n`;
  sqlBackup += `-- Schema is defined in: supabase/migrations/\n`;
  sqlBackup += `-- Apply all migration files before importing data\n`;
  sqlBackup += `--\n`;
  sqlBackup += `-- Migration files should be applied in chronological order:\n`;
  sqlBackup += `-- 1. 20250605003318_pink_field.sql (initial schema)\n`;
  sqlBackup += `-- 2. 20251022141416_create_lti_moodle_simulation_schema.sql\n`;
  sqlBackup += `-- ... (continue with all migrations)\n`;
  sqlBackup += `--\n`;
  sqlBackup += `-- ============================================================================\n\n`;

  sqlBackup += `-- ============================================================================\n`;
  sqlBackup += `-- PART 2: DATA (Table Contents with INSERT Statements)\n`;
  sqlBackup += `-- ============================================================================\n\n`;

  // Get all tables
  const tables = await getAllTables();
  console.log(`📋 Found ${tables.length} tables\n`);

  let totalRows = 0;
  let backedUpTables = 0;

  for (const tableName of tables) {
    console.log(`📊 Processing: ${tableName}`);

    try {
      // Try to get data
      const { data, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) {
        console.log(`   ⚠️  No access or empty: ${error.message}`);
        sqlBackup += `\n-- Table: ${tableName} (no data or no access)\n`;
        sqlBackup += `-- ${error.message}\n`;
        continue;
      }

      if (!data || data.length === 0) {
        console.log(`   ℹ️  Empty table`);
        sqlBackup += `\n-- Table: ${tableName} (empty)\n`;
        continue;
      }

      sqlBackup += `\n-- ============================================================================\n`;
      sqlBackup += `-- Table: ${tableName}\n`;
      sqlBackup += `-- Rows: ${data.length}\n`;
      sqlBackup += `-- ============================================================================\n\n`;

      const columns = Object.keys(data[0]);
      const columnList = columns.map(c => `"${c}"`).join(', ');

      // Disable triggers for faster import
      sqlBackup += `ALTER TABLE "${tableName}" DISABLE TRIGGER ALL;\n\n`;

      // Generate INSERT statements
      for (const row of data) {
        const values = columns.map(col => escapeValue(row[col])).join(', ');
        sqlBackup += `INSERT INTO "${tableName}" (${columnList}) VALUES (${values});\n`;
      }

      sqlBackup += `\nALTER TABLE "${tableName}" ENABLE TRIGGER ALL;\n`;

      console.log(`   ✅ Backed up ${data.length} rows`);
      totalRows += data.length;
      backedUpTables++;

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      sqlBackup += `\n-- ERROR backing up ${tableName}: ${error.message}\n`;
    }
  }

  sqlBackup += `\n-- ============================================================================\n`;
  sqlBackup += `-- PART 3: POST-DATA (Constraints, Indexes, Policies)\n`;
  sqlBackup += `-- ============================================================================\n`;
  sqlBackup += `--\n`;
  sqlBackup += `-- All constraints, indexes, and RLS policies are defined in migrations\n`;
  sqlBackup += `-- They will be applied when you run the migration files\n`;
  sqlBackup += `--\n`;
  sqlBackup += `-- ============================================================================\n\n`;

  sqlBackup += `-- Re-enable Row Level Security\n`;
  sqlBackup += `SET row_security = on;\n\n`;

  sqlBackup += `-- Refresh table statistics\n`;
  for (const tableName of tables) {
    sqlBackup += `ANALYZE "${tableName}";\n`;
  }

  sqlBackup += `\n-- ============================================================================\n`;
  sqlBackup += `-- BACKUP SUMMARY\n`;
  sqlBackup += `-- ============================================================================\n`;
  sqlBackup += `-- Total tables found: ${tables.length}\n`;
  sqlBackup += `-- Tables backed up: ${backedUpTables}\n`;
  sqlBackup += `-- Total rows: ${totalRows}\n`;
  sqlBackup += `-- Timestamp: ${new Date().toISOString()}\n`;
  sqlBackup += `-- ============================================================================\n`;

  return sqlBackup;
}

async function main() {
  try {
    const backup = await createCompleteBackup();

    const filename = `complete-database-backup-${new Date().toISOString().split('T')[0]}.sql`;
    writeFileSync(filename, backup);

    const fileSizeMB = (backup.length / 1024 / 1024).toFixed(2);

    console.log('\n' + '='.repeat(80));
    console.log('✅ DATABASE BACKUP COMPLETE');
    console.log('='.repeat(80));
    console.log(`📁 File: ${filename}`);
    console.log(`💾 Size: ${fileSizeMB} MB`);
    console.log(`📊 Backup includes schema references and all accessible data`);
    console.log('\n📋 RESTORE PROCEDURE:');
    console.log('1. Create new Supabase project');
    console.log('2. Apply all migrations from supabase/migrations/');
    console.log(`3. Import data: psql -f ${filename}`);
    console.log('4. Verify: Check row counts in each table');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Backup failed:', error);
    throw error;
  }
}

main().catch(console.error);
