import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createToken, createSessionResponse } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, displayName, password } = body;

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

    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users);
    const isFirstUser = countResult[0].count === 0;

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db
      .insert(users)
      .values({
        username: username.toLowerCase().trim(),
        displayName: displayName.trim(),
        passwordHash,
        isAdmin: isFirstUser,
      })
      .returning();

    const token = await createToken({
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      isAdmin: user.isAdmin,
    });

    return createSessionResponse(
      {
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          isAdmin: user.isAdmin,
        },
      },
      token
    );
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "23505") {
      return NextResponse.json(
        { error: "Uporabniško ime je že zasedeno" },
        { status: 409 }
      );
    }
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Napaka pri registraciji" },
      { status: 500 }
    );
  }
}
