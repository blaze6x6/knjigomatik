import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { passwordResets, users } from "@/db/schema";
import { createSessionResponse, hashPassword } from "@/lib/auth";
import { clientIp, fail, readJson } from "@/lib/http";
import { emailEnabled, sendPasswordChangedEmail } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";
import { hashResetToken } from "@/lib/reset-token";
import * as v from "@/lib/validate";

export const dynamic = "force-dynamic";

function limited(request: NextRequest) {
  const rl = rateLimit(`reset:${clientIp(request)}`, 30, 15 * 60 * 1000);
  return rl.ok ? null : fail("Preveč poskusov. Poskusite pozneje.", 429, { "Retry-After": String(rl.retryAfter) });
}

/** Preveri, ali je povezava za ponastavitev še veljavna. */
export async function GET(request: NextRequest) {
  const blocked = limited(request);
  if (blocked) return blocked;
  const token = request.nextUrl.searchParams.get("token") || "";
  if (!token || token.length > 200) return fail("Povezava ni veljavna", 400);

  const [row] = await db
    .select({ username: users.username, displayName: users.displayName })
    .from(passwordResets)
    .innerJoin(users, eq(users.id, passwordResets.userId))
    .where(
      and(
        eq(passwordResets.tokenHash, hashResetToken(token)),
        isNull(passwordResets.usedAt),
        gt(passwordResets.expiresAt, new Date()),
        eq(users.disabled, false)
      )
    );
  if (!row) return fail("Povezava je potekla ali je že bila uporabljena. Prosite skrbnika za novo.", 410);
  return NextResponse.json(row);
}

/** Nastavi novo geslo z enkratnim žetonom in uporabnika prijavi. */
export async function POST(request: NextRequest) {
  const blocked = limited(request);
  if (blocked) return blocked;
  const body = await readJson(request);
  if (!body || typeof body.token !== "string" || !body.token || body.token.length > 200) return fail("Povezava ni veljavna");
  const p = v.password(body.password);
  if (p.error) return fail(p.error);

  const passwordHash = await hashPassword(p.value!);
  const tokenHash = hashResetToken(body.token);

  try {
    const user = await db.transaction(async (tx) => {
      // atomarno "porabi" žeton: drugi hkratni zahtevek ne dobi nobene vrstice
      const [used] = await tx
        .update(passwordResets)
        .set({ usedAt: new Date() })
        .where(and(eq(passwordResets.tokenHash, tokenHash), isNull(passwordResets.usedAt), gt(passwordResets.expiresAt, new Date())))
        .returning({ userId: passwordResets.userId });
      if (!used) return null;

      const [u] = await tx
        .update(users)
        .set({ passwordHash, tokenVersion: sql`${users.tokenVersion} + 1` })
        .where(and(eq(users.id, used.userId), eq(users.disabled, false)))
        .returning();
      if (!u) return null;

      await tx
        .update(passwordResets)
        .set({ usedAt: new Date() })
        .where(and(eq(passwordResets.userId, u.id), isNull(passwordResets.usedAt)));
      await tx.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, u.id));
      return u;
    });
    if (!user) return fail("Povezava je potekla ali je že bila uporabljena.", 410);
    if (user.email && emailEnabled()) {
      sendPasswordChangedEmail({ to: user.email, name: user.displayName }).catch((e) => console.error("Notice email error:", e));
    }
    return createSessionResponse(request, user);
  } catch (e) {
    console.error("Reset error:", e);
    return fail("Napaka pri ponastavitvi gesla", 500);
  }
}
