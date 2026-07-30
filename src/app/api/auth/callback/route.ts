import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { digestOpaqueToken } from "@/lib/security-tokens";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next") ?? "/dashboard";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/dashboard";
  const invitationToken = url.searchParams.get("invitation");
  if (!isSupabaseConfigured || !code) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/sign-in?error=callback", request.url));
  if (invitationToken) {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    const admin = createAdminClient();
    const { data: invitation } = await admin
      .from("business_invitations")
      .select("id, business_id, email, role, expires_at, accepted_at, revoked_at")
      .eq("token_digest", digestOpaqueToken(invitationToken))
      .maybeSingle();
    if (
      !user?.email ||
      !invitation ||
      invitation.accepted_at ||
      invitation.revoked_at ||
      new Date(invitation.expires_at).getTime() <= Date.now() ||
      invitation.email.toLowerCase() !== user.email.toLowerCase()
    ) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/sign-in?error=invitation", request.url));
    }
    const now = new Date().toISOString();
    const { error: membershipError } = await admin.from("business_memberships").upsert({
      business_id: invitation.business_id,
      user_id: user.id,
      role: invitation.role,
      status: "active",
      joined_at: now
    });
    if (membershipError) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/sign-in?error=membership", request.url));
    }
    await Promise.all([
      admin
        .from("business_invitations")
        .update({ accepted_at: now })
        .eq("id", invitation.id),
      admin.from("profiles").upsert({
        user_id: user.id,
        display_name: user.user_metadata?.full_name || user.email.split("@")[0]
      })
    ]);
  }
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/sign-in?error=callback", request.url));
  }
  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("business_memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (!membership) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/sign-in?error=not_member", request.url));
  }
  return NextResponse.redirect(new URL(next, request.url));
}
