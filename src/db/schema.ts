import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const bookStatusEnum = pgEnum("book_status", [
  "wishlist",
  "reading",
  "read",
  "reserved",
  "unavailable",
  "cancelled",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
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
  notes: text("notes"),
  genre: varchar("genre", { length: 100 }),
  year: integer("year"),
  thumbnail: text("thumbnail"),
  description: text("description"),
  isbn: varchar("isbn", { length: 20 }),
  pageCount: integer("page_count"),
  publisher: varchar("publisher", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;
