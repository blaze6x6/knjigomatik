import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users);
    const hasUsers = result[0].count > 0;
    return NextResponse.json({ needsSetup: !hasUsers });
  } catch {
    return NextResponse.json({ needsSetup: true });
  }
}
