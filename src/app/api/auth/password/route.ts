import { NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSessionResponse, hashPassword, isResponse, requireUser, verifyPassword } from "@/lib/auth";
import { fail, readJson } from "@/lib/http";
import { emailEnabled, sendPasswordChangedEmail } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";
import * as v from "@/lib/validate";

/** Sprememba lastnega gesla. Odjavi vse druge seje, trenutna ostane. */
export async function POST(request: NextRequest) {
  const session = await requireUser(request);
  if (isResponse(session)) return session;

  const rl = rateLimit(`pwchange:${session.userId}`, 10, 15 * 60 * 1000);
  if (!rl.ok) return fail("Preveč poskusov. Poskusite pozneje.", 429, { "Retry-After": String(rl.retryAfter) });

  const body = await readJson(request);
  if (!body || typeof body.current !== "string") return fail("Vnesite trenutno geslo");
  const p = v.password(body.password);
  if (p.error) return fail(p.error);

  const [user] = await db.select().from(users).where(eq(users.id, session.userId));
  if (!user || !(await verifyPassword(body.current, user.passwordHash))) {
    return fail("Trenutno geslo ni pravilno", 403);
  }

  const [updated] = await db
    .update(users)
    .set({ passwordHash: await hashPassword(p.value!), tokenVersion: sql`${users.tokenVersion} + 1` })
    .where(eq(users.id, user.id))
    .returning();
  if (updated.email && emailEnabled()) {
    sendPasswordChangedEmail({ to: updated.email, name: updated.displayName }).catch((e) => console.error("Notice email error:", e));
  }
  return createSessionResponse(request, updated);
}
