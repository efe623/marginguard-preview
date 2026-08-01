import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { digestOpaqueToken } from "@/lib/security-tokens";
import { serializeCalendar, type CalendarEvent } from "@/lib/calendar";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (token.length < 32 || token.length > 128) return new NextResponse("Calendar not found.", { status: 404 });
  const admin = createAdminClient();
  const { data: feed } = await admin
    .from("calendar_feed_tokens")
    .select("id, business_id, membership_id, user_id")
    .eq("token_digest", digestOpaqueToken(token))
    .is("revoked_at", null)
    .maybeSingle();
  if (!feed) return new NextResponse("Calendar not found.", { status: 404 });
  const { data: membership } = await admin
    .from("business_memberships")
    .select("role, status")
    .eq("id", feed.membership_id)
    .eq("user_id", feed.user_id)
    .eq("business_id", feed.business_id)
    .maybeSingle();
  if (!membership || membership.status !== "active") return new NextResponse("Calendar not found.", { status: 404 });

  let projectQuery = admin.from("projects").select("id, name, due_date, status").eq("business_id", feed.business_id).is("deleted_at", null);
  if (membership.role !== "owner") {
    const { data: assignments } = await admin.from("project_assignments").select("project_id").eq("membership_id", feed.membership_id);
    const ids = (assignments ?? []).map((row) => row.project_id);
    if (!ids.length) return calendarResponse([]);
    projectQuery = projectQuery.in("id", ids);
  }
  const { data: projects } = await projectQuery;
  const projectIds = (projects ?? []).map((project) => project.id);
  if (!projectIds.length) return calendarResponse([]);
  const [tasksResult, invoicesResult] = await Promise.all([
    admin.from("project_tasks").select("id, project_id, title, priority, status, due_at").in("project_id", projectIds).not("due_at", "is", null),
    admin.from("invoices").select("id, project_id, invoice_number, amount_minor, currency, status, due_date").in("project_id", projectIds).not("status", "eq", "void")
  ]);
  const names = new Map((projects ?? []).map((project) => [project.id, project.name]));
  const origin = new URL(request.url).origin;
  const events: CalendarEvent[] = [];
  for (const project of projects ?? []) if (project.due_date) events.push({
    id: project.id, date: project.due_date, title: `${project.name} deadline`, detail: "Project deadline",
    href: `${origin}/projects/${project.id}`, kind: "project", status: project.status
  });
  for (const task of tasksResult.data ?? []) if (task.due_at) events.push({
    id: task.id, date: task.due_at.slice(0, 10), title: task.title,
    detail: `${names.get(task.project_id) ?? "Project"} · ${task.priority} priority`,
    href: `${origin}/projects/${task.project_id}/work`, kind: "task", status: task.status
  });
  for (const invoice of invoicesResult.data ?? []) events.push({
    id: invoice.id, date: invoice.due_date, title: `Invoice ${invoice.invoice_number} due`,
    detail: `${names.get(invoice.project_id) ?? "Project"} · ${invoice.currency} ${(Number(invoice.amount_minor) / 100).toLocaleString()}`,
    href: `${origin}/projects/${invoice.project_id}/money`, kind: "invoice", status: invoice.status
  });
  await admin.from("calendar_feed_tokens").update({ last_accessed_at: new Date().toISOString() }).eq("id", feed.id);
  return calendarResponse(events);
}

function calendarResponse(events: CalendarEvent[]) {
  return new NextResponse(serializeCalendar(events, "UnitPulse business dates"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="unitpulse-calendar.ics"',
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
