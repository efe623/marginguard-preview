import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const env = getServerEnv();
  if (!env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: overdue, error } = await admin
    .from("invoices")
    .select("id, business_id, project_id, invoice_number, due_date, amount_minor, currency")
    .lt("due_date", today)
    .in("status", ["sent", "partially_paid"]);
  if (error) return NextResponse.json({ error: "Invoice scan failed." }, { status: 503 });
  for (const invoice of overdue ?? []) {
    await admin.from("invoices").update({ status: "overdue" }).eq("id", invoice.id);
    const { data: recipients } = await admin
      .from("business_memberships")
      .select("user_id")
      .eq("business_id", invoice.business_id)
      .eq("status", "active");
    for (const recipient of recipients ?? []) {
      await admin.from("in_app_notifications").upsert(
        {
          business_id: invoice.business_id,
          user_id: recipient.user_id,
          project_id: invoice.project_id,
          kind: "invoice_overdue",
          title: `${invoice.invoice_number} is overdue`,
          body: `Due ${invoice.due_date}. Review payment status or create a draft follow-up.`,
          href: `/projects/${invoice.project_id}/money`,
          dedupe_key: `invoice-overdue:${invoice.id}:${recipient.user_id}`
        },
        { onConflict: "dedupe_key", ignoreDuplicates: true }
      );
    }
  }
  const dueSoon = new Date(Date.now() + 2 * 86400000).toISOString();
  const { data: tasks } = await admin
    .from("project_tasks")
    .select("id, business_id, project_id, title, assigned_to, due_at")
    .neq("status", "done")
    .not("due_at", "is", null)
    .lte("due_at", dueSoon);
  for (const task of tasks ?? []) {
    const recipients = task.assigned_to
      ? [{ user_id: task.assigned_to }]
      : (
          await admin
            .from("business_memberships")
            .select("user_id")
            .eq("business_id", task.business_id)
            .eq("status", "active")
        ).data ?? [];
    for (const recipient of recipients) {
      await admin.from("in_app_notifications").upsert(
        {
          business_id: task.business_id,
          user_id: recipient.user_id,
          project_id: task.project_id,
          kind: "task_due",
          title: "Task deadline approaching",
          body: task.title,
          href: `/projects/${task.project_id}/work`,
          dedupe_key: `task-due:${task.id}:${recipient.user_id}`
        },
        { onConflict: "dedupe_key", ignoreDuplicates: true }
      );
    }
  }
  return NextResponse.json({
    overdueInvoices: overdue?.length ?? 0,
    dueTasks: tasks?.length ?? 0
  });
}
