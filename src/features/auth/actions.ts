"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { getServerEnv } from "@/lib/env";
import {
  digestOpaqueToken,
  keyedDigest,
  safeDigestEqual
} from "@/lib/security-tokens";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  beginOwnerSetupFlow,
  clearOwnerSetupFlow,
  hasOwnerSetupFlow
} from "@/features/auth/owner-setup-flow";

export type AuthState = { error?: string; success?: string };

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

const firstOwnerSchema = z
  .object({
    setupCode: z.string().trim().min(10).max(100),
    displayName: z.string().trim().min(2).max(100),
    email: z.email(),
    password: z.string().min(11).max(128),
    confirmation: z.string(),
    businessName: z.string().trim().min(2).max(160),
    businessType: z.string().trim().min(2).max(120),
    currency: z.string().regex(/^[A-Z]{3}$/),
    countryCode: z.string().regex(/^[A-Z]{2}$/),
    timezone: z.string().trim().min(1).max(120)
  })
  .refine((data) => data.password === data.confirmation, {
    path: ["confirmation"],
    message: "Passwords do not match."
  });

const ownerProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(100),
  businessName: z.string().trim().min(2).max(160),
  businessType: z.string().trim().min(2).max(120),
  currency: z.string().regex(/^[A-Z]{3}$/),
  countryCode: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/),
  timezone: z.string().trim().min(1).max(120)
});

export async function startOwnerSetup() {
  if (!(await beginOwnerSetupFlow())) {
    redirect("/sign-in?error=owner_setup_unavailable");
  }
  redirect("/sign-up");
}

export async function createFirstOwner(
  _state: AuthState,
  formData: FormData
): Promise<AuthState> {
  if (!(await hasOwnerSetupFlow())) {
    return { error: "This owner setup session expired. Start again from sign in." };
  }
  if (!isSupabaseConfigured) {
    return { error: "Supabase is not configured." };
  }
  const parsed = firstOwnerSchema.safeParse({
    setupCode: formData.get("setupCode"),
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmation: formData.get("confirmation"),
    businessName: formData.get("businessName"),
    businessType: formData.get("businessType"),
    currency: formData.get("currency"),
    countryCode: formData.get("countryCode"),
    timezone: formData.get("timezone")
  });
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Check the owner and business details."
    };
  }

  const env = getServerEnv();
  const isTestCode = safeDigestEqual(
    digestOpaqueToken(parsed.data.setupCode),
    digestOpaqueToken("EFEBAYLANEFE")
  );
  const isDeploymentCode = Boolean(
    env.OWNER_SETUP_SECRET &&
      safeDigestEqual(
        digestOpaqueToken(parsed.data.setupCode),
        digestOpaqueToken(env.OWNER_SETUP_SECRET)
      )
  );
  if (!isTestCode && !isDeploymentCode) {
    return { error: "The one-time setup code is invalid." };
  }

  const admin = createAdminClient();
  const { data: created, error: userError } =
    await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        full_name: parsed.data.displayName,
        unitpulse_profile_complete: true
      }
    });
  if (userError || !created.user) {
    const message = userError?.message.toLowerCase() ?? "";
    if (message.includes("already") || message.includes("registered") || message.includes("exists")) {
      return { error: "An account already uses this email. Sign in or reset its password." };
    }
    if (message.includes("password")) {
      return { error: "Supabase rejected this password. Use at least 11 characters with letters and numbers." };
    }
    return { error: userError?.message || "The owner account could not be created." };
  }

  const { data: business, error: businessError } = await admin
    .from("businesses")
    .insert({
      name: parsed.data.businessName,
      business_type: parsed.data.businessType,
      currency: parsed.data.currency,
      timezone: parsed.data.timezone,
      country_code: parsed.data.countryCode
    })
    .select("id")
    .single();
  if (businessError || !business) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: "The business workspace could not be created." };
  }

  const joinedAt = new Date().toISOString();
  const [membership, profile] = await Promise.all([
    admin.from("business_memberships").insert({
      business_id: business.id,
      user_id: created.user.id,
      role: "owner",
      status: "active",
      joined_at: joinedAt
    }),
    admin.from("profiles").upsert({
      user_id: created.user.id,
      display_name: parsed.data.displayName,
      timezone: parsed.data.timezone
    })
  ]);
  if (membership.error || profile.error) {
    await admin.from("businesses").delete().eq("id", business.id);
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: "Owner setup could not be completed safely." };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });
  revalidatePath("/", "layout");
  await clearOwnerSetupFlow();
  if (signInError) redirect("/sign-in?created=1");
  redirect("/mfa?next=/dashboard");
}

export async function completeOwnerProfile(
  _state: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = ownerProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    businessName: formData.get("businessName"),
    businessType: formData.get("businessType"),
    currency: formData.get("currency"),
    countryCode: formData.get("countryCode"),
    timezone: formData.get("timezone")
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  const supabase = await createClient();
  const [{ data: userData }, { data: assurance }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  ]);
  const user = userData.user;
  if (!user || assurance?.currentLevel !== "aal2") {
    redirect("/mfa?next=/complete-profile");
  }

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("business_memberships")
    .select("business_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (!membership || membership.role !== "owner") {
    return { error: "Only the business owner can complete this setup." };
  }

  const [profileResult, businessResult, userResult] = await Promise.all([
    admin.from("profiles").upsert({
      user_id: user.id,
      display_name: parsed.data.displayName,
      timezone: parsed.data.timezone
    }),
    admin.from("businesses").update({
      name: parsed.data.businessName,
      business_type: parsed.data.businessType,
      currency: parsed.data.currency,
      country_code: parsed.data.countryCode,
      timezone: parsed.data.timezone
    }).eq("id", membership.business_id),
    admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        full_name: parsed.data.displayName,
        unitpulse_profile_complete: true
      }
    })
  ]);
  if (profileResult.error || businessResult.error || userResult.error) {
    return { error: "Your profile could not be saved. Try again." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

const googleOwnerSchema = z.object({
  displayName: z.string().trim().min(2).max(100),
  businessName: z.string().trim().min(2).max(160),
  businessType: z.string().trim().min(2).max(120),
  currency: z.string().regex(/^[A-Z]{3}$/),
  countryCode: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/),
  timezone: z.string().trim().min(1).max(120)
});

export async function createGoogleOwner(
  _state: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = googleOwnerSchema.safeParse({
    displayName: formData.get("displayName"),
    businessName: formData.get("businessName"),
    businessType: formData.get("businessType"),
    currency: formData.get("currency"),
    countryCode: formData.get("countryCode"),
    timezone: formData.get("timezone")
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details." };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user?.email || !user.identities?.some((identity) => identity.provider === "google")) {
    return { error: "Sign in with Google before creating this workspace." };
  }

  const admin = createAdminClient();
  const { data: existingMembership } = await admin.from("business_memberships").select("id").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
  if (existingMembership) redirect("/dashboard");

  const { data: business, error: businessError } = await admin.from("businesses").insert({
    name: parsed.data.businessName,
    business_type: parsed.data.businessType,
    currency: parsed.data.currency,
    timezone: parsed.data.timezone,
    country_code: parsed.data.countryCode
  }).select("id").single();
  if (businessError || !business) return { error: "The business workspace could not be created." };

  const [membership, profile, authUser] = await Promise.all([
    admin.from("business_memberships").insert({ business_id: business.id, user_id: user.id, role: "owner", status: "active", joined_at: new Date().toISOString() }),
    admin.from("profiles").upsert({ user_id: user.id, display_name: parsed.data.displayName, timezone: parsed.data.timezone }),
    admin.auth.admin.updateUserById(user.id, { user_metadata: { ...user.user_metadata, full_name: parsed.data.displayName, unitpulse_profile_complete: true } })
  ]);
  if (membership.error || profile.error || authUser.error) {
    await admin.from("businesses").delete().eq("id", business.id);
    return { error: "Owner setup could not be completed safely." };
  }

  revalidatePath("/", "layout");
  redirect("/mfa?next=/dashboard");
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
  }
  redirect("/sign-in");
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
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${getServerEnv().NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/reset-password`
  });
  if (error) return { error: "The recovery email could not be sent. Try again." };
  return { success: "Check your inbox for a secure password-reset link." };
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
