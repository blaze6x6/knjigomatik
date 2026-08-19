import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { books } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Neprijavljen" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { title, author, status, rating, color, notes, genre, year, thumbnail } = body;

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
      .update(books)
      .set({
        title: title.trim(),
        author: author.trim(),
        status: status || "wishlist",
        rating: rating || null,
        color: color || "#ffffff",
        notes: notes?.trim() || null,
        genre: genre?.trim() || null,
        year: year || null,
        thumbnail: thumbnail || null,
        updatedAt: new Date(),
      })
      .where(and(eq(books.id, id), eq(books.userId, session.userId)))
      .returning();

    if (!book) {
      return NextResponse.json(
        { error: "Knjiga ni najdena" },
        { status: 404 }
      );
    }

    return NextResponse.json({ book });
  } catch (error) {
    console.error("Update book error:", error);
    return NextResponse.json(
      { error: "Napaka pri urejanju knjige" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Neprijavljen" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const [book] = await db
      .delete(books)
      .where(and(eq(books.id, id), eq(books.userId, session.userId)))
      .returning();

    if (!book) {
      return NextResponse.json(
        { error: "Knjiga ni najdena" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete book error:", error);
    return NextResponse.json(
      { error: "Napaka pri brisanju knjige" },
      { status: 500 }
    );
  }
}
