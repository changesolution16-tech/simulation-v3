import postgres from 'postgres';

let sql: ReturnType<typeof postgres>;

if (process.env.DATABASE_URL) {
  sql = postgres(process.env.DATABASE_URL, {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  });
} else {
  sql = null as any;
  if (typeof window === 'undefined') {
    console.warn('⚠️  DATABASE_URL not set - database operations will fail');
  }
}

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
