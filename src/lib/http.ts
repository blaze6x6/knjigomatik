import { NextRequest, NextResponse } from "next/server";

export const fail = (error: string, status = 400, headers?: Record<string, string>) =>
  NextResponse.json({ error }, { status, headers });

export async function readJson(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export const pgConstraint = (e: unknown): string =>
  String((e as { constraint?: string; cause?: { constraint?: string } })?.constraint ??
    (e as { cause?: { constraint?: string } })?.cause?.constraint ?? "");

export const pgCode = (e: unknown): string | undefined => {
  const err = e as { code?: string; cause?: { code?: string } };
  return err?.code ?? err?.cause?.code;
};
