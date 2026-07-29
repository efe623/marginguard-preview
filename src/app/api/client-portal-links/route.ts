import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwnerAal2 } from "@/features/auth/authorization";
import { getServerEnv } from "@/lib/env";
import { createOpaqueToken, digestOpaqueToken } from "@/lib/security-tokens";

const schema = z.object({ clientId: z.uuid() });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid client." }, { status: 400 });
  const owner = await getOwnerAal2();
  if (!owner) return NextResponse.json({ error: "Owner MFA is required." }, { status: 403 });
  const { data: client } = await owner.supabase
    .from("clients")
    .select("id, business_id")
    .eq("id", parsed.data.clientId)
    .eq("business_id", owner.membership.business_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!client) return NextResponse.json({ error: "Client unavailable." }, { status: 404 });
  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
  const { error } = await owner.supabase.from("client_portal_tokens").insert({
    business_id: client.business_id,
    client_id: client.id,
    token_digest: digestOpaqueToken(token),
    expires_at: expiresAt,
    created_by: owner.user.id
  });
  if (error) return NextResponse.json({ error: "Portal link could not be saved." }, { status: 503 });
  await owner.supabase.from("audit_events").insert({
    business_id: client.business_id,
    actor_user_id: owner.user.id,
    action: "client_portal.link_created",
    subject_type: "client",
    subject_id: client.id,
    metadata: { expires_at: expiresAt }
  });
  return NextResponse.json({
    url: `${getServerEnv().NEXT_PUBLIC_APP_URL}/portal/${token}`,
    expiresAt
  });
}
