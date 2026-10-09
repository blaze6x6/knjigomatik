export const BOOK_STATUSES = ["wishlist", "reading", "read", "reserved", "unavailable", "cancelled"] as const;
export type BookStatus = (typeof BOOK_STATUSES)[number];

export const STATUS_ORDER: BookStatus[] = ["reading", "wishlist", "reserved", "read", "unavailable", "cancelled"];

export const STATUS: Record<BookStatus, { label: string; short: string; tone: string }> = {
  wishlist:    { label: "Želja",                 short: "Želja",       tone: "plum" },
  reading:     { label: "V branju",              short: "V branju",    tone: "sky" },
  read:        { label: "Prebrana",              short: "Prebrana",    tone: "moss" },
  reserved:    { label: "Rezervirana",           short: "Rezervirana", tone: "brass" },
  unavailable: { label: "Ni na voljo",           short: "Ni na voljo", tone: "rust" },
  cancelled:   { label: "Prenehal(a) z branjem", short: "Opuščena",    tone: "stone" },
};

export const GENRES = [
  "Roman", "Kriminalka", "Fantazija", "Znanstvena fantastika", "Triler",
  "Biografija", "Zgodovina", "Znanost", "Poezija", "Filozofija",
  "Samopomoč", "Potopis", "Drama", "Komedija", "Mladinska", "Strokovna", "Drugo",
];

export const SPINE_COLORS = ["#ffffff", "#9b2c2c", "#c2762b", "#b7922f", "#4d7c4f", "#2f6f73", "#3d5a99", "#6b4a8f", "#8a5a44", "#4a4a4a"];
