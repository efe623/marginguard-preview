"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getOwnerAal2 } from "@/features/auth/authorization";
import { getServerEnv, isSupabaseConfigured } from "@/lib/env";
import { createOpaqueToken, digestOpaqueToken } from "@/lib/security-tokens";
import { createAdminClient } from "@/lib/supabase/admin";

export async function inviteStaff(formData: FormData) {
  if (!isSupabaseConfigured) redirect("/settings/members?preview=invited");
  const email = z.email().safeParse(formData.get("email"));
  if (!email.success) redirect("/settings/members?error=Enter%20a%20valid%20email");
  const owner = await getOwnerAal2();
  if (!owner) redirect("/mfa?next=/settings/members");

  const rawToken = createOpaqueToken();
  const expiresAt = new Date(Date.now() + 72 * 60 * 60_000).toISOString();
  const admin = createAdminClient();
  const { data: invitation, error } = await admin
    .from("business_invitations")
    .insert({
      business_id: owner.membership.business_id,
      email: email.data.toLowerCase(),
      role: "staff",
      token_digest: digestOpaqueToken(rawToken),
      invited_by: owner.user.id,
      expires_at: expiresAt
    })
    .select("id")
    .single();
  if (error) redirect(`/settings/members?error=${encodeURIComponent(error.message)}`);

  const callback = `${getServerEnv().NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/dashboard&invitation=${rawToken}`;
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email.data, {
    redirectTo: callback
  });
  if (inviteError) {
    await admin
      .from("business_invitations")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", invitation.id);
    redirect("/settings/members?error=Invitation%20email%20could%20not%20be%20sent");
  }
  revalidatePath("/settings/members");
  redirect("/settings/members?invited=1");
}

export async function setFinancialPermission(formData: FormData) {
  if (!isSupabaseConfigured) redirect("/settings/members?preview=permission");
  const parsed = z.object({
    membershipId: z.uuid(),
    enabled: z.enum(["true", "false"])
  }).safeParse({
    membershipId: formData.get("membershipId"),
    enabled: formData.get("enabled")
  });
  if (!parsed.success) redirect("/settings/members?error=Invalid%20permission");
  const owner = await getOwnerAal2();
  if (!owner) redirect("/mfa?next=/settings/members");
  const admin = createAdminClient();
  const { error } = await admin
    .from("business_memberships")
    .update({ send_financial_documents: parsed.data.enabled === "true" })
    .eq("id", parsed.data.membershipId)
    .eq("business_id", owner.membership.business_id)
    .eq("role", "staff");
  if (error) redirect(`/settings/members?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/settings/members");
  redirect("/settings/members?updated=1");
}

export async function assignProject(formData: FormData) {
  if (!isSupabaseConfigured) redirect(`/projects/${formData.get("projectId")}?preview=assigned`);
  const parsed = z.object({
    projectId: z.uuid(),
    membershipId: z.uuid()
  }).safeParse({
    projectId: formData.get("projectId"),
    membershipId: formData.get("membershipId")
  });
  if (!parsed.success) redirect("/projects?error=Invalid%20assignment");
  const owner = await getOwnerAal2();
  if (!owner) redirect(`/mfa?next=/projects/${parsed.data.projectId}`);
  const admin = createAdminClient();
  const { data: member } = await admin
    .from("business_memberships")
    .select("id")
    .eq("id", parsed.data.membershipId)
    .eq("business_id", owner.membership.business_id)
    .eq("role", "staff")
    .eq("status", "active")
    .maybeSingle();
  const { data: project } = await admin
    .from("projects")
    .select("id")
    .eq("id", parsed.data.projectId)
    .eq("business_id", owner.membership.business_id)
    .maybeSingle();
  if (!member || !project) redirect("/projects?error=Assignment%20target%20not%20found");
  const { error } = await admin.from("project_assignments").upsert({
    business_id: owner.membership.business_id,
    project_id: project.id,
    membership_id: member.id,
    assigned_by: owner.user.id
  }, { onConflict: "project_id,membership_id" });
  if (error) redirect(`/projects/${project.id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/projects/${project.id}`);
  redirect(`/projects/${project.id}?assigned=1`);
}

export async function removeProjectAssignment(formData: FormData) {
  if (!isSupabaseConfigured) redirect(`/projects/${formData.get("projectId")}?preview=unassigned`);
  const parsed = z.object({
    projectId: z.uuid(),
    membershipId: z.uuid()
  }).safeParse({
    projectId: formData.get("projectId"),
    membershipId: formData.get("membershipId")
  });
  if (!parsed.success) redirect("/projects?error=Invalid%20assignment");
  const owner = await getOwnerAal2();
  if (!owner) redirect(`/mfa?next=/projects/${parsed.data.projectId}`);
  const admin = createAdminClient();
  await admin
    .from("project_assignments")
    .delete()
    .eq("business_id", owner.membership.business_id)
    .eq("project_id", parsed.data.projectId)
    .eq("membership_id", parsed.data.membershipId);
  revalidatePath(`/projects/${parsed.data.projectId}`);
  redirect(`/projects/${parsed.data.projectId}?unassigned=1`);
}
