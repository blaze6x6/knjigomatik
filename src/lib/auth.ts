import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

const COOKIE = "session";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 dni

// Vrednosti iz starih različic, ki jih ne sprejmemo več.
const FORBIDDEN_SECRETS = [
  "spremenite-ta-skrivni-kljuc-v-produkciji-2024",
  "default-secret-change-in-production-knjigomatik-2024",
  "changeme",
];

let cachedKey: Uint8Array | null = null;
function getKey(): Uint8Array {
  if (cachedKey) return cachedKey;
  const secret = process.env.JWT_SECRET;
  const bad = !secret || secret.length < 16 || FORBIDDEN_SECRETS.includes(secret);
  if (bad) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET mora biti nastavljen (vsaj 16 znakov, ne privzeta vrednost). Ustvarite ga z: openssl rand -hex 32");
    }
    cachedKey = new TextEncoder().encode("dev-only-secret-knjigomatik-not-for-production");
  } else {
    cachedKey = new TextEncoder().encode(secret);
  }
  return cachedKey;
}

export interface SessionUser {
  userId: string;
  username: string;
  displayName: string;
  email: string | null;
  isAdmin: boolean;
}

type PublicUserRow = {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  isAdmin: boolean;
  tokenVersion: number;
};

export function toSessionUser(u: { id: string; username: string; displayName: string; email: string | null; isAdmin: boolean }): SessionUser {
  return { userId: u.id, username: u.username, displayName: u.displayName, email: u.email, isAdmin: u.isAdmin };
}

async function signToken(u: PublicUserRow): Promise<string> {
  return new SignJWT({ tv: u.tokenVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(u.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getKey());
}

/**
 * Sejo vedno preveri v bazi: izklopljen račun, zamenjano geslo ali odvzeta
 * admin pravica takoj učinkujejo (JWT sam nosi le ID in verzijo).
 */
export async function getSession(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), { algorithms: ["HS256"] });
    if (!payload.sub || typeof payload.tv !== "number") return null;
    const [u] = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        email: users.email,
        isAdmin: users.isAdmin,
        disabled: users.disabled,
        tokenVersion: users.tokenVersion,
      })
      .from(users)
      .where(eq(users.id, payload.sub));
    if (!u || u.disabled || u.tokenVersion !== payload.tv) return null;
    return toSessionUser(u);
  } catch {
    return null;
  }
}

export const isResponse = (x: unknown): x is NextResponse => x instanceof NextResponse;

export async function requireUser(request: NextRequest): Promise<SessionUser | NextResponse> {
  const s = await getSession(request);
  return s ?? NextResponse.json({ error: "Neprijavljen" }, { status: 401 });
}

export async function requireAdmin(request: NextRequest): Promise<SessionUser | NextResponse> {
  const s = await requireUser(request);
  if (isResponse(s)) return s;
  return s.isAdmin ? s : NextResponse.json({ error: "Nimate pravic" }, { status: 403 });
}

function isSecure(request: NextRequest): boolean {
  const o = process.env.COOKIE_SECURE;
  if (o === "true") return true;
  if (o === "false") return false;
  return request.headers.get("x-forwarded-proto")?.split(",")[0].trim() === "https" || request.nextUrl.protocol === "https:";
}

export async function createSessionResponse(
  request: NextRequest,
  user: PublicUserRow,
  status = 200
): Promise<NextResponse> {
  const response = NextResponse.json({ user: toSessionUser(user) }, { status });
  response.cookies.set(COOKIE, await signToken(user), {
    httpOnly: true,
    secure: isSecure(request),
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
  return response;
}

export function clearSessionResponse(request: NextRequest): NextResponse {
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE, "", {
    httpOnly: true,
    secure: isSecure(request),
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}

// ---- gesla ----

export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

let dummyHash: Promise<string> | null = null;
/** Poraba čas enako kot pravo preverjanje, da prijava ne razkrije obstoja uporabnika. */
export async function fakeVerify(password: string): Promise<void> {
  dummyHash ??= bcrypt.hash("knjigomatik-dummy", 12);
  await bcrypt.compare(password, await dummyHash);
}
