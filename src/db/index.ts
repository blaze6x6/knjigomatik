import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __knjigomatikPool: Pool | undefined;
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL ni nastavljen");
}

// Pool se do prve poizvedbe ne poveže, zato je build brez baze mogoč.
export const pool: Pool =
  globalThis.__knjigomatikPool ??
  (globalThis.__knjigomatikPool = new Pool({ connectionString: databaseUrl, max: 10 }));

export const db = drizzle({ client: pool });
