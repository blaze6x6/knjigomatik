"use client";

import { useState } from "react";
import { X, Save, Star, BookOpen, Link as LinkIcon, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import ModalPortal from "./ModalPortal";
import type { BookData } from "./Dashboard";

interface Props {
  book: BookData | null;
  onClose: () => void;
  onSaved: () => void;
}

const STATUS_OPTIONS = [
  { value: "wishlist", label: "Želja", emoji: "💫" },
  { value: "reading", label: "V branju", emoji: "📖" },
  { value: "read", label: "Prebrana", emoji: "✅" },
  { value: "reserved", label: "Rezervirana", emoji: "📌" },
  { value: "unavailable", label: "Ni na voljo", emoji: "❌" },
  { value: "cancelled", label: "Prenehal(a) z branjem", emoji: "🚫"},
];

const GENRES = [
  "Roman", "Kriminalka", "Fantazija", "Znanstvena fantastika", "Triler",
  "Biografija", "Zgodovina", "Znanost", "Poezija", "Filozofija",
  "Samopomoč", "Potopis", "Drama", "Komedija", "Mladinska", "Strokovna", "Drugo",
];

export default function BookModal({ book, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(book?.title || "");
  const [author, setAuthor] = useState(book?.author || "");
  const [status, setStatus] = useState(book?.status || "wishlist");
  const [rating, setRating] = useState<number | null>(book?.rating ?? null);
  const [notes, setNotes] = useState(book?.notes || "");
  const [genre, setGenre] = useState(book?.genre || "");
  const [year, setYear] = useState<string>(book?.year?.toString() || "");
  const [thumbnail, setThumbnail] = useState(book?.thumbnail || "");
  const [isbnInput, setIsbnInput] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Funkcija za uvoz podatkov preko ISBN/COBISS številke
  async function handleIsbnImport() {
    if (!isbnInput.trim()) return;
    setImporting(true);
    setError("");
    try {
      const res = await apiFetch(`/api/books/cobiss?isbn=${encodeURIComponent(isbnInput)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Knjige ni bilo mogoče najti");
        return;
      }
      if (data.title) setTitle(data.title);
      if (data.author) setAuthor(data.author);
      if (data.year) setYear(data.year.toString());
      if (data.thumbnail) setThumbnail(data.thumbnail);
    } catch {
      setError("Napaka pri povezavi s strežnikom");
    } finally {
      setImporting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      title, author, status, rating, notes: notes || null,
      genre: genre || null, year: year ? parseInt(year) : null,
      thumbnail: thumbnail || null, color: "#ffffff",
    };

    try {
      const url = book ? `/api/books/${book.id}` : "/api/books";
      const method = book ? "PUT" : "POST";
      const res = await apiFetch(url, { method, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Napaka"); return; }
      onSaved();
    } catch { setError("Napaka pri shranjevanju"); }
    finally { setLoading(false); }
  }

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-backdrop backdrop-blur-sm" onClick={onClose} />
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative bg-surface-light border border-b-default rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up my-8 transition-colors duration-300">
          <div className="flex items-center justify-between p-6 pb-0">
            <h2 className="text-xl font-bold text-t-primary">
              {book ? "Uredi knjigo" : "Dodaj knjigo ročno"}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-surface-lighter rounded-lg transition cursor-pointer">
              <X className="w-5 h-5 text-t-muted" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
            )}

            {/* ISBN/COBISS Import Section */}
            {!book && (
              <div className="p-3 bg-surface border border-brand-500/30 rounded-xl space-y-2">
                <label className="block text-xs font-medium text-brand-400 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5" /> Hitri uvoz prek ISBN/COBISS številke
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={isbnInput}
                    onChange={(e) => setIsbnInput(e.target.value)}
                    className="flex-1 bg-surface-light border border-b-default rounded-lg px-3 py-1.5 text-t-primary placeholder-t-faint text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Npr. 9789610155050 ali COBISS ID"
                  />
                  <button
                    type="button"
                    onClick={handleIsbnImport}
                    disabled={importing || !isbnInput.trim()}
                    className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 flex items-center gap-1"
                  >
                    {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Uvozi"}
                  </button>
                </div>
              </div>
            )}

            {/* Thumbnail preview */}
            <div className="flex gap-4">
              <div className="w-20 h-28 bg-surface-lighter rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                {thumbnail ? (
                  <img src={thumbnail} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="w-8 h-8 text-t-faint" />
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm text-t-muted mb-1.5">URL naslovnice</label>
                <input type="url" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)}
                  className="w-full bg-surface border border-b-default rounded-lg px-3 py-2 text-t-primary placeholder-t-faint focus:outline-none focus:ring-2 focus:ring-brand-500 transition text-sm"
                  placeholder="https://..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm text-t-muted mb-1.5">Naslov *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-surface border border-b-default rounded-lg px-4 py-2.5 text-t-primary placeholder-t-faint focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  placeholder="Naslov knjige" required />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-t-muted mb-1.5">Avtor *</label>
                <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)}
                  className="w-full bg-surface border border-b-default rounded-lg px-4 py-2.5 text-t-primary placeholder-t-faint focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  placeholder="Ime avtorja" required />
              </div>
              <div>
                <label className="block text-sm text-t-muted mb-1.5">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as BookData["status"])}
                  className="w-full bg-surface border border-b-default rounded-lg px-4 py-2.5 text-t-primary focus:outline-none focus:ring-2 focus:ring-brand-500 transition cursor-pointer">
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.emoji} {opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-t-muted mb-1.5">Žanr</label>
                <select value={genre} onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-surface border border-b-default rounded-lg px-4 py-2.5 text-t-primary focus:outline-none focus:ring-2 focus:ring-brand-500 transition cursor-pointer">
                  <option value="">Brez žanra</option>
                  {GENRES.map((g) => (<option key={g} value={g}>{g}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-t-muted mb-1.5">Leto</label>
                <input type="number" value={year} onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-surface border border-b-default rounded-lg px-4 py-2.5 text-t-primary placeholder-t-faint focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  placeholder="2023" min="1000" max="2100" />
              </div>
              <div>
                <label className="block text-sm text-t-muted mb-1.5">Ocena (1–10)</label>
                <div className="relative">
                  <select
                    value={rating !== null ? rating : ""}
                    onChange={(e) => setRating(e.target.value ? parseInt(e.target.value, 10) : null)}
                    className="w-full bg-surface border border-b-default rounded-lg px-4 py-2.5 text-t-primary focus:outline-none focus:ring-2 focus:ring-brand-500 transition cursor-pointer appearance-none pr-10"
                  >
                    <option value="">Brez ocene</option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        ⭐ {num} / 10 {num >= 9 ? "(Odlično)" : num >= 7 ? "(Dobro)" : num >= 5 ? "(Povprečno)" : ""}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-amber-400 flex items-center gap-1 text-sm font-medium">
                    {rating !== null && <span className="text-t-primary font-bold">{rating}/10</span>}
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-t-muted mb-1.5">Opombe</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-surface border border-b-default rounded-lg px-4 py-2.5 text-t-primary placeholder-t-faint focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-none"
                placeholder="Vaše opombe o knjigi..." rows={2} />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-brand-600/50 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Save className="w-4 h-4" />{book ? "Shrani spremembe" : "Dodaj knjigo"}</>
              )}
            </button>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}