import { NextRequest, NextResponse } from "next/server";
import { isResponse, requireAdmin } from "@/lib/auth";
import { fail, readJson } from "@/lib/http";
import { getMailConfig, mailProblem, sendTestEmail } from "@/lib/mail";
import * as v from "@/lib/validate";

export const dynamic = "force-dynamic";

/** Stanje SMTP nastavitev (brez gesla). */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  const cfg = getMailConfig();
  return NextResponse.json({
    enabled: !!cfg,
    problem: mailProblem(),
    host: cfg?.host ?? null,
    port: cfg?.port ?? null,
    secure: cfg?.secure ?? null,
    from: cfg?.from ?? null,
    appUrl: cfg?.appUrl ?? null,
    tlsVerify: cfg?.rejectUnauthorized ?? null,
  });
}

/** Pošlje testno sporočilo, da skrbnik preveri nastavitve. */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (isResponse(admin)) return admin;
  const body = await readJson(request);
  const e = v.email(body?.to);
  if (e.error || !e.value) return fail("Vnesite veljaven e-naslov");
  if (!getMailConfig()) return fail(mailProblem() || "E-pošta ni nastavljena", 409);
  try {
    await sendTestEmail(e.value);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Test email error:", err);
    // sporočilo napake SMTP je koristno za odpravljanje težav; vidi ga samo skrbnik
    return fail(`Pošiljanje ni uspelo: ${(err as Error).message || "neznana napaka"}`, 502);
  }
}
