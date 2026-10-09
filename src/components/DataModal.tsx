"use client";

import { useRef, useState } from "react";
import { Download, FileJson, FileSpreadsheet, Upload } from "lucide-react";
import { apiJson } from "@/lib/api";
import Modal from "./Modal";

interface Props {
  bookCount: number;
  onClose: () => void;
  onImported: () => void;
}

interface ImportResult { imported: number; skipped: number; errorCount: number; errors: { row: number; error: string }[] }

export default function DataModal({ bookCount, onClose, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(""); setResult(null);
    if (file.size > 20 * 1024 * 1024) return setError("Datoteka je prevelika (največ 20 MB)");
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      return setError("Datoteka ni veljaven JSON. Uporabite izvoz iz Knjigomatika (JSON).");
    }
    setBusy(true);
    const res = await apiJson<ImportResult>("/api/books/import", { method: "POST", body: JSON.stringify(parsed) });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setResult(res.data);
    if (res.data.imported > 0) onImported();
  }

  return (
    <Modal title="Uvoz in izvoz" subtitle="Varnostna kopija vaše police" onClose={onClose}>
      <div className="space-y-6">
        <section>
          <h3 className="heading font-semibold mb-1">Izvoz ({bookCount} knjig)</h3>
          <p className="text-sm text-muted mb-3">JSON je primeren za varnostno kopijo in ponovni uvoz, CSV za Excel ali Google Preglednice.</p>
          <div className="flex flex-wrap gap-2">
            <a className="btn btn-ghost" href="/api/books/export?format=json" download><FileJson className="w-4 h-4" />Prenesi JSON</a>
            <a className="btn btn-ghost" href="/api/books/export?format=csv" download><FileSpreadsheet className="w-4 h-4" />Prenesi CSV</a>
          </div>
        </section>

        <section className="border-t border-line pt-6">
          <h3 className="heading font-semibold mb-1">Uvoz</h3>
          <p className="text-sm text-muted mb-3">Izberite JSON, ki ste ga prej izvozili. Knjige z enakim naslovom in avtorjem se preskočijo, obstoječih ne spreminjamo.</p>
          {error && <div className="alert alert-error mb-3">{error}</div>}
          {result && (
            <div className={`alert mb-3 ${result.errorCount ? "alert-info" : "alert-ok"}`}>
              Uvoženih: <strong>{result.imported}</strong>, preskočenih (že obstajajo): <strong>{result.skipped}</strong>
              {result.errorCount > 0 && (
                <>, neveljavnih: <strong>{result.errorCount}</strong>
                  <ul className="mt-1.5 list-disc pl-5 text-xs">{result.errors.map((er) => <li key={er.row}>vrstica {er.row}: {er.error}</li>)}</ul>
                </>
              )}
            </div>
          )}
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
          <button className="btn btn-primary" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? <Download className="w-4 h-4 animate-pulse" /> : <Upload className="w-4 h-4" />}
            {busy ? "Uvažam …" : "Izberi datoteko"}
          </button>
        </section>
      </div>
    </Modal>
  );
}
