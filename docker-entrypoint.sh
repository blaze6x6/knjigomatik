#!/bin/sh
set -e

echo "🚀 Knjigomatik se zaganja ..."

# JWT_SECRET je obvezen in ne sme biti privzeta vrednost iz starih različic
case "${JWT_SECRET:-}" in
  ""|changeme|spremenite-ta-skrivni-kljuc-v-produkciji-2024|default-secret-change-in-production-knjigomatik-2024)
    echo "❌ JWT_SECRET ni nastavljen (ali je privzet). Ustvarite ga z: openssl rand -hex 32"
    echo "   in ga vpišite v datoteko .env (glejte .env.example)."
    exit 1
    ;;
esac
if [ "${#JWT_SECRET}" -lt 16 ]; then
  echo "❌ JWT_SECRET je prekratek (najmanj 16 znakov, priporočeno 64)."
  exit 1
fi

# Migracije baze; počaka na bazo, ob napaki se zagon prekine
node scripts/migrate.mjs

echo "✅ Zaganjam aplikacijo na portu ${PORT:-3000}"
exec "$@"
