import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/internal-reset-7f8a9c3e|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
