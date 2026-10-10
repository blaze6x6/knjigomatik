"use client";

import { useEffect, useState } from "react";
import { Download, Share, Smartphone } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Razdelek "Namesti aplikacijo" v računu. Android/Chrome: pravi gumb, iOS: navodilo, že nameščeno: skrit. */
export default function InstallApp() {
  const [evt, setEvt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as InstallPromptEvent); };
    const onInstalled = () => { setInstalled(true); setEvt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;
  if (!evt && !ios) return null;

  return (
    <section className="space-y-3 border-t border-line pt-6">
      <h3 className="heading font-semibold text-ink flex items-center gap-2"><Smartphone className="w-4 h-4" /> Namesti aplikacijo</h3>
      {evt ? (
        <>
          <p className="text-xs text-muted -mt-1">Knjigomatik se bo odprl v svojem oknu, brez naslovne vrstice brskalnika, z ikono na začetnem zaslonu.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={async () => { await evt.prompt(); await evt.userChoice.catch(() => {}); setEvt(null); }}
          >
            <Download className="w-4 h-4" /> Namesti
          </button>
        </>
      ) : (
        <p className="text-sm text-ink-2">
          V Safariju tapnite <Share className="inline w-4 h-4 -mt-0.5" /> <b>Deli</b> in izberite <b>Dodaj na začetni zaslon</b>.
        </p>
      )}
    </section>
  );
}
