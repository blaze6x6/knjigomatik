-- 0003_email_and_cleanup
-- * e-naslov uporabnika (za samostojno ponastavitev gesla po SMTP)
-- * odstranitev neuporabljenega stolpca google_books_id

ALTER TABLE users ADD COLUMN IF NOT EXISTS email varchar(254);
-- en e-naslov = en račun (primerjava brez razlike med velikimi in malimi črkami)
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_key ON users (lower(email)) WHERE email IS NOT NULL;

ALTER TABLE books DROP COLUMN IF EXISTS google_books_id;
