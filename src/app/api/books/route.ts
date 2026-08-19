import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { books } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Neprijavljen" }, { status: 401 });
  }

  const userBooks = await db
    .select()
    .from(books)
    .where(eq(books.userId, session.userId))
    .orderBy(desc(books.updatedAt));

  return NextResponse.json({ books: userBooks });
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Neprijavljen" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      title,
      author,
      status,
      rating,
      color,
      notes,
      genre,
      year,
      thumbnail,
      description,
      isbn,
      pageCount,
      publisher,
    } = body;

    if (!title || !author) {
      return NextResponse.json(
        { error: "Naslov in avtor sta obvezna" },
        { status: 400 }
      );
    }

    if (rating !== null && rating !== undefined && (rating < 1 || rating > 10)) {
      return NextResponse.json(
        { error: "Ocena mora biti med 1 in 10" },
        { status: 400 }
      );
    }

    const [book] = await db
      .insert(books)
      .values({
        userId: session.userId,
        title: title.trim(),
        author: author.trim(),
        status: status || "wishlist",
        rating: rating || null,
        color: color || "#ffffff",
        notes: notes?.trim() || null,
        genre: genre?.trim() || null,
        year: year || null,
        thumbnail: thumbnail || null,
        description: description || null,
        isbn: isbn || null,
        pageCount: pageCount || null,
        publisher: publisher || null,
      })
      .returning();

    return NextResponse.json({ book }, { status: 201 });
  } catch (error) {
    console.error("Create book error:", error);
    return NextResponse.json(
      { error: "Napaka pri dodajanju knjige" },
      { status: 500 }
    );
  }
}
