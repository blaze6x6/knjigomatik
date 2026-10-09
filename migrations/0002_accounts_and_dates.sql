-- 0002_accounts_and_dates
-- * onemogočanje računov in razveljavitev sej (token_version)
-- * ponastavitev gesel prek enkratnih povezav
-- * datuma začetka in konca branja
-- * omejitev ocene tudi v bazi

ALTER TABLE users ADD COLUMN IF NOT EXISTS disabled      boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version integer NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at timestamp;

CREATE TABLE IF NOT EXISTS password_resets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  expires_at  timestamp NOT NULL,
  used_at     timestamp,
  created_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at  timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);

ALTER TABLE books ADD COLUMN IF NOT EXISTS started_at  date;
ALTER TABLE books ADD COLUMN IF NOT EXISTS finished_at date;

CREATE INDEX IF NOT EXISTS idx_books_user_status ON books(user_id, status);

-- NOT VALID: obstoječih vrstic ne preverja, nove in spremenjene pa
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'books_rating_range') THEN
    ALTER TABLE books ADD CONSTRAINT books_rating_range
      CHECK (rating IS NULL OR (rating >= 1 AND rating <= 10)) NOT VALID;
  END IF;
END $$;
