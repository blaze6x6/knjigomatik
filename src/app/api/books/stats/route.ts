import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { books } from "@/db/schema";
import { eq, sql, avg } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Neprijavljen" }, { status: 401 });
  }

  const [stats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      read: sql<number>`count(*) filter (where ${books.status} = 'read')::int`,
      reading: sql<number>`count(*) filter (where ${books.status} = 'reading')::int`,
      wishlist: sql<number>`count(*) filter (where ${books.status} = 'wishlist')::int`,
      reserved: sql<number>`count(*) filter (where ${books.status} = 'reserved')::int`,
      unavailable: sql<number>`count(*) filter (where ${books.status} = 'unavailable')::int`,
      avgRating: avg(books.rating),
    })
    .from(books)
    .where(eq(books.userId, session.userId));

  return NextResponse.json({
    stats: {
      ...stats,
      avgRating: stats.avgRating ? parseFloat(String(stats.avgRating)).toFixed(1) : null,
    },
  });
}
