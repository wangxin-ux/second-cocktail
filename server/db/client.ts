import { Pool, type PoolClient, type QueryResultRow } from "pg";

const connectionString = process.env.DATABASE_URL;
const useDatabaseSsl = process.env.DATABASE_SSL === "true";

if (!connectionString && process.env.NODE_ENV !== "test") {
  console.warn("DATABASE_URL is not configured. Realtime match services cannot start.");
}

export const db = new Pool({
  connectionString,
  max: 10,
  ssl: useDatabaseSsl ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" } : undefined,
});

export async function withTransaction<T>(work: (client: PoolClient) => Promise<T>) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function queryOne<T extends QueryResultRow>(
  text: string,
  values: readonly unknown[] = [],
) {
  const result = await db.query<T>(text, [...values]);
  return result.rows[0] ?? null;
}
