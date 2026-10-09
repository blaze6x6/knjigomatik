"use client";

import { useEffect, useRef, useState } from "react";
import { Check, MonitorSmartphone, Palette } from "lucide-react";
import { THEMES, type ThemeInfo } from "@/lib/themes";
import { useTheme } from "./ThemeProvider";

function Swatch({ t, selected, onPick }: { t: ThemeInfo; selected: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      role="radio"
      aria-checked={selected}
      title={`${t.name} (${t.mode === "light" ? "svetla" : "temna"})`}
      className="group flex flex-col items-center gap-1.5 rounded-xl p-1.5 cursor-pointer hover:bg-sunk"
    >
      <span
        className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border-2 flex flex-col justify-between p-1.5"
        style={{ background: t.paper, borderColor: selected ? t.brand : "transparent", boxShadow: "inset 0 0 0 1px rgba(128,128,128,0.35)" }}
      >
        <span className="block h-2 w-3/4 rounded-sm" style={{ background: t.ink, opacity: 0.8 }} />
        <span className="flex items-end gap-1">
          <span className="block h-3.5 flex-1 rounded-sm" style={{ background: t.card, boxShadow: "inset 0 0 0 1px rgba(128,128,128,0.35)" }} />
          <span className="block h-3.5 w-3.5 rounded-sm" style={{ background: t.brand }} />
          <span className="block h-3.5 w-2 rounded-sm" style={{ background: t.brass }} />
        </span>
        {selected && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: t.brand, color: "#fff" }}>
            <Check className="w-3 h-3" />
          </span>
        )}
      </span>
      <span className="text-[11px] leading-none text-ink-2 font-medium truncate max-w-full">{t.name}</span>
    </button>
  );
}

export default function ThemePicker() {
  const { setting, active, setSetting } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const current = THEMES.find((t) => t.id === active);
  const groups: { label: string; items: ThemeInfo[] }[] = [
    { label: "Svetle teme", items: THEMES.filter((t) => t.mode === "light") },
    { label: "Temne teme", items: THEMES.filter((t) => t.mode === "dark") },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn btn-icon"
        aria-haspopup="dialog"
        aria-expanded={open}
        title={`Barvna tema: ${current?.name ?? ""}${setting === "auto" ? " (samodejno)" : ""}`}
        aria-label="Izbira barvne teme"
      >
        <Palette className="w-[18px] h-[18px]" />
      </button>

      {open && (
        <div role="dialog" aria-label="Barvne teme" className="absolute right-0 mt-2 z-50 card panel-shadow p-3 animate-fade-in w-[min(24rem,calc(100vw-1.5rem))] max-h-[75vh] overflow-y-auto">
          <button
            type="button"
            onClick={() => setSetting("auto")}
            aria-pressed={setting === "auto"}
            className={`w-full flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm text-left cursor-pointer ${setting === "auto" ? "border-brand bg-brand/5" : "border-line hover:bg-sunk"}`}
          >
            <MonitorSmartphone className="w-4 h-4 text-muted shrink-0" />
            <span className="flex-1">
              <span className="font-semibold text-ink block">Samodejno</span>
              <span className="text-xs text-muted">Sledi svetli/temni nastavitvi naprave</span>
            </span>
            {setting === "auto" && <Check className="w-4 h-4 text-brand-text" />}
          </button>

          {groups.map((g) => (
            <div key={g.label} className="mt-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted px-1 mb-1">{g.label}</div>
              <div className="grid grid-cols-4 gap-0.5" role="radiogroup" aria-label={g.label}>
                {g.items.map((t) => (
                  <Swatch key={t.id} t={t} selected={setting === t.id} onPick={() => setSetting(t.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
