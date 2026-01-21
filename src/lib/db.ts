import postgres from 'postgres';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

declare global {
  var __db: ReturnType<typeof postgres> | undefined;
}

let sql: ReturnType<typeof postgres>;

function getConnection(): ReturnType<typeof postgres> {
  if (global.__db) {
    return global.__db;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  console.log('Creating database connection pool (process id:', process.pid, ')');

  let sslConfig: any = 'require';

  const caPath = join(process.cwd(), 'src', 'lib', 'rds-us-east-1-ca.pem');
  if (existsSync(caPath)) {
    try {
      const caCert = readFileSync(caPath, 'utf-8');
      sslConfig = {
        ca: caCert,
        rejectUnauthorized: true
      };
    } catch (e) {
      console.warn('Could not read CA certificate, using default SSL');
    }
  }

  global.__db = postgres(process.env.DATABASE_URL, {
    max: 3,
    idle_timeout: 10,
    max_lifetime: 60 * 30,
    connect_timeout: 30,
    ssl: sslConfig,
    onnotice: () => {},
    connection: {
      application_name: 'soft-skills-training'
    },
    transform: {
      undefined: null,
    },
  });

  console.log('Database connection pool created');
  return global.__db;
}

sql = getConnection();

export default sql;

export async function healthCheck(): Promise<boolean> {
  if (!sql) {
    console.error('Database not configured');
    return false;
  }

  try {
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
