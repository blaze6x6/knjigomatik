"use client";

import { useEffect, useState } from "react";
import { BookOpen, BookMarked, Eye, Sparkles, Star, TrendingUp, Ban, BookmarkCheck } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Stats {
  total: number;
  read: number;
  reading: number;
  wishlist: number;
  reserved: number;
  unavailable: number;
  avgRating: string | null;
}

export default function StatsPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await apiFetch("/api/books/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch (err) { console.error("Stats error:", err); }
      finally { setLoading(false); }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center py-20 text-t-muted">Napaka pri nalaganju statistike</div>;
  }

  const statCards = [
    { label: "Vse knjige", value: stats.total, icon: BookOpen, bg: "bg-brand-500/10", iconColor: "text-brand-400" },
    { label: "Zaželjene", value: stats.wishlist, icon: Sparkles, bg: "bg-purple-500/10", iconColor: "text-purple-400" },
    { label: "V branju", value: stats.reading, icon: Eye, bg: "bg-blue-500/10", iconColor: "text-blue-400" },
    { label: "Prebrane", value: stats.read, icon: BookMarked, bg: "bg-emerald-500/10", iconColor: "text-emerald-400" },
    { label: "Rezervirane", value: stats.reserved, icon: BookmarkCheck, bg: "bg-amber-500/10", iconColor: "text-amber-400" },
    { label: "Ni na voljo", value: stats.unavailable, icon: Ban, bg: "bg-red-500/10", iconColor: "text-red-400" },
    { label: "Povp. ocena", value: stats.avgRating || "—", icon: Star, bg: "bg-yellow-500/10", iconColor: "text-yellow-400" },
  ];

  const readPercentage = stats.total > 0 ? Math.round((stats.read / stats.total) * 100) : 0;

  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="text-2xl font-bold text-t-primary flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-brand-400" />Statistika
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <div key={card.label}
            className="bg-surface-light border border-b-default rounded-2xl p-5 animate-fade-in transition-colors duration-300"
            style={{ animationDelay: `${i * 60}ms` }}>
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
            <div className="text-3xl font-bold text-t-primary">{card.value}</div>
            <div className="text-sm text-t-muted mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {stats.total > 0 && (
        <div className="bg-surface-light border border-b-default rounded-2xl p-6 transition-colors duration-300">
          <h3 className="text-lg font-semibold text-t-primary mb-4">Napredek branja</h3>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-t-muted">{stats.read} od {stats.total} knjig prebranih</span>
            <span className="text-brand-400 font-medium">{readPercentage}%</span>
          </div>
          <div className="w-full h-4 bg-surface rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all duration-1000"
              style={{ width: `${readPercentage}%` }} />
          </div>

          <div className="mt-4">
            <div className="flex rounded-full overflow-hidden h-3">
              {stats.read > 0 && <div className="bg-emerald-500" style={{ width: `${(stats.read / stats.total) * 100}%` }} />}
              {stats.reading > 0 && <div className="bg-blue-500" style={{ width: `${(stats.reading / stats.total) * 100}%` }} />}
              {stats.wishlist > 0 && <div className="bg-purple-500" style={{ width: `${(stats.wishlist / stats.total) * 100}%` }} />}
              {stats.reserved > 0 && <div className="bg-amber-500" style={{ width: `${(stats.reserved / stats.total) * 100}%` }} />}
              {stats.unavailable > 0 && <div className="bg-red-500" style={{ width: `${(stats.unavailable / stats.total) * 100}%` }} />}
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-t-muted">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Prebrane</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />V branju</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" />Zaželjene</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Rezervirane</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Ni na voljo</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
