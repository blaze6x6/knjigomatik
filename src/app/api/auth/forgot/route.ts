import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { passwordResets, users } from "@/db/schema";
import { clientIp, fail, readJson } from "@/lib/http";
import { emailEnabled, sendResetEmail } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";
import { SELF_RESET_TTL_MS, hashResetToken, newResetToken } from "@/lib/reset-token";

const HOUR = 60 * 60 * 1000;

async function process_(identifier: string) {
  try {
    const [user] = await db
      .select({ id: users.id, username: users.username, displayName: users.displayName, email: users.email })
      .from(users)
      .where(and(eq(users.disabled, false), sql`(lower(${users.email}) = ${identifier} OR ${users.username} = ${identifier})`));
    if (!user?.email) return;

    const token = newResetToken();
    await db.transaction(async (tx) => {
      await tx.update(passwordResets).set({ usedAt: new Date() }).where(and(eq(passwordResets.userId, user.id), isNull(passwordResets.usedAt)));
      await tx.insert(passwordResets).values({ userId: user.id, tokenHash: hashResetToken(token), expiresAt: new Date(Date.now() + SELF_RESET_TTL_MS) });
    });
    await sendResetEmail({ to: user.email, name: user.displayName, username: user.username, token, hours: SELF_RESET_TTL_MS / HOUR, kind: "reset" });
  } catch (e) {
    console.error("Forgot-password error:", e);
  }
}

/**
 * "Pozabljeno geslo": uporabnik vpiše e-naslov ali uporabniško ime.
 * Odgovor je vedno enak (ne razkrije, ali račun obstaja); delo se opravi v ozadju.
 */
export async function POST(request: NextRequest) {
  if (!emailEnabled()) return fail("Pošiljanje e-pošte ni nastavljeno. Obrnite se na skrbnika.", 503);

  const body = await readJson(request);
  const identifier = typeof body?.identifier === "string" ? body.identifier.trim().toLowerCase().slice(0, 254) : "";
  if (!identifier) return fail("Vnesite e-naslov ali uporabniško ime");

  const a = rateLimit(`forgot:ip:${clientIp(request)}`, 10, 15 * 60 * 1000);
  const b = rateLimit(`forgot:id:${identifier}`, 3, HOUR);
  if (!a.ok || !b.ok) {
    const retry = Math.max(a.retryAfter, b.retryAfter);
    return fail("Preveč zahtev. Poskusite znova čez nekaj časa.", 429, { "Retry-After": String(retry) });
  }

  void process_(identifier);
  return NextResponse.json({ ok: true });
}
