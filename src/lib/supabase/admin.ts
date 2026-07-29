import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv, publicEnv } from "@/lib/env";

export function createAdminClient() {
  const env = getServerEnv();
  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    throw new Error("Supabase admin credentials are not configured.");
  }

  return createClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
