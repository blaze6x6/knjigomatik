"use client";

import { useState } from "react";
import { BookOpen, User, Lock, LogIn, Sun, Moon } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useTheme } from "./ThemeProvider";

interface Props {
  onSuccess: (user: Record<string, unknown>) => void;
  onSwitchToRegister: () => void;
}

export default function LoginPage({ onSuccess, onSwitchToRegister }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Napaka pri prijavi"); return; }
      onSuccess(data.user);
    } catch { setError("Napaka pri povezavi"); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4 transition-colors duration-300 relative">
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-lg text-t-muted hover:text-t-primary hover:bg-surface-light transition cursor-pointer"
        title={theme === "dark" ? "Svetla tema" : "Temna tema"}
      >
        {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600/20 rounded-2xl mb-4 animate-pulse-glow">
            <BookOpen className="w-8 h-8 text-brand-400" />
          </div>
          <h1 className="text-3xl font-bold text-t-primary">
            Knjigomatik
          </h1>
          <p className="text-t-muted mt-1">Vaša osebna knjižna polica</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface-light border border-b-default rounded-2xl p-8 shadow-2xl shadow-black/10 transition-colors duration-300"
        >
          <h2 className="text-xl font-semibold text-t-primary mb-6">Prijava</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm animate-fade-in">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-t-muted mb-1.5">Uporabniško ime</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-t-faint" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-surface border border-b-default rounded-lg px-10 py-2.5 text-t-primary placeholder-t-faint focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                  placeholder="uporabnisko.ime"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-t-muted mb-1.5">Geslo</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-t-faint" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface border border-b-default rounded-lg px-10 py-2.5 text-t-primary placeholder-t-faint focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                  placeholder="••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-brand-600 hover:bg-brand-500 disabled:bg-brand-600/50 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><LogIn className="w-4 h-4" />Prijava</>
            )}
          </button>
        </form>

        <p className="text-center text-t-faint mt-4 text-sm">
          Nimate računa?{" "}
          <button onClick={onSwitchToRegister} className="text-brand-400 hover:text-brand-300 transition cursor-pointer">
            Kontaktirajte administratorja
          </button>
        </p>
      </div>
    </div>
  );
}
