import { isSupabaseConfigured } from "@/lib/env";
import { getAuthenticatedBusinessContext } from "@/features/auth/context";
import { createClient } from "@/lib/supabase/server";
import type { CalendarEvent } from "@/lib/calendar";

export type OperationsProjectData = {
  tasks: Array<Record<string, unknown>>;
  timeEntries: Array<Record<string, unknown>>;
  expenses: Array<Record<string, unknown>>;
  invoices: Array<Record<string, unknown>>;
  messages: Array<Record<string, unknown>>;
  aiDrafts: Array<Record<string, unknown>>;
  updates: Array<Record<string, unknown>>;
  quotes: Array<Record<string, unknown>>;
};

const emptyProjectData: OperationsProjectData = {
  tasks: [],
  timeEntries: [],
  expenses: [],
  invoices: [],
  messages: [],
  aiDrafts: [],
  updates: [],
  quotes: []
};

export async function getOperationsProjectData(
  projectId: string
): Promise<OperationsProjectData> {
  if (!isSupabaseConfigured) return emptyProjectData;
  const supabase = await createClient();
  const [
    tasks,
    timeEntries,
    expenses,
    invoices,
    messages,
    aiDrafts,
    updates,
    quotes
  ] = await Promise.all([
    supabase
      .from("project_tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("position")
      .order("due_at"),
    supabase
      .from("time_entries")
      .select("*")
      .eq("project_id", projectId)
      .order("work_date", { ascending: false }),
    supabase
      .from("project_expenses")
      .select("*")
      .eq("project_id", projectId)
      .order("incurred_on", { ascending: false }),
    supabase
      .from("invoices")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    supabase
      .from("client_messages")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    supabase
      .from("ai_generations")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    supabase
      .from("project_updates")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    supabase
      .from("quotes")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
  ]);

  return {
    tasks: tasks.data ?? [],
    timeEntries: timeEntries.data ?? [],
    expenses: expenses.data ?? [],
    invoices: invoices.data ?? [],
    messages: messages.data ?? [],
    aiDrafts: aiDrafts.data ?? [],
    updates: updates.data ?? [],
    quotes: quotes.data ?? []
  };
}

export async function getBusinessOperationsData() {
  if (!isSupabaseConfigured) {
    return {
      business: null,
      projects: [],
      clients: [],
      tasks: [],
      timeEntries: [],
      expenses: [],
      invoices: [],
      changeOrders: [],
      notifications: []
    };
  }
  const context = await getAuthenticatedBusinessContext();
  if (!context) {
    return {
      business: null,
      projects: [],
      clients: [],
      tasks: [],
      timeEntries: [],
      expenses: [],
      invoices: [],
      changeOrders: [],
      notifications: []
    };
  }
  const { supabase, userId } = context;
  const businessId = context.membership.business_id;

  const [business, projects, clients, tasks, timeEntries, expenses, invoices, orders, notifications] =
    await Promise.all([
      supabase.from("businesses").select("*").eq("id", businessId).maybeSingle(),
      supabase
        .from("projects")
        .select("*")
        .eq("business_id", businessId)
        .is("deleted_at", null),
      supabase
        .from("clients")
        .select("*")
        .eq("business_id", businessId)
        .is("deleted_at", null),
      supabase.from("project_tasks").select("*").eq("business_id", businessId),
      supabase.from("time_entries").select("*").eq("business_id", businessId),
      supabase.from("project_expenses").select("*").eq("business_id", businessId),
      supabase.from("invoices").select("*").eq("business_id", businessId),
      supabase
        .from("change_order_versions")
        .select("*")
        .eq("business_id", businessId)
        .is("superseded_at", null),
      supabase
        .from("in_app_notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30)
    ]);

  return {
    business: business.data,
    projects: projects.data ?? [],
    clients: clients.data ?? [],
    tasks: tasks.data ?? [],
    timeEntries: timeEntries.data ?? [],
    expenses: expenses.data ?? [],
    invoices: invoices.data ?? [],
    changeOrders: orders.data ?? [],
    notifications: notifications.data ?? []
  };
}

export async function getBusinessSettingsData() {
  if (!isSupabaseConfigured) return null;
  const context = await getAuthenticatedBusinessContext();
  if (!context) return null;

  const { data } = await context.supabase
    .from("businesses")
    .select(
      "id, name, business_type, currency, timezone, country_code, default_hourly_rate_minor, ai_enabled, ai_terms_acknowledged_at"
    )
    .eq("id", context.membership.business_id)
    .maybeSingle();

  return data;
}

export async function getNotificationsData() {
  if (!isSupabaseConfigured) return [];
  const context = await getAuthenticatedBusinessContext();
  if (!context) return [];

  const { data } = await context.supabase
    .from("in_app_notifications")
    .select("id, title, body, href, read_at, created_at")
    .eq("user_id", context.userId)
    .order("created_at", { ascending: false })
    .limit(30);

  return data ?? [];
}

export type ActivityItem = {
  id: string;
  kind: "alert" | "audit";
  title: string;
  body: string;
  href: string | null;
  unread: boolean;
  createdAt: string;
  category: string;
};

export async function getActivityCenterData(): Promise<ActivityItem[]> {
  if (!isSupabaseConfigured) return [];
  const context = await getAuthenticatedBusinessContext();
  if (!context) return [];

  const [notifications, auditEvents] = await Promise.all([
    context.supabase
      .from("in_app_notifications")
      .select("id, title, body, href, read_at, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(40),
    context.supabase
      .from("audit_events")
      .select("id, action, subject_type, subject_id, metadata, occurred_at, project_id")
      .eq("business_id", context.membership.business_id)
      .order("occurred_at", { ascending: false })
      .limit(40)
  ]);

  const alertItems: ActivityItem[] = (notifications.data ?? []).map((row) => ({
    id: `alert-${row.id}`,
    kind: "alert",
    title: row.title,
    body: row.body,
    href: row.href,
    unread: !row.read_at,
    createdAt: row.created_at,
    category: "Alert"
  }));
  const auditItems: ActivityItem[] = (auditEvents.data ?? []).map((row) => {
    const words = row.action.replaceAll(".", " ").replaceAll("_", " ");
    const title = words.charAt(0).toUpperCase() + words.slice(1);
    const subject = row.subject_type.replaceAll("_", " ");
    return {
      id: `audit-${row.id}`,
      kind: "audit",
      title,
      body: row.subject_id ? `${subject} · ${row.subject_id}` : subject,
      href: row.project_id ? `/projects/${row.project_id}/audit` : null,
      unread: false,
      createdAt: row.occurred_at,
      category: "Audit"
    };
  });

  return [...alertItems, ...auditItems]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 60);
}

export async function getInvoicesPageData() {
  if (!isSupabaseConfigured) return { invoices: [], projects: [] };
  const context = await getAuthenticatedBusinessContext();
  if (!context) return { invoices: [], projects: [] };
  const businessId = context.membership.business_id;

  const [invoices, projects] = await Promise.all([
    context.supabase
      .from("invoices")
      .select(
        "id, project_id, invoice_number, description, amount_minor, currency, status, due_date"
      )
      .eq("business_id", businessId)
      .order("created_at", { ascending: false }),
    context.supabase
      .from("projects")
      .select("id, name")
      .eq("business_id", businessId)
      .is("deleted_at", null)
  ]);

  return {
    invoices: invoices.data ?? [],
    projects: projects.data ?? []
  };
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  if (!isSupabaseConfigured) {
    return [
      { id: "demo-invoice-1", date: "2026-07-31", title: "Invoice INV-204 due", detail: "E-commerce Redesign · AED 12,500", href: "/projects/ecommerce-redesign/money", kind: "invoice", status: "sent" },
      { id: "demo-task-1", date: "2026-08-03", title: "Homepage review", detail: "E-commerce Redesign · High priority", href: "/projects/ecommerce-redesign/work", kind: "task", status: "in_progress" },
      { id: "demo-project-1", date: "2026-08-07", title: "Branding Package deadline", detail: "Project deadline", href: "/projects/brand-package", kind: "project", status: "active" }
    ];
  }
  const context = await getAuthenticatedBusinessContext();
  if (!context) return [];
  const businessId = context.membership.business_id;
  const [projectsResult, tasksResult, invoicesResult] = await Promise.all([
    context.supabase.from("projects").select("id, name, due_date, status").eq("business_id", businessId).is("deleted_at", null),
    context.supabase.from("project_tasks").select("id, project_id, title, priority, status, due_at").eq("business_id", businessId).not("due_at", "is", null),
    context.supabase.from("invoices").select("id, project_id, invoice_number, amount_minor, currency, status, due_date").eq("business_id", businessId).not("status", "eq", "void")
  ]);
  const projects = projectsResult.data ?? [];
  const projectNames = new Map(projects.map((project) => [project.id, project.name]));
  const events: CalendarEvent[] = [];
  for (const project of projects) {
    if (project.due_date) events.push({
      id: project.id, date: project.due_date, title: `${project.name} deadline`,
      detail: "Project deadline", href: `/projects/${project.id}`, kind: "project", status: project.status
    });
  }
  for (const task of tasksResult.data ?? []) {
    if (task.due_at) events.push({
      id: task.id, date: task.due_at.slice(0, 10), title: task.title,
      detail: `${projectNames.get(task.project_id) ?? "Project"} · ${task.priority} priority`,
      href: `/projects/${task.project_id}/work`, kind: "task", status: task.status
    });
  }
  for (const invoice of invoicesResult.data ?? []) {
    events.push({
      id: invoice.id, date: invoice.due_date, title: `Invoice ${invoice.invoice_number} due`,
      detail: `${projectNames.get(invoice.project_id) ?? "Project"} · ${invoice.currency} ${(Number(invoice.amount_minor) / 100).toLocaleString()}`,
      href: `/projects/${invoice.project_id}/money`, kind: "invoice", status: invoice.status
    });
  }
  return events.sort((left, right) => left.date.localeCompare(right.date));
}

export async function getDashboardData() {
  if (!isSupabaseConfigured) {
    return {
      business: null,
      projects: [],
      tasks: [],
      expenses: [],
      invoices: [],
      changeOrders: []
    };
  }
  const context = await getAuthenticatedBusinessContext();
  if (!context) {
    return {
      business: null,
      projects: [],
      tasks: [],
      expenses: [],
      invoices: [],
      changeOrders: []
    };
  }
  const businessId = context.membership.business_id;
  const [business, projects, tasks, expenses, invoices, changeOrders] =
    await Promise.all([
      context.supabase
        .from("businesses")
        .select("currency")
        .eq("id", businessId)
        .maybeSingle(),
      context.supabase
        .from("projects")
        .select("id, name, quote_amount_minor, status")
        .eq("business_id", businessId)
        .is("deleted_at", null),
      context.supabase
        .from("project_tasks")
        .select("id, project_id, title, status, due_at")
        .eq("business_id", businessId),
      context.supabase
        .from("project_expenses")
        .select("amount_minor, currency")
        .eq("business_id", businessId),
      context.supabase
        .from("invoices")
        .select(
          "id, project_id, invoice_number, amount_minor, status, due_date"
        )
        .eq("business_id", businessId),
      context.supabase
        .from("change_order_versions")
        .select("amount_minor, status")
        .eq("business_id", businessId)
        .is("superseded_at", null)
    ]);

  return {
    business: business.data,
    projects: projects.data ?? [],
    tasks: tasks.data ?? [],
    expenses: expenses.data ?? [],
    invoices: invoices.data ?? [],
    changeOrders: changeOrders.data ?? []
  };
}

export async function getProjectContext(projectId: string) {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*, clients(id, name, primary_email)")
    .eq("id", projectId)
    .is("deleted_at", null)
    .maybeSingle();
  return data;
}

export async function getQuoteTemplates() {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("quote_templates")
    .select("id, name, title, introduction, terms, default_valid_days")
    .order("name");
  return data ?? [];
}
