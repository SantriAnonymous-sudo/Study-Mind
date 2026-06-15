import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import * as schema from './schema.ts';

const { Pool } = pkg;

const parseConnectionString = (url: string) => {
  try {
    const reg = /postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:/]+)(?::(\d+))?\/([^?#]+)/;
    const match = url.trim().match(reg);
    if (match) {
      return {
        user: match[1],
        password: match[2],
        host: match[3],
        port: match[4] ? parseInt(match[4], 10) : 5432,
        database: match[5],
      };
    }
  } catch (e) {
    console.error('Failed to parse database connection string:', e);
  }
  return null;
};

export const createPool = () => {
  const connectionUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || '';
  const parsed = connectionUrl ? parseConnectionString(connectionUrl) : null;

  const host = process.env.SQL_HOST || process.env.POSTGRES_HOST || parsed?.host || '';
  const user = process.env.SQL_USER || process.env.POSTGRES_USER || parsed?.user || '';
  const password = process.env.SQL_PASSWORD || process.env.POSTGRES_PASSWORD || parsed?.password || '';
  const database = process.env.SQL_DB_NAME || process.env.POSTGRES_DATABASE || parsed?.database || '';
  const port = process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : (parsed?.port || 5432);

  // Cloud databases (Neon, Supabase, Render, Aiven) strictly require SSL in production environments.
  const isCloudDb = typeof host === 'string' && (
    host.includes('neon.tech') ||
    host.includes('supabase') ||
    host.includes('aiven') ||
    host.includes('render.com') ||
    process.env.SQL_SSL === 'true' ||
    process.env.VERCEL === '1' ||
    connectionUrl.includes('sslmode=')
  );

  if (!host) {
    console.warn(
      '⚠️ [PostgreSQL Pool Warning] No database credentials discovered. ' +
      'Please check your Vercel or environment settings (SQL_HOST, SQL_USER, SQL_PASSWORD, SQL_DB_NAME).'
    );
  }

  return new Pool({
    host,
    user,
    password,
    database,
    port,
    connectionTimeoutMillis: 5000, // Fail fast (5 seconds) instead of hanging indefinitely
    idleTimeoutMillis: 30000,
    ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
  });
};

const pool = createPool();

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

export const db = drizzle(pool, { schema });

