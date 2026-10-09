import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { passwordResets, users } from "@/db/schema";
import { hashPassword, isResponse, requireAdmin } from "@/lib/auth";
import { fail, pgCode, pgConstraint, readJson } from "@/lib/http";
import { emailEnabled, sendResetEmail } from "@/lib/mail";
import { RESET_TTL_MS, hashResetToken, newResetToken } from "@/lib/reset-token";
import * as v from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;

  const list = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      email: users.email,
      isAdmin: users.isAdmin,
      disabled: users.disabled,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      bookCount: sql<number>`(SELECT count(*)::int FROM books WHERE books.user_id = ${users.id})`,
    })
    .from(users)
    .orderBy(users.createdAt);
  return NextResponse.json({ users: list });
}

/**
 * Ustvari uporabnika. Če geslo ni podano, se ustvari povabilo:
 * odgovor vsebuje žeton, iz katerega skrbnik sestavi povezavo za nastavitev gesla.
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;

  const body = await readJson(request);
  if (!body) return fail("Neveljavna zahteva");
  const u = v.username(body.username);
  const d = v.displayName(body.displayName);
  const em = v.email(body.email);
  const invite = body.password === undefined || body.password === null || body.password === "";
  const p: { value?: string; error?: string } = invite ? { value: crypto.randomBytes(24).toString("base64url") } : v.password(body.password);
  const err = u.error || d.error || em.error || p.error;
  const wantMail = body.sendEmail === true && !!em.value && invite;
  if (wantMail && !emailEnabled()) return fail("Pošiljanje e-pošte ni nastavljeno (SMTP_* in APP_URL)");
  if (err) return fail(err);

  try {
    const result = await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          username: u.value!,
          displayName: d.value!,
          email: em.value,
          passwordHash: await hashPassword(p.value!),
          isAdmin: body.isAdmin === true,
        })
        .returning({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          email: users.email,
          isAdmin: users.isAdmin,
          disabled: users.disabled,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
        });
      let token: string | undefined;
      if (invite) {
        const t = newResetToken();
        token = t;
        await tx.insert(passwordResets).values({
          userId: user.id,
          tokenHash: hashResetToken(t),
          expiresAt: new Date(Date.now() + RESET_TTL_MS),
          createdBy: admin.userId,
        });
      }
      return { user: { ...user, bookCount: 0 }, token };
    });
    let emailSent: boolean | undefined;
    let emailError: string | undefined;
    if (wantMail && result.token) {
      try {
        await sendResetEmail({ to: em.value!, name: result.user.displayName, username: result.user.username, token: result.token, hours: RESET_TTL_MS / 3600000, kind: "invite" });
        emailSent = true;
      } catch (e) {
        console.error("Invite email error:", e);
        emailSent = false;
        emailError = (e as Error).message;
      }
    }
    return NextResponse.json(
      { user: result.user, resetToken: result.token, expiresInHours: result.token ? RESET_TTL_MS / 3600000 : undefined, emailSent, emailError },
      { status: 201 }
    );
  } catch (e) {
    if (pgCode(e) === "23505") return fail(pgConstraint(e).includes("email") ? "Ta e-naslov že uporablja drug račun" : "Uporabniško ime je že zasedeno", 409);
    console.error("Create user error:", e);
    return fail("Napaka pri dodajanju uporabnika", 500);
  }
}
