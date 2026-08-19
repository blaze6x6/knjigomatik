import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Nimate pravic" }, { status: 403 });
  }

  const allUsers = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
      bookCount: sql<number>`(SELECT count(*)::int FROM books WHERE books.user_id = ${users.id})`,
    })
    .from(users)
    .orderBy(users.createdAt);

  return NextResponse.json({ users: allUsers });
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Nimate pravic" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { username, displayName, password, isAdmin } = body;

    if (!username || !displayName || !password) {
      return NextResponse.json(
        { error: "Vsa polja so obvezna" },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: "Uporabniško ime mora imeti vsaj 3 znake" },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      return NextResponse.json(
        { error: "Uporabniško ime lahko vsebuje le črke, številke, pike, pomišljaje in podčrtaje" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Geslo mora imeti vsaj 6 znakov" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db
      .insert(users)
      .values({
        username: username.toLowerCase().trim(),
        displayName: displayName.trim(),
        passwordHash,
        isAdmin: isAdmin || false,
      })
      .returning({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
      });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "23505") {
      return NextResponse.json(
        { error: "Uporabniško ime je že zasedeno" },
        { status: 409 }
      );
    }
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Napaka pri dodajanju uporabnika" },
      { status: 500 }
    );
  }
}
