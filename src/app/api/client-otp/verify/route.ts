import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerEnv, isSupabaseConfigured } from "@/lib/env";
import {
  digestOpaqueToken,
  keyedDigest,
  safeDigestEqual,
  signClientSession
} from "@/lib/security-tokens";
import { createAdminClient } from "@/lib/supabase/admin";

const verifySchema = z.object({
  token: z.string().min(32).max(256),
  code: z.string().regex(/^\d{6}$/)
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ preview: true, verified: true });
  }
  const parsed = verifySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }
  const env = getServerEnv();
  if (!env.CLIENT_SESSION_SECRET) {
    return NextResponse.json({ error: "OTP service unavailable" }, { status: 503 });
  }
  const admin = createAdminClient();
  const { data: token } = await admin
    .from("client_access_tokens")
    .select("id, expires_at, revoked_at")
    .eq("token_digest", digestOpaqueToken(parsed.data.token))
    .maybeSingle();
  if (!token || token.revoked_at || new Date(token.expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const { data: challenge } = await admin
    .from("client_otp_challenges")
    .select("id, otp_digest, attempt_count, expires_at, consumed_at")
    .eq("token_id", token.id)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (
    !challenge ||
    challenge.attempt_count >= 5 ||
    new Date(challenge.expires_at).getTime() <= Date.now()
  ) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const submittedDigest = keyedDigest(parsed.data.code, env.CLIENT_SESSION_SECRET);
  if (!safeDigestEqual(challenge.otp_digest, submittedDigest)) {
    await admin
      .from("client_otp_challenges")
      .update({ attempt_count: challenge.attempt_count + 1 })
      .eq("id", challenge.id);
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const now = new Date().toISOString();
  await Promise.all([
    admin.from("client_otp_challenges").update({ consumed_at: now }).eq("id", challenge.id),
    admin.from("client_access_tokens").update({ verified_at: now }).eq("id", token.id)
  ]);

  const expirySeconds = Math.min(
    Math.floor(new Date(token.expires_at).getTime() / 1000),
    Math.floor(Date.now() / 1000) + 30 * 60
  );
  const response = NextResponse.json({ verified: true });
  response.cookies.set(
    "mg_client_session",
    signClientSession(token.id, expirySeconds, env.CLIENT_SESSION_SECRET),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: new Date(expirySeconds * 1000)
    }
  );
  return response;
}
