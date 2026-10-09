import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/Toast";
import { DEFAULT_DARK, DEFAULT_LIGHT, THEMES, THEME_STORAGE_KEY } from "@/lib/themes";

export const metadata: Metadata = {
  title: "Knjigomatik",
  description: "Vaša osebna knjižna polica: kaj berete, kaj ste prebrali in kaj še čaka.",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.svg", apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Knjigomatik" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Tema se nastavi pred prvim izrisom, da ne utripa. Podatke (ID-ji, barve) vzame iz seznama tem.
const themeScript = `(function(){try{var T=${JSON.stringify(Object.fromEntries(THEMES.map((t) => [t.id, [t.mode, t.paper]])))};var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(s==='light')s=${JSON.stringify(DEFAULT_LIGHT)};if(s==='dark')s=${JSON.stringify(DEFAULT_DARK)};if(!s||!T[s]){s=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?${JSON.stringify(DEFAULT_DARK)}:${JSON.stringify(DEFAULT_LIGHT)}}var r=document.documentElement;r.dataset.theme=s;r.style.colorScheme=T[s][0];var m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement('meta');m.name='theme-color';document.head.appendChild(m)}m.content=T[s][1]}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
