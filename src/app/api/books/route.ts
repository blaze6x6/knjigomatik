import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { books } from "@/db/schema";
import { isResponse, requireUser } from "@/lib/auth";
import { fail, readJson } from "@/lib/http";
import * as v from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await requireUser(request);
  if (isResponse(user)) return user;
  const list = await db.select().from(books).where(eq(books.userId, user.userId)).orderBy(desc(books.updatedAt));
  return NextResponse.json({ books: list });
}

export async function POST(request: NextRequest) {
  const user = await requireUser(request);
  if (isResponse(user)) return user;
  const body = await readJson(request);
  if (!body) return fail("Neveljavna zahteva");

  const parsed = v.bookInput(body, "create");
  if (parsed.error) return fail(parsed.error);
  const val = { ...parsed.value! };

  // samodejni datumi ob ustvarjanju z ustreznim statusom
  if (val.status === "reading" && val.startedAt === undefined) val.startedAt = v.today();
  if (val.status === "read" && val.finishedAt === undefined) val.finishedAt = v.today();

  try {
    const [book] = await db
      .insert(books)
      .values({ ...val, title: val.title!, author: val.author!, userId: user.userId })
      .returning();
    return NextResponse.json({ book }, { status: 201 });
  } catch (e) {
    console.error("Create book error:", e);
    return fail("Napaka pri dodajanju knjige", 500);
  }
}
