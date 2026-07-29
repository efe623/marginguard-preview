import { NextResponse } from "next/server";
import { getServerEnv, isSupabaseConfigured } from "@/lib/env";
import { generateRecoveryCodes, keyedDigest } from "@/lib/security-tokens";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ codes: generateRecoveryCodes() });
  }
  const env = getServerEnv();
  if (!env.RECOVERY_CODE_PEPPER) {
    return NextResponse.json({ error: "Recovery is not configured" }, { status: 503 });
  }
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
  if (!user || assurance?.currentLevel !== "aal2") {
    return NextResponse.json({ error: "MFA is required" }, { status: 403 });
  }

  const codes = generateRecoveryCodes();
  const admin = createAdminClient();
  const { error: deleteError } = await admin.from("recovery_codes").delete().eq("user_id", user.id);
  if (deleteError) return NextResponse.json({ error: "Codes could not be replaced" }, { status: 503 });
  const { error } = await admin.from("recovery_codes").insert(
    codes.map((code) => ({
      user_id: user.id,
      code_digest: keyedDigest(code.replaceAll("-", ""), env.RECOVERY_CODE_PEPPER ?? "")
    }))
  );
  if (error) return NextResponse.json({ error: "Codes could not be created" }, { status: 503 });
  return NextResponse.json({ codes });
}
