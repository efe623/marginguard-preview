import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerEnv, isSupabaseConfigured } from "@/lib/env";
import { keyedDigest, verifyClientSession } from "@/lib/security-tokens";
import { createAdminClient } from "@/lib/supabase/admin";

const decisionSchema = z.object({
  decision: z.enum(["approved", "rejected"])
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ preview: true, recorded: true });
  }
  const parsed = decisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }
  const env = getServerEnv();
  const cookieStore = await cookies();
  const value = cookieStore.get("mg_client_session")?.value;
  const session =
    value && env.CLIENT_SESSION_SECRET
      ? verifyClientSession(value, env.CLIENT_SESSION_SECRET)
      : null;
  if (!session) return NextResponse.json({ error: "Verification required" }, { status: 401 });

  const admin = createAdminClient();
  const { data: token } = await admin
    .from("client_access_tokens")
    .select("id, expires_at, revoked_at, verified_at")
    .eq("id", session.tokenId)
    .maybeSingle();
  if (
    !token ||
    token.revoked_at ||
    !token.verified_at ||
    new Date(token.expires_at).getTime() <= Date.now()
  ) {
    return NextResponse.json({ error: "Link expired" }, { status: 410 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ipHash = forwardedFor
    ? keyedDigest(forwardedFor, env.CLIENT_SESSION_SECRET ?? "")
    : null;
  const { error } = await admin.rpc("record_client_decision", {
    p_token_id: token.id,
    p_decision: parsed.data.decision,
    p_ip_hash: ipHash,
    p_user_agent: request.headers.get("user-agent")
  });
  if (error?.code === "23505") {
    return NextResponse.json({ error: "Decision already recorded" }, { status: 409 });
  }
  if (error?.code === "55000") {
    return NextResponse.json({ error: "Version is no longer current" }, { status: 409 });
  }
  if (error) return NextResponse.json({ error: "Decision failed" }, { status: 503 });

  return NextResponse.json({ recorded: true });
}
