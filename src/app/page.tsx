"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import LoginPage from "@/components/LoginPage";
import RegisterPage from "@/components/RegisterPage";
import Dashboard from "@/components/Dashboard";

interface UserInfo {
  userId: string;
  username: string;
  displayName: string;
  isAdmin: boolean;
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => { checkAuth(); }, []);

  async function checkAuth() {
    try {
      const [setupRes, authRes] = await Promise.all([
        apiFetch("/api/setup"),
        apiFetch("/api/auth/me"),
      ]);
      const setupData = await setupRes.json();
      if (setupData.needsSetup) {
        setNeedsSetup(true);
        setShowRegister(true);
        setLoading(false);
        return;
      }
      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData.user) setUser(authData.user);
      }
    } catch (err) { console.error("Auth check error:", err); }
    setLoading(false);
  }

  function handleAuthSuccess(u: Record<string, unknown>) {
    setUser({
      userId: (u.userId || u.id) as string,
      username: u.username as string,
      displayName: u.displayName as string,
      isAdmin: u.isAdmin as boolean,
    });
    setNeedsSetup(false);
  }

  async function handleLogout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setShowRegister(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-t-muted text-sm">Nalagam...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showRegister || needsSetup) {
      return (
        <RegisterPage
          isFirstUser={needsSetup}
          onSuccess={handleAuthSuccess}
          onSwitchToLogin={needsSetup ? undefined : () => setShowRegister(false)}
        />
      );
    }
    return (
      <LoginPage
        onSuccess={handleAuthSuccess}
        onSwitchToRegister={() => setShowRegister(true)}
      />
    );
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}
