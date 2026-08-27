import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { db } from "./client";

async function main() {
  const directory = path.join(process.cwd(), "server/db/migrations");
  const files = (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort();
  for (const file of files) {
    const migration = await readFile(path.join(directory, file), "utf8");
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await client.query("CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
      const applied = await client.query<{ name: string }>("SELECT name FROM schema_migrations WHERE name=$1", [file]);
      if (applied.rowCount === 0) {
        await client.query(migration);
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
        console.log(`Applied ${file}`);
      } else {
        console.log(`Skipped ${file} (already applied)`);
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  await db.end();
}

void main().catch(() => {
  console.error("Migration failed");
  process.exitCode = 1;
});
