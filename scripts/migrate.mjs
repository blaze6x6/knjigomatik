// Zažene SQL migracije iz mape ./migrations (po abecednem redu).
// Uporaba: node scripts/migrate.mjs
// Varno za večkratni zagon; uporablja advisory lock, da se več replik ne tepe.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = process.env.MIGRATIONS_DIR || path.join(here, "..", "migrations");
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL ni nastavljen");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connect() {
  for (let i = 1; i <= 30; i++) {
    const client = new pg.Client({ connectionString: url });
    try {
      await client.connect();
      return client;
    } catch (e) {
      console.log(`⏳ Čakam na bazo (${i}/30): ${e.code || e.message}`);
      await client.end().catch(() => {});
      await sleep(2000);
    }
  }
  throw new Error("Baza ni dosegljiva po 60 s");
}

const client = await connect();
try {
  await client.query("SELECT pg_advisory_lock(727274)");
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY,
    applied_at timestamp NOT NULL DEFAULT now()
  )`);
  const done = new Set((await client.query("SELECT name FROM schema_migrations")).rows.map((r) => r.name));
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

  let applied = 0;
  for (const file of files) {
    if (done.has(file)) continue;
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    console.log(`🔄 Migracija ${file}`);
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      applied++;
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      console.error(`❌ Migracija ${file} ni uspela: ${e.message}`);
      process.exitCode = 1;
      break;
    }
  }
  if (!process.exitCode) console.log(applied ? `✅ Uporabljenih migracij: ${applied}` : "✅ Shema je posodobljena");
} finally {
  await client.query("SELECT pg_advisory_unlock(727274)").catch(() => {});
  await client.end();
}
