import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession, isResponse, requireUser, verifyPassword } from "@/lib/auth";
import { fail, pgConstraint, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import * as v from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user: session });
}

/**
 * Sprememba lastnih podatkov: ime in/ali e-naslov.
 * Za spremembo e-naslova je potrebno trenutno geslo (e-naslov omogoča ponastavitev gesla).
 */
export async function PATCH(request: NextRequest) {
  const session = await requireUser(request);
  if (isResponse(session)) return session;
  const body = await readJson(request);
  if (!body) return fail("Neveljavna zahteva");

  const set: Partial<typeof users.$inferInsert> = {};

  if ("displayName" in body) {
    const d = v.displayName(body.displayName);
    if (d.error) return fail(d.error);
    set.displayName = d.value;
  }

  if ("email" in body) {
    const e = v.email(body.email);
    if (e.error) return fail(e.error);
    if (e.value !== session.email) {
      const rl = rateLimit(`pwchange:${session.userId}`, 10, 15 * 60 * 1000);
      if (!rl.ok) return fail("Preveč poskusov. Poskusite pozneje.", 429, { "Retry-After": String(rl.retryAfter) });
      if (typeof body.currentPassword !== "string" || !body.currentPassword) return fail("Za spremembo e-naslova vnesite trenutno geslo");
      const [row] = await db.select({ hash: users.passwordHash }).from(users).where(eq(users.id, session.userId));
      if (!row || !(await verifyPassword(body.currentPassword, row.hash))) return fail("Trenutno geslo ni pravilno", 403);
      set.email = e.value;
    }
  }

  if (Object.keys(set).length === 0) return NextResponse.json({ user: session });

  try {
    const [row] = await db
      .update(users)
      .set(set)
      .where(eq(users.id, session.userId))
      .returning({ displayName: users.displayName, email: users.email });
    return NextResponse.json({ user: { ...session, ...row } });
  } catch (e) {
    if (pgConstraint(e).includes("email")) return fail("Ta e-naslov že uporablja drug račun", 409);
    console.error("Update profile error:", e);
    return fail("Napaka pri shranjevanju", 500);
  }
}
