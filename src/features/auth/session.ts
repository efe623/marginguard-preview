import type { SupabaseClient } from "@supabase/supabase-js";

type SessionClaims = {
  sub?: string;
  session_id?: string;
};

export async function ensureAppSession(
  supabase: SupabaseClient,
  claims: SessionClaims
) {
  if (!claims.sub || !claims.session_id) return false;

  const { data, error } = await supabase
    .from("app_sessions")
    .upsert(
      {
        session_id: claims.session_id,
        user_id: claims.sub,
        last_seen_at: new Date().toISOString()
      },
      { onConflict: "session_id" }
    )
    .select("revoked_at")
    .single();

  if (error || data?.revoked_at) return false;
  return true;
}
