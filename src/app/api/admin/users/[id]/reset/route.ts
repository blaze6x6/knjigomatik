import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { passwordResets, users } from "@/db/schema";
import { isResponse, requireAdmin } from "@/lib/auth";
import { fail, isUuid, readJson } from "@/lib/http";
import { emailEnabled, sendResetEmail } from "@/lib/mail";
import { RESET_TTL_MS, hashResetToken, newResetToken } from "@/lib/reset-token";

/**
 * Ustvari enkratno povezavo za ponastavitev gesla.
 * Vedno vrne žeton (skrbnik ga lahko pošlje sam); z {"send": true} jo dodatno pošlje
 * na e-naslov uporabnika. Prejšnje neuporabljene povezave tega uporabnika prenehajo veljati.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  const { id } = await params;
  if (!isUuid(id)) return fail("Uporabnik ni najden", 404);
  const body = (await readJson(request)) ?? {};

  const [target] = await db
    .select({ id: users.id, username: users.username, displayName: users.displayName, email: users.email, disabled: users.disabled })
    .from(users)
    .where(eq(users.id, id));
  if (!target) return fail("Uporabnik ni najden", 404);
  if (target.disabled) return fail("Račun je onemogočen. Najprej ga omogočite.", 409);
  const send = body.send === true;
  if (send && !target.email) return fail("Uporabnik nima e-naslova");
  if (send && !emailEnabled()) return fail("Pošiljanje e-pošte ni nastavljeno (SMTP_* in APP_URL)");

  const token = newResetToken();
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);
  await db.transaction(async (tx) => {
    await tx.update(passwordResets).set({ usedAt: new Date() }).where(and(eq(passwordResets.userId, id), isNull(passwordResets.usedAt)));
    await tx.insert(passwordResets).values({ userId: id, tokenHash: hashResetToken(token), expiresAt, createdBy: admin.userId });
  });

  let emailSent: boolean | undefined;
  let emailError: string | undefined;
  if (send) {
    try {
      await sendResetEmail({ to: target.email!, name: target.displayName, username: target.username, token, hours: RESET_TTL_MS / 3600000, kind: "reset" });
      emailSent = true;
    } catch (e) {
      console.error("Reset email error:", e);
      emailSent = false;
      emailError = (e as Error).message;
    }
  }
  return NextResponse.json({ token, expiresAt, expiresInHours: RESET_TTL_MS / 3600000, emailSent, emailError });
}
