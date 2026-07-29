import { clients, projects, changeOrders, scopeItems } from "@/data/fixtures";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Client, Project, ScopeItem } from "@/types/domain";

const visibleStatuses = new Set<Project["status"]>([
  "active",
  "awaiting_approval",
  "awaiting_deposit",
  "authorized",
  "completed"
]);

export async function getProjectView(projectId: string): Promise<Project | null> {
  if (!isSupabaseConfigured) {
    return projects.find((project) => project.id === projectId) ?? null;
  }
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, code, name, client_id, currency, quote_amount_minor, status, revision_limit, updated_at")
    .eq("id", projectId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) return null;
  const [{ data: client }, { count: revisionCount }, { data: approved }] = await Promise.all([
    supabase.from("clients").select("name").eq("id", project.client_id).single(),
    supabase
      .from("revision_events")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id),
    supabase
      .from("change_order_versions")
      .select("amount_minor")
      .eq("project_id", project.id)
      .in("status", ["approved", "awaiting_deposit", "authorized", "balance_due", "paid"])
  ]);
  const status = visibleStatuses.has(project.status as Project["status"])
    ? (project.status as Project["status"])
    : "active";
  return {
    id: project.id,
    code: project.code,
    name: project.name,
    clientId: project.client_id,
    clientName: client?.name ?? "Client",
    currency: project.currency,
    quoteMinor: Number(project.quote_amount_minor),
    approvedExtrasMinor: (approved ?? []).reduce(
      (sum, row) => sum + Number(row.amount_minor),
      0
    ),
    status,
    revisionUsed: revisionCount ?? 0,
    revisionLimit: project.revision_limit,
    updatedAt: project.updated_at
  };
}

export async function listProjectViews(): Promise<Project[]> {
  if (!isSupabaseConfigured) return projects;
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  const loaded = await Promise.all((data ?? []).map((row) => getProjectView(row.id)));
  return loaded.filter((project): project is Project => Boolean(project));
}

export async function getClientView(clientId: string): Promise<Client | null> {
  if (!isSupabaseConfigured) {
    return clients.find((client) => client.id === clientId) ?? null;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id, name, primary_email, phone, location, notes")
    .eq("id", clientId)
    .is("deleted_at", null)
    .maybeSingle();
  return data
    ? {
        id: data.id,
        name: data.name,
        email: data.primary_email ?? "",
        phone: data.phone ?? "",
        location: data.location ?? "",
        notes: data.notes ?? ""
      }
    : null;
}

export async function listClientViews(): Promise<Client[]> {
  if (!isSupabaseConfigured) return clients;
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id, name, primary_email, phone, location, notes")
    .is("deleted_at", null)
    .order("name");
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.primary_email ?? "",
    phone: row.phone ?? "",
    location: row.location ?? "",
    notes: row.notes ?? ""
  }));
}

export async function getScopeItemsView(projectId: string): Promise<ScopeItem[]> {
  if (!isSupabaseConfigured) return scopeItems;
  const supabase = await createClient();
  const { data: scope } = await supabase
    .from("project_scopes")
    .select("id")
    .eq("project_id", projectId)
    .is("superseded_at", null)
    .maybeSingle();
  if (!scope) return [];
  const { data } = await supabase
    .from("scope_items")
    .select("id, kind, title, description")
    .eq("scope_id", scope.id)
    .order("position");
  return (data ?? []) as ScopeItem[];
}

export async function getChangeOrderView(changeOrderId: string, projectId: string) {
  if (!isSupabaseConfigured) {
    return changeOrders.find(
      (order) => order.id === changeOrderId && order.projectId === projectId
    ) ?? null;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("change_order_versions")
    .select("id, order_number, project_id, snapshot, amount_minor, currency, deposit_basis_points, status, created_at")
    .eq("id", changeOrderId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (!data) return null;
  const snapshot = data.snapshot as {
    title?: string;
    reason?: string;
    timeline_impact?: string;
  };
  return {
    id: data.id,
    number: `CO-${String(data.order_number).padStart(3, "0")}`,
    projectId: data.project_id,
    title: snapshot.title ?? "Change Order",
    reason: snapshot.reason ?? "Client request",
    amountMinor: Number(data.amount_minor),
    currency: data.currency,
    depositBasisPoints: data.deposit_basis_points,
    timelineImpact: snapshot.timeline_impact ?? "No change",
    status: data.status,
    evidenceAttached: true,
    createdAt: data.created_at
  };
}

export async function listChangeOrderViews(projectId: string) {
  if (!isSupabaseConfigured) {
    return changeOrders.filter((order) => order.projectId === projectId);
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("change_order_versions")
    .select("id")
    .eq("project_id", projectId)
    .is("superseded_at", null)
    .order("sent_at", { ascending: false });
  const loaded = await Promise.all(
    (data ?? []).map((row) => getChangeOrderView(row.id, projectId))
  );
  return loaded.filter((order): order is NonNullable<typeof order> => Boolean(order));
}

export async function getPendingPaymentRequestId(changeOrderVersionId: string) {
  if (!isSupabaseConfigured) return "00000000-0000-0000-0000-000000000004";
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_requests")
    .select("id")
    .eq("change_order_version_id", changeOrderVersionId)
    .in("status", ["pending", "link_created", "processing"])
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.id;
}
