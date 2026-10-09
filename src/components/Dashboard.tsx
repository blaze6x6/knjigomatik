"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, ChevronDown, Database, ExternalLink, Library, LogOut, Plus, Search, UserCog, Users, X } from "lucide-react";
import { apiJson } from "@/lib/api";
import { STATUS, STATUS_ORDER, type BookStatus } from "@/lib/status";
import type { BookData, SessionUserInfo } from "@/lib/types";
import AccountModal from "./AccountModal";
import AdminPanel from "./AdminPanel";
import BookCard from "./BookCard";
import BookModal from "./BookModal";
import ConfirmDialog from "./ConfirmDialog";
import DataModal from "./DataModal";
import Logo from "./Logo";
import StatsPanel from "./StatsPanel";
import SummaryModal from "./SummaryModal";
import ThemePicker from "./ThemePicker";
import { useToast } from "./Toast";

interface Props {
  user: SessionUserInfo;
  onLogout: () => void;
  onUserChange: (u: SessionUserInfo) => void;
  emailEnabled: boolean;
}

type Tab = "books" | "stats" | "admin";
type Filter = "all" | BookStatus;
type Sort = "updated" | "added" | "title" | "author" | "rating" | "finished";

const SORTS: { value: Sort; label: string }[] = [
  { value: "updated", label: "Nazadnje spremenjene" },
  { value: "added", label: "Nazadnje dodane" },
  { value: "title", label: "Naslov (A–Ž)" },
  { value: "author", label: "Avtor (A–Ž)" },
  { value: "rating", label: "Ocena (najvišja)" },
  { value: "finished", label: "Datum branja (najnovejše)" },
];

const collator = new Intl.Collator("sl");

function compare(sort: Sort): (a: BookData, b: BookData) => number {
  switch (sort) {
    case "title": return (a, b) => collator.compare(a.title, b.title);
    case "author": return (a, b) => collator.compare(a.author, b.author) || collator.compare(a.title, b.title);
    case "rating": return (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || collator.compare(a.title, b.title);
    case "finished": return (a, b) => (b.finishedAt ?? "").localeCompare(a.finishedAt ?? "") || b.updatedAt.localeCompare(a.updatedAt);
    case "added": return (a, b) => b.createdAt.localeCompare(a.createdAt);
    default: return (a, b) => b.updatedAt.localeCompare(a.updatedAt);
  }
}

export default function Dashboard({ user, onLogout, onUserChange, emailEnabled }: Props) {
  const toast = useToast();
  const [books, setBooks] = useState<BookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState<Tab>("books");

  const [filter, setFilter] = useState<Filter>("all");
  const [genre, setGenre] = useState("");
  const [sort, setSort] = useState<Sort>("updated");
  const [query, setQuery] = useState("");

  const [bookModal, setBookModal] = useState<{ book: BookData | null } | null>(null);
  const [summaryBook, setSummaryBook] = useState<BookData | null>(null);
  const [deleteBook, setDeleteBook] = useState<BookData | null>(null);
  const [showAccount, setShowAccount] = useState(false);
  const [showData, setShowData] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchBooks = useCallback(async () => {
    const res = await apiJson<{ books: BookData[] }>("/api/books");
    if (res.ok) { setBooks(res.data.books); setLoadError(""); }
    else setLoadError(res.error);
    setLoading(false);
  }, []);
  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [menuOpen]);

  const upsert = useCallback((book: BookData) => {
    setBooks((prev) => (prev.some((b) => b.id === book.id) ? prev.map((b) => (b.id === book.id ? book : b)) : [book, ...prev]));
  }, []);

  async function quickStatus(book: BookData, status: BookStatus) {
    const res = await apiJson<{ book: BookData }>(`/api/books/${book.id}`, { method: "PUT", body: JSON.stringify({ status }) });
    if (!res.ok) return toast(res.error, "error");
    upsert(res.data.book);
    toast(status === "read" ? "Označeno kot prebrano 🎉" : "Veselo branje!");
  }

  async function confirmDelete() {
    if (!deleteBook) return;
    const res = await apiJson(`/api/books/${deleteBook.id}`, { method: "DELETE" });
    if (!res.ok) { toast(res.error, "error"); return; }
    setBooks((prev) => prev.filter((b) => b.id !== deleteBook.id));
    setDeleteBook(null);
    toast("Knjiga izbrisana");
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: books.length };
    for (const b of books) c[b.status] = (c[b.status] || 0) + 1;
    return c;
  }, [books]);

  const genres = useMemo(() => Array.from(new Set(books.map((b) => b.genre).filter((g): g is string => !!g))).sort((a, b) => collator.compare(a, b)), [books]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return books
      .filter((b) => (filter === "all" || b.status === filter) && (!genre || b.genre === genre)
        && (!q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)))
      .sort(compare(sort));
  }, [books, filter, genre, query, sort]);

  const tabs: { id: Tab; label: string; icon: typeof Library }[] = [
    { id: "books", label: "Knjige", icon: Library },
    { id: "stats", label: "Statistika", icon: BarChart3 },
    ...(user.isAdmin ? [{ id: "admin" as Tab, label: "Uporabniki", icon: Users }] : []),
  ];

  const filtersActive = filter !== "all" || genre || query;

  return (
    <div className="min-h-screen pb-24 md:pb-10">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size={34} />
            <span className="heading text-xl font-semibold hidden sm:block">Knjigomatik</span>
          </div>

          <nav className="hidden md:flex items-center gap-1" aria-label="Glavna navigacija">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined}
                className={`btn min-h-9! ${tab === id ? "bg-sunk text-ink" : "text-muted hover:text-ink hover:bg-sunk/60"}`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
            <a href="https://plus.cobiss.net/cobiss/si/sl/search/cobib" target="_blank" rel="noopener noreferrer" className="btn min-h-9! text-muted hover:text-ink hover:bg-sunk/60">
              <ExternalLink className="w-4 h-4" />COBISS
            </a>
          </nav>

          <div className="flex items-center gap-1.5">
            <ThemePicker />
            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenuOpen((o) => !o)} aria-haspopup="menu" aria-expanded={menuOpen}
                className="btn btn-ghost px-2! py-1! min-h-10! gap-2">
                <span className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center text-sm heading font-semibold" aria-hidden="true">
                  {user.displayName.charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:block max-w-[10rem] truncate text-ink">{user.displayName}</span>
                <ChevronDown className="w-4 h-4 text-muted" />
              </button>
              {menuOpen && (
                <div role="menu" className="absolute right-0 mt-2 w-60 card panel-shadow py-1.5 animate-fade-in z-50">
                  <div className="px-3.5 py-2 border-b border-line mb-1">
                    <div className="text-sm font-semibold text-ink truncate">{user.displayName}</div>
                    <div className="text-xs text-muted">@{user.username}{user.isAdmin ? " · skrbnik" : ""}</div>
                  </div>
                  <MenuItem icon={UserCog} onClick={() => { setMenuOpen(false); setShowAccount(true); }}>Moj račun in geslo</MenuItem>
                  <MenuItem icon={Database} onClick={() => { setMenuOpen(false); setShowData(true); }}>Uvoz in izvoz</MenuItem>
                  <a role="menuitem" href="https://plus.cobiss.net/cobiss/si/sl/search/cobib" target="_blank" rel="noopener noreferrer"
                    className="md:hidden flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-ink-2 hover:bg-sunk">
                    <ExternalLink className="w-4 h-4" />COBISS
                  </a>
                  <div className="border-t border-line mt-1 pt-1">
                    <MenuItem icon={LogOut} onClick={onLogout}>Odjava</MenuItem>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {tab === "books" && (
          <div className="animate-fade-in">
            <div className="flex items-end justify-between gap-4 mb-5">
              <div>
                <h1 className="heading text-3xl font-semibold">Moja polica</h1>
                <p className="text-sm text-muted mt-1">
                  {books.length === 0 ? "Začnite z dodajanjem prve knjige." : `${books.length} ${books.length === 1 ? "knjiga" : "knjig"}, ${counts.reading || 0} v branju`}
                </p>
              </div>
              <button className="btn btn-primary hidden sm:inline-flex" onClick={() => setBookModal({ book: null })}>
                <Plus className="w-4 h-4" />Dodaj knjigo
              </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-faint absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input type="search" className="input pl-10! pr-10!" value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Išči po naslovu ali avtorju …" aria-label="Iskanje po knjigah" />
                {query && (
                  <button onClick={() => setQuery("")} className="btn btn-icon absolute right-1 top-1/2 -translate-y-1/2" aria-label="Počisti iskanje"><X className="w-4 h-4" /></button>
                )}
              </div>
              <div className="flex gap-3">
                {genres.length > 0 && (
                  <select className="input lg:w-48" value={genre} onChange={(e) => setGenre(e.target.value)} aria-label="Filter po žanru">
                    <option value="">Vsi žanri</option>
                    {genres.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                )}
                <select className="input lg:w-56" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Razvrščanje">
                  {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div className="scroll-x -mx-4 px-4 sm:mx-0 sm:px-0 mb-6">
              <div className="flex gap-2 w-max sm:w-auto sm:flex-wrap" role="group" aria-label="Filter po statusu">
                <button className="chip" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>Vse <span className="count">{counts.all}</span></button>
                {STATUS_ORDER.filter((s) => (counts[s] || 0) > 0 || filter === s).map((s) => (
                  <button key={s} className="chip" aria-pressed={filter === s} onClick={() => setFilter(s)}>
                    {STATUS[s].short} <span className="count">{counts[s] || 0}</span>
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="py-24 flex justify-center"><div className="w-9 h-9 border-[3px] border-brand border-t-transparent rounded-full animate-spin" role="status" aria-label="Nalagam" /></div>
            ) : loadError ? (
              <div className="alert alert-error flex items-center justify-between gap-3">
                <span>{loadError}</span>
                <button className="btn btn-ghost min-h-8!" onClick={fetchBooks}>Poskusi znova</button>
              </div>
            ) : visible.length === 0 ? (
              <div className="py-16 text-center">
                <div className="flex items-end justify-center gap-1.5 h-20 mb-2" aria-hidden="true">
                  {[44, 64, 52, 72, 48, 60].map((h, i) => (
                    <div key={i} className="w-5 rounded-t-sm" style={{ height: h, background: ["var(--brand)", "var(--brass)", "var(--sky)", "var(--moss)", "var(--plum)", "var(--rust)"][i], opacity: 0.85 }} />
                  ))}
                </div>
                <div className="shelf-rule max-w-xs mx-auto mb-6" />
                <p className="heading text-xl text-ink mb-1">{books.length === 0 ? "Polica je še prazna" : "Nič ni najdenega"}</p>
                <p className="text-sm text-muted mb-5">
                  {books.length === 0 ? "Dodajte prvo knjigo ročno ali z vnosom ISBN." : "Poskusite z drugim iskanjem ali filtrom."}
                </p>
                {books.length === 0 ? (
                  <button className="btn btn-primary" onClick={() => setBookModal({ book: null })}><Plus className="w-4 h-4" />Dodaj knjigo</button>
                ) : filtersActive ? (
                  <button className="btn btn-ghost" onClick={() => { setFilter("all"); setGenre(""); setQuery(""); }}>Počisti filtre</button>
                ) : null}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((book) => (
                  <BookCard key={book.id} book={book}
                    onEdit={() => setBookModal({ book })}
                    onDelete={() => setDeleteBook(book)}
                    onOpenSummary={() => setSummaryBook(book)}
                    onStatus={(s) => quickStatus(book, s)} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "stats" && (
          <div>
            <h1 className="heading text-3xl font-semibold mb-5">Statistika</h1>
            {loading ? <div className="py-20 text-center text-muted">Nalagam …</div> : <StatsPanel books={books} />}
          </div>
        )}
        {tab === "admin" && user.isAdmin && <AdminPanel currentUser={user} emailEnabled={emailEnabled} />}
      </main>

      {/* Plavajoči gumb za dodajanje na telefonu */}
      {tab === "books" && (
        <button onClick={() => setBookModal({ book: null })} aria-label="Dodaj knjigo"
          className="sm:hidden fixed right-4 bottom-20 z-30 w-14 h-14 rounded-full bg-brand text-white shadow-lg flex items-center justify-center cursor-pointer active:scale-95 transition">
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Spodnja navigacija (telefon) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-line bg-paper/95 backdrop-blur-md bottom-nav" aria-label="Glavna navigacija">
        <div className="flex">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold cursor-pointer ${tab === id ? "text-brand-text" : "text-muted"}`}>
              <Icon className="w-5 h-5" />{label}
            </button>
          ))}
        </div>
      </nav>

      {bookModal && (
        <BookModal book={bookModal.book} onClose={() => setBookModal(null)}
          onSaved={(b, isNew) => { upsert(b); setBookModal(null); toast(isNew ? "Knjiga dodana" : "Spremembe shranjene"); }} />
      )}
      {summaryBook && (
        <SummaryModal book={summaryBook} onClose={() => setSummaryBook(null)}
          onSaved={(b) => { upsert(b); setSummaryBook(null); toast("Povzetek shranjen"); }} />
      )}
      {deleteBook && (
        <ConfirmDialog title="Izbris knjige" message={`Knjiga »${deleteBook.title}« bo trajno izbrisana.`} confirmLabel="Izbriši" danger
          onCancel={() => setDeleteBook(null)} onConfirm={confirmDelete} />
      )}
      {showAccount && <AccountModal user={user} emailEnabled={emailEnabled} onClose={() => setShowAccount(false)} onUserChange={onUserChange} />}
      {showData && <DataModal bookCount={books.length} onClose={() => setShowData(false)} onImported={fetchBooks} />}
    </div>
  );
}

function MenuItem({ icon: Icon, onClick, children }: { icon: typeof Library; onClick: () => void; children: React.ReactNode }) {
  return (
    <button role="menuitem" onClick={onClick} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-ink-2 hover:bg-sunk text-left cursor-pointer">
      <Icon className="w-4 h-4" />{children}
    </button>
  );
}
