import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedMembership } from "@/features/auth/authorization";
import { generateAssistantReply } from "@/lib/ai";
import { getServerEnv } from "@/lib/env";

export const runtime = "nodejs";

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(1500)
      })
    )
    .min(1)
    .max(10)
});

export async function POST(request: Request) {
  const hasGeminiKey = Boolean(getServerEnv().GEMINI_API_KEY?.trim());
  if (!hasGeminiKey) {
    console.error("[api/ai/assistant] Gemini configuration missing", {
      hasGeminiKey,
      hasGeminiModel: Boolean(getServerEnv().GEMINI_MODEL?.trim()),
      vercelEnvironment: process.env.VERCEL_ENV ?? "local"
    });
    return NextResponse.json(
      { error: "Pulse cannot find GEMINI_API_KEY in this deployment. Check the Production environment value and redeploy." },
      { status: 503 }
    );
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.messages.at(-1)?.role !== "user") {
    return NextResponse.json({ error: "That message could not be read." }, { status: 400 });
  }

  const actor = await getAuthenticatedMembership();
  if (!actor) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const businessId = actor.membership.business_id;

  const [businessResult, projectsResult, clientsResult, invoicesResult, tasksResult, expensesResult, stripeResult, calendarResult, userResult] =
    await Promise.all([
      actor.supabase
        .from("businesses")
        .select("name, currency, ai_enabled, ai_terms_acknowledged_at")
        .eq("id", businessId)
        .maybeSingle(),
      actor.supabase
        .from("projects")
        .select("id, name, status, due_date, quote_amount_minor")
        .eq("business_id", businessId)
        .is("deleted_at", null),
      actor.supabase
        .from("clients")
        .select("id, name")
        .eq("business_id", businessId)
        .is("deleted_at", null),
      actor.supabase
        .from("invoices")
        .select("id, project_id, client_id, invoice_number, description, amount_minor, paid_amount_minor, currency, status, issue_date, due_date")
        .eq("business_id", businessId)
        .order("due_date"),
      actor.supabase
        .from("project_tasks")
        .select("project_id, title, status, priority, due_at")
        .eq("business_id", businessId)
        .order("due_at"),
      actor.supabase
        .from("project_expenses")
        .select("project_id, amount_minor, currency, category, incurred_on")
        .eq("business_id", businessId),
      actor.supabase.from("stripe_connections").select("charges_enabled, disconnected_at").eq("business_id", businessId).maybeSingle(),
      actor.supabase.from("calendar_feeds").select("id").eq("business_id", businessId).is("revoked_at", null),
      actor.supabase.auth.getUser()
    ]);

  const business = businessResult.data;
  if (!business?.ai_enabled || !business.ai_terms_acknowledged_at) {
    return NextResponse.json(
      { error: "The owner must enable AI in Settings → AI and privacy first." },
      { status: 403 }
    );
  }

  const latestQuestion = parsed.data.messages.at(-1)?.content.toLowerCase() ?? "";
  if (/\b(connect|connected|connection|connections|integration|integrations|stripe|strength|google account)\b/.test(latestQuestion)) {
    const googleConnected = Boolean(userResult.data.user?.identities?.some((identity) => identity.provider === "google"));
    const stripeConnected = Boolean(stripeResult.data && !stripeResult.data.disconnected_at);
    const calendarFeedReady = (calendarResult.data?.length ?? 0) > 0;
    return NextResponse.json({ reply: [
      "Here are your UnitPulse connections:",
      `• Google sign-in: ${googleConnected ? "Connected" : "Not connected"}`,
      `• Stripe: ${stripeConnected ? (stripeResult.data?.charges_enabled ? "Connected and ready" : "Connected, but charges are not enabled yet") : "Not connected"}`,
      `• Calendar feed: ${calendarFeedReady ? "Created" : "Not created yet"}`,
      "You can manage these in Settings → Connections."
    ].join("\n") });
  }

  const projectNames = new Map((projectsResult.data ?? []).map((project) => [project.id, project.name]));
  const clientNames = new Map((clientsResult.data ?? []).map((client) => [client.id, client.name]));
  const invoices = (invoicesResult.data ?? []).map((invoice) => ({
    number: invoice.invoice_number,
    project: projectNames.get(invoice.project_id) ?? "Unknown project",
    client: clientNames.get(invoice.client_id) ?? "Unknown client",
    description: invoice.description,
    amount: Number(invoice.amount_minor) / 100,
    paidAmount: Number(invoice.paid_amount_minor) / 100,
    outstandingAmount: (Number(invoice.amount_minor) - Number(invoice.paid_amount_minor)) / 100,
    currency: invoice.currency,
    status: invoice.status,
    issueDate: invoice.issue_date,
    dueDate: invoice.due_date
  }));
  const today = new Date().toISOString().slice(0, 10);
  const context = JSON.stringify({
    business: { name: business.name, currency: business.currency },
    today,
    invoices,
    projects: projectsResult.data ?? [],
    tasks: (tasksResult.data ?? []).slice(0, 100),
    expenses: (expensesResult.data ?? []).slice(0, 100),
    connections: {
      google: userResult.data.user?.identities?.some((identity) => identity.provider === "google") ? "connected" : "not connected",
      stripe: stripeResult.data && !stripeResult.data.disconnected_at ? "connected" : "not connected",
      calendarFeed: (calendarResult.data?.length ?? 0) > 0 ? "created" : "not created"
    },
    accessNote: "This dataset is already limited by UnitPulse row-level permissions."
  });

  try {
    const generated = await generateAssistantReply({
      messages: parsed.data.messages,
      businessContext: context,
      today
    });
    return NextResponse.json({ reply: generated.text });
  } catch {
    return NextResponse.json(
      { error: "Pulse could not answer right now. Check the Gemini key or try again." },
      { status: 502 }
    );
  }
}
