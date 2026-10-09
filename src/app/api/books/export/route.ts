import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { books } from "@/db/schema";
import { isResponse, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const FIELDS = [
  "title", "author", "status", "rating", "genre", "year", "isbn", "pageCount", "publisher",
  "startedAt", "finishedAt", "color", "thumbnail", "description", "summary",
] as const;

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  // preprečimo izvajanje formul v Excelu
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** ?format=json (privzeto, primerno za ponovni uvoz) ali ?format=csv (Excel, ločilo ;) */
export async function GET(request: NextRequest) {
  const user = await requireUser(request);
  if (isResponse(user)) return user;

  const rows = await db.select().from(books).where(eq(books.userId, user.userId)).orderBy(asc(books.title));
  const stamp = new Date().toISOString().slice(0, 10);
  const headers = { "Cache-Control": "no-store" };

  if (request.nextUrl.searchParams.get("format") === "csv") {
    const lines = [FIELDS.join(";"), ...rows.map((r) => FIELDS.map((f) => csvCell(r[f])).join(";"))];
    return new NextResponse("﻿" + lines.join("\r\n"), {
      headers: { ...headers, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="knjigomatik-${stamp}.csv"` },
    });
  }

  const data = { app: "knjigomatik", version: 2, exportedAt: new Date().toISOString(), books: rows.map((r) => Object.fromEntries(FIELDS.map((f) => [f, r[f]]))) };
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="knjigomatik-${stamp}.json"` },
  });
}
