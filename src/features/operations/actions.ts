"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  getAuthenticatedMembership,
  getOwnerAal2
} from "@/features/auth/authorization";
import { isSupabaseConfigured } from "@/lib/env";
import { toMinorUnits } from "@/lib/money";

async function getProjectActor(projectId: string) {
  const actor = await getAuthenticatedMembership();
  if (!actor) redirect("/sign-in");
  const { data: project } = await actor.supabase
    .from("projects")
    .select("id, business_id, client_id, currency, name")
    .eq("id", projectId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) throw new Error("Project is unavailable.");
  return { ...actor, project };
}

function refreshProject(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/work`);
  revalidatePath(`/projects/${projectId}/money`);
  revalidatePath(`/projects/${projectId}/messages`);
  revalidatePath(`/projects/${projectId}/ai`);
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/invoices");
}

export async function createTask(formData: FormData) {
  const parsed = z
    .object({
      projectId: z.uuid(),
      title: z.string().trim().min(1).max(240),
      description: z.string().trim().max(4000),
      priority: z.enum(["low", "normal", "high", "urgent"]),
      dueAt: z.string().optional(),
      assignedTo: z.string().optional()
    })
    .safeParse({
      projectId: formData.get("projectId"),
      title: formData.get("title"),
      description: formData.get("description") ?? "",
      priority: formData.get("priority") ?? "normal",
      dueAt: formData.get("dueAt") || undefined,
      assignedTo: formData.get("assignedTo") || undefined
    });
  if (!parsed.success || !isSupabaseConfigured) return;
  const actor = await getProjectActor(parsed.data.projectId);
  const { error } = await actor.supabase.from("project_tasks").insert({
    business_id: actor.project.business_id,
    project_id: actor.project.id,
    title: parsed.data.title,
    description: parsed.data.description,
    priority: parsed.data.priority,
    due_at: parsed.data.dueAt || null,
    assigned_to: parsed.data.assignedTo || actor.user.id,
    created_by: actor.user.id
  });
  if (error) throw new Error(error.message);
  refreshProject(actor.project.id);
}

export async function updateTaskStatus(formData: FormData) {
  const parsed = z
    .object({
      projectId: z.uuid(),
      taskId: z.uuid(),
      status: z.enum(["todo", "in_progress", "blocked", "done"])
    })
    .safeParse({
      projectId: formData.get("projectId"),
      taskId: formData.get("taskId"),
      status: formData.get("status")
    });
  if (!parsed.success || !isSupabaseConfigured) return;
  const actor = await getProjectActor(parsed.data.projectId);
  const { error } = await actor.supabase
    .from("project_tasks")
    .update({
      status: parsed.data.status,
      completed_at: parsed.data.status === "done" ? new Date().toISOString() : null
    })
    .eq("id", parsed.data.taskId)
    .eq("project_id", actor.project.id);
  if (error) throw new Error(error.message);
  refreshProject(actor.project.id);
}

export async function logTime(formData: FormData) {
  const parsed = z
    .object({
      projectId: z.uuid(),
      taskId: z.string().optional(),
      minutes: z.coerce.number().int().min(1).max(1440),
      workDate: z.iso.date(),
      description: z.string().trim().max(2000),
      billable: z.boolean()
    })
    .safeParse({
      projectId: formData.get("projectId"),
      taskId: formData.get("taskId") || undefined,
      minutes: formData.get("minutes"),
      workDate: formData.get("workDate"),
      description: formData.get("description") ?? "",
      billable: formData.get("billable") === "on"
    });
  if (!parsed.success || !isSupabaseConfigured) return;
  const actor = await getProjectActor(parsed.data.projectId);
  const { error } = await actor.supabase.from("time_entries").insert({
    business_id: actor.project.business_id,
    project_id: actor.project.id,
    task_id: parsed.data.taskId || null,
    user_id: actor.user.id,
    minutes: parsed.data.minutes,
    work_date: parsed.data.workDate,
    description: parsed.data.description,
    billable: parsed.data.billable
  });
  if (error) throw new Error(error.message);
  refreshProject(actor.project.id);
}

export async function addExpense(formData: FormData) {
  const parsed = z
    .object({
      projectId: z.uuid(),
      category: z.enum(["material", "subcontractor", "travel", "software", "other"]),
      vendor: z.string().trim().max(180),
      description: z.string().trim().min(1).max(2000),
      amount: z.string().min(1),
      currency: z.string().length(3),
      incurredOn: z.iso.date()
    })
    .safeParse({
      projectId: formData.get("projectId"),
      category: formData.get("category"),
      vendor: formData.get("vendor") ?? "",
      description: formData.get("description"),
      amount: formData.get("amount"),
      currency: formData.get("currency"),
      incurredOn: formData.get("incurredOn")
    });
  if (!parsed.success || !isSupabaseConfigured) return;
  const actor = await getProjectActor(parsed.data.projectId);
  const { error } = await actor.supabase.from("project_expenses").insert({
    business_id: actor.project.business_id,
    project_id: actor.project.id,
    category: parsed.data.category,
    vendor: parsed.data.vendor || null,
    description: parsed.data.description,
    amount_minor: toMinorUnits(parsed.data.amount, parsed.data.currency).toString(),
    currency: parsed.data.currency.toUpperCase(),
    incurred_on: parsed.data.incurredOn,
    created_by: actor.user.id
  });
  if (error) throw new Error(error.message);
  refreshProject(actor.project.id);
}

export async function createInvoice(formData: FormData) {
  const parsed = z
    .object({
      projectId: z.uuid(),
      description: z.string().trim().max(2000),
      amount: z.string().min(1),
      currency: z.string().length(3),
      dueDate: z.iso.date()
    })
    .safeParse({
      projectId: formData.get("projectId"),
      description: formData.get("description") ?? "",
      amount: formData.get("amount"),
      currency: formData.get("currency"),
      dueDate: formData.get("dueDate")
    });
  if (!parsed.success || !isSupabaseConfigured) return;
  const actor = await getProjectActor(parsed.data.projectId);
  const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();
  const { error } = await actor.supabase.from("invoices").insert({
    business_id: actor.project.business_id,
    project_id: actor.project.id,
    client_id: actor.project.client_id,
    invoice_number: `INV-${suffix}`,
    description: parsed.data.description,
    amount_minor: toMinorUnits(parsed.data.amount, parsed.data.currency).toString(),
    currency: parsed.data.currency.toUpperCase(),
    due_date: parsed.data.dueDate,
    created_by: actor.user.id
  });
  if (error) throw new Error(error.message);
  refreshProject(actor.project.id);
}

export async function updateInvoiceStatus(formData: FormData) {
  const parsed = z
    .object({
      projectId: z.uuid(),
      invoiceId: z.uuid(),
      status: z.enum(["draft", "sent", "partially_paid", "paid", "overdue", "void"])
    })
    .safeParse({
      projectId: formData.get("projectId"),
      invoiceId: formData.get("invoiceId"),
      status: formData.get("status")
    });
  if (!parsed.success || !isSupabaseConfigured) return;
  const actor = await getProjectActor(parsed.data.projectId);
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.status === "sent") patch.sent_at = now;
  if (parsed.data.status === "paid") patch.paid_at = now;
  const { error } = await actor.supabase
    .from("invoices")
    .update(patch)
    .eq("id", parsed.data.invoiceId)
    .eq("project_id", actor.project.id);
  if (error) throw new Error(error.message);
  refreshProject(actor.project.id);
}

export async function importClientMessage(formData: FormData) {
  const parsed = z
    .object({
      projectId: z.uuid(),
      sourceType: z.enum(["whatsapp", "email", "meeting_note", "other"]),
      senderName: z.string().trim().max(180),
      senderAddress: z.string().trim().max(320),
      content: z.string().trim().min(1).max(100000),
      occurredAt: z.string().optional()
    })
    .safeParse({
      projectId: formData.get("projectId"),
      sourceType: formData.get("sourceType"),
      senderName: formData.get("senderName") ?? "",
      senderAddress: formData.get("senderAddress") ?? "",
      content: formData.get("content"),
      occurredAt: formData.get("occurredAt") || undefined
    });
  if (!parsed.success || !isSupabaseConfigured) return;
  const actor = await getProjectActor(parsed.data.projectId);
  const { error } = await actor.supabase.from("client_messages").insert({
    business_id: actor.project.business_id,
    project_id: actor.project.id,
    source_type: parsed.data.sourceType,
    sender_name: parsed.data.senderName || null,
    sender_address: parsed.data.senderAddress || null,
    content: parsed.data.content,
    occurred_at: parsed.data.occurredAt || null,
    imported_by: actor.user.id
  });
  if (error) throw new Error(error.message);
  refreshProject(actor.project.id);
}

export async function createQuote(formData: FormData) {
  const parsed = z
    .object({
      projectId: z.uuid(),
      templateId: z.union([z.literal(""), z.uuid()]),
      title: z.string().trim().min(1).max(240),
      introduction: z.string().trim().max(6000),
      terms: z.string().trim().max(10000),
      amount: z.string().min(1),
      currency: z.string().length(3),
      validUntil: z.string().optional()
    })
    .safeParse({
      projectId: formData.get("projectId"),
      templateId: formData.get("templateId") ?? "",
      title: formData.get("title"),
      introduction: formData.get("introduction") ?? "",
      terms: formData.get("terms") ?? "",
      amount: formData.get("amount"),
      currency: formData.get("currency"),
      validUntil: formData.get("validUntil") || undefined
    });
  if (!parsed.success || !isSupabaseConfigured) return;
  const actor = await getProjectActor(parsed.data.projectId);
  if (parsed.data.templateId) {
    const { data: template } = await actor.supabase
      .from("quote_templates")
      .select("id")
      .eq("id", parsed.data.templateId)
      .eq("business_id", actor.project.business_id)
      .maybeSingle();
    if (!template) throw new Error("Quote template is unavailable.");
  }
  const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();
  const amountMinor = toMinorUnits(parsed.data.amount, parsed.data.currency);
  const { error } = await actor.supabase.from("quotes").insert({
    business_id: actor.project.business_id,
    project_id: actor.project.id,
    template_id: parsed.data.templateId || null,
    quote_number: `QUO-${suffix}`,
    title: parsed.data.title,
    introduction: parsed.data.introduction,
    terms: parsed.data.terms,
    amount_minor: amountMinor.toString(),
    currency: parsed.data.currency.toUpperCase(),
    valid_until: parsed.data.validUntil || null,
    snapshot: {
      title: parsed.data.title,
      introduction: parsed.data.introduction,
      terms: parsed.data.terms,
      amount_minor: amountMinor.toString(),
      currency: parsed.data.currency.toUpperCase()
    },
    created_by: actor.user.id
  });
  if (error) throw new Error(error.message);
  refreshProject(actor.project.id);
}

export async function createQuoteTemplate(formData: FormData) {
  if (!isSupabaseConfigured) return;
  const owner = await getOwnerAal2();
  if (!owner) redirect("/mfa?next=/settings/quotes");
  const parsed = z
    .object({
      name: z.string().trim().min(1).max(160),
      title: z.string().trim().min(1).max(240),
      introduction: z.string().trim().max(6000),
      terms: z.string().trim().max(10000),
      validDays: z.coerce.number().int().min(1).max(365)
    })
    .safeParse({
      name: formData.get("name"),
      title: formData.get("title"),
      introduction: formData.get("introduction") ?? "",
      terms: formData.get("terms") ?? "",
      validDays: formData.get("validDays")
    });
  if (!parsed.success) return;
  const { error } = await owner.supabase.from("quote_templates").insert({
    business_id: owner.membership.business_id,
    name: parsed.data.name,
    title: parsed.data.title,
    introduction: parsed.data.introduction,
    terms: parsed.data.terms,
    default_valid_days: parsed.data.validDays,
    created_by: owner.user.id
  });
  if (error) throw new Error(error.message);
  revalidatePath("/settings/quotes");
}

export async function createProjectUpdate(formData: FormData) {
  const parsed = z
    .object({
      projectId: z.uuid(),
      title: z.string().trim().min(1).max(240),
      body: z.string().trim().min(1).max(10000),
      visibleToClient: z.boolean()
    })
    .safeParse({
      projectId: formData.get("projectId"),
      title: formData.get("title"),
      body: formData.get("body"),
      visibleToClient: formData.get("visibleToClient") === "on"
    });
  if (!parsed.success || !isSupabaseConfigured) return;
  const actor = await getProjectActor(parsed.data.projectId);
  const { error } = await actor.supabase.from("project_updates").insert({
    business_id: actor.project.business_id,
    project_id: actor.project.id,
    title: parsed.data.title,
    body: parsed.data.body,
    visible_to_client: parsed.data.visibleToClient,
    created_by: actor.user.id
  });
  if (error) throw new Error(error.message);
  refreshProject(actor.project.id);
}

export async function updateBusinessAiSettings(formData: FormData) {
  if (!isSupabaseConfigured) return;
  const owner = await getOwnerAal2();
  if (!owner) redirect("/mfa?next=/settings/ai");
  const enabled = formData.get("aiEnabled") === "on";
  const acknowledged = formData.get("acknowledged") === "on";
  if (enabled && !acknowledged) throw new Error("AI data-use acknowledgement is required.");
  const { error } = await owner.supabase
    .from("businesses")
    .update({
      ai_enabled: enabled,
      ai_terms_acknowledged_at: enabled ? new Date().toISOString() : null
    })
    .eq("id", owner.membership.business_id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings/ai");
}

export async function updateBusinessProfile(formData: FormData) {
  if (!isSupabaseConfigured) return;
  const owner = await getOwnerAal2();
  if (!owner) redirect("/mfa?next=/settings/business");
  const parsed = z
    .object({
      name: z.string().trim().min(1).max(160),
      businessType: z.string().trim().min(1).max(120),
      currency: z.string().length(3),
      timezone: z.string().trim().min(1).max(120),
      countryCode: z.string().length(2),
      defaultHourlyRate: z.string().optional()
    })
    .safeParse({
      name: formData.get("name"),
      businessType: formData.get("businessType"),
      currency: formData.get("currency"),
      timezone: formData.get("timezone"),
      countryCode: formData.get("countryCode"),
      defaultHourlyRate: formData.get("defaultHourlyRate") || undefined
    });
  if (!parsed.success) return;
  const rate = parsed.data.defaultHourlyRate
    ? toMinorUnits(parsed.data.defaultHourlyRate, parsed.data.currency).toString()
    : null;
  const { error } = await owner.supabase
    .from("businesses")
    .update({
      name: parsed.data.name,
      business_type: parsed.data.businessType,
      currency: parsed.data.currency.toUpperCase(),
      timezone: parsed.data.timezone,
      country_code: parsed.data.countryCode.toUpperCase(),
      default_hourly_rate_minor: rate
    })
    .eq("id", owner.membership.business_id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings/business");
  revalidatePath("/dashboard");
}

export async function reviewAiDraft(formData: FormData) {
  const parsed = z
    .object({
      projectId: z.uuid(),
      generationId: z.uuid(),
      status: z.enum(["accepted", "dismissed"])
    })
    .safeParse({
      projectId: formData.get("projectId"),
      generationId: formData.get("generationId"),
      status: formData.get("status")
    });
  if (!parsed.success || !isSupabaseConfigured) return;
  const actor = await getProjectActor(parsed.data.projectId);
  const { error } = await actor.supabase
    .from("ai_generations")
    .update({
      status: parsed.data.status,
      reviewed_by: actor.user.id,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", parsed.data.generationId)
    .eq("project_id", actor.project.id);
  if (error) throw new Error(error.message);
  refreshProject(actor.project.id);
}
