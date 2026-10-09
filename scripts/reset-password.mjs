// Nujna obnova dostopa (npr. pozabljeno geslo edinega skrbnika).
//
//   docker compose exec app node scripts/reset-password.mjs <uporabnik>
//   docker compose exec app node scripts/reset-password.mjs <uporabnik> --admin   (naredi skrbnika + odblokira)
//
// Izpiše novo začasno geslo, odjavi vse seje tega uporabnika.
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import pg from "pg";

const args = process.argv.slice(2);
const username = args.find((a) => !a.startsWith("--"))?.toLowerCase().trim();
const makeAdmin = args.includes("--admin");
if (!username) {
  console.error("Uporaba: node scripts/reset-password.mjs <uporabnik> [--admin]");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL ni nastavljen");
  process.exit(1);
}

const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const password = Array.from(crypto.randomBytes(14), (b) => alphabet[b % alphabet.length]).join("");
const hash = await bcrypt.hash(password, 12);

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const res = await client.query(
    `UPDATE users
        SET password_hash = $1,
            token_version = token_version + 1,
            disabled = false,
            is_admin = is_admin OR $3
      WHERE username = $2
      RETURNING username, is_admin`,
    [hash, username, makeAdmin]
  );
  if (res.rowCount === 0) {
    console.error(`❌ Uporabnik "${username}" ne obstaja.`);
    const all = await client.query("SELECT username, is_admin FROM users ORDER BY created_at");
    if (all.rowCount) console.error("Obstoječi uporabniki: " + all.rows.map((r) => r.username + (r.is_admin ? " (admin)" : "")).join(", "));
    process.exitCode = 1;
  } else {
    await client.query("UPDATE password_resets SET used_at = now() WHERE user_id = (SELECT id FROM users WHERE username = $1) AND used_at IS NULL", [username]);
    console.log(`✅ Geslo za "${username}"${res.rows[0].is_admin ? " (admin)" : ""} je nastavljeno na:\n\n    ${password}\n\nPo prijavi ga spremenite v meniju »Moj račun«.`);
  }
} finally {
  await client.end();
}
