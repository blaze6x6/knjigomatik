-- Knjigomatik Database Initialization

DO $$ BEGIN
    CREATE TYPE book_status AS ENUM ('wishlist', 'reading', 'read', 'reserved', 'unavailable', `cancelled`);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(500) NOT NULL,
    status book_status NOT NULL DEFAULT 'wishlist',
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    color VARCHAR(7) NOT NULL DEFAULT '#ffffff',
    notes TEXT,
    genre VARCHAR(100),
    year INTEGER,
    thumbnail TEXT,
    description TEXT,
    isbn VARCHAR(20),
    page_count INTEGER,
    publisher VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

