"use client";

import { useMemo, type ReactNode } from "react";
import { BookCheck, BookOpen, BookText, CalendarCheck, Library, Star } from "lucide-react";
import { STATUS, STATUS_ORDER } from "@/lib/status";
import type { BookData } from "@/lib/types";

const TONE_VAR: Record<string, string> = {
  plum: "var(--plum)", sky: "var(--sky)", moss: "var(--moss)", brass: "var(--brass)", rust: "var(--rust)", stone: "var(--stone)",
};

function Tile({ icon, label, value, hint }: { icon: ReactNode; label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-muted text-xs font-semibold uppercase tracking-wide">{icon}{label}</div>
      <div className="heading text-3xl font-semibold text-ink mt-2 tabular-nums">{value}</div>
      {hint && <div className="text-xs text-faint mt-1">{hint}</div>}
    </div>
  );
}

function BarRow({ label, value, max, color, suffix }: { label: string; value: number; max: number; color: string; suffix?: string }) {
  return (
    <div className="grid grid-cols-[7rem_1fr_2.5rem] sm:grid-cols-[9rem_1fr_3rem] items-center gap-3 text-sm">
      <span className="truncate text-ink-2" title={label}>{label}</span>
      <div className="h-3 rounded-full bg-sunk overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${max ? Math.max(2, (value / max) * 100) : 0}%`, background: color }} />
      </div>
      <span className="text-right tabular-nums text-muted">{value}{suffix}</span>
    </div>
  );
}

export default function StatsPanel({ books }: { books: BookData[] }) {
  const s = useMemo(() => {
    const byStatus: Record<string, number> = {};
    const years: Record<string, number> = {};
    const genres: Record<string, number> = {};
    const ratings = Array<number>(10).fill(0);
    let pages = 0, rated = 0, ratingSum = 0, undated = 0;
    const thisYear = String(new Date().getFullYear());
    let readThisYear = 0;

    for (const b of books) {
      byStatus[b.status] = (byStatus[b.status] || 0) + 1;
      if (b.rating) { rated++; ratingSum += b.rating; ratings[b.rating - 1]++; }
      if (b.status === "read") {
        pages += b.pageCount || 0;
        if (b.genre) genres[b.genre] = (genres[b.genre] || 0) + 1;
        if (b.finishedAt) {
          const y = b.finishedAt.slice(0, 4);
          years[y] = (years[y] || 0) + 1;
          if (y === thisYear) readThisYear++;
        } else undated++;
      }
    }
    return {
      byStatus, pages, rated, readThisYear, undated, thisYear,
      avg: rated ? (ratingSum / rated).toFixed(1).replace(".", ",") : "–",
      years: Object.entries(years).sort((a, b) => b[0].localeCompare(a[0])),
      genres: Object.entries(genres).sort((a, b) => b[1] - a[1]).slice(0, 6),
      ratings,
    };
  }, [books]);

  const total = books.length;
  if (total === 0) {
    return (
      <div className="card p-10 text-center text-muted animate-fade-in">
        Statistika se pokaže, ko dodate prve knjige.
      </div>
    );
  }
  const read = s.byStatus.read || 0;
  const maxYear = Math.max(1, ...s.years.map(([, n]) => n));
  const maxGenre = Math.max(1, ...s.genres.map(([, n]) => n));
  const maxRating = Math.max(1, ...s.ratings);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Tile icon={<Library className="w-4 h-4" />} label="Vse knjige" value={total} />
        <Tile icon={<BookCheck className="w-4 h-4" />} label="Prebrane" value={read} hint={`${Math.round((read / total) * 100)} % zbirke`} />
        <Tile icon={<BookOpen className="w-4 h-4" />} label="V branju" value={s.byStatus.reading || 0} />
        <Tile icon={<CalendarCheck className="w-4 h-4" />} label={`Prebrano ${s.thisYear}`} value={s.readThisYear} />
        <Tile icon={<BookText className="w-4 h-4" />} label="Prebranih strani" value={s.pages.toLocaleString("sl-SI")} hint="Seštevek strani prebranih knjig" />
        <Tile icon={<Star className="w-4 h-4" />} label="Povprečna ocena" value={s.avg} hint={s.rated ? `Iz ${s.rated} ocen` : "Ni še ocen"} />
      </div>

      <section className="card p-5">
        <h3 className="heading text-lg font-semibold mb-4">Moja zbirka</h3>
        <div className="flex h-4 rounded-full overflow-hidden bg-sunk" role="img" aria-label="Razdelitev knjig po statusu">
          {STATUS_ORDER.map((k) => (s.byStatus[k] ? <div key={k} style={{ width: `${(s.byStatus[k] / total) * 100}%`, background: TONE_VAR[STATUS[k].tone] }} title={`${STATUS[k].label}: ${s.byStatus[k]}`} /> : null))}
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-sm">
          {STATUS_ORDER.map((k) => (
            <li key={k} className="flex items-center gap-2 text-ink-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: TONE_VAR[STATUS[k].tone] }} />
              {STATUS[k].label} <span className="text-muted tabular-nums">{s.byStatus[k] || 0}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h3 className="heading text-lg font-semibold mb-4">Prebrano po letih</h3>
          {s.years.length === 0 ? (
            <p className="text-sm text-muted">Ni prebranih knjig z datumom konca branja. Datum lahko dodate pri urejanju knjige.</p>
          ) : (
            <div className="space-y-2.5">{s.years.map(([y, n]) => <BarRow key={y} label={y} value={n} max={maxYear} color="var(--moss)" />)}</div>
          )}
          {s.undated > 0 && <p className="text-xs text-faint mt-3">{s.undated} prebranih knjig je brez datuma konca branja.</p>}
        </section>

        <section className="card p-5">
          <h3 className="heading text-lg font-semibold mb-4">Najpogostejši žanri (prebrane)</h3>
          {s.genres.length === 0 ? (
            <p className="text-sm text-muted">Žanre dodajte pri urejanju knjig.</p>
          ) : (
            <div className="space-y-2.5">{s.genres.map(([g, n]) => <BarRow key={g} label={g} value={n} max={maxGenre} color="var(--brass)" />)}</div>
          )}
        </section>
      </div>

      <section className="card p-5">
        <h3 className="heading text-lg font-semibold mb-4">Razporeditev ocen</h3>
        {s.rated === 0 ? (
          <p className="text-sm text-muted">Še nimate ocenjenih knjig.</p>
        ) : (
          <div className="flex items-end gap-1.5 sm:gap-2 h-32" role="img" aria-label="Število knjig po ocenah od 1 do 10">
            {s.ratings.map((n, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1" title={`Ocena ${i + 1}: ${n}`}>
                <span className="text-xs text-muted tabular-nums">{n || ""}</span>
                <div className="w-full rounded-t-md" style={{ height: `${(n / maxRating) * 100}%`, minHeight: n ? 4 : 0, background: "var(--brass)" }} />
                <span className="text-xs text-ink-2 font-semibold">{i + 1}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
