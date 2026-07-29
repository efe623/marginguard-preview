import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

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
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
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
  const { data: membership } = await supabase
    .from("business_memberships")
    .select("business_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (!membership) {
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

  const [business, projects, clients, tasks, timeEntries, expenses, invoices, orders, notifications] =
    await Promise.all([
      supabase.from("businesses").select("*").eq("id", membership.business_id).maybeSingle(),
      supabase
        .from("projects")
        .select("*")
        .eq("business_id", membership.business_id)
        .is("deleted_at", null),
      supabase
        .from("clients")
        .select("*")
        .eq("business_id", membership.business_id)
        .is("deleted_at", null),
      supabase.from("project_tasks").select("*").eq("business_id", membership.business_id),
      supabase.from("time_entries").select("*").eq("business_id", membership.business_id),
      supabase.from("project_expenses").select("*").eq("business_id", membership.business_id),
      supabase.from("invoices").select("*").eq("business_id", membership.business_id),
      supabase
        .from("change_order_versions")
        .select("*")
        .eq("business_id", membership.business_id)
        .is("superseded_at", null),
      supabase
        .from("in_app_notifications")
        .select("*")
        .eq("user_id", user.id)
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
