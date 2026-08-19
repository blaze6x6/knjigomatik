import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Nimate pravic" }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.userId) {
    return NextResponse.json(
      { error: "Ne morete izbrisati sebe" },
      { status: 400 }
    );
  }

  try {
    const [user] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      return NextResponse.json(
        { error: "Uporabnik ni najden" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Napaka pri brisanju uporabnika" },
      { status: 500 }
    );
  }
}
