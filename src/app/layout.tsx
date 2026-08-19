import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Knjigomatik — Vaša knjižna polica",
  description: "Moderna spletna aplikacija za upravljanje vaše knjižne zbirke",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Knjigomatik",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
    { media: "(prefers-color-scheme: light)", color: "#f1f5f9" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sl" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var t = localStorage.getItem('knjigomatik-theme');
                  var root = document.documentElement;
                  if (t === 'light') {
                    root.classList.remove('dark');
                    root.classList.add('light');
                  }
                  // Update theme-color meta to match
                  var meta = document.querySelector('meta[name="theme-color"]');
                  if (meta) meta.setAttribute('content', t === 'light' ? '#f1f5f9' : '#0f172a');
                } catch(e){}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-surface text-t-primary antialiased min-h-screen transition-colors duration-300">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
