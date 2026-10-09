import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isResponse, requireAdmin } from "@/lib/auth";
import { fail, isUuid, pgConstraint, readJson } from "@/lib/http";
import * as v from "@/lib/validate";

type Ctx = { params: Promise<{ id: string }> };

/** Urejanje uporabnika: ime, e-naslov, vloga skrbnika, onemogočen račun. */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  const { id } = await params;
  if (!isUuid(id)) return fail("Uporabnik ni najden", 404);

  const body = await readJson(request);
  if (!body) return fail("Neveljavna zahteva");

  const set: Partial<typeof users.$inferInsert> = {};
  let invalidateSessions = false;

  if ("displayName" in body) {
    const d = v.displayName(body.displayName);
    if (d.error) return fail(d.error);
    set.displayName = d.value;
  }
  if ("email" in body) {
    const e = v.email(body.email);
    if (e.error) return fail(e.error);
    set.email = e.value;
  }
  if ("isAdmin" in body) {
    if (typeof body.isAdmin !== "boolean") return fail("Neveljavna vloga");
    if (id === admin.userId && !body.isAdmin) return fail("Sebi ne morete odvzeti pravic skrbnika");
    set.isAdmin = body.isAdmin;
    invalidateSessions = true;
  }
  if ("disabled" in body) {
    if (typeof body.disabled !== "boolean") return fail("Neveljavna vrednost");
    if (id === admin.userId && body.disabled) return fail("Sebe ne morete onemogočiti");
    set.disabled = body.disabled;
    invalidateSessions = true;
  }
  if (Object.keys(set).length === 0) return fail("Ni sprememb");
  if (invalidateSessions) set.tokenVersion = sql`${users.tokenVersion} + 1` as unknown as number;

  try {
    const [row] = await db
      .update(users)
      .set(set)
      .where(eq(users.id, id))
      .returning({ id: users.id, username: users.username, displayName: users.displayName, email: users.email, isAdmin: users.isAdmin, disabled: users.disabled });
    if (!row) return fail("Uporabnik ni najden", 404);
    return NextResponse.json({ user: row });
  } catch (e) {
    if (pgConstraint(e).includes("email")) return fail("Ta e-naslov že uporablja drug račun", 409);
    console.error("Update user error:", e);
    return fail("Napaka pri shranjevanju", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  const { id } = await params;
  if (!isUuid(id)) return fail("Uporabnik ni najden", 404);
  if (id === admin.userId) return fail("Sebe ne morete izbrisati");

  const [row] = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
  if (!row) return fail("Uporabnik ni najden", 404);
  return NextResponse.json({ success: true });
}
