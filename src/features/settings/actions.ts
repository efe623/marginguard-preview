"use server";

import { redirect } from "next/navigation";
import { getOwnerAal2 } from "@/features/auth/authorization";
import { isSupabaseConfigured } from "@/lib/env";
import { getServerEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function scheduleDeletion() {
  if (!isSupabaseConfigured) redirect("/settings/deletion?preview=scheduled");
  const owner = await getOwnerAal2();
  if (!owner) redirect("/mfa?next=/settings/deletion");
  const { error } = await owner.supabase.rpc("schedule_business_deletion", {
    p_business_id: owner.membership.business_id
  });
  if (error) redirect(`/settings/deletion?error=${encodeURIComponent(error.message)}`);
  await owner.supabase.auth.signOut({ scope: "global" });
  redirect("/sign-in?deletion=scheduled");
}

export async function restoreDeletion(formData: FormData) {
  const businessId = formData.get("businessId")?.toString();
  if (!businessId) redirect("/settings/deletion?error=Business%20is%20missing");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("restore_business", {
    p_business_id: businessId
  });
  if (error || !data) redirect("/settings/deletion?error=The%20restore%20window%20has%20ended");
  redirect("/mfa?next=/dashboard");
}

export async function requestDataExport() {
  if (!isSupabaseConfigured) redirect("/settings/deletion?preview=export");
  const owner = await getOwnerAal2();
  if (!owner) redirect("/mfa?next=/settings/deletion");
  const admin = createAdminClient();
  await admin.from("audit_events").insert({
    business_id: owner.membership.business_id,
    actor_user_id: owner.user.id,
    action: "export.requested",
    subject_type: "business",
    subject_id: owner.membership.business_id,
    metadata: { format: "json_zip" }
  });
  redirect("/settings/deletion?export=requested");
}

export async function createSupportGrant(formData: FormData) {
  if (!isSupabaseConfigured) redirect("/settings/support?preview=granted");
  const reason = formData.get("reason")?.toString().trim() ?? "";
  const projectId = formData.get("projectId")?.toString() || null;
  const hours = Math.min(24, Math.max(1, Number(formData.get("hours") ?? 1)));
  if (reason.length < 10) redirect("/settings/support?error=Explain%20why%20support%20needs%20access");
  const env = getServerEnv();
  if (!env.SUPPORT_USER_ID) redirect("/settings/support?error=Support%20identity%20is%20not%20configured");
  const owner = await getOwnerAal2();
  if (!owner) redirect("/mfa?next=/settings/support");
  const expiresAt = new Date(Date.now() + hours * 60 * 60_000).toISOString();
  const admin = createAdminClient();
  const { error } = await admin.from("support_access_grants").insert({
    business_id: owner.membership.business_id,
    support_user_id: env.SUPPORT_USER_ID,
    project_id: projectId,
    reason,
    granted_by: owner.user.id,
    expires_at: expiresAt
  });
  if (error) redirect(`/settings/support?error=${encodeURIComponent(error.message)}`);
  redirect("/settings/support?granted=1");
}
