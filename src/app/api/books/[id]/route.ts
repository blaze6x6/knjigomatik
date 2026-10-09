import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { books } from "@/db/schema";
import { isResponse, requireUser } from "@/lib/auth";
import { fail, isUuid, readJson } from "@/lib/http";
import * as v from "@/lib/validate";

type Ctx = { params: Promise<{ id: string }> };

/** Delna posodobitev: spremenijo se samo podana polja. */
export async function PUT(request: NextRequest, { params }: Ctx) {
  const user = await requireUser(request);
  if (isResponse(user)) return user;
  const { id } = await params;
  if (!isUuid(id)) return fail("Knjiga ni najdena", 404);

  const body = await readJson(request);
  if (!body) return fail("Neveljavna zahteva");
  const parsed = v.bookInput(body, "update");
  if (parsed.error) return fail(parsed.error);
  const val = { ...parsed.value! };

  const [existing] = await db.select().from(books).where(and(eq(books.id, id), eq(books.userId, user.userId)));
  if (!existing) return fail("Knjiga ni najdena", 404);

  if (val.status && val.status !== existing.status) {
    const started = "startedAt" in val ? val.startedAt : existing.startedAt;
    const finished = "finishedAt" in val ? val.finishedAt : existing.finishedAt;
    if (val.status === "reading" && !started) val.startedAt = v.today();
    if (val.status === "read" && !finished) val.finishedAt = v.today();
  }
  const s = "startedAt" in val ? val.startedAt : existing.startedAt;
  const f = "finishedAt" in val ? val.finishedAt : existing.finishedAt;
  if (s && f && f < s) return fail("Konec branja ne more biti pred začetkom");

  const [book] = await db
    .update(books)
    .set({ ...val, updatedAt: new Date() })
    .where(and(eq(books.id, id), eq(books.userId, user.userId)))
    .returning();
  return NextResponse.json({ book });
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const user = await requireUser(request);
  if (isResponse(user)) return user;
  const { id } = await params;
  if (!isUuid(id)) return fail("Knjiga ni najdena", 404);

  const [book] = await db.delete(books).where(and(eq(books.id, id), eq(books.userId, user.userId))).returning({ id: books.id });
  if (!book) return fail("Knjiga ni najdena", 404);
  return NextResponse.json({ success: true });
}
