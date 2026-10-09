import { NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSessionResponse, fakeVerify, verifyPassword } from "@/lib/auth";
import { clientIp, fail, readJson } from "@/lib/http";
import { rateLimit, rateLimitClear } from "@/lib/rate-limit";

const WINDOW = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  const body = await readJson(request);
  // "identifier" = e-naslov ali uporabniško ime ("username" ostaja sprejet zaradi starejših odjemalcev)
  const rawId = body?.identifier ?? body?.username;
  if (!body || typeof rawId !== "string" || typeof body.password !== "string" || !rawId.trim() || !body.password) {
    return fail("Vnesite e-naslov ali uporabniško ime in geslo");
  }
  const identifier = rawId.toLowerCase().trim().slice(0, 254);

  const ipKey = `login:ip:${clientIp(request)}`;
  const userKey = `login:user:${identifier}`;
  const a = rateLimit(ipKey, 30, WINDOW);
  const b = rateLimit(userKey, 10, WINDOW);
  if (!a.ok || !b.ok) {
    const retry = Math.max(a.retryAfter, b.retryAfter);
    return fail(`Preveč poskusov prijave. Poskusite znova čez ${Math.ceil(retry / 60)} min.`, 429, { "Retry-After": String(retry) });
  }

  try {
    // Uporabniško ime ne more vsebovati @, e-naslov pa ga vedno, zato se ne moreta zamenjati.
    const [user] = await db
      .select()
      .from(users)
      .where(identifier.includes("@") ? sql`lower(${users.email}) = ${identifier}` : sql`${users.username} = ${identifier}`);
    if (!user) {
      await fakeVerify(body.password);
      return fail("Napačen e-naslov, uporabniško ime ali geslo", 401);
    }
    if (!(await verifyPassword(body.password, user.passwordHash))) {
      return fail("Napačen e-naslov, uporabniško ime ali geslo", 401);
    }
    if (user.disabled) {
      return fail("Ta račun je onemogočen. Obrnite se na skrbnika.", 403);
    }

    rateLimitClear(userKey);
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
    return createSessionResponse(request, user);
  } catch (e) {
    console.error("Login error:", e);
    return fail("Napaka pri prijavi", 500);
  }
}
