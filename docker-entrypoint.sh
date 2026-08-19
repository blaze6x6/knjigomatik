#!/bin/sh
set -e

DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@db:5432/knjigomatik}"

# Parse DATABASE_URL -> host, port, user, dbname
rest="${DB_URL#*://}"
creds="${rest%%@*}"
DB_USER="${creds%%:*}"
hostpart="${rest#*@}"
hostdb="${hostpart%%\?*}"
hostport="${hostdb%%/*}"
DB_NAME="${hostdb#*/}"
DB_HOST="${hostport%%:*}"
DB_PORT="${hostport#*:}"
[ "$DB_PORT" = "$hostport" ] && DB_PORT=5432

echo "🚀 Starting Knjigomatik..."
echo "📦 Waiting for database at ${DB_HOST}:${DB_PORT} ..."

i=0
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; do
  i=$((i+1))
  if [ "$i" -ge 30 ]; then
    echo "❌ Database not reachable after 60s — starting anyway."
    break
  fi
  echo "⏳ Waiting for database... ($i/30)"
  sleep 2
done

echo "🔄 Synchronizing database schema with Drizzle..."
npx drizzle-kit push || true

echo "✅ Starting application on port ${PORT:-3000}"
exec "$@"
