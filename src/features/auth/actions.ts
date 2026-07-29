"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { getServerEnv } from "@/lib/env";
import { keyedDigest } from "@/lib/security-tokens";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string };

const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(10)
});

export async function signIn(
  _state: AuthState,
  formData: FormData
): Promise<AuthState> {
  if (!isSupabaseConfigured) {
    redirect("/dashboard");
  }

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and a password of at least 10 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Email or password is incorrect." };

  const { data: assurance } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (
    assurance?.nextLevel === "aal2" &&
    assurance.currentLevel !== "aal2"
  ) {
    redirect("/mfa");
  }
  redirect("/dashboard");
}

export async function requestPasswordReset(
  _state: AuthState,
  formData: FormData
): Promise<AuthState> {
  if (!isSupabaseConfigured) {
    return { error: "Email delivery is unavailable in preview mode." };
  }
  const email = z.email().safeParse(formData.get("email"));
  if (!email.success) return { error: "Enter a valid email address." };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/reset-password`
  });
  return {};
}

export async function updatePassword(formData: FormData) {
  if (!isSupabaseConfigured) redirect("/sign-in?preview=password");
  const parsed = z.object({
    password: z.string().min(12).max(128),
    confirmation: z.string()
  }).safeParse({
    password: formData.get("password"),
    confirmation: formData.get("confirmation")
  });
  if (!parsed.success || parsed.data.password !== parsed.data.confirmation) {
    redirect("/reset-password?error=Passwords%20must%20match%20and%20use%2012%20characters");
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  await supabase.auth.signOut({ scope: "global" });
  redirect("/sign-in?password=updated");
}

export async function recoverWithCode(formData: FormData) {
  if (!isSupabaseConfigured) redirect("/sign-in?preview=recovered");
  const code = z.string().trim().regex(/^[A-Fa-f0-9-]{20,32}$/).safeParse(formData.get("code"));
  if (!code.success) redirect("/recovery?error=Invalid%20recovery%20code");
  const env = getServerEnv();
  if (!env.RECOVERY_CODE_PEPPER) redirect("/recovery?error=Recovery%20is%20not%20configured");

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: sessionData } = await supabase.auth.getSession();
  if (!user || !sessionData.session) redirect("/forgot-password");
  const digest = keyedDigest(
    code.data.replaceAll("-", "").toUpperCase(),
    env.RECOVERY_CODE_PEPPER
  );
  const admin = createAdminClient();
  const { data: recoveryCode } = await admin
    .from("recovery_codes")
    .select("id")
    .eq("user_id", user.id)
    .eq("code_digest", digest)
    .is("used_at", null)
    .maybeSingle();
  if (!recoveryCode) redirect("/recovery?error=Invalid%20recovery%20code");

  const usedAt = new Date().toISOString();
  const { data: consumed } = await admin
    .from("recovery_codes")
    .update({ used_at: usedAt })
    .eq("id", recoveryCode.id)
    .is("used_at", null)
    .select("id")
    .maybeSingle();
  if (!consumed) redirect("/recovery?error=Recovery%20code%20was%20already%20used");

  const { data: factors } = await admin.auth.admin.mfa.listFactors({ userId: user.id });
  await Promise.all(
    (factors?.factors ?? []).map((factor) =>
      admin.auth.admin.mfa.deleteFactor({ userId: user.id, id: factor.id })
    )
  );
  await admin
    .from("app_sessions")
    .update({ revoked_at: usedAt })
    .eq("user_id", user.id)
    .is("revoked_at", null);
  await admin.auth.admin.signOut(sessionData.session.access_token, "global");
  redirect("/sign-in?recovered=1");
}
