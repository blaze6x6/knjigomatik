"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BookOpen, Plus, LogOut, Users, BarChart3, Library,
  Search, Menu, X, Filter, ExternalLink, Save, Trash2
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import BookCard from "./BookCard";
import BookModal from "./BookModal";
import StatsPanel from "./StatsPanel";
import AdminPanel from "./AdminPanel";
import ThemeToggle from "./ThemeToggle";
import ModalPortal from "./ModalPortal";

export interface BookData {
  id: string;
  userId: string;
  googleBooksId: string | null;
  title: string;
  author: string;
  status: "wishlist" | "reading" | "read" | "reserved" | "unavailable" | "cancelled";
  rating: number | null;
  color: string;
  summary: string | null; // Zamenjano iz notes
  genre: string | null;
  year: number | null;
  thumbnail: string | null;
  description: string | null;
  isbn: string | null;
  pageCount: number | null;
  publisher: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  user: { userId: string; username: string; displayName: string; isAdmin: boolean };
  onLogout: () => void;
}

type TabType = "books" | "stats" | "admin";
type FilterStatus = "all" | "wishlist" | "reading" | "read" | "reserved" | "unavailable" | "cancelled";

export default function Dashboard({ user, onLogout }: Props) {
  const [books, setBooks] = useState<BookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("books");
  const [showBookModal, setShowBookModal] = useState(false);
  const [editingBook, setEditingBook] = useState<BookData | null>(null);
  
  // Stanje za modalno okno za urejanje/prikaz povzetka
  const [summaryModalBook, setSummaryModalBook] = useState<BookData | null>(null);
  const [summaryText, setSummaryText] = useState("");
  const [summarySaving, setSummarySaving] = useState(false);

  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileFilterMenu, setShowMobileFilterMenu] = useState(false);

  const fetchBooks = useCallback(async () => {
    try {
      const res = await apiFetch("/api/books");
      if (res.ok) {
        const data = await res.json();
        setBooks(data.books);
      }
    } catch (err) {
      console.error("Fetch books error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  function handleEdit(book: BookData) {
    setEditingBook(book);
    setShowBookModal(true);
  }

  async function handleDelete(bookId: string) {
    if (!confirm("Ali ste prepričani, da želite izbrisati to knjigo?")) return;
    try {
      const res = await apiFetch(`/api/books/${bookId}`, { method: "DELETE" });
      if (res.ok) setBooks((prev) => prev.filter((b) => b.id !== bookId));
    } catch (err) { console.error("Delete error:", err); }
  }

  function handleBookSaved() {
    setShowBookModal(false);
    setEditingBook(null);
    fetchBooks();
  }

  // Odpiranje modalnega okna za povzetek
  function openSummaryModal(book: BookData) {
    setSummaryModalBook(book);
    setSummaryText(book.summary || "");
  }

  // Shranjevanje ali brisanje povzetka iz dashboard modalnega okna
  async function handleSaveSummary() {
    if (!summaryModalBook) return;
    setSummarySaving(true);
    try {
      const res = await apiFetch(`/api/books/${summaryModalBook.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...summaryModalBook,
          summary: summaryText.trim() ? summaryText.trim() : null,
        }),
      });
      if (res.ok) {
        setSummaryModalBook(null);
        fetchBooks();
      }
    } catch (err) {
      console.error("Napaka pri shranjevanju povzetka:", err);
    } finally {
      setSummarySaving(false);
    }
  }

  async function handleDeleteSummary() {
    setSummaryText("");
  }

  const filteredBooks = books.filter((book) => {
    const matchesStatus = filterStatus === "all" || book.status === filterStatus;
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      book.title.toLowerCase().includes(query) || 
      book.author.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    all: books.length,
    wishlist: books.filter((b) => b.status === "wishlist").length,
    reading: books.filter((b) => b.status === "reading").length,
    read: books.filter((b) => b.status === "read").length,
    reserved: books.filter((b) => b.status === "reserved").length,
    unavailable: books.filter((b) => b.status === "unavailable").length,
    cancelled: books.filter((b) => b.status === "cancelled").length,
  };

  const statusLabels: Record<FilterStatus, string> = {
    all: "Vse",
    wishlist: "Želja",
    reading: "V branju",
    read: "Prebrane",
    reserved: "Rezervirane",
    unavailable: "Ni na voljo",
    cancelled: "Prenehal(a) z branjem",
  };

  return (
    <div className="min-h-screen bg-surface transition-colors duration-300">
      <header className="bg-surface-light/80 backdrop-blur-xl border-b border-b-default sticky top-0 z-40 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-brand-600/20 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-brand-400" />
              </div>
              <span className="font-bold text-lg text-t-primary hidden sm:block">Knjigomatik</span>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              <button onClick={() => setActiveTab("books")}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition cursor-pointer ${
                  activeTab === "books" ? "bg-brand-600/20 text-brand-400" : "text-t-muted hover:text-t-primary hover:bg-surface-lighter/50"
                }`}>
                <Library className="w-4 h-4" />Knjige
              </button>
              <button onClick={() => setActiveTab("stats")}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition cursor-pointer ${
                  activeTab === "stats" ? "bg-brand-600/20 text-brand-400" : "text-t-muted hover:text-t-primary hover:bg-surface-lighter/50"
                }`}>
                <BarChart3 className="w-4 h-4" />Statistika
              </button>
              {user.isAdmin && (
                <button onClick={() => setActiveTab("admin")}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition cursor-pointer ${
                    activeTab === "admin" ? "bg-brand-600/20 text-brand-400" : "text-t-muted hover:text-t-primary hover:bg-surface-lighter/50"
                  }`}>
                  <Users className="w-4 h-4" />Uporabniki
                </button>
              )}
              <a 
                href="https://plus.cobiss.net/cobiss/si/sl/search/cobib" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-t-muted hover:text-t-primary hover:bg-surface-lighter/50 transition cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />COBISS
              </a>
            </nav>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-accent-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="text-sm">
                  <span className="text-t-secondary">{user.displayName}</span>
                  {user.isAdmin && (
                    <span className="ml-2 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-md font-medium">Admin</span>
                  )}
                </div>
              </div>
              <ThemeToggle />
              <button onClick={onLogout}
                className="p-2 text-t-muted hover:text-t-primary hover:bg-surface-lighter/50 rounded-lg transition cursor-pointer" title="Odjava">
                <LogOut className="w-4 h-4" />
              </button>
              <button onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-t-muted hover:text-t-primary rounded-lg transition cursor-pointer">
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
          {showMobileMenu && (
            <div className="md:hidden pb-3 flex gap-1 animate-fade-in border-t border-b-default pt-2">
              <button onClick={() => { setActiveTab("books"); setShowMobileMenu(false); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${activeTab === "books" ? "bg-brand-600/20 text-brand-400" : "text-t-muted"}`}>
                Knjige
              </button>
              <button onClick={() => { setActiveTab("stats"); setShowMobileMenu(false); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${activeTab === "stats" ? "bg-brand-600/20 text-brand-400" : "text-t-muted"}`}>
                Statistika
              </button>
              {user.isAdmin && (
                <button onClick={() => { setActiveTab("admin"); setShowMobileMenu(false); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${activeTab === "admin" ? "bg-brand-600/20 text-brand-400" : "text-t-muted"}`}>
                  Uporabniki
                </button>
              )}
              <a 
                href="https://plus.cobiss.net/cobiss/si/sl/search/cobib" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-t-muted hover:text-t-primary flex items-center gap-2 transition cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />COBISS
              </a>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === "books" && (
          <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex-1 bg-surface-light border border-b-default rounded-xl px-4 py-2.5 flex items-center gap-2 focus-within:ring-2 focus-within:ring-brand-500 transition">
                <Search className="w-4 h-4 text-t-faint shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Išči po svojih knjigah (naslov ali avtor)..."
                  className="w-full bg-transparent text-t-primary placeholder-t-faint focus:outline-none text-sm"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-t-faint hover:text-t-primary">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button onClick={() => { setEditingBook(null); setShowBookModal(true); }}
                className="bg-brand-600 hover:bg-brand-500 text-white font-medium px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition whitespace-nowrap cursor-pointer">
                <Plus className="w-4 h-4" />Dodaj knjigo ročno
              </button>
            </div>

            <div className="mb-6">
              <div className="sm:hidden flex items-center justify-between mb-2">
                <button
                  onClick={() => setShowMobileFilterMenu(!showMobileFilterMenu)}
                  className="w-full bg-surface-light border border-b-default px-4 py-2.5 rounded-xl text-sm font-medium text-t-primary flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-brand-400" />
                    Filter: <strong className="text-brand-400">{statusLabels[filterStatus]}</strong> ({statusCounts[filterStatus]})
                  </span>
                  <Menu className="w-4 h-4 text-t-muted" />
                </button>
              </div>

              {showMobileFilterMenu && (
                <div className="sm:hidden bg-surface-light border border-b-default rounded-xl p-2 mb-3 space-y-1 animate-fade-in shadow-lg">
                  {(Object.keys(statusLabels) as FilterStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setFilterStatus(status);
                        setShowMobileFilterMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between transition ${
                        filterStatus === status
                          ? "bg-brand-600 text-white"
                          : "text-t-muted hover:text-t-primary hover:bg-surface-lighter/50"
                      }`}
                    >
                      <span>{statusLabels[status]}</span>
                      <span className="opacity-80 px-2 py-0.5 rounded-full text-xs bg-black/10">
                        {statusCounts[status]}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="hidden sm:flex gap-2 overflow-x-auto pb-1">
                {(Object.keys(statusLabels) as FilterStatus[]).map((status) => (
                  <button key={status} onClick={() => setFilterStatus(status)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition cursor-pointer ${
                      filterStatus === status
                        ? "bg-brand-600 text-white"
                        : "bg-surface-light text-t-muted hover:text-t-primary border border-b-default"
                    }`}>
                    {statusLabels[status]}
                    <span className="ml-1.5 opacity-60">{statusCounts[status]}</span>
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-surface-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-t-faint" />
                </div>
                <p className="text-t-muted text-lg mb-2">
                  {books.length === 0 ? "Nimate še dodanih knjig" : "Ni najdenih knjig"}
                </p>
                <p className="text-t-faint text-sm">
                  {books.length === 0 ? "Kliknite na »Dodaj knjigo ročno« za začetek" : "Poskusite z drugim iskalnim nizom ali filtrom"}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredBooks.map((book, i) => (
                  <div key={book.id} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                    <BookCard 
                      book={book} 
                      onEdit={() => handleEdit(book)} 
                      onDelete={() => handleDelete(book.id)} 
                      onOpenSummary={() => openSummaryModal(book)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "stats" && <StatsPanel />}
        {activeTab === "admin" && user.isAdmin && <AdminPanel />}
      </main>

      {/* Modal za urejanje knjige */}
      {showBookModal && (
        <BookModal book={editingBook}
          onClose={() => { setShowBookModal(false); setEditingBook(null); }}
          onSaved={handleBookSaved} />
      )}

      {/* Modalno okno za prikaz in urejanje povzetka */}
      {summaryModalBook && (
        <ModalPortal>
          <div className="fixed inset-0 bg-backdrop backdrop-blur-sm" onClick={() => setSummaryModalBook(null)} />
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative bg-surface-light border border-b-default rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-t-primary">Povzetek knjige</h3>
                  <p className="text-xs text-t-muted">{summaryModalBook.title} – {summaryModalBook.author}</p>
                </div>
                <button onClick={() => setSummaryModalBook(null)} className="p-2 hover:bg-surface-lighter rounded-lg transition cursor-pointer">
                  <X className="w-5 h-5 text-t-muted" />
                </button>
              </div>

              <div className="space-y-4">
                <textarea
                  value={summaryText}
                  onChange={(e) => setSummaryText(e.target.value)}
                  placeholder="Napišite ali uredite povzetek knjige..."
                  rows={6}
                  className="w-full bg-surface border border-b-default rounded-lg px-4 py-3 text-t-primary placeholder-t-faint focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-none text-sm"
                />

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleDeleteSummary}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> Izbriši povzetek
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSummaryModalBook(null)}
                      className="px-4 py-2 bg-surface-lighter hover:bg-surface-lighter/80 text-t-muted rounded-lg text-sm font-medium transition cursor-pointer"
                    >
                      Prekliči
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSummary}
                      disabled={summarySaving}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> {summarySaving ? "Shranjujem..." : "Shrani povzetek"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
