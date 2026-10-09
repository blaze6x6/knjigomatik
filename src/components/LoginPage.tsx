"use client";

import { useState } from "react";
import { ArrowLeft, LogIn, Mail } from "lucide-react";
import { apiJson } from "@/lib/api";
import type { SessionUserInfo } from "@/lib/types";
import AuthShell from "./AuthShell";
import PasswordField from "./PasswordField";

export default function LoginPage({ onSuccess, emailEnabled }: { onSuccess: (u: SessionUserInfo) => void; emailEnabled: boolean }) {
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await apiJson<{ user: SessionUserInfo }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier: loginId, password }),
    });
    setLoading(false);
    if (!res.ok) return setError(res.error);
    onSuccess(res.data.user);
  }

  async function forgot(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await apiJson("/api/auth/forgot", { method: "POST", body: JSON.stringify({ identifier }) });
    setLoading(false);
    if (!res.ok) return setError(res.error);
    setSent(true);
  }

  if (mode === "forgot") {
    return (
      <AuthShell
        title="Pozabljeno geslo"
        subtitle="Vpišite e-naslov ali uporabniško ime. Če ima račun e-naslov, vam nanj pošljemo povezavo za novo geslo."
        footer={<button className="inline-flex items-center gap-1.5 text-brand-text underline cursor-pointer" onClick={() => { setMode("login"); setSent(false); setError(""); }}><ArrowLeft className="w-4 h-4" />Nazaj na prijavo</button>}
      >
        {sent ? (
          <div className="alert alert-ok" role="status">
            Če račun obstaja in ima nastavljen e-naslov, smo nanj poslali povezavo. Velja eno uro. Preverite tudi mapo z vsiljeno pošto.
          </div>
        ) : (
          <form onSubmit={forgot} className="space-y-4">
            {error && <div className="alert alert-error" role="alert">{error}</div>}
            <div>
              <label htmlFor="identifier" className="label">E-naslov ali uporabniško ime</label>
              <input id="identifier" className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} required autoFocus />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              <Mail className="w-4 h-4" />{loading ? "Pošiljam …" : "Pošlji povezavo"}
            </button>
          </form>
        )}
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Dobrodošli nazaj"
      subtitle="Prijavite se in odprite svojo knjižno polico."
      footer={
        emailEnabled ? (
          <button className="text-brand-text underline cursor-pointer" onClick={() => { setMode("forgot"); setError(""); }}>Ste pozabili geslo?</button>
        ) : (
          <>
            <strong className="text-ink-2">Ste pozabili geslo?</strong>
            <br />
            Prosite skrbnika, naj vam ustvari povezavo za ponastavitev.
          </>
        )
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <div>
          <label htmlFor="username" className="label">E-naslov ali uporabniško ime</label>
          <input id="username" className="input" value={loginId} onChange={(e) => setLoginId(e.target.value)}
            autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} required autoFocus />
        </div>
        <PasswordField id="password" label="Geslo" value={password} onChange={setPassword} autoComplete="current-password" />
        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          <LogIn className="w-4 h-4" />{loading ? "Prijavljam …" : "Prijava"}
        </button>
      </form>
    </AuthShell>
  );
}
