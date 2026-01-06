import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

console.log('🔍 Checking active database connections...\n');

// Read the RDS CA certificate
const caPath = join(__dirname, 'src', 'lib', 'global-bundle.pem');
const caCert = readFileSync(caPath, 'utf-8');

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  connect_timeout: 30,
  ssl: {
    ca: caCert,
    rejectUnauthorized: true
  },
});

try {
  const connections = await sql`
    SELECT
      pid,
      usename,
      application_name,
      client_addr,
      backend_start,
      state,
      query
    FROM pg_stat_activity
    WHERE datname = ${process.env.DB_NAME}
    ORDER BY backend_start DESC
  `;

  console.log(`Found ${connections.length} active connections:\n`);

  connections.forEach((conn, i) => {
    console.log(`Connection ${i + 1}:`);
    console.log(`  PID: ${conn.pid}`);
    console.log(`  User: ${conn.usename}`);
    console.log(`  App: ${conn.application_name || 'N/A'}`);
    console.log(`  Client: ${conn.client_addr || 'local'}`);
    console.log(`  Started: ${conn.backend_start}`);
    console.log(`  State: ${conn.state}`);
    console.log(`  Query: ${conn.query?.substring(0, 100) || 'idle'}\n`);
  });

  const appConnections = connections.filter(c =>
    c.application_name === 'soft-skills-training'
  );

  console.log(`\n📊 Summary:`);
  console.log(`Total connections: ${connections.length}`);
  console.log(`App connections: ${appConnections.length}`);
  console.log(`Other connections: ${connections.length - appConnections.length}`);

  await sql.end();
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error);
  await sql.end();
  process.exit(1);
}
