import postgres from 'postgres';
import { readFileSync } from 'fs';

// Load .env file manually
const envFile = readFileSync('.env', 'utf-8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^['"]|['"]$/g, '');
    process.env[key] = value;
  }
});

console.log('🔍 Testing database connection...\n');

console.log('Environment variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '****' : 'NOT SET');
console.log('\n');

const sql = postgres(process.env.DATABASE_URL, {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 1,
  connect_timeout: 30,
  ssl: 'require',
  debug: (connection, query, parameters) => {
    console.log('🔍 Debug:', { connection, query: query?.substring(0, 100) });
  },
  onconnect: () => {
    console.log('✅ Connection callback triggered');
  },
  onclose: () => {
    console.log('⚠️  Connection closed');
  },
});

console.log('Attempting to connect and query...\n');

try {
  const startTime = Date.now();
  console.log('Starting query at:', new Date().toISOString());

  const result = await sql`SELECT NOW() as current_time, version() as pg_version`;

  const endTime = Date.now();
  console.log('Query completed at:', new Date().toISOString());
  console.log('Time taken:', endTime - startTime, 'ms\n');

  console.log('✅ SUCCESS! Database connection working!');
  console.log('Result:', result[0]);

  await sql.end();
  process.exit(0);
} catch (error) {
  console.error('❌ FAILED! Database connection error:');
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
  console.error('Error address:', error.address);
  console.error('Error port:', error.port);
  console.error('\nFull error:', error);

  console.log('\n📋 Troubleshooting steps:');
  console.log('1. Check if RDS instance is publicly accessible');
  console.log('2. Check RDS security group inbound rules allow port 5432 from your IP');
  console.log('3. Check if RDS is in a public subnet with internet gateway');
  console.log('4. Verify credentials are correct');
  console.log('5. Check if network ACLs allow the connection');

  await sql.end();
  process.exit(1);
}
