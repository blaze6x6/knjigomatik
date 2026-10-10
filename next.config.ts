import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // pg in bcryptjs ostaneta zunanja paketa, da ju najdejo tudi skripte v mapi scripts/
  // (migrate.mjs, reset-password.mjs) v Docker sliki.
  serverExternalPackages: ["pg", "bcryptjs"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      // Servisni delavec se ne sme predpomniti, sicer se posodobitve ne bi nikoli prenesle.
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
      { source: "/manifest.json", headers: [{ key: "Content-Type", value: "application/manifest+json" }] },
    ];
  },
};

export default nextConfig;
