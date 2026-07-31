import { cache } from "react";
import { ensureAppSession } from "@/features/auth/session";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const getAuthenticatedBusinessContext = cache(async () => {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) return null;
  if (!(await ensureAppSession(supabase, claims))) return null;

  const { data: membership } = await supabase
    .from("business_memberships")
    .select("id, business_id, role")
    .eq("user_id", claims.sub)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!membership) return null;

  const [{ data: profile }, { data: business }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, timezone")
      .eq("user_id", claims.sub)
      .maybeSingle(),
    supabase
      .from("businesses")
      .select("name, business_type, currency, country_code, timezone")
      .eq("id", membership.business_id)
      .maybeSingle()
  ]);

  return {
    supabase,
    userId: claims.sub,
    assuranceLevel: claims.aal,
    membership,
    profile,
    business,
    profileComplete:
      (claims.user_metadata as { unitpulse_profile_complete?: boolean } | undefined)
        ?.unitpulse_profile_complete === true
  };
});
