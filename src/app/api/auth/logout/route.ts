import { clearSessionResponse } from "@/lib/auth";

export async function POST() {
  return clearSessionResponse();
}
