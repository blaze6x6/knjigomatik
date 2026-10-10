"use client";

import { useState } from "react";
import { apiJson } from "@/lib/api";
import type { SessionUserInfo } from "@/lib/types";
import Modal from "./Modal";
import InstallApp from "./InstallApp";
import PasswordField from "./PasswordField";
import { useToast } from "./Toast";

interface Props {
  user: SessionUserInfo;
  emailEnabled: boolean;
  onClose: () => void;
  onUserChange: (u: SessionUserInfo) => void;
}

export default function AccountModal({ user, emailEnabled, onClose, onUserChange }: Props) {
  const toast = useToast();
  const [name, setName] = useState(user.displayName);
  const [nameErr, setNameErr] = useState("");
  const [nameBusy, setNameBusy] = useState(false);

  const [email, setEmail] = useState(user.email || "");
  const [emailPw, setEmailPw] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const emailChanged = email.trim().toLowerCase() !== (user.email || "");

  const [current, setCurrent] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setNameErr("");
    setNameBusy(true);
    const res = await apiJson<{ user: SessionUserInfo }>("/api/auth/me", { method: "PATCH", body: JSON.stringify({ displayName: name }) });
    setNameBusy(false);
    if (!res.ok) return setNameErr(res.error);
    onUserChange(res.data.user);
    toast("Ime shranjeno");
  }

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailErr("");
    setEmailBusy(true);
    const res = await apiJson<{ user: SessionUserInfo }>("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify({ email, currentPassword: emailPw }),
    });
    setEmailBusy(false);
    if (!res.ok) return setEmailErr(res.error);
    onUserChange(res.data.user);
    setEmail(res.data.user.email || "");
    setEmailPw("");
    toast(res.data.user.email ? "E-naslov shranjen" : "E-naslov odstranjen");
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwErr("");
    if (pw !== pw2) return setPwErr("Novi gesli se ne ujemata");
    setPwBusy(true);
    const res = await apiJson("/api/auth/password", { method: "POST", body: JSON.stringify({ current, password: pw }) });
    setPwBusy(false);
    if (!res.ok) return setPwErr(res.error);
    setCurrent(""); setPw(""); setPw2("");
    toast("Geslo spremenjeno. Druge naprave so odjavljene.");
  }

  return (
    <Modal title="Moj račun" subtitle={`@${user.username}${user.isAdmin ? " · skrbnik" : ""}`} onClose={onClose}>
      <div className="space-y-7">
        <form onSubmit={saveName} className="space-y-3">
          <h3 className="heading font-semibold text-ink">Ime za prikaz</h3>
          {nameErr && <div className="alert alert-error">{nameErr}</div>}
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required aria-label="Ime za prikaz" />
          <button className="btn btn-primary" disabled={nameBusy || name.trim() === user.displayName}>{nameBusy ? "Shranjujem …" : "Shrani ime"}</button>
        </form>

        <form onSubmit={saveEmail} className="space-y-3 border-t border-line pt-6">
          <h3 className="heading font-semibold text-ink">E-naslov</h3>
          <p className="text-xs text-muted -mt-1">
            {emailEnabled
              ? "Na ta naslov vam pošljemo povezavo, če pozabite geslo."
              : "Strežnik ne pošilja e-pošte, zato naslov zaenkrat ni uporabljen. Skrbnik lahko nastavi SMTP."}
          </p>
          {emailErr && <div className="alert alert-error">{emailErr}</div>}
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ime@primer.si" autoComplete="email" maxLength={254} aria-label="E-naslov" />
          {emailChanged && <PasswordField id="emailpw" label="Trenutno geslo (potrditev)" value={emailPw} onChange={setEmailPw} autoComplete="current-password" />}
          <button className="btn btn-primary" disabled={emailBusy || !emailChanged}>{emailBusy ? "Shranjujem …" : "Shrani e-naslov"}</button>
        </form>

        <form onSubmit={savePassword} className="space-y-3 border-t border-line pt-6">
          <h3 className="heading font-semibold text-ink">Sprememba gesla</h3>
          {pwErr && <div className="alert alert-error">{pwErr}</div>}
          <PasswordField id="cur" label="Trenutno geslo" value={current} onChange={setCurrent} autoComplete="current-password" />
          <PasswordField id="new" label="Novo geslo" value={pw} onChange={setPw} autoComplete="new-password" hint="Vsaj 8 znakov." />
          <PasswordField id="new2" label="Ponovite novo geslo" value={pw2} onChange={setPw2} autoComplete="new-password" />
          <button className="btn btn-primary" disabled={pwBusy}>{pwBusy ? "Shranjujem …" : "Spremeni geslo"}</button>
        </form>

        <InstallApp />
      </div>
    </Modal>
  );
}
