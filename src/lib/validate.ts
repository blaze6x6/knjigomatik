import { BOOK_STATUSES, type BookStatus } from "@/lib/status";

type Result<T> = { value: T; error?: undefined } | { error: string; value?: undefined };
const bad = (error: string): { error: string } => ({ error });

export function username(raw: unknown): Result<string> {
  if (typeof raw !== "string") return bad("Uporabniško ime je obvezno");
  const v = raw.trim().toLowerCase();
  if (v.length < 3 || v.length > 50) return bad("Uporabniško ime mora imeti od 3 do 50 znakov");
  if (!/^[a-z0-9._-]+$/.test(v)) return bad("Uporabniško ime lahko vsebuje le črke (a–z), številke, pike, pomišljaje in podčrtaje");
  return { value: v };
}

export function displayName(raw: unknown): Result<string> {
  if (typeof raw !== "string") return bad("Ime je obvezno");
  const v = raw.trim();
  if (v.length < 1 || v.length > 100) return bad("Ime mora imeti od 1 do 100 znakov");
  return { value: v };
}

/** Prazno = brez e-naslova (null). */
export function email(raw: unknown): Result<string | null> {
  if (raw === null || raw === undefined || (typeof raw === "string" && raw.trim() === "")) return { value: null };
  if (typeof raw !== "string") return bad("Neveljaven e-naslov");
  const v = raw.trim().toLowerCase();
  if (v.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return bad("Neveljaven e-naslov");
  return { value: v };
}

export function password(raw: unknown): Result<string> {
  if (typeof raw !== "string" || raw.length === 0) return bad("Geslo je obvezno");
  if (raw.length < 8) return bad("Geslo mora imeti vsaj 8 znakov");
  if (Buffer.byteLength(raw, "utf8") > 72) return bad("Geslo je predolgo (največ 72 bajtov)");
  return { value: raw };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function validDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export interface BookValues {
  title?: string;
  author?: string;
  status?: BookStatus;
  rating?: number | null;
  color?: string;
  summary?: string | null;
  genre?: string | null;
  year?: number | null;
  thumbnail?: string | null;
  description?: string | null;
  isbn?: string | null;
  pageCount?: number | null;
  publisher?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
}

const has = (o: Record<string, unknown>, k: string) => Object.prototype.hasOwnProperty.call(o, k);
const empty = (v: unknown) => v === null || v === undefined || (typeof v === "string" && v.trim() === "");

/**
 * Preveri vnos knjige. Pri "update" se obdelajo samo podana polja,
 * zato posodobitev enega polja (npr. povzetka) ne uniči ostalih.
 */
export function bookInput(body: Record<string, unknown>, mode: "create" | "update"): Result<BookValues> {
  const out: BookValues = {};

  const text = (key: "title" | "author", label: string, max: number): string | null => {
    if (!has(body, key)) return mode === "create" ? `${label} je obvezen` : null;
    const v = body[key];
    if (typeof v !== "string" || !v.trim()) return `${label} je obvezen`;
    if (v.trim().length > max) return `${label} je predolg (največ ${max} znakov)`;
    out[key] = v.trim();
    return null;
  };
  let e = text("title", "Naslov", 500) || text("author", "Avtor", 500);
  if (e) return bad(e);

  if (has(body, "status")) {
    if (!BOOK_STATUSES.includes(body.status as BookStatus)) return bad("Neveljaven status");
    out.status = body.status as BookStatus;
  }

  const int = (key: "rating" | "year" | "pageCount", label: string, min: number, max: number): string | null => {
    if (!has(body, key)) return null;
    const v = body[key];
    if (empty(v)) { out[key] = null; return null; }
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isInteger(n) || n < min || n > max) return `${label} mora biti celo število od ${min} do ${max}`;
    out[key] = n;
    return null;
  };
  e = int("rating", "Ocena", 1, 10) || int("year", "Leto", 1000, 2100) || int("pageCount", "Število strani", 1, 20000);
  if (e) return bad(e);

  const str = (key: "summary" | "genre" | "description" | "publisher" | "isbn", label: string, max: number): string | null => {
    if (!has(body, key)) return null;
    const v = body[key];
    if (empty(v)) { out[key] = null; return null; }
    if (typeof v !== "string") return `${label}: neveljavna vrednost`;
    if (v.trim().length > max) return `${label} je predolg (največ ${max} znakov)`;
    out[key] = v.trim();
    return null;
  };
  e = str("summary", "Povzetek", 20000) || str("genre", "Žanr", 100) || str("description", "Opis", 2000)
    || str("publisher", "Založnik", 255) || str("isbn", "ISBN", 20);
  if (e) return bad(e);
  if (out.isbn && !/^[0-9Xx-]+$/.test(out.isbn)) return bad("ISBN lahko vsebuje le števke, X in pomišljaje");

  if (has(body, "thumbnail")) {
    const v = body.thumbnail;
    if (empty(v)) out.thumbnail = null;
    else if (typeof v !== "string" || v.length > 2000 || !/^https?:\/\//i.test(v.trim())) return bad("Naslovnica mora biti veljaven http(s) naslov");
    else out.thumbnail = v.trim();
  }

  if (has(body, "color")) {
    const v = body.color;
    if (empty(v)) out.color = "#ffffff";
    else if (typeof v !== "string" || !/^#[0-9a-f]{6}$/i.test(v)) return bad("Neveljavna barva");
    else out.color = v.toLowerCase();
  }

  for (const key of ["startedAt", "finishedAt"] as const) {
    if (!has(body, key)) continue;
    const v = body[key];
    if (empty(v)) out[key] = null;
    else if (typeof v !== "string" || !validDate(v)) return bad("Datum mora biti v obliki LLLL-MM-DD");
    else out[key] = v;
  }
  if (out.startedAt && out.finishedAt && out.finishedAt < out.startedAt) {
    return bad("Konec branja ne more biti pred začetkom");
  }

  return { value: out };
}

/** Današnji datum (LLLL-MM-DD) v časovnem pasu aplikacije. */
export function today(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: process.env.APP_TZ || "Europe/Ljubljana" });
}
