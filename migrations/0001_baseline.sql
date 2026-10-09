-- 0001_baseline
-- Osnovna shema. Je idempotentna, zato se brez težav izvede tudi na bazah,
-- ki so jih ustvarili init.sql ali `drizzle-kit push` (različice 1.x), in
-- jih po potrebi dvigne na trenutno obliko (stari stolpci, manjkajoče vrednosti).

DO $$ BEGIN
  CREATE TYPE book_status AS ENUM ('wishlist', 'reading', 'read', 'reserved', 'unavailable', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Starejše baze nimajo vedno vseh vrednosti
ALTER TYPE book_status ADD VALUE IF NOT EXISTS 'reserved';
ALTER TYPE book_status ADD VALUE IF NOT EXISTS 'unavailable';
ALTER TYPE book_status ADD VALUE IF NOT EXISTS 'cancelled';

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username      varchar(100) NOT NULL UNIQUE,
  display_name  varchar(255) NOT NULL,
  password_hash text NOT NULL,
  is_admin      boolean NOT NULL DEFAULT false,
  created_at    timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       varchar(500) NOT NULL,
  author      varchar(500) NOT NULL,
  status      book_status NOT NULL DEFAULT 'wishlist',
  created_at  timestamp NOT NULL DEFAULT now(),
  updated_at  timestamp NOT NULL DEFAULT now()
);

-- Stolpci, ki so se skozi različice dodajali
ALTER TABLE books ADD COLUMN IF NOT EXISTS rating      integer;
ALTER TABLE books ADD COLUMN IF NOT EXISTS color       varchar(7) NOT NULL DEFAULT '#ffffff';
ALTER TABLE books ADD COLUMN IF NOT EXISTS summary     text;
ALTER TABLE books ADD COLUMN IF NOT EXISTS genre       varchar(100);
ALTER TABLE books ADD COLUMN IF NOT EXISTS year        integer;
ALTER TABLE books ADD COLUMN IF NOT EXISTS thumbnail   text;
ALTER TABLE books ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE books ADD COLUMN IF NOT EXISTS isbn        varchar(20);
ALTER TABLE books ADD COLUMN IF NOT EXISTS page_count  integer;
ALTER TABLE books ADD COLUMN IF NOT EXISTS publisher   varchar(255);

-- Podatkovna migracija: stari stolpec "notes" je postal "summary"
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = current_schema() AND table_name = 'books' AND column_name = 'notes') THEN
    UPDATE books SET summary = notes WHERE summary IS NULL AND notes IS NOT NULL;
    ALTER TABLE books ALTER COLUMN notes DROP NOT NULL;
  END IF;
END $$;

-- Podatkovna migracija: stari stolpec "google_books_id" ne sme blokirati vnosov
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = current_schema() AND table_name = 'books' AND column_name = 'google_books_id') THEN
    ALTER TABLE books ALTER COLUMN google_books_id DROP NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_status  ON books(status);
