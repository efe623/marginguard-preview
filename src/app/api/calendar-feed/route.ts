import { NextResponse } from "next/server";
import { getAuthenticatedMembership } from "@/features/auth/authorization";
import { createOpaqueToken, digestOpaqueToken } from "@/lib/security-tokens";

export async function POST(request: Request) {
  const actor = await getAuthenticatedMembership();
  if (!actor) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  const { supabase, user, membership } = actor;
  const rawToken = createOpaqueToken();
  const { error: revokeError } = await supabase
    .from("calendar_feed_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("business_id", membership.business_id)
    .is("revoked_at", null);
  if (revokeError) return NextResponse.json({ error: revokeError.message }, { status: 500 });
  const { error } = await supabase.from("calendar_feed_tokens").insert({
    business_id: membership.business_id,
    membership_id: membership.id,
    user_id: user.id,
    token_digest: digestOpaqueToken(rawToken)
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    url: `${new URL(request.url).origin}/api/calendar/${rawToken}`
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE() {
  const actor = await getAuthenticatedMembership();
  if (!actor) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  const { error } = await actor.supabase
    .from("calendar_feed_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", actor.user.id)
    .eq("business_id", actor.membership.business_id)
    .is("revoked_at", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
