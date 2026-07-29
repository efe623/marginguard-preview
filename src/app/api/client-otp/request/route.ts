import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerEnv, isSupabaseConfigured } from "@/lib/env";
import {
  createOtp,
  digestOpaqueToken,
  keyedDigest
} from "@/lib/security-tokens";
import { createAdminClient } from "@/lib/supabase/admin";

const requestSchema = z.object({ token: z.string().min(32).max(256) });

export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ preview: true, accepted: true });
  }
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ accepted: true }, { status: 202 });
  }

  const env = getServerEnv();
  if (!env.CLIENT_SESSION_SECRET) {
    return NextResponse.json({ error: "OTP service unavailable" }, { status: 503 });
  }

  const admin = createAdminClient();
  const { data: token } = await admin
    .from("client_access_tokens")
    .select("id, client_email, business_id, expires_at, revoked_at")
    .eq("token_digest", digestOpaqueToken(parsed.data.token))
    .maybeSingle();

  if (
    !token ||
    token.revoked_at ||
    new Date(token.expires_at).getTime() <= Date.now()
  ) {
    return NextResponse.json({ accepted: true }, { status: 202 });
  }

  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count } = await admin
    .from("client_otp_challenges")
    .select("id", { count: "exact", head: true })
    .eq("token_id", token.id)
    .gte("created_at", oneMinuteAgo);
  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: "Wait before requesting another code." }, { status: 429 });
  }

  const otp = createOtp();
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
  const { error: challengeError } = await admin
    .from("client_otp_challenges")
    .insert({
      token_id: token.id,
      otp_digest: keyedDigest(otp, env.CLIENT_SESSION_SECRET),
      expires_at: expiresAt
    });
  if (challengeError) {
    return NextResponse.json({ error: "OTP service unavailable" }, { status: 503 });
  }

  await admin.from("notification_outbox").insert({
    business_id: token.business_id,
    recipient_email: token.client_email,
    template: "client_approval_otp",
    payload: { code: otp, expires_in_minutes: 10 },
    idempotency_key: `client-otp:${token.id}:${expiresAt}`
  });

  return NextResponse.json({ accepted: true }, { status: 202 });
}
