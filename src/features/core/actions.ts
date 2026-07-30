"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ensureAppSession } from "@/features/auth/session";
import { isSupabaseConfigured } from "@/lib/env";
import { toMinorUnits } from "@/lib/money";
import { createOpaqueToken, digestOpaqueToken } from "@/lib/security-tokens";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

type Actor = {
  userId: string;
  businessId: string;
  membershipId: string;
  role: "owner" | "staff";
};

async function requireActor(): Promise<{
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>;
  actor: Actor;
}> {
  const supabase = await createSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const { data: claimsData } = await supabase.auth.getClaims();
  if (
    !claimsData?.claims ||
    !(await ensureAppSession(supabase, claimsData.claims))
  ) {
    redirect("/sign-in?error=Session%20expired");
  }

  const { data: membership } = await supabase
    .from("business_memberships")
    .select("id, business_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (!membership) throw new Error("No active business membership.");

  return {
    supabase,
    actor: {
      userId: user.id,
      businessId: membership.business_id,
      membershipId: membership.id,
      role: membership.role
    }
  };
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

const clientSchema = z.object({
  name: z.string().trim().min(1).max(180),
  email: z.union([z.literal(""), z.email()]),
  phone: z.string().trim().max(50),
  location: z.string().trim().max(180),
  notes: z.string().trim().max(5000)
});

export async function createClient(formData: FormData) {
  if (!isSupabaseConfigured) redirect("/clients?preview=client");
  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    location: formData.get("location"),
    notes: formData.get("notes")
  });
  if (!parsed.success) fail("/clients/new", "Check the client details.");

  const { supabase, actor } = await requireActor();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      business_id: actor.businessId,
      name: parsed.data.name,
      primary_email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      location: parsed.data.location || null,
      notes: parsed.data.notes || null,
      created_by: actor.userId
    })
    .select("id")
    .single();
  if (error) fail("/clients/new", error.message);

  revalidatePath("/clients");
  redirect(`/clients/${data.id}`);
}

export async function updateClientNotes(formData: FormData) {
  if (!isSupabaseConfigured) return;
  const parsed = z
    .object({
      clientId: z.uuid(),
      notes: z.string().trim().max(5000)
    })
    .safeParse({
      clientId: formData.get("clientId"),
      notes: formData.get("notes") ?? ""
    });
  if (!parsed.success) return;
  const { supabase, actor } = await requireActor();
  const { error } = await supabase
    .from("clients")
    .update({ notes: parsed.data.notes || null })
    .eq("id", parsed.data.clientId)
    .eq("business_id", actor.businessId);
  if (error) fail(`/clients/${parsed.data.clientId}`, error.message);
  revalidatePath(`/clients/${parsed.data.clientId}`);
}

const projectSchema = z.object({
  name: z.string().trim().min(1).max(180),
  clientId: z.uuid(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  quote: z.string().min(1),
  pricingMethod: z.enum(["hourly", "fixed"]),
  hourlyRate: z.string().optional(),
  revisionLimit: z.coerce.number().int().min(0).max(100)
});

export async function createProject(formData: FormData) {
  if (!isSupabaseConfigured) redirect("/projects/ecommerce-redesign/scope");
  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    clientId: formData.get("clientId"),
    currency: formData.get("currency"),
    quote: formData.get("quote"),
    pricingMethod: formData.get("pricingMethod"),
    hourlyRate: formData.get("hourlyRate")?.toString() || undefined,
    revisionLimit: formData.get("revisionLimit")
  });
  if (!parsed.success) fail("/projects/new", "Check the project details.");

  let quoteMinor: bigint;
  let hourlyRateMinor: bigint | null = null;
  try {
    quoteMinor = toMinorUnits(parsed.data.quote, parsed.data.currency);
    if (parsed.data.pricingMethod === "hourly") {
      hourlyRateMinor = toMinorUnits(
        parsed.data.hourlyRate ?? "",
        parsed.data.currency
      );
    }
  } catch (error) {
    fail("/projects/new", error instanceof Error ? error.message : "Invalid amount.");
  }

  const { supabase, actor } = await requireActor();
  const code = `PRJ-${randomBytes(4).toString("hex").toUpperCase()}`;
  const { data, error } = await supabase
    .from("projects")
    .insert({
      business_id: actor.businessId,
      client_id: parsed.data.clientId,
      code,
      name: parsed.data.name,
      currency: parsed.data.currency,
      quote_amount_minor: quoteMinor.toString(),
      pricing_method: parsed.data.pricingMethod,
      hourly_rate_minor: hourlyRateMinor?.toString() ?? null,
      revision_limit: parsed.data.revisionLimit,
      created_by: actor.userId
    })
    .select("id")
    .single();
  if (error) fail("/projects/new", error.message);

  revalidatePath("/projects");
  redirect(`/projects/${data.id}/scope`);
}

const changeRequestSchema = z.object({
  projectId: z.uuid(),
  title: z.string().trim().min(1).max(240),
  requestType: z.enum(["new_request", "revision", "approval", "promise"]),
  sourceType: z.enum(["whatsapp", "email", "meeting_note", "other"]),
  sourceExcerpt: z.string().trim().max(10000),
  scopeItemId: z.union([z.literal(""), z.uuid()])
});

export async function createChangeRequest(formData: FormData) {
  const fallbackProject = formData.get("projectId")?.toString() || "ecommerce-redesign";
  if (!isSupabaseConfigured) {
    redirect(`/projects/${fallbackProject}/requests?preview=request`);
  }
  const parsed = changeRequestSchema.safeParse({
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    requestType: formData.get("requestType"),
    sourceType: formData.get("sourceType"),
    sourceExcerpt: formData.get("sourceExcerpt") ?? "",
    scopeItemId: formData.get("scopeItemId") ?? ""
  });
  if (!parsed.success) {
    fail(`/projects/${fallbackProject}/requests/new`, "Check the request details.");
  }

  const { supabase, actor } = await requireActor();
  const { data: request, error } = await supabase
    .from("change_requests")
    .insert({
      business_id: actor.businessId,
      project_id: parsed.data.projectId,
      scope_item_id: parsed.data.scopeItemId || null,
      title: parsed.data.title,
      request_type: parsed.data.requestType,
      source_type: parsed.data.sourceType,
      source_excerpt: parsed.data.sourceExcerpt || null,
      evidence_attached: Boolean(parsed.data.sourceExcerpt),
      created_by: actor.userId
    })
    .select("id")
    .single();
  if (error) fail(`/projects/${parsed.data.projectId}/requests/new`, error.message);
  if (parsed.data.requestType === "revision") {
    const { data: latest } = await supabase
      .from("revision_events")
      .select("revision_number")
      .eq("project_id", parsed.data.projectId)
      .order("revision_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error: revisionError } = await supabase.from("revision_events").insert({
      business_id: actor.businessId,
      project_id: parsed.data.projectId,
      change_request_id: request.id,
      revision_number: (latest?.revision_number ?? 0) + 1,
      title: parsed.data.title,
      created_by: actor.userId
    });
    if (revisionError) {
      fail(`/projects/${parsed.data.projectId}/requests`, "Request saved, but revision counting needs review.");
    }
  }
  const notificationAdmin = createAdminClient();
  const { data: requestRecipients } = await notificationAdmin
    .from("business_memberships")
    .select("user_id")
    .eq("business_id", actor.businessId)
    .eq("status", "active");
  for (const recipient of requestRecipients ?? []) {
    await notificationAdmin.from("in_app_notifications").upsert(
      {
        business_id: actor.businessId,
        user_id: recipient.user_id,
        project_id: parsed.data.projectId,
        kind: "change_request",
        title: `New ${parsed.data.requestType.replace("_", " ")}`,
        body: parsed.data.title,
        href: `/projects/${parsed.data.projectId}/requests`,
        dedupe_key: `change-request:${request.id}:${recipient.user_id}`
      },
      { onConflict: "dedupe_key", ignoreDuplicates: true }
    );
  }

  revalidatePath(`/projects/${parsed.data.projectId}/requests`);
  redirect(`/projects/${parsed.data.projectId}/requests`);
}

const scopeSchema = z.object({
  projectId: z.uuid(),
  timeline: z.string().trim().min(1).max(2000),
  revisionLimit: z.coerce.number().int().min(0).max(100),
  pricingMethod: z.enum(["hourly", "fixed"]),
  hourlyRate: z.string(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  deliverables: z.string().trim().min(1).max(20000),
  exclusions: z.string().trim().max(20000)
});

function parseScopeLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, ...description] = line.split("|");
      return { title: title.trim(), description: description.join("|").trim() };
    });
}

export async function publishScope(formData: FormData) {
  const fallbackProject = formData.get("projectId")?.toString() || "ecommerce-redesign";
  if (!isSupabaseConfigured) redirect(`/projects/${fallbackProject}/scope?preview=published`);
  const parsed = scopeSchema.safeParse({
    projectId: formData.get("projectId"),
    timeline: formData.get("timeline"),
    revisionLimit: formData.get("revisionLimit"),
    pricingMethod: formData.get("pricingMethod"),
    hourlyRate: formData.get("hourlyRate")?.toString() ?? "",
    currency: formData.get("currency"),
    deliverables: formData.get("deliverables"),
    exclusions: formData.get("exclusions") ?? ""
  });
  if (!parsed.success) fail(`/projects/${fallbackProject}/scope/edit`, "Complete the structured scope.");

  let hourlyRateMinor: bigint | null = null;
  try {
    if (parsed.data.pricingMethod === "hourly") {
      hourlyRateMinor = toMinorUnits(parsed.data.hourlyRate, parsed.data.currency);
    }
  } catch (error) {
    fail(
      `/projects/${parsed.data.projectId}/scope/edit`,
      error instanceof Error ? error.message : "Invalid hourly rate."
    );
  }
  const { supabase } = await requireActor();
  const { error } = await supabase.rpc("publish_project_scope", {
    p_project_id: parsed.data.projectId,
    p_timeline_text: parsed.data.timeline,
    p_revision_limit: parsed.data.revisionLimit,
    p_pricing_method: parsed.data.pricingMethod,
    p_hourly_rate_minor: hourlyRateMinor?.toString() ?? null,
    p_deliverables: parseScopeLines(parsed.data.deliverables),
    p_exclusions: parseScopeLines(parsed.data.exclusions)
  });
  if (error) fail(`/projects/${parsed.data.projectId}/scope/edit`, error.message);
  revalidatePath(`/projects/${parsed.data.projectId}/scope`);
  redirect(`/projects/${parsed.data.projectId}/scope`);
}

const changeOrderSchema = z.object({
  projectId: z.uuid(),
  changeRequestId: z.union([z.literal(""), z.uuid()]),
  title: z.string().trim().min(1).max(240),
  reason: z.string().trim().min(1).max(500),
  description: z.string().trim().min(1).max(10000),
  amount: z.string().min(1),
  currency: z.string().regex(/^[A-Z]{3}$/),
  depositPercent: z.coerce.number().int().min(1).max(100),
  timelineImpact: z.string().trim().min(1).max(1000)
});

export async function sendChangeOrder(formData: FormData) {
  const fallbackProject = formData.get("projectId")?.toString() || "ecommerce-redesign";
  if (!isSupabaseConfigured) redirect(`/projects/${fallbackProject}/change-orders/co-004?preview=sent`);
  const parsed = changeOrderSchema.safeParse({
    projectId: formData.get("projectId"),
    changeRequestId: formData.get("changeRequestId") ?? "",
    title: formData.get("title"),
    reason: formData.get("reason"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    depositPercent: formData.get("depositPercent"),
    timelineImpact: formData.get("timelineImpact")
  });
  if (!parsed.success) fail(`/projects/${fallbackProject}/change-orders/new`, "Check the Change Order details.");

  let amountMinor: bigint;
  try {
    amountMinor = toMinorUnits(parsed.data.amount, parsed.data.currency);
  } catch (error) {
    fail(
      `/projects/${parsed.data.projectId}/change-orders/new`,
      error instanceof Error ? error.message : "Invalid amount."
    );
  }

  const { supabase } = await requireActor();
  const rawToken = createOpaqueToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60_000).toISOString();
  const { data, error } = await supabase.rpc("send_change_order", {
    p_project_id: parsed.data.projectId,
    p_change_request_id: parsed.data.changeRequestId || null,
    p_title: parsed.data.title,
    p_reason: parsed.data.reason,
    p_description: parsed.data.description,
    p_amount_minor: amountMinor.toString(),
    p_currency: parsed.data.currency,
    p_deposit_basis_points: parsed.data.depositPercent * 100,
    p_timeline_impact: parsed.data.timelineImpact,
    p_token_digest: digestOpaqueToken(rawToken),
    p_token_expires_at: expiresAt
  });
  if (error || !data) {
    fail(`/projects/${parsed.data.projectId}/change-orders/new`, error?.message ?? "Send failed.");
  }
  const result = data as {
    version_id: string;
    client_email: string;
    business_id: string;
    order_number: number;
  };
  const admin = createAdminClient();
  const approvalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/approve/${rawToken}`;
  const { error: notificationError } = await admin.from("notification_outbox").insert({
    business_id: result.business_id,
    recipient_email: result.client_email,
    template: "change_order_approval",
    payload: {
      approval_url: approvalUrl,
      order_number: result.order_number,
      expires_at: expiresAt
    },
    idempotency_key: `change-order-send:${result.version_id}`
  });
  if (notificationError) {
    fail(
      `/projects/${parsed.data.projectId}/change-orders/${result.version_id}`,
      "The order was locked, but the approval email could not be queued."
    );
  }
  const { data: orderRecipients } = await admin
    .from("business_memberships")
    .select("user_id")
    .eq("business_id", result.business_id)
    .eq("status", "active");
  for (const recipient of orderRecipients ?? []) {
    await admin.from("in_app_notifications").upsert(
      {
        business_id: result.business_id,
        user_id: recipient.user_id,
        project_id: parsed.data.projectId,
        kind: "change_order_sent",
        title: `CO-${String(result.order_number).padStart(3, "0")} sent`,
        body: parsed.data.title,
        href: `/projects/${parsed.data.projectId}/change-orders/${result.version_id}`,
        dedupe_key: `change-order-sent:${result.version_id}:${recipient.user_id}`
      },
      { onConflict: "dedupe_key", ignoreDuplicates: true }
    );
  }
  revalidatePath(`/projects/${parsed.data.projectId}/change-orders`);
  redirect(`/projects/${parsed.data.projectId}/change-orders/${result.version_id}`);
}
