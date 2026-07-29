import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedMembership() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("business_memberships")
    .select("id, business_id, role, send_financial_documents")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (!membership) return null;
  return { supabase, user, membership };
}

export async function getOwnerAal2() {
  const supabase = await createClient();
  const [
    {
      data: { user }
    },
    { data: assurance }
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  ]);
  if (!user || assurance?.currentLevel !== "aal2") return null;

  const { data: membership } = await supabase
    .from("business_memberships")
    .select("id, business_id")
    .eq("user_id", user.id)
    .eq("role", "owner")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (!membership) return null;
  return { supabase, user, membership };
}
