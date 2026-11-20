import { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export type Db = NodePgDatabase<typeof schema>;

declare global {
  var __chaskaPool: Pool | undefined;
  var __chaskaDb: Db | undefined;
}

function pool(): Pool {
  if (!global.__chaskaPool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    global.__chaskaPool = new Pool({
      connectionString: url,
      // Neon's pooled endpoint terminates TLS; verify the chain against system roots.
      ssl: { rejectUnauthorized: true },
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 15_000,
    });
  }
  return global.__chaskaPool;
}

function database(): Db {
  if (!global.__chaskaDb) global.__chaskaDb = drizzle(pool(), { schema });
  return global.__chaskaDb;
}

/**
 * Lazy so that merely importing a route module never touches DATABASE_URL. Next's
 * "collecting page data" step imports every handler at build time, and a build on a
 * host that injects env vars per-invocation would otherwise fail before it deploys.
 */
export const db = new Proxy({} as Db, {
  get(_target, property) {
    return Reflect.get(database(), property, database());
  },
});
