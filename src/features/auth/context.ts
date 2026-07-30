import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const getAuthenticatedBusinessContext = cache(async () => {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) return null;

  const { data: membership } = await supabase
    .from("business_memberships")
    .select("id, business_id, role")
    .eq("user_id", claims.sub)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!membership) return null;

  return {
    supabase,
    userId: claims.sub,
    assuranceLevel: claims.aal,
    membership
  };
});
