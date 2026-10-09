"use client";

import { useState } from "react";
import { Loader2, Save, ScanSearch, Star } from "lucide-react";
import { apiJson } from "@/lib/api";
import { BOOK_STATUSES, GENRES, SPINE_COLORS, STATUS, type BookStatus } from "@/lib/status";
import type { BookData } from "@/lib/types";
import BookCover from "./BookCover";
import Modal from "./Modal";

interface Props {
  book: BookData | null;
  onClose: () => void;
  onSaved: (book: BookData, isNew: boolean) => void;
}

interface Found {
  title: string | null; author: string | null; year: number | null; thumbnail: string | null;
  isbn: string | null; pageCount: number | null; publisher: string | null; link: string | null; note?: string; source?: string;
}

export default function BookModal({ book, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(book?.title || "");
  const [author, setAuthor] = useState(book?.author || "");
  const [status, setStatus] = useState<BookStatus>(book?.status || "wishlist");
  const [rating, setRating] = useState<number | null>(book?.rating ?? null);
  const [genre, setGenre] = useState(book?.genre || "");
  const [year, setYear] = useState(book?.year?.toString() || "");
  const [pageCount, setPageCount] = useState(book?.pageCount?.toString() || "");
  const [publisher, setPublisher] = useState(book?.publisher || "");
  const [isbn, setIsbn] = useState(book?.isbn || "");
  const [thumbnail, setThumbnail] = useState(book?.thumbnail || "");
  const [startedAt, setStartedAt] = useState(book?.startedAt || "");
  const [finishedAt, setFinishedAt] = useState(book?.finishedAt || "");
  const [color, setColor] = useState(book?.color || "#ffffff");
  const [summary, setSummary] = useState(book?.summary || "");
  const [description, setDescription] = useState(book?.description || "");

  const [lookupQ, setLookupQ] = useState("");
  const [looking, setLooking] = useState(false);
  const [lookupMsg, setLookupMsg] = useState<{ kind: "ok" | "info" | "error"; text: string } | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // genre iz starejših zapisov, ki ni na seznamu, ostane izbirljiv
  const genreOptions = genre && !GENRES.includes(genre) ? [genre, ...GENRES] : GENRES;

  async function lookup() {
    if (!lookupQ.trim()) return;
    setLooking(true);
    setLookupMsg(null);
    const res = await apiJson<Found>(`/api/books/lookup?q=${encodeURIComponent(lookupQ)}`);
    setLooking(false);
    if (!res.ok) return setLookupMsg({ kind: "error", text: res.error });
    const f = res.data;
    if (f.title) setTitle(f.title);
    if (f.author) setAuthor(f.author);
    if (f.year) setYear(String(f.year));
    if (f.thumbnail) setThumbnail(f.thumbnail);
    if (f.isbn) setIsbn(f.isbn);
    if (f.pageCount) setPageCount(String(f.pageCount));
    if (f.publisher) setPublisher(f.publisher);
    if (f.link?.startsWith("https://plus.cobiss.net/")) setDescription(f.link);
    if (f.title || f.author) setLookupMsg({ kind: "ok", text: `Podatki prebrani (${f.source}). Preglejte jih pred shranjevanjem.${f.note ? " " + f.note : ""}` });
    else setLookupMsg({ kind: "info", text: f.note || "Podatkov ni bilo mogoče najti." });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const payload = {
      title, author, status, rating,
      genre: genre || null,
      year: year || null,
      pageCount: pageCount || null,
      publisher: publisher || null,
      isbn: isbn || null,
      thumbnail: thumbnail || null,
      startedAt: startedAt || null,
      finishedAt: finishedAt || null,
      color,
      summary: summary || null,
      description: description || null,
    };
    const res = await apiJson<{ book: BookData }>(book ? `/api/books/${book.id}` : "/api/books", {
      method: book ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) return setError(res.error);
    onSaved(res.data.book, !book);
  }

  return (
    <Modal title={book ? "Uredi knjigo" : "Nova knjiga"} onClose={onClose} size="lg">
      <form onSubmit={submit} className="space-y-5">
        {error && <div className="alert alert-error" role="alert">{error}</div>}

        {!book && (
          <div className="rounded-xl border border-dashed border-line bg-sunk/40 p-3.5">
            <label htmlFor="lookup" className="label flex items-center gap-1.5"><ScanSearch className="w-4 h-4" />Hitri vnos z ISBN ali COBISS številko</label>
            <div className="flex gap-2">
              <input
                id="lookup" className="input" value={lookupQ} onChange={(e) => setLookupQ(e.target.value)} inputMode="numeric"
                placeholder="npr. 9789610155050"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); lookup(); } }}
              />
              <button type="button" className="btn btn-ghost shrink-0" onClick={lookup} disabled={looking || !lookupQ.trim()}>
                {looking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Poišči"}
              </button>
            </div>
            {lookupMsg && <div className={`alert mt-2.5 ${lookupMsg.kind === "error" ? "alert-error" : lookupMsg.kind === "ok" ? "alert-ok" : "alert-info"}`}>{lookupMsg.text}</div>}
          </div>
        )}

        <div className="flex gap-4">
          <BookCover title={title || "Naslov"} author={author} thumbnail={thumbnail || null} color={color} className="w-24 h-[136px]" />
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <label htmlFor="b-title" className="label">Naslov *</label>
              <input id="b-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={500} />
            </div>
            <div>
              <label htmlFor="b-author" className="label">Avtor *</label>
              <input id="b-author" className="input" value={author} onChange={(e) => setAuthor(e.target.value)} required maxLength={500} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="b-status" className="label">Status</label>
            <select id="b-status" className="input" value={status} onChange={(e) => setStatus(e.target.value as BookStatus)}>
              {BOOK_STATUSES.map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="b-genre" className="label">Žanr</label>
            <select id="b-genre" className="input" value={genre} onChange={(e) => setGenre(e.target.value)}>
              <option value="">Brez žanra</option>
              {genreOptions.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="b-start" className="label">Začetek branja</label>
            <input id="b-start" type="date" className="input" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} />
          </div>
          <div>
            <label htmlFor="b-end" className="label">Konec branja</label>
            <input id="b-end" type="date" className="input" value={finishedAt} min={startedAt || undefined} onChange={(e) => setFinishedAt(e.target.value)} />
          </div>
        </div>

        <div>
          <span className="label">Ocena</span>
          <div className="flex items-center flex-wrap gap-0.5" role="radiogroup" aria-label="Ocena od 1 do 10">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} od 10`}
                onClick={() => setRating(rating === n ? null : n)}
                className="btn btn-icon p-1!"
              >
                <Star className={`w-6 h-6 ${rating !== null && n <= rating ? "fill-brass text-brass" : "text-faint"}`} />
              </button>
            ))}
            <span className="ml-2 text-sm font-semibold text-ink-2 tabular-nums">{rating !== null ? `${rating}/10` : "Brez ocene"}</span>
            {rating !== null && <button type="button" className="btn btn-icon text-xs! ml-1 px-2!" onClick={() => setRating(null)}>Počisti</button>}
          </div>
        </div>

        <details className="group rounded-xl border border-line">
          <summary className="cursor-pointer select-none px-3.5 py-2.5 text-sm font-semibold text-ink-2">Več podrobnosti (leto, strani, ISBN, naslovnica, barva)</summary>
          <div className="px-3.5 pb-4 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="b-year" className="label">Leto izida</label>
              <input id="b-year" type="number" inputMode="numeric" className="input" value={year} onChange={(e) => setYear(e.target.value)} min={1000} max={2100} />
            </div>
            <div>
              <label htmlFor="b-pages" className="label">Število strani</label>
              <input id="b-pages" type="number" inputMode="numeric" className="input" value={pageCount} onChange={(e) => setPageCount(e.target.value)} min={1} max={20000} />
            </div>
            <div>
              <label htmlFor="b-pub" className="label">Založnik</label>
              <input id="b-pub" className="input" value={publisher} onChange={(e) => setPublisher(e.target.value)} maxLength={255} />
            </div>
            <div>
              <label htmlFor="b-isbn" className="label">ISBN</label>
              <input id="b-isbn" className="input" value={isbn} onChange={(e) => setIsbn(e.target.value)} maxLength={20} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="b-thumb" className="label">Naslov slike naslovnice (URL)</label>
              <input id="b-thumb" type="url" className="input" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} placeholder="https://…" />
            </div>
            <div className="sm:col-span-2">
              <span className="label">Barva hrbta</span>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Barva hrbta knjige">
                {SPINE_COLORS.map((c) => (
                  <button
                    key={c} type="button" role="radio" aria-checked={color.toLowerCase() === c}
                    aria-label={c === "#ffffff" ? "Privzeta (po statusu)" : c}
                    title={c === "#ffffff" ? "Privzeta (po statusu)" : c}
                    onClick={() => setColor(c)}
                    className="w-8 h-8 rounded-full border-2 cursor-pointer flex items-center justify-center text-[10px] text-muted"
                    style={{ background: c === "#ffffff" ? "var(--card)" : c, borderColor: color.toLowerCase() === c ? "var(--ink)" : "var(--line)" }}
                  >
                    {c === "#ffffff" ? "A" : ""}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </details>

        <div>
          <label htmlFor="b-sum" className="label">Povzetek in vtisi</label>
          <textarea id="b-sum" className="input" rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={20000} placeholder="Neobvezno" />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Prekliči</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save className="w-4 h-4" />{saving ? "Shranjujem …" : book ? "Shrani spremembe" : "Dodaj knjigo"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
