import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

function isValidPostgresUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return trimmed.startsWith('postgres://') || trimmed.startsWith('postgresql://');
}

const hasValidPostgresUrl = isValidPostgresUrl(process.env.DATABASE_URL);
const hasHostConfig = Boolean(
  process.env.SQL_HOST && process.env.SQL_USER && process.env.SQL_PASSWORD && process.env.SQL_DB_NAME
);

export const databaseConfigured = hasValidPostgresUrl || hasHostConfig;

let dbInstance: any = null;
let activePool: Pool | null = null;

if (databaseConfigured) {
  try {
    const pool = new Pool({
      ...(hasValidPostgresUrl
        ? { connectionString: process.env.DATABASE_URL!.trim() }
        : {
            host: process.env.SQL_HOST,
            user: process.env.SQL_USER,
            password: process.env.SQL_PASSWORD,
            database: process.env.SQL_DB_NAME,
            port: Number(process.env.SQL_PORT || 5432),
          }),
      max: 5,
      connectionTimeoutMillis: 3000,
      query_timeout: 5000,
    });
    pool.on('error', (error) => {
      console.warn('[PostgreSQL connection error]', {
        code: (error as Error & { code?: string }).code,
        message: error.message,
      });
      disablePostgres(error);
    });
    activePool = pool;
    dbInstance = drizzle(pool, { schema });
  } catch (err) {
    console.warn('[AI Studio] PostgreSQL initialization failed — using mock store', err);
    dbInstance = null;
  }
} else {
  console.log('[AI Studio] PostgreSQL not configured or URL is non-postgres — using in-memory store for orders and dashboard');
}

export let db = dbInstance;

export function disablePostgres(reason?: any) {
  if (dbInstance) {
    console.warn('[PostgreSQL disabled — falling back to in-memory store]:', reason?.message || reason);
    dbInstance = null;
    db = null;
    if (activePool) {
      activePool.end().catch(() => {});
      activePool = null;
    }
  }
}


