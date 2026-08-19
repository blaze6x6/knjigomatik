import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-change-in-production-knjigomatik-2024"
);

export interface SessionPayload {
  userId: string;
  username: string;
  displayName: string;
  isAdmin: boolean;
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get("session")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function createSessionResponse(
  data: Record<string, unknown>,
  token: string,
  status = 200
): NextResponse {
  const response = NextResponse.json(data, { status });
  response.cookies.set("session", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}

export function clearSessionResponse(): NextResponse {
  const response = NextResponse.json({ success: true });
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
