import { NextResponse } from "next/server";
import { getServerEnv, isSupabaseConfigured } from "@/lib/env";

export function GET() {
  return NextResponse.json({
    ok: true,
    mode: isSupabaseConfigured ? "configured" : "fixture",
    aiConfigured: Boolean(getServerEnv().GEMINI_API_KEY?.trim()),
    aiModel: getServerEnv().GEMINI_MODEL
  });
}
