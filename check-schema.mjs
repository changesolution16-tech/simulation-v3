import postgres from 'postgres';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config();

const caPath = join(process.cwd(), 'src', 'lib', 'rds-us-east-1-ca.pem');
const caCert = readFileSync(caPath, 'utf-8');

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  ssl: {
    ca: caCert,
    rejectUnauthorized: true
  }
});

async function checkSchema() {
  try {
    console.log('Checking auth.users table structure...\n');

    const authUsersColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'auth' AND table_name = 'users'
      ORDER BY ordinal_position
    `;

    console.log('auth.users columns:');
    console.table(authUsersColumns);

    console.log('\n\nChecking profiles table structure...\n');

    const profilesColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles'
      ORDER BY ordinal_position
    `;

    console.log('profiles columns:');
    console.table(profilesColumns);

    console.log('\n\nChecking if auth schema exists...\n');

    const schemas = await sql`
      SELECT schema_name FROM information_schema.schemata
      WHERE schema_name IN ('auth', 'public')
    `;

    console.log('Available schemas:');
    console.table(schemas);

    console.log('\n\nChecking all tables...\n');

    const tables = await sql`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema IN ('auth', 'public')
      ORDER BY table_schema, table_name
    `;

    console.log('All tables:');
    console.table(tables);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

checkSchema();
