import nodemailer, { type Transporter } from "nodemailer";

export interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
  rejectUnauthorized: boolean;
  appUrl: string;
}

/**
 * Pošiljanje e-pošte je vklopljeno, ko so nastavljeni SMTP_HOST, pošiljatelj
 * (SMTP_FROM ali SMTP_USER) in APP_URL. APP_URL je obvezen, da povezav v e-pošti
 * ni mogoče podtakniti z lažnim Host zaglavjem.
 */
export function mailProblem(): string | null {
  const missing: string[] = [];
  if (!process.env.SMTP_HOST?.trim()) missing.push("SMTP_HOST");
  if (!process.env.SMTP_FROM?.trim() && !process.env.SMTP_USER?.includes("@")) missing.push("SMTP_FROM");
  const url = process.env.APP_URL?.trim();
  if (!url) missing.push("APP_URL");
  else if (!/^https?:\/\/[^\s/]+/i.test(url)) return "APP_URL mora biti poln naslov, npr. https://knjige.example.si";
  return missing.length ? `Manjka: ${missing.join(", ")}` : null;
}

export function getMailConfig(): MailConfig | null {
  if (mailProblem()) return null;
  const secure = process.env.SMTP_SECURE === "true";
  return {
    host: process.env.SMTP_HOST!.trim(),
    port: parseInt(process.env.SMTP_PORT || "", 10) || (secure ? 465 : 587),
    secure,
    user: process.env.SMTP_USER?.trim() || undefined,
    pass: process.env.SMTP_PASS || undefined,
    from: (process.env.SMTP_FROM?.trim() || process.env.SMTP_USER!.trim()),
    rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
    appUrl: process.env.APP_URL!.trim().replace(/\/+$/, ""),
  };
}

export const emailEnabled = () => getMailConfig() !== null;

declare global {
  // eslint-disable-next-line no-var
  var __knjigomatikMail: { key: string; transport: Transporter } | undefined;
}

function transporter(cfg: MailConfig): Transporter {
  const key = JSON.stringify([cfg.host, cfg.port, cfg.secure, cfg.user, cfg.pass, cfg.rejectUnauthorized]);
  if (globalThis.__knjigomatikMail?.key !== key) {
    globalThis.__knjigomatikMail = {
      key,
      transport: nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure, // true = implicitni TLS (465); false = STARTTLS, če ga strežnik ponuja
        auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
        tls: { rejectUnauthorized: cfg.rejectUnauthorized },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000,
      }),
    };
  }
  return globalThis.__knjigomatikMail.transport;
}

export async function sendMail(msg: { to: string; subject: string; text: string; html: string }): Promise<void> {
  const cfg = getMailConfig();
  if (!cfg) throw new Error("E-pošta ni nastavljena");
  await transporter(cfg).sendMail({ from: cfg.from, ...msg });
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(title: string, bodyHtml: string): string {
  return `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:24px;color:#2a2118">
<h2 style="margin:0 0 16px;color:#8c2f39">📚 ${esc(title)}</h2>${bodyHtml}
<p style="margin-top:28px;font-size:12px;color:#7a6a58">Knjigomatik</p></div>`;
}

export function resetLink(token: string): string {
  const cfg = getMailConfig();
  if (!cfg) throw new Error("E-pošta ni nastavljena");
  return `${cfg.appUrl}/reset?token=${encodeURIComponent(token)}`;
}

export async function sendResetEmail(opts: { to: string; name: string; username: string; token: string; hours: number; kind: "reset" | "invite" }): Promise<void> {
  const link = resetLink(opts.token);
  const invite = opts.kind === "invite";
  const subject = invite ? "Knjigomatik: vaš račun je pripravljen" : "Knjigomatik: ponastavitev gesla";
  const intro = invite
    ? `Za vas je bil ustvarjen račun v Knjigomatiku (uporabniško ime: ${opts.username}). Geslo si nastavite s klikom na povezavo.`
    : `Prejeli smo zahtevo za ponastavitev gesla za račun ${opts.username}. Novo geslo si nastavite s klikom na povezavo.`;
  const validity = `Povezava velja ${opts.hours === 1 ? "1 uro" : `${opts.hours} ur`} in jo je mogoče uporabiti samo enkrat.`;
  const ignore = invite ? "" : "Če zahteve niste poslali vi, to sporočilo prezrite. Vaše geslo ostane nespremenjeno.";
  await sendMail({
    to: opts.to,
    subject,
    text: `Pozdravljeni, ${opts.name}!\n\n${intro}\n\n${link}\n\n${validity}\n${ignore}\n`,
    html: layout(subject.replace("Knjigomatik: ", ""),
      `<p>Pozdravljeni, ${esc(opts.name)}!</p><p>${esc(intro)}</p>
<p style="margin:24px 0"><a href="${esc(link)}" style="background:#8c2f39;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-family:sans-serif;font-weight:600">Nastavi geslo</a></p>
<p style="font-size:13px;color:#4a3d2f">Če gumb ne deluje, kopirajte povezavo v brskalnik:<br><span style="word-break:break-all">${esc(link)}</span></p>
<p style="font-size:13px;color:#4a3d2f">${esc(validity)} ${esc(ignore)}</p>`),
  });
}

export async function sendPasswordChangedEmail(opts: { to: string; name: string }): Promise<void> {
  const text = "Geslo za vaš račun v Knjigomatiku je bilo pravkar spremenjeno. Če tega niste storili vi, se takoj obrnite na skrbnika.";
  await sendMail({
    to: opts.to,
    subject: "Knjigomatik: geslo je bilo spremenjeno",
    text: `Pozdravljeni, ${opts.name}!\n\n${text}\n`,
    html: layout("Geslo je bilo spremenjeno", `<p>Pozdravljeni, ${esc(opts.name)}!</p><p>${esc(text)}</p>`),
  });
}

export async function sendTestEmail(to: string): Promise<void> {
  await sendMail({
    to,
    subject: "Knjigomatik: testno sporočilo",
    text: "Če berete to sporočilo, so SMTP nastavitve Knjigomatika pravilne.",
    html: layout("Testno sporočilo", "<p>Če berete to sporočilo, so SMTP nastavitve Knjigomatika pravilne. ✅</p>"),
  });
}
