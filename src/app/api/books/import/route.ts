import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { books } from "@/db/schema";
import { isResponse, requireUser } from "@/lib/auth";
import { fail, readJson } from "@/lib/http";
import * as v from "@/lib/validate";

const MAX_BOOKS = 5000;
const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Uvoz iz JSON izvoza (ali preprostega seznama knjig).
 * Podvojene (isti naslov + avtor) preskoči, neveljavne vrstice poroča.
 */
export async function POST(request: NextRequest) {
  const user = await requireUser(request);
  if (isResponse(user)) return user;

  const body = await request.json().catch(() => null);
  const list: unknown = Array.isArray(body) ? body : (body as { books?: unknown } | null)?.books;
  if (!Array.isArray(list)) return fail("Datoteka mora vsebovati seznam knjig");
  if (list.length > MAX_BOOKS) return fail(`Naenkrat je mogoče uvoziti največ ${MAX_BOOKS} knjig`);

  const existing = await db.select({ title: books.title, author: books.author }).from(books).where(eq(books.userId, user.userId));
  const seen = new Set(existing.map((b) => `${norm(b.title)}|${norm(b.author)}`));

  const toInsert: (typeof books.$inferInsert)[] = [];
  const errors: { row: number; error: string }[] = [];
  let skipped = 0;

  list.forEach((item, i) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      errors.push({ row: i + 1, error: "Neveljaven zapis" });
      return;
    }
    const parsed = v.bookInput(item as Record<string, unknown>, "create");
    if (parsed.error) {
      errors.push({ row: i + 1, error: parsed.error });
      return;
    }
    const val = parsed.value!;
    const key = `${norm(val.title!)}|${norm(val.author!)}`;
    if (seen.has(key)) {
      skipped++;
      return;
    }
    seen.add(key);
    toInsert.push({ ...val, title: val.title!, author: val.author!, userId: user.userId });
  });

  try {
    await db.transaction(async (tx) => {
      for (let i = 0; i < toInsert.length; i += 200) {
        await tx.insert(books).values(toInsert.slice(i, i + 200));
      }
    });
  } catch (e) {
    console.error("Import error:", e);
    return fail("Napaka pri uvozu. Nič ni bilo shranjeno.", 500);
  }
  return NextResponse.json({ imported: toInsert.length, skipped, errors: errors.slice(0, 20), errorCount: errors.length });
}
