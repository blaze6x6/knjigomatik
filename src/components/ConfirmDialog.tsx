"use client";

import { useState } from "react";
import Modal from "./Modal";

interface Props {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export default function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onCancel }: Props) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal title={title} onClose={onCancel} size="sm">
      <p className="text-sm text-ink-2 leading-relaxed">{message}</p>
      <div className="flex justify-end gap-2 mt-5">
        <button className="btn btn-ghost" onClick={onCancel} disabled={busy}>Prekliči</button>
        <button
          className={`btn ${danger ? "btn-danger-solid" : "btn-primary"}`}
          disabled={busy}
          onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } }}
        >
          {busy ? "Počakajte …" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
