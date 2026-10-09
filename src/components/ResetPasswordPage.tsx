"use client";

import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { apiJson } from "@/lib/api";
import AuthShell from "./AuthShell";
import PasswordField from "./PasswordField";

type State =
  | { kind: "checking" }
  | { kind: "invalid"; message: string }
  | { kind: "ready"; username: string; displayName: string };

/** Stran za nastavitev novega gesla prek povezave, ki jo je ustvaril skrbnik (/reset?token=…). */
export default function ResetPasswordPage({ token }: { token: string }) {
  const [state, setState] = useState<State>({ kind: "checking" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) { setState({ kind: "invalid", message: "Povezava ni veljavna." }); return; }
    let alive = true;
    apiJson<{ username: string; displayName: string }>(`/api/auth/reset?token=${encodeURIComponent(token)}`).then((res) => {
      if (!alive) return;
      setState(res.ok ? { kind: "ready", ...res.data } : { kind: "invalid", message: res.error });
    });
    return () => { alive = false; };
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) return setError("Gesli se ne ujemata");
    setLoading(true);
    const res = await apiJson("/api/auth/reset", { method: "POST", body: JSON.stringify({ token, password }) });
    if (!res.ok) { setLoading(false); return setError(res.error); }
    window.location.assign("/"); // seja je že vzpostavljena
  }

  if (state.kind === "checking") {
    return <AuthShell title="Preverjam povezavo …"><div className="h-16" /></AuthShell>;
  }
  if (state.kind === "invalid") {
    return (
      <AuthShell title="Povezava ne deluje" footer={<a href="/" className="text-brand-text underline">Nazaj na prijavo</a>}>
        <div className="alert alert-error">{state.message}</div>
      </AuthShell>
    );
  }
  return (
    <AuthShell title="Novo geslo" subtitle={`Račun: ${state.displayName} (@${state.username}). Po shranjevanju boste samodejno prijavljeni.`}>
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <PasswordField id="np" label="Novo geslo" value={password} onChange={setPassword} autoComplete="new-password" hint="Vsaj 8 znakov." />
        <PasswordField id="np2" label="Ponovite geslo" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          <KeyRound className="w-4 h-4" />{loading ? "Shranjujem …" : "Nastavi geslo"}
        </button>
      </form>
    </AuthShell>
  );
}
