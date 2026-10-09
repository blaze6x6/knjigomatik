"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Ban, BookOpen, CircleCheck, Copy, KeyRound, Mail, Pencil, Send, Shield, ShieldOff, Trash2, UserPlus } from "lucide-react";
import { apiJson } from "@/lib/api";
import type { SessionUserInfo } from "@/lib/types";
import ConfirmDialog from "./ConfirmDialog";
import Modal from "./Modal";
import PasswordField from "./PasswordField";
import { useToast } from "./Toast";

interface UserRow {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  isAdmin: boolean;
  disabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  bookCount: number;
}

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("sl-SI", { dateStyle: "medium", timeStyle: "short" }) : "še nikoli");

type Pending =
  | { kind: "delete"; user: UserRow }
  | { kind: "toggleAdmin"; user: UserRow }
  | { kind: "toggleDisabled"; user: UserRow }
  | { kind: "reset"; user: UserRow };

export default function AdminPanel({ currentUser, emailEnabled }: { currentUser: SessionUserInfo; emailEnabled: boolean }) {
  const currentUserId = currentUser.userId;
  const toast = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [link, setLink] = useState<{ user: string; token: string; hours: number; invite?: boolean } | null>(null);

  const load = useCallback(async () => {
    const res = await apiJson<{ users: UserRow[] }>("/api/admin/users");
    if (res.ok) setUsers(res.data.users);
    else setError(res.error);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function runReset(u: UserRow, send: boolean) {
    const r = await apiJson<{ token: string; expiresInHours: number; emailSent?: boolean; emailError?: string }>(`/api/admin/users/${u.id}/reset`, {
      method: "POST",
      body: JSON.stringify({ send }),
    });
    setPending(null);
    if (!r.ok) return setError(r.error);
    if (send && r.data.emailSent) return toast(`Povezava poslana na ${u.email}`);
    if (send && r.data.emailSent === false) setError(`E-pošte ni bilo mogoče poslati (${r.data.emailError || "napaka"}). Povezavo lahko pošljete sami.`);
    setLink({ user: u.displayName, token: r.data.token, hours: r.data.expiresInHours });
  }

  async function runPending() {
    if (!pending) return;
    const u = pending.user;
    let res;
    if (pending.kind === "delete") res = await apiJson(`/api/admin/users/${u.id}`, { method: "DELETE" });
    else if (pending.kind === "toggleAdmin") res = await apiJson(`/api/admin/users/${u.id}`, { method: "PATCH", body: JSON.stringify({ isAdmin: !u.isAdmin }) });
    else if (pending.kind === "toggleDisabled") res = await apiJson(`/api/admin/users/${u.id}`, { method: "PATCH", body: JSON.stringify({ disabled: !u.disabled }) });
    else return runReset(u, false);
    setPending(null);
    if (!res.ok) return setError(res.error);
    toast(pending.kind === "delete" ? "Uporabnik izbrisan" : "Spremenjeno");
    load();
  }

  const confirmText = (p: Pending) => {
    const n = p.user.displayName;
    switch (p.kind) {
      case "delete": return { title: "Izbris uporabnika", message: `Uporabnik »${n}« in vse njegove knjige (${p.user.bookCount}) bodo trajno izbrisani. Tega ni mogoče razveljaviti.`, label: "Izbriši", danger: true };
      case "toggleAdmin": return p.user.isAdmin
        ? { title: "Odvzem pravic", message: `»${n}« ne bo več skrbnik. Odjavljen bo z vseh naprav.`, label: "Odvzemi", danger: false }
        : { title: "Skrbniške pravice", message: `»${n}« bo lahko dodajal uporabnike, ponastavljal gesla in brisal račune.`, label: "Naredi skrbnika", danger: false };
      case "toggleDisabled": return p.user.disabled
        ? { title: "Omogoči račun", message: `»${n}« se bo lahko spet prijavil.`, label: "Omogoči", danger: false }
        : { title: "Onemogoči račun", message: `»${n}« bo takoj odjavljen in se ne bo mogel prijaviti. Knjige ostanejo.`, label: "Onemogoči", danger: true };
      case "reset": return { title: "Ponastavitev gesla", message: `Ustvarili bomo enkratno povezavo, prek katere si »${n}« nastavi novo geslo. Obstoječe geslo velja, dokler povezave ne uporabi. Prejšnje povezave prenehajo veljati.`, label: "Ustvari povezavo", danger: false };
    }
  };

  if (loading) return <div className="py-20 text-center text-muted">Nalagam …</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="heading text-2xl font-semibold">Uporabniki</h2>
          <p className="text-sm text-muted">{users.length} {users.length === 1 ? "račun" : "računov"}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><UserPlus className="w-4 h-4" />Nov uporabnik</button>
      </div>

      <div className="alert alert-info">
        <strong>Pozabljeno geslo?</strong> Pri uporabniku kliknite ključ in ustvarjeno povezavo pošljite osebi. Če ste pozabili geslo vi (edini skrbnik), uporabite ukaz{" "}
        <code className="text-xs bg-sunk px-1.5 py-0.5 rounded">docker compose exec app node scripts/reset-password.mjs uporabnik</code>.
      </div>

      <EmailStatus adminEmail={currentUser.email} />

      {error && (
        <div className="alert alert-error flex justify-between gap-3" role="alert">
          <span>{error}</span>
          <button className="underline shrink-0 cursor-pointer" onClick={() => setError("")}>Zapri</button>
        </div>
      )}

      <ul className="space-y-3">
        {users.map((u) => {
          const self = u.id === currentUserId;
          return (
            <li key={u.id} className={`card p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 ${u.disabled ? "opacity-70" : ""}`}>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-11 h-11 rounded-full bg-brand text-white flex items-center justify-center font-semibold heading shrink-0" aria-hidden="true">
                  {u.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink truncate">{u.displayName}</span>
                    {self && <span className="badge tone-stone">vi</span>}
                    {u.isAdmin && <span className="badge tone-brass"><Shield className="w-3 h-3" />Skrbnik</span>}
                    {u.disabled && <span className="badge tone-rust"><Ban className="w-3 h-3" />Onemogočen</span>}
                  </div>
                  <div className="text-xs text-muted mt-0.5 flex flex-wrap gap-x-3">
                    <span className="font-mono">@{u.username}</span>
                    {u.email && <span className="inline-flex items-center gap-1 truncate"><Mail className="w-3 h-3 shrink-0" /><span className="truncate">{u.email}</span></span>}
                    <span className="inline-flex items-center gap-1"><BookOpen className="w-3 h-3" />{u.bookCount}</span>
                    <span>Zadnja prijava: {fmt(u.lastLoginAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-0.5 self-end sm:self-auto">
                <button className="btn btn-icon" title="Uredi ime" aria-label={`Uredi ime: ${u.displayName}`} onClick={() => setEditing(u)}><Pencil className="w-4 h-4" /></button>
                <button className="btn btn-icon" title="Povezava za ponastavitev gesla" aria-label={`Ponastavi geslo: ${u.displayName}`} disabled={u.disabled} onClick={() => setPending({ kind: "reset", user: u })}><KeyRound className="w-4 h-4" /></button>
                <button className="btn btn-icon" title={u.isAdmin ? "Odvzemi skrbnika" : "Naredi skrbnika"} aria-label="Spremeni vlogo" disabled={self} onClick={() => setPending({ kind: "toggleAdmin", user: u })}>
                  {u.isAdmin ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                </button>
                <button className="btn btn-icon" title={u.disabled ? "Omogoči račun" : "Onemogoči račun"} aria-label="Omogoči ali onemogoči račun" disabled={self} onClick={() => setPending({ kind: "toggleDisabled", user: u })}>
                  {u.disabled ? <CircleCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                </button>
                <button className="btn btn-icon hover:text-rust!" title="Izbriši" aria-label={`Izbriši: ${u.displayName}`} disabled={self} onClick={() => setPending({ kind: "delete", user: u })}><Trash2 className="w-4 h-4" /></button>
              </div>
            </li>
          );
        })}
      </ul>

      {showAdd && (
        <AddUserModal
          emailEnabled={emailEnabled}
          onClose={() => setShowAdd(false)}
          onAdded={(r) => {
            setShowAdd(false);
            load();
            if (r.emailSent) toast(`Povabilo poslano na ${r.email}`);
            else if (r.invite) {
              if (r.emailSent === false) setError(`Uporabnik je ustvarjen, a e-pošte ni bilo mogoče poslati (${r.emailError || "napaka"}). Povezavo pošljite sami.`);
              setLink({ user: r.invite.name, token: r.invite.token, hours: r.invite.hours, invite: true });
            } else toast("Uporabnik dodan");
          }}
        />
      )}
      {editing && <EditUserModal user={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); toast("Ime shranjeno"); load(); }} />}
      {link && <LinkModal {...link} onClose={() => setLink(null)} />}
      {pending?.kind === "reset" && emailEnabled && pending.user.email && (
        <ResetChoiceModal user={pending.user} onCancel={() => setPending(null)} onChoose={(send) => runReset(pending.user, send)} />
      )}
      {pending && !(pending.kind === "reset" && emailEnabled && pending.user.email) && (() => { const c = confirmText(pending); return <ConfirmDialog title={c.title} message={c.message} confirmLabel={c.label} danger={c.danger} onCancel={() => setPending(null)} onConfirm={runPending} />; })()}
    </div>
  );
}

function AddUserModal({ emailEnabled, onClose, onAdded }: {
  emailEnabled: boolean;
  onClose: () => void;
  onAdded: (r: { email?: string; emailSent?: boolean; emailError?: string; invite?: { name: string; token: string; hours: number } }) => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"invite" | "password">("invite");
  const [password, setPassword] = useState("");
  const [sendMail, setSendMail] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const canSend = emailEnabled && mode === "invite" && email.trim() !== "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await apiJson<{ resetToken?: string; expiresInHours?: number; emailSent?: boolean; emailError?: string }>("/api/admin/users", {
      method: "POST",
      body: JSON.stringify({ displayName, username, email: email.trim() || null, isAdmin, password: mode === "password" ? password : undefined, sendEmail: canSend && sendMail }),
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onAdded({
      email: email.trim().toLowerCase(),
      emailSent: res.data.emailSent,
      emailError: res.data.emailError,
      invite: res.data.resetToken ? { name: displayName, token: res.data.resetToken, hours: res.data.expiresInHours ?? 24 } : undefined,
    });
  }

  return (
    <Modal title="Nov uporabnik" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <div>
          <label htmlFor="nu-name" className="label">Ime za prikaz</label>
          <input id="nu-name" className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required maxLength={100} />
        </div>
        <div>
          <label htmlFor="nu-user" className="label">Uporabniško ime</label>
          <input id="nu-user" className="input" value={username} onChange={(e) => setUsername(e.target.value)} required autoCapitalize="none" autoCorrect="off" spellCheck={false} />
        </div>
        <div>
          <label htmlFor="nu-mail" className="label">E-naslov (neobvezno)</label>
          <input id="nu-mail" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} placeholder="ime@primer.si" />
          <p className="text-xs text-faint mt-1">Omogoči, da si uporabnik geslo ponastavi sam.</p>
        </div>

        <fieldset>
          <legend className="label">Kako dobi dostop?</legend>
          <div className="grid sm:grid-cols-2 gap-2">
            {([
              ["invite", "Povezava za nastavitev gesla", "Priporočeno. Uporabnik si geslo izbere sam."],
              ["password", "Začasno geslo", "Geslo mu sporočite sami."],
            ] as const).map(([val, title, text]) => (
              <label key={val} className={`rounded-xl border p-3 cursor-pointer text-sm ${mode === val ? "border-brand bg-brand/5" : "border-line"}`}>
                <input type="radio" name="mode" className="sr-only" checked={mode === val} onChange={() => setMode(val)} />
                <div className="font-semibold text-ink">{title}</div>
                <div className="text-xs text-muted mt-0.5">{text}</div>
              </label>
            ))}
          </div>
        </fieldset>

        {mode === "password" && <PasswordField id="nu-pw" label="Geslo" value={password} onChange={setPassword} autoComplete="new-password" hint="Vsaj 8 znakov." />}

        {canSend && (
          <label className="flex items-center gap-2.5 text-sm text-ink-2 cursor-pointer">
            <input type="checkbox" checked={sendMail} onChange={(e) => setSendMail(e.target.checked)} className="w-4 h-4 accent-[var(--brand)]" />
            Povabilo pošlji po e-pošti
          </label>
        )}
        <label className="flex items-center gap-2.5 text-sm text-ink-2 cursor-pointer">
          <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} className="w-4 h-4 accent-[var(--brand)]" />
          Skrbnik (lahko upravlja uporabnike)
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Prekliči</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? "Ustvarjam …" : "Ustvari"}</button>
        </div>
      </form>
    </Modal>
  );
}

function EditUserModal({ user, onClose, onSaved }: { user: UserRow; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(user.displayName);
  const [email, setEmail] = useState(user.email || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await apiJson(`/api/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify({ displayName: name, email: email.trim() || null }) });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onSaved();
  }
  return (
    <Modal title="Uredi uporabnika" subtitle={`@${user.username}`} onClose={onClose} size="sm">
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="alert alert-error">{error}</div>}
        <div>
          <label htmlFor="en" className="label">Ime za prikaz</label>
          <input id="en" className="input" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
        </div>
        <div>
          <label htmlFor="em" className="label">E-naslov</label>
          <input id="em" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} placeholder="ime@primer.si" />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Prekliči</button>
          <button className="btn btn-primary" disabled={busy}>Shrani</button>
        </div>
      </form>
    </Modal>
  );
}

function ResetChoiceModal({ user, onCancel, onChoose }: { user: UserRow; onCancel: () => void; onChoose: (send: boolean) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  async function go(send: boolean) { setBusy(true); try { await onChoose(send); } finally { setBusy(false); } }
  return (
    <Modal title="Ponastavitev gesla" subtitle={user.displayName} onClose={onCancel} size="sm">
      <p className="text-sm text-ink-2 leading-relaxed">
        Ustvarili bomo enkratno povezavo (velja 24 ur). Obstoječe geslo velja, dokler povezave ne uporabi; prejšnje povezave prenehajo veljati.
      </p>
      <div className="flex flex-col gap-2 mt-5">
        <button className="btn btn-primary" disabled={busy} onClick={() => go(true)}><Send className="w-4 h-4" />Pošlji na {user.email}</button>
        <button className="btn btn-ghost" disabled={busy} onClick={() => go(false)}>Samo ustvari povezavo (pošljem sam)</button>
        <button className="btn btn-ghost border-transparent" disabled={busy} onClick={onCancel}>Prekliči</button>
      </div>
    </Modal>
  );
}

interface EmailInfo { enabled: boolean; problem: string | null; host: string | null; port: number | null; secure: boolean | null; from: string | null; appUrl: string | null; tlsVerify: boolean | null }

function EmailStatus({ adminEmail }: { adminEmail: string | null }) {
  const toast = useToast();
  const [info, setInfo] = useState<EmailInfo | null>(null);
  const [to, setTo] = useState(adminEmail || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let alive = true;
    apiJson<EmailInfo>("/api/admin/email").then((r) => { if (alive && r.ok) setInfo(r.data); });
    return () => { alive = false; };
  }, []);

  async function test(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await apiJson("/api/admin/email", { method: "POST", body: JSON.stringify({ to }) });
    setBusy(false);
    if (r.ok) { setMsg({ ok: true, text: "Poslano. Preverite nabiralnik." }); toast("Testno sporočilo poslano"); }
    else setMsg({ ok: false, text: r.error });
  }

  if (!info) return null;
  return (
    <section className="card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Mail className={`w-5 h-5 mt-0.5 shrink-0 ${info.enabled ? "text-moss" : "text-faint"}`} />
        <div className="min-w-0 text-sm">
          <div className="font-semibold text-ink">{info.enabled ? "E-pošta je vklopljena" : "E-pošta ni nastavljena"}</div>
          {info.enabled ? (
            <div className="text-xs text-muted mt-0.5 break-words">
              {info.host}:{info.port} ({info.secure ? "TLS" : "STARTTLS"}{info.tlsVerify === false ? ", brez preverjanja certifikata" : ""}) · pošiljatelj: {info.from} · povezave: {info.appUrl}
            </div>
          ) : (
            <div className="text-xs text-muted mt-0.5">
              {info.problem}. Vrednosti nastavite v datoteki <code className="bg-sunk px-1 rounded">.env</code> (SMTP_HOST, SMTP_FROM, APP_URL …) in ponovno zaženite aplikacijo. Uporabniki si nato lahko sami ponastavijo geslo.
            </div>
          )}
        </div>
      </div>
      {info.enabled && (
        <form onSubmit={test} className="flex flex-col sm:flex-row gap-2">
          <input type="email" required className="input" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Testni prejemnik" aria-label="Testni prejemnik" />
          <button className="btn btn-ghost shrink-0" disabled={busy}><Send className="w-4 h-4" />{busy ? "Pošiljam …" : "Pošlji testno sporočilo"}</button>
        </form>
      )}
      {msg && <div className={`alert ${msg.ok ? "alert-ok" : "alert-error"}`}>{msg.text}</div>}
    </section>
  );
}

function LinkModal({ user, token, hours, invite, onClose }: { user: string; token: string; hours: number; invite?: boolean; onClose: () => void }) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [url] = useState(() => `${window.location.origin}/reset?token=${token}`);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast("Povezava kopirana");
    } catch {
      input.current?.select();
      toast("Označeno. Kopirajte ročno (Ctrl+C).", "error");
    }
  }

  return (
    <Modal title={invite ? "Uporabnik ustvarjen" : "Povezava za ponastavitev"} subtitle={user} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-ink-2 leading-relaxed">
          Pošljite to povezavo osebi (sporočilo, e-pošta). Z njo si bo nastavila novo geslo.
          Povezava velja <strong>{hours} ur</strong> in jo je mogoče uporabiti <strong>enkrat</strong>.
        </p>
        <div className="flex gap-2">
          <input ref={input} readOnly className="input font-mono text-xs" value={url} onFocus={(e) => e.currentTarget.select()} aria-label="Povezava" />
          <button className="btn btn-primary shrink-0" onClick={copy}><Copy className="w-4 h-4" />Kopiraj</button>
        </div>
        <div className="alert alert-info text-xs">Povezave kasneje ni več mogoče pogledati. Če jo izgubite, ustvarite novo.</div>
        <div className="flex justify-end"><button className="btn btn-ghost" onClick={onClose}>Zapri</button></div>
      </div>
    </Modal>
  );
}
