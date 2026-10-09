"use client";

import { useEffect, useState } from "react";
import { apiFetch, apiJson } from "@/lib/api";
import type { SessionUserInfo } from "@/lib/types";
import LoginPage from "@/components/LoginPage";
import SetupPage from "@/components/SetupPage";
import Dashboard from "@/components/Dashboard";
import Logo from "@/components/Logo";

type View = "loading" | "error" | "setup" | "login" | "app";

export default function Home() {
  const [view, setView] = useState<View>("loading");
  const [user, setUser] = useState<SessionUserInfo | null>(null);
  const [emailEnabled, setEmailEnabled] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const setup = await apiJson<{ needsSetup: boolean; emailEnabled?: boolean }>("/api/setup");
      if (!alive) return;
      if (!setup.ok) return setView("error");
      setEmailEnabled(!!setup.data.emailEnabled);
      if (setup.data.needsSetup) return setView("setup");
      const me = await apiJson<{ user: SessionUserInfo }>("/api/auth/me");
      if (!alive) return;
      if (me.ok && me.data.user) { setUser(me.data.user); setView("app"); } else setView("login");
    })();
    return () => { alive = false; };
  }, []);

  function enter(u: SessionUserInfo) {
    setUser(u);
    setView("app");
  }

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setView("login");
  }

  if (view === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse"><Logo size={48} /></div>
      </div>
    );
  }
  if (view === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div className="max-w-sm">
          <h1 className="heading text-2xl font-semibold mb-2">Strežnik ni dosegljiv</h1>
          <p className="text-sm text-muted mb-4">Baza podatkov se morda še zaganja. Poskusite znova čez nekaj sekund.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Poskusi znova</button>
        </div>
      </div>
    );
  }
  if (view === "setup") return <SetupPage onSuccess={enter} />;
  if (view === "login" || !user) return <LoginPage onSuccess={enter} emailEnabled={emailEnabled} />;
  return <Dashboard user={user} onLogout={logout} onUserChange={setUser} emailEnabled={emailEnabled} />;
}
