import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createToken, createSessionResponse } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Uporabniško ime in geslo sta obvezna" },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username.toLowerCase().trim()));

    if (!user) {
      return NextResponse.json(
        { error: "Napačno uporabniško ime ali geslo" },
        { status: 401 }
      );
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json(
        { error: "Napačno uporabniško ime ali geslo" },
        { status: 401 }
      );
    }

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
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Napaka pri prijavi" },
      { status: 500 }
    );
  }
}
