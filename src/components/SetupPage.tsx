"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { apiJson } from "@/lib/api";
import type { SessionUserInfo } from "@/lib/types";
import AuthShell from "./AuthShell";
import PasswordField from "./PasswordField";

export default function SetupPage({ onSuccess }: { onSuccess: (u: SessionUserInfo) => void }) {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) return setError("Gesli se ne ujemata");
    setLoading(true);
    const res = await apiJson<{ user: SessionUserInfo }>("/api/setup", {
      method: "POST",
      body: JSON.stringify({ username, displayName, email: email.trim() || null, password }),
    });
    setLoading(false);
    if (!res.ok) return setError(res.error);
    onSuccess(res.data.user);
  }

  return (
    <AuthShell
      title="Dobrodošli v Knjigomatiku"
      subtitle="Ustvarite prvi račun. Ta bo skrbnik: dodajal bo druge uporabnike in jim ponastavljal gesla."
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <div>
          <label htmlFor="dn" className="label">Ime za prikaz</label>
          <input id="dn" className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="name" required autoFocus />
        </div>
        <div>
          <label htmlFor="un" className="label">Uporabniško ime</label>
          <input id="un" className="input" value={username} onChange={(e) => setUsername(e.target.value)}
            autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} required />
          <p className="text-xs text-faint mt-1">Črke (a–z), številke, pika, pomišljaj, podčrtaj. Najmanj 3 znaki.</p>
        </div>
        <div>
          <label htmlFor="em" className="label">E-naslov (priporočeno)</label>
          <input id="em" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={254} />
          <p className="text-xs text-faint mt-1">Z njim se lahko prijavite in si ponastavite geslo.</p>
        </div>
        <PasswordField id="pw" label="Geslo" value={password} onChange={setPassword} autoComplete="new-password" hint="Vsaj 8 znakov." />
        <PasswordField id="pw2" label="Ponovite geslo" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          <Sparkles className="w-4 h-4" />{loading ? "Ustvarjam …" : "Ustvari skrbniški račun"}
        </button>
      </form>
    </AuthShell>
  );
}
