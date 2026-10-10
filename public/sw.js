/* Knjigomatik: servisni delavec.
 * Namen: aplikacijo je mogoče namestiti, statične datoteke se nalagajo hitreje, brez povezave pa se pokaže
 * lepa stran namesto napake brskalnika. Podatkov (API) in strani NIKOLI ne shranjuje, saj so zasebni.
 * Ob spremembi te datoteke povečaj VERSION. */
const VERSION = "v1";
const STATIC_CACHE = `knjigomatik-static-${VERSION}`;
const PRECACHE = ["/offline.html", "/favicon.svg", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("knjigomatik-") && k !== STATIC_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // naslovnice knjig in drugo tuje ne
  if (url.pathname.startsWith("/api/")) return; // zasebni podatki: vedno neposredno na strežnik

  // Strani: vedno z omrežja, brez povezave pa offline.html
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/offline.html").then((r) => r || Response.error()))
    );
    return;
  }

  // Zgoščene datoteke Next.js se nikoli ne spremenijo: najprej iz predpomnilnika
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
      )
    );
    return;
  }

  // Ikone in manifest: prikaži iz predpomnilnika, v ozadju osveži
  if (PRECACHE.includes(url.pathname) || url.pathname === "/manifest.json") {
    event.respondWith(
      caches.match(req).then((hit) => {
        const net = fetch(req)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() => hit);
        return hit || net;
      })
    );
  }
});
