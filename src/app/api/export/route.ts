import { NextResponse } from "next/server";
import { getOwnerAal2 } from "@/features/auth/authorization";
import { createAdminClient } from "@/lib/supabase/admin";

const exportTables = [
  "businesses",
  "business_memberships",
  "clients",
  "projects",
  "project_assignments",
  "project_scopes",
  "scope_items",
  "project_files",
  "change_requests",
  "revision_events",
  "revision_overrides",
  "change_order_drafts",
  "change_order_versions",
  "change_order_approvals",
  "payment_requests",
  "manual_payment_confirmations",
  "quote_templates",
  "quotes",
  "client_messages",
  "project_tasks",
  "time_entries",
  "project_expenses",
  "invoices",
  "ai_generations",
  "project_updates",
  "audit_events"
] as const;

export async function GET() {
  const owner = await getOwnerAal2();
  if (!owner) return NextResponse.json({ error: "Owner MFA is required" }, { status: 403 });
  const admin = createAdminClient();
  const entries = await Promise.all(
    exportTables.map(async (table) => {
      const { data, error } = await admin
        .from(table)
        .select("*")
        .eq(table === "businesses" ? "id" : "business_id", owner.membership.business_id);
      if (error) throw error;
      return [table, data] as const;
    })
  );
  await admin.from("audit_events").insert({
    business_id: owner.membership.business_id,
    actor_user_id: owner.user.id,
    action: "export.downloaded",
    subject_type: "business",
    subject_id: owner.membership.business_id,
    metadata: { format: "json" }
  });
  const body = JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      business_id: owner.membership.business_id,
      data: Object.fromEntries(entries)
    },
    null,
    2
  );
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="unitpulse-export-${owner.membership.business_id}.json"`,
      "Cache-Control": "no-store"
    }
  });
}
