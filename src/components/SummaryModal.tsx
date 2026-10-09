"use client";

import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { apiJson } from "@/lib/api";
import type { BookData } from "@/lib/types";
import Modal from "./Modal";

interface Props {
  book: BookData;
  onClose: () => void;
  onSaved: (book: BookData) => void;
}

export default function SummaryModal({ book, onClose, onSaved }: Props) {
  const [text, setText] = useState(book.summary || "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  async function save(summary: string | null) {
    setSaving(true);
    setError("");
    const res = await apiJson<{ book: BookData }>(`/api/books/${book.id}`, { method: "PUT", body: JSON.stringify({ summary }) });
    setSaving(false);
    if (!res.ok) return setError(res.error);
    onSaved(res.data.book);
  }

  return (
    <Modal title="Povzetek in vtisi" subtitle={`${book.title} – ${book.author}`} onClose={onClose} size="lg">
      <div className="space-y-3">
        {error && <div className="alert alert-error">{error}</div>}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="O čem je knjiga? Kaj vam je ostalo v spominu?"
          className="input min-h-[40vh] sm:min-h-[320px] font-serif text-[1.05rem] leading-relaxed"
          maxLength={20000}
        />
        <div className="flex items-center justify-between gap-2">
          {book.summary ? (
            <button
              type="button"
              className="btn btn-danger"
              disabled={saving}
              onClick={() => (confirmDelete ? save(null) : setConfirmDelete(true))}
            >
              <Trash2 className="w-4 h-4" />{confirmDelete ? "Res izbrišem" : "Izbriši povzetek"}
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Prekliči</button>
            <button type="button" className="btn btn-primary" disabled={saving} onClick={() => save(text.trim() || null)}>
              <Save className="w-4 h-4" />{saving ? "Shranjujem …" : "Shrani"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
