"use client";

import { BookCheck, BookOpen, ExternalLink, FileText, Pencil, Star, Trash2 } from "lucide-react";
import { STATUS, type BookStatus } from "@/lib/status";
import type { BookData } from "@/lib/types";
import BookCover from "./BookCover";

interface Props {
  book: BookData;
  onEdit: () => void;
  onDelete: () => void;
  onOpenSummary: () => void;
  onStatus: (status: BookStatus) => void;
}

const TONE_VAR: Record<string, string> = {
  plum: "var(--plum)", sky: "var(--sky)", moss: "var(--moss)", brass: "var(--brass)", rust: "var(--rust)", stone: "var(--stone)",
};

const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("sl-SI", { day: "numeric", month: "numeric", year: "numeric" });

export default function BookCard({ book, onEdit, onDelete, onOpenSummary, onStatus }: Props) {
  const st = STATUS[book.status] ?? STATUS.wishlist;
  const customColor = book.color && book.color.toLowerCase() !== "#ffffff" ? book.color : null;
  const spine = customColor ?? TONE_VAR[st.tone];
  const cobiss = book.description?.startsWith("https://plus.cobiss.net/") ? book.description : null;

  const meta = [book.year, book.genre, book.pageCount ? `${book.pageCount} str.` : null].filter(Boolean).join(" · ");
  const dates =
    book.status === "read" && book.finishedAt ? `Prebrana ${fmtDate(book.finishedAt)}`
    : book.status === "reading" && book.startedAt ? `Začeta ${fmtDate(book.startedAt)}`
    : null;

  return (
    <article className="card book-card group flex flex-col h-full" style={{ "--spine": spine } as React.CSSProperties}>
      <div className="book-spine" aria-hidden="true" />
      <div className="flex gap-3.5 p-4 pl-5 min-w-0 flex-1">
        <BookCover title={book.title} author={book.author} thumbnail={book.thumbnail} color={book.color} />

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <h3 className="heading font-semibold text-ink leading-snug line-clamp-2 break-words" title={book.title}>{book.title}</h3>
              <p className="text-sm text-muted truncate mt-0.5">{book.author}</p>
            </div>
            <div className="flex shrink-0 -mr-1.5 -mt-1 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
              <button onClick={onEdit} className="btn btn-icon" title="Uredi" aria-label={`Uredi: ${book.title}`}><Pencil className="w-4 h-4" /></button>
              <button onClick={onDelete} className="btn btn-icon hover:text-rust!" title="Izbriši" aria-label={`Izbriši: ${book.title}`}><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <span className={`badge tone-${st.tone}`}>{st.label}</span>
            {book.rating !== null && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-brass" title={`Ocena ${book.rating} od 10`}>
                <Star className="w-3.5 h-3.5 fill-current" />{book.rating}/10
              </span>
            )}
          </div>

          <div className="mt-auto pt-2 text-xs text-faint space-y-0.5">
            {dates && <div className="text-muted">{dates}</div>}
            {meta && <div className="truncate">{meta}</div>}
          </div>
        </div>
      </div>

      <div className="px-4 pl-5 py-2 border-t border-line bg-sunk/50 flex items-center gap-2 min-h-[44px]">
        <button
          onClick={onOpenSummary}
          className="flex-1 min-w-0 flex items-center gap-1.5 text-left text-xs text-muted hover:text-brand-text cursor-pointer"
          title={book.summary ? "Odpri povzetek" : "Dodaj povzetek"}
        >
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span className={`truncate ${book.summary ? "italic" : ""}`}>{book.summary ? book.summary : "Dodaj povzetek"}</span>
        </button>

        {cobiss && (
          <a href={cobiss} target="_blank" rel="noopener noreferrer" className="btn btn-icon min-h-8! min-w-8!" title="Odpri v COBISS" aria-label="Odpri v COBISS">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        {(book.status === "wishlist" || book.status === "reserved") && (
          <button onClick={() => onStatus("reading")} className="btn btn-ghost min-h-8! px-2.5! py-1! text-xs! shrink-0">
            <BookOpen className="w-3.5 h-3.5" />Začni brati
          </button>
        )}
        {book.status === "reading" && (
          <button onClick={() => onStatus("read")} className="btn btn-ghost min-h-8! px-2.5! py-1! text-xs! shrink-0">
            <BookCheck className="w-3.5 h-3.5" />Prebrano
          </button>
        )}
      </div>
    </article>
  );
}
