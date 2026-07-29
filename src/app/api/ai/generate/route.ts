import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedMembership } from "@/features/auth/authorization";
import { generateAiDraft } from "@/lib/ai";
import { getServerEnv, isSupabaseConfigured } from "@/lib/env";

export const runtime = "nodejs";

const requestSchema = z.object({
  projectId: z.uuid(),
  type: z.enum([
    "scope_extraction",
    "request_detection",
    "scope_creep",
    "extra_work_estimate",
    "change_order",
    "payment_follow_up"
  ]),
  sourceText: z.string().trim().min(10).max(40000),
  sourceIds: z.array(z.uuid()).max(50).default([]),
  consentConfirmed: z.literal(true)
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured || !getServerEnv().GEMINI_API_KEY) {
    return NextResponse.json({ error: "AI is not configured." }, { status: 503 });
  }
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "The AI request is invalid." }, { status: 400 });
  }

  const actor = await getAuthenticatedMembership();
  if (!actor) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data: project } = await actor.supabase
    .from("projects")
    .select(
      "id, business_id, name, description, currency, quote_amount_minor, hourly_rate_minor, revision_limit, ai_opt_out"
    )
    .eq("id", parsed.data.projectId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) return NextResponse.json({ error: "Project unavailable." }, { status: 404 });
  if (project.ai_opt_out) {
    return NextResponse.json({ error: "AI is disabled for this project." }, { status: 403 });
  }
  const { data: business } = await actor.supabase
    .from("businesses")
    .select("ai_enabled, ai_terms_acknowledged_at")
    .eq("id", project.business_id)
    .maybeSingle();
  if (!business?.ai_enabled || !business.ai_terms_acknowledged_at) {
    return NextResponse.json(
      { error: "The owner must enable AI and acknowledge external processing first." },
      { status: 403 }
    );
  }

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const { count } = await actor.supabase
    .from("ai_generations")
    .select("id", { count: "exact", head: true })
    .eq("business_id", project.business_id)
    .gte("created_at", startOfDay.toISOString());
  if ((count ?? 0) >= 20) {
    return NextResponse.json(
      { error: "The free-plan AI limit of 20 drafts per day has been reached." },
      { status: 429 }
    );
  }

  const [{ data: scope }, { data: expenses }, { data: timeEntries }] = await Promise.all([
    actor.supabase
      .from("project_scopes")
      .select("timeline_text, revision_limit, pricing_method, hourly_rate_minor, scope_items(kind,title,description)")
      .eq("project_id", project.id)
      .is("superseded_at", null)
      .maybeSingle(),
    actor.supabase
      .from("project_expenses")
      .select("amount_minor, currency, category")
      .eq("project_id", project.id),
    actor.supabase
      .from("time_entries")
      .select("minutes, billable")
      .eq("project_id", project.id)
  ]);
  const projectContext = JSON.stringify({
    project: {
      name: project.name,
      description: project.description,
      currency: project.currency,
      quoteAmountMinor: project.quote_amount_minor,
      hourlyRateMinor: project.hourly_rate_minor,
      revisionLimit: project.revision_limit
    },
    scope,
    expenseTotals: expenses ?? [],
    trackedMinutes: (timeEntries ?? []).reduce(
      (sum, entry) => sum + Number(entry.minutes),
      0
    )
  });

  try {
    const generated = await generateAiDraft({
      type: parsed.data.type,
      sourceText: parsed.data.sourceText,
      projectContext
    });
    const inputHash = createHash("sha256")
      .update(`${project.id}:${parsed.data.type}:${parsed.data.sourceText}`)
      .digest("hex");
    const { data, error } = await actor.supabase
      .from("ai_generations")
      .insert({
        business_id: project.business_id,
        project_id: project.id,
        generation_type: parsed.data.type,
        source_type: parsed.data.sourceIds.length ? "saved_records" : "pasted_text",
        source_ids: parsed.data.sourceIds,
        input_hash: inputHash,
        model: generated.model,
        output: generated.output,
        input_tokens: generated.usage.inputTokens,
        output_tokens: generated.usage.outputTokens,
        consent_confirmed: true,
        created_by: actor.user.id
      })
      .select("id, output, model, status, created_at")
      .single();
    if (error) throw error;
    await actor.supabase.from("audit_events").insert({
      business_id: project.business_id,
      project_id: project.id,
      actor_user_id: actor.user.id,
      action: "ai.draft_created",
      subject_type: "ai_generation",
      subject_id: data.id,
      metadata: { generation_type: parsed.data.type, model: generated.model }
    });
    return NextResponse.json({ draft: data });
  } catch {
    return NextResponse.json(
      { error: "Gemini could not create a valid draft. No business record was changed." },
      { status: 502 }
    );
  }
}
