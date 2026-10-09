import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { isResponse, requireUser } from "@/lib/auth";
import { fail } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

interface Found {
  title: string | null;
  author: string | null;
  year: number | null;
  thumbnail: string | null;
  isbn: string | null;
  pageCount: number | null;
  publisher: string | null;
  link: string | null;
  source: string;
  note?: string;
}

const TIMEOUT = 8000;

async function lookupIsbn(isbn: string): Promise<Found | null> {
  const key = `ISBN:${isbn}`;
  const res = await fetch(`https://openlibrary.org/api/books?bibkeys=${key}&format=json&jscmd=data`, {
    signal: AbortSignal.timeout(TIMEOUT),
    headers: { "User-Agent": "Knjigomatik/2.0 (self-hosted)" },
  });
  if (!res.ok) throw new Error(`Open Library ${res.status}`);
  const data = (await res.json()) as Record<string, {
    title?: string; authors?: { name: string }[]; publish_date?: string; number_of_pages?: number;
    publishers?: { name: string }[]; cover?: { medium?: string; large?: string }; url?: string;
  }>;
  const b = data[key];
  if (!b?.title) return null;
  const year = b.publish_date?.match(/\d{4}/)?.[0];
  return {
    title: b.title,
    author: b.authors?.map((a) => a.name).join(", ") || null,
    year: year ? parseInt(year, 10) : null,
    thumbnail: b.cover?.medium || b.cover?.large || `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`,
    isbn,
    pageCount: b.number_of_pages ?? null,
    publisher: b.publishers?.[0]?.name ?? null,
    link: b.url ?? null,
    source: "Open Library",
  };
}

async function lookupCobiss(cobissId: string): Promise<Found> {
  const thumbnail = `https://d.cobiss.net/repository/si/thumbnails/cobib/${cobissId}`;
  const link = `https://plus.cobiss.net/cobiss/si/sl/bib/${cobissId}`;
  const base: Found = { title: null, author: null, year: null, thumbnail, isbn: null, pageCount: null, publisher: null, link, source: "COBISS" };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ...base, note: "GEMINI_API_KEY ni nastavljen: naslov in avtor se ne preberejo samodejno." };

  try {
    const img = await fetch(thumbnail, { signal: AbortSignal.timeout(TIMEOUT) });
    if (!img.ok) throw new Error(`COBISS slika ${img.status}`);
    const buf = Buffer.from(await img.arrayBuffer());
    if (buf.length > 5_000_000) throw new Error("Slika je prevelika");

    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-3.6-flash" });
    const result = await model.generateContent([
      { inlineData: { data: buf.toString("base64"), mimeType: img.headers.get("content-type")?.split(";")[0] || "image/jpeg" } },
      "Iz te naslovnice knjige preberi avtorja in naslov. Vrni odgovor izključno v JSON obliki z dvema ključema: 'title' (naslov knjige) in 'author' (avtor knjige). Brez dodatnega besedila in brez markdown oklepajev.",
    ]);
    const text = result.response.text();
    const json = text.match(/\{[\s\S]*\}/)?.[0];
    const parsed = json ? JSON.parse(json) : {};
    return {
      ...base,
      title: typeof parsed.title === "string" ? parsed.title.trim().slice(0, 500) || null : null,
      author: typeof parsed.author === "string" ? parsed.author.trim().slice(0, 500) || null : null,
      source: "COBISS + Gemini",
    };
  } catch (e) {
    console.error("COBISS/Gemini lookup error:", e);
    return { ...base, note: "Naslovnice ni bilo mogoče prebrati. Podatke vnesite ročno." };
  }
}

/** ?q=<ISBN-10/13 ali COBISS ID>. Zahteva prijavo (porablja zunanje storitve). */
export async function GET(request: NextRequest) {
  const user = await requireUser(request);
  if (isResponse(user)) return user;

  const rl = rateLimit(`lookup:${user.userId}`, 30, 10 * 60 * 1000);
  if (!rl.ok) return fail("Preveč iskanj. Poskusite pozneje.", 429, { "Retry-After": String(rl.retryAfter) });

  const q = request.nextUrl.searchParams.get("q") || request.nextUrl.searchParams.get("isbn") || "";
  const clean = q.replace(/[\s-]/g, "").toUpperCase();
  if (!/^[0-9]{1,13}$|^[0-9]{9}X$/.test(clean)) return fail("Vnesite ISBN (10 ali 13 števk) ali COBISS ID");

  try {
    if (clean.length === 10 || clean.length === 13) {
      const found = await lookupIsbn(clean).catch((e) => {
        console.error("ISBN lookup error:", e);
        return null;
      });
      if (found) return NextResponse.json(found);
      return NextResponse.json({
        title: null, author: null, year: null, thumbnail: null, isbn: clean, pageCount: null, publisher: null, link: null,
        source: "Open Library", note: "Knjiga s tem ISBN ni bila najdena. Podatke vnesite ročno.",
      } satisfies Found);
    }
    return NextResponse.json(await lookupCobiss(clean));
  } catch (e) {
    console.error("Lookup error:", e);
    return fail("Iskanje ni uspelo", 502);
  }
}
