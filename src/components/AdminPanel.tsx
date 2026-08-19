"use client";

import { useEffect, useState } from "react";
import {
  Users, UserPlus, Trash2, Shield, BookOpen,
  X, Save, Lock, User, Type,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import ModalPortal from "./ModalPortal";

interface UserData {
  id: string;
  username: string;
  displayName: string;
  isAdmin: boolean;
  createdAt: string;
  bookCount: number;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    try {
      const res = await apiFetch("/api/admin/users");
      if (res.ok) { const data = await res.json(); setUsers(data.users); }
    } catch (err) { console.error("Fetch users error:", err); }
    finally { setLoading(false); }
  }

  async function handleDeleteUser(userId: string, userName: string) {
    if (!confirm(`Ali ste prepričani, da želite izbrisati uporabnika "${userName}"? Vse njegove knjige bodo prav tako izbrisane.`)) return;
    try {
      const res = await apiFetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) { setUsers((prev) => prev.filter((u) => u.id !== userId)); }
      else { const data = await res.json(); setError(data.error || "Napaka pri brisanju"); }
    } catch { setError("Napaka pri brisanju"); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-t-primary flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-400" />
            Upravljanje uporabnikov
          </h2>
          <button onClick={() => setShowAddModal(true)}
            className="bg-brand-600 hover:bg-brand-500 text-white font-medium px-5 py-2.5 rounded-xl flex items-center gap-2 transition cursor-pointer">
            <UserPlus className="w-4 h-4" />Nov uporabnik
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
            <button onClick={() => setError("")} className="ml-2 text-red-300 hover:text-red-500 cursor-pointer">✕</button>
          </div>
        )}

        <div className="bg-surface-light border border-b-default rounded-2xl overflow-hidden transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-b-default">
                  <th className="text-left text-sm text-t-muted font-medium px-6 py-4">Uporabnik</th>
                  <th className="text-left text-sm text-t-muted font-medium px-6 py-4">Uporabniško ime</th>
                  <th className="text-center text-sm text-t-muted font-medium px-6 py-4">Vloga</th>
                  <th className="text-center text-sm text-t-muted font-medium px-6 py-4">Knjige</th>
                  <th className="text-center text-sm text-t-muted font-medium px-6 py-4">Registriran</th>
                  <th className="text-right text-sm text-t-muted font-medium px-6 py-4">Dejanja</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-b-light last:border-0 hover:bg-surface-lighter/30 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-accent-500 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0">
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-t-primary font-medium">{user.displayName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-t-muted text-sm font-mono">@{user.username}</td>
                    <td className="px-6 py-4 text-center">
                      {user.isAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/20 text-amber-500 rounded-full text-xs font-medium">
                          <Shield className="w-3 h-3" />Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-500/20 text-t-muted rounded-full text-xs font-medium">
                          <User className="w-3 h-3" />Uporabnik
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-t-secondary text-sm">
                        <BookOpen className="w-3.5 h-3.5" />{user.bookCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-t-muted text-sm">
                      {new Date(user.createdAt).toLocaleDateString("sl-SI")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDeleteUser(user.id, user.displayName)}
                        className="p-2 text-t-faint hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                        title="Izbriši uporabnika">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddUserModal onClose={() => setShowAddModal(false)} onAdded={() => { setShowAddModal(false); fetchUsers(); }} />
      )}
    </>
  );
}

function AddUserModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({ username, displayName, password, isAdmin }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Napaka"); return; }
      onAdded();
    } catch { setError("Napaka pri dodajanju"); }
    finally { setLoading(false); }
  }

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-backdrop backdrop-blur-sm" onClick={onClose} />
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative bg-surface-light border border-b-default rounded-2xl w-full max-w-md shadow-2xl animate-slide-up my-8 transition-colors duration-300">
          <div className="flex items-center justify-between p-6 pb-0">
            <h3 className="text-xl font-bold text-t-primary flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-brand-400" />Nov uporabnik
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-surface-lighter rounded-lg transition cursor-pointer">
              <X className="w-5 h-5 text-t-muted" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}

            <div>
              <label className="block text-sm text-t-muted mb-1.5">Uporabniško ime *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-t-faint" />
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-surface border border-b-default rounded-lg px-10 py-2.5 text-t-primary placeholder-t-faint focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  placeholder="janez.novak" required minLength={3} />
              </div>
              <p className="text-xs text-t-faint mt-1">Črke, številke, pike, pomišljaji, podčrtaji</p>
            </div>

            <div>
              <label className="block text-sm text-t-muted mb-1.5">Prikazno ime *</label>
              <div className="relative">
                <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-t-faint" />
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-surface border border-b-default rounded-lg px-10 py-2.5 text-t-primary placeholder-t-faint focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  placeholder="Janez Novak" required />
              </div>
            </div>

            <div>
              <label className="block text-sm text-t-muted mb-1.5">Geslo *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-t-faint" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface border border-b-default rounded-lg px-10 py-2.5 text-t-primary placeholder-t-faint focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  placeholder="Vsaj 6 znakov" required minLength={6} />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer p-3 bg-surface rounded-lg border border-b-default hover:border-t-faint transition">
              <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} className="w-4 h-4 accent-brand-500" />
              <div>
                <span className="text-t-primary text-sm font-medium flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />Administratorske pravice
                </span>
                <span className="text-xs text-t-faint">Uporabnik bo lahko upravljal druge uporabnike</span>
              </div>
            </label>

            <button type="submit" disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-brand-600/50 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer mt-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Save className="w-4 h-4" />Dodaj uporabnika</>
              )}
            </button>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
