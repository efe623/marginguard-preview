import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";

export function GET() {
  return NextResponse.json({
    ok: true,
    mode: isSupabaseConfigured ? "configured" : "fixture"
  });
}
