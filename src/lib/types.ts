import type { BookStatus } from "@/lib/status";

export interface SessionUserInfo {
  userId: string;
  username: string;
  displayName: string;
  email: string | null;
  isAdmin: boolean;
}

export interface BookData {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  rating: number | null;
  color: string;
  summary: string | null;
  genre: string | null;
  year: number | null;
  thumbnail: string | null;
  description: string | null;
  isbn: string | null;
  pageCount: number | null;
  publisher: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
