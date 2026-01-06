#!/usr/bin/env node

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
try {
  const envPath = join(__dirname, '.env');
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.error('⚠️  Could not load .env file:', error.message);
}

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║     PostgreSQL Database Connection Checker           ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

// Check environment variables
console.log('📋 Configuration Check:');
console.log('─────────────────────────────────────────────────────────');

const requiredVars = ['DATABASE_URL', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingVars = [];

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    missingVars.push(varName);
    console.log(`❌ ${varName}: NOT SET`);
  } else if (varName === 'DB_PASSWORD' || varName === 'DATABASE_URL') {
    const masked = varName === 'DB_PASSWORD'
      ? '****'
      : value.replace(/:[^:@]+@/, ':****@');
    console.log(`✅ ${varName}: ${masked}`);
  } else {
    console.log(`✅ ${varName}: ${value}`);
  }
});

if (missingVars.length > 0) {
  console.log('\n❌ Missing required environment variables:', missingVars.join(', '));
  console.log('Please check your .env file\n');
  process.exit(1);
}

console.log('\n🔌 Attempting database connection...');
console.log('─────────────────────────────────────────────────────────');

let sql;

try {
  // Create connection
  sql = postgres(process.env.DATABASE_URL, {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 2,
    idle_timeout: 10,
    connect_timeout: 30,
    ssl: 'require',
  });

  console.log('✅ Connection pool created');

  // Test 1: Basic connectivity
  console.log('\n📊 Test 1: Basic Connectivity');
  console.log('─────────────────────────────────────────────────────────');
  const startTime = Date.now();

  const [result] = await sql`
    SELECT
      NOW() as current_time,
      version() as pg_version,
      current_database() as database_name,
      current_user as current_user
  `;

  const duration = Date.now() - startTime;

  console.log('✅ Connection successful!');
  console.log(`⏱️  Query time: ${duration}ms`);
  console.log(`📅 Server time: ${result.current_time}`);
  console.log(`🗄️  Database: ${result.database_name}`);
  console.log(`👤 User: ${result.current_user}`);
  console.log(`🐘 PostgreSQL: ${result.pg_version.split(',')[0]}`);

  // Test 2: Connection pool status
  console.log('\n📊 Test 2: Connection Pool Status');
  console.log('─────────────────────────────────────────────────────────');
  console.log(`📦 Max connections: ${sql.options.max}`);
  console.log(`⏱️  Idle timeout: ${sql.options.idle_timeout}s`);
  console.log(`⏱️  Connect timeout: ${sql.options.connect_timeout}s`);

  // Test 3: List tables
  console.log('\n📊 Test 3: Database Schema');
  console.log('─────────────────────────────────────────────────────────');

  const tables = await sql`
    SELECT
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;

  console.log(`✅ Found ${tables.length} tables in public schema:\n`);

  tables.forEach(table => {
    console.log(`   📋 ${table.tablename.padEnd(35)} ${table.size}`);
  });

  // Test 4: Sample data check
  console.log('\n📊 Test 4: Sample Data Check');
  console.log('─────────────────────────────────────────────────────────');

  const counts = await sql`
    SELECT
      (SELECT COUNT(*) FROM profiles) as profiles_count,
      (SELECT COUNT(*) FROM simulations) as simulations_count,
      (SELECT COUNT(*) FROM scenarios) as scenarios_count,
      (SELECT COUNT(*) FROM video_library) as videos_count
  `;

  console.log(`👥 Profiles: ${counts[0].profiles_count}`);
  console.log(`🎮 Simulations: ${counts[0].simulations_count}`);
  console.log(`📝 Scenarios: ${counts[0].scenarios_count}`);
  console.log(`🎥 Videos: ${counts[0].videos_count}`);

  // Test 5: Connection reliability
  console.log('\n📊 Test 5: Connection Reliability (3 rapid queries)');
  console.log('─────────────────────────────────────────────────────────');

  for (let i = 1; i <= 3; i++) {
    const start = Date.now();
    await sql`SELECT 1 as test`;
    const time = Date.now() - start;
    console.log(`✅ Query ${i}: ${time}ms`);
  }

  // Summary
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║                  ✅ ALL TESTS PASSED                  ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('\n🎉 Database connection is working perfectly!\n');

  await sql.end();
  process.exit(0);

} catch (error) {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║                  ❌ CONNECTION FAILED                 ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  console.error('💥 Error Details:');
  console.error('─────────────────────────────────────────────────────────');
  console.error(`Code: ${error.code || 'N/A'}`);
  console.error(`Message: ${error.message}`);

  if (error.address) console.error(`Address: ${error.address}`);
  if (error.port) console.error(`Port: ${error.port}`);
  if (error.syscall) console.error(`System call: ${error.syscall}`);

  console.log('\n🔧 Troubleshooting Steps:');
  console.log('─────────────────────────────────────────────────────────');

  if (error.code === 'ENOTFOUND') {
    console.log('❌ Cannot resolve hostname');
    console.log('   → Check DB_HOST is correct');
    console.log('   → Check DNS resolution');
    console.log('   → Verify internet connectivity');
  } else if (error.code === 'ECONNREFUSED') {
    console.log('❌ Connection refused');
    console.log('   → Database server may be down');
    console.log('   → Check DB_PORT is correct (should be 5432)');
    console.log('   → Verify firewall settings');
  } else if (error.code === 'ETIMEDOUT') {
    console.log('❌ Connection timeout');
    console.log('   → Check security group rules');
    console.log('   → Verify RDS is publicly accessible');
    console.log('   → Check network ACLs');
  } else if (error.message?.includes('password')) {
    console.log('❌ Authentication failed');
    console.log('   → Check DB_USER is correct');
    console.log('   → Check DB_PASSWORD is correct');
    console.log('   → Verify user has access permissions');
  } else if (error.message?.includes('SSL')) {
    console.log('❌ SSL connection issue');
    console.log('   → Database may not support SSL');
    console.log('   → Try setting ssl: false in connection options');
  } else {
    console.log('❌ Unexpected error occurred');
    console.log('   → Check all environment variables');
    console.log('   → Verify database is running');
    console.log('   → Check network connectivity');
  }

  console.log('\n📋 General Checklist:');
  console.log('─────────────────────────────────────────────────────────');
  console.log('  1. ✓ Check .env file exists and is properly formatted');
  console.log('  2. ✓ Verify all DATABASE_URL components are correct');
  console.log('  3. ✓ Ensure RDS security group allows inbound port 5432');
  console.log('  4. ✓ Confirm RDS instance is publicly accessible');
  console.log('  5. ✓ Check RDS is in correct VPC and subnet');
  console.log('  6. ✓ Verify your IP is whitelisted in security group');
  console.log('  7. ✓ Test using psql command line client\n');

  if (sql) {
    await sql.end();
  }
  process.exit(1);
}
