"use client";

import { Edit3, Trash2, Star, BookOpen } from "lucide-react";
import type { BookData } from "./Dashboard";

interface Props {
  book: BookData;
  onEdit: () => void;
  onDelete: () => void;
}

const statusConfig: Record<string, { label: string; className: string; emoji: string }> = {
  wishlist: { label: "Želja", className: "bg-purple-500/20 text-purple-400 border-purple-500/30", emoji: "💫" },
  reading: { label: "V branju", className: "bg-blue-500/20 text-blue-400 border-blue-500/30", emoji: "📖" },
  read: { label: "Prebrana", className: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30", emoji: "✅" },
  reserved: { label: "Rezervirana", className: "bg-amber-500/20 text-amber-500 border-amber-500/30", emoji: "📌" },
  unavailable: { label: "Ni na voljo", className: "bg-red-500/20 text-red-400 border-red-500/30", emoji: "❌" },
  cancelled: { label: "Prenehal(a) z branjem", className: "bg-gray-500/20 text-gray-400 border-gray-500/30", emoji: "🚫" },
};

export default function BookCard({ book, onEdit, onDelete }: Props) {
  const status = statusConfig[book.status] || statusConfig.wishlist;

  return (
    <div className="group bg-card border border-b-default rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 hover:border-brand-500/30">
      <div className="flex gap-3 p-4">
        {/* Thumbnail */}
        <div className="w-20 h-28 bg-surface-lighter rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
          {book.thumbnail ? (
            <img src={book.thumbnail} alt={book.title} className="w-full h-full object-cover" />
          ) : (
            <BookOpen className="w-8 h-8 text-t-faint" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-t-primary leading-tight line-clamp-2" title={book.title}>
                {book.title}
              </h3>
              <p className="text-sm text-t-muted truncate mt-0.5">{book.author}</p>
            </div>

            {/* Actions - Popravljeno: na mobilnih vedno vidno, na racunalniku ob hoverju */}
            <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
              <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-surface-lighter transition cursor-pointer" title="Uredi">
                <Edit3 className="w-4 h-4 text-t-muted" />
              </button>
              <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/20 transition cursor-pointer" title="Izbriši">
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="mt-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${status.className}`}>
              <span>{status.emoji}</span>
              {status.label}
            </span>
          </div>

          {/* Rating */}
          {book.rating !== null && (
            <div className="flex items-center gap-1 mt-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 10 }, (_, i) => (
                  <Star key={i} className={`w-3 h-3 ${i < book.rating! ? "fill-amber-400 text-amber-400" : "text-t-faint/30"}`} />
                ))}
              </div>
              <span className="text-xs text-t-muted ml-1">{book.rating}/10</span>
            </div>
          )}

          {/* Meta */}
          <div className="flex gap-2 mt-auto pt-2 text-xs text-t-faint">
            {book.year && <span>{book.year}</span>}
            {book.genre && <span>• {book.genre}</span>}
            {book.pageCount && <span>• {book.pageCount} str.</span>}
          </div>
        </div>
      </div>

      {/* Notes */}
      {book.notes && (
        <div className="px-4 pb-3">
          <p className="text-xs text-t-faint italic line-clamp-2 border-t border-b-light pt-2">
            &ldquo;{book.notes}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}