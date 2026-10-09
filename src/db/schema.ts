import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { BOOK_STATUSES } from "@/lib/status";

// Vir resnice za shemo so SQL datoteke v ./migrations.
// Ta datoteka jih le odraža za tipizirane poizvedbe.

export const bookStatusEnum = pgEnum("book_status", BOOK_STATUSES);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 254 }),
  passwordHash: text("password_hash").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  disabled: boolean("disabled").notNull().default(false),
  tokenVersion: integer("token_version").notNull().default(0),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const passwordResets = pgTable("password_resets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const books = pgTable("books", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  author: varchar("author", { length: 500 }).notNull(),
  status: bookStatusEnum("status").notNull().default("wishlist"),
  rating: integer("rating"),
  color: varchar("color", { length: 7 }).notNull().default("#ffffff"),
  summary: text("summary"),
  genre: varchar("genre", { length: 100 }),
  year: integer("year"),
  thumbnail: text("thumbnail"),
  description: text("description"),
  isbn: varchar("isbn", { length: 20 }),
  pageCount: integer("page_count"),
  publisher: varchar("publisher", { length: 255 }),
  startedAt: date("started_at"),
  finishedAt: date("finished_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Book = typeof books.$inferSelect;
