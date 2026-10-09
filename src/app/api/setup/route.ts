import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSessionResponse, hashPassword } from "@/lib/auth";
import { fail, readJson } from "@/lib/http";
import { emailEnabled } from "@/lib/mail";
import * as v from "@/lib/validate";

export const dynamic = "force-dynamic";

/** Ali aplikacija še čaka na prvega (admin) računa. */
export async function GET() {
  try {
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
    return NextResponse.json({ needsSetup: count === 0, emailEnabled: emailEnabled() });
  } catch (e) {
    console.error("Setup check error:", e);
    return fail("Baza ni dosegljiva", 503);
  }
}

/** Ustvari prvega uporabnika (administratorja). Po tem je pot trajno zaprta. */
export async function POST(request: NextRequest) {
  const body = await readJson(request);
  if (!body) return fail("Neveljavna zahteva");

  const u = v.username(body.username);
  const d = v.displayName(body.displayName);
  const p = v.password(body.password);
  const em = v.email(body.email);
  const err = u.error || d.error || em.error || p.error;
  if (err) return fail(err);

  const passwordHash = await hashPassword(p.value!);

  try {
    const created = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(727273)`);
      const [{ count }] = await tx.select({ count: sql<number>`count(*)::int` }).from(users);
      if (count > 0) return null;
      const [row] = await tx
        .insert(users)
        .values({ username: u.value!, displayName: d.value!, email: em.value, passwordHash, isAdmin: true })
        .returning();
      return row;
    });
    if (!created) return fail("Aplikacija je že nastavljena. Prijavite se.", 403);
    return createSessionResponse(request, created, 201);
  } catch (e) {
    console.error("Setup error:", e);
    return fail("Napaka pri ustvarjanju računa", 500);
  }
}
