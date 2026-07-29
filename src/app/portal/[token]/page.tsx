import { notFound } from "next/navigation";
import { Status } from "@/components/ui/status";
import { digestOpaqueToken } from "@/lib/security-tokens";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatMoney } from "@/lib/money";

export default async function ClientPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const now = new Date();
  const { token } = await params;
  const admin = createAdminClient();
  const { data: access } = await admin
    .from("client_portal_tokens")
    .select("id, client_id, business_id, expires_at, revoked_at")
    .eq("token_digest", digestOpaqueToken(token))
    .maybeSingle();
  if (!access || access.revoked_at || new Date(access.expires_at).getTime() <= now.getTime()) notFound();
  const [{ data: client }, { data: business }, { data: projects }] = await Promise.all([
    admin.from("clients").select("id, name").eq("id", access.client_id).single(),
    admin.from("businesses").select("name, currency").eq("id", access.business_id).single(),
    admin.from("projects").select("id, name, status, due_date").eq("client_id", access.client_id).is("deleted_at", null)
  ]);
  const projectIds = (projects ?? []).map((project) => project.id);
  const [{ data: updates }, { data: invoices }] = await Promise.all([
    projectIds.length ? admin.from("project_updates").select("id, project_id, title, body, created_at").in("project_id", projectIds).eq("visible_to_client", true).order("created_at", { ascending: false }) : { data: [] },
    projectIds.length ? admin.from("invoices").select("id, project_id, invoice_number, amount_minor, currency, status, due_date, external_payment_url").in("project_id", projectIds).neq("status", "draft").order("due_date") : { data: [] }
  ]);
  await admin.from("client_portal_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", access.id);

  return (
    <main className="min-h-screen bg-[var(--paper)] p-5 md:p-10">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-[var(--line)] pb-7">
          <p className="eyebrow">{business?.name}</p>
          <h1 className="font-display mt-3 text-5xl font-bold">Welcome, {client?.name}</h1>
          <p className="quiet mt-3">Private project status, updates, and invoices. MarginGuard does not process payments.</p>
        </header>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="card p-6"><h2 className="section-title">Projects</h2><div className="mt-5 space-y-4">{(projects ?? []).map((project) => <article key={project.id} className="border border-[var(--line)] p-4"><div className="flex justify-between gap-4"><strong>{project.name}</strong><Status tone={project.status === "completed" ? "success" : "neutral"}>{project.status.replace("_", " ")}</Status></div>{project.due_date ? <p className="quiet mt-2 text-sm">Target: {project.due_date}</p> : null}</article>)}</div></section>
          <section className="card p-6"><h2 className="section-title">Invoices</h2><div className="mt-5 space-y-4">{(invoices ?? []).map((invoice) => <article key={invoice.id} className="border border-[var(--line)] p-4"><div className="flex justify-between gap-4"><div><strong>{invoice.invoice_number}</strong><p className="quiet mt-1 text-sm">Due {invoice.due_date}</p></div><div className="text-right"><strong>{formatMoney(Number(invoice.amount_minor), invoice.currency)}</strong><br /><Status tone={invoice.status === "paid" ? "success" : "warning"}>{invoice.status.replace("_", " ")}</Status></div></div>{invoice.external_payment_url ? <a className="button button-primary mt-4" href={invoice.external_payment_url} rel="noreferrer" target="_blank">Open external payment page</a> : null}</article>)}</div></section>
        </div>
        <section className="card mt-6 p-6"><h2 className="section-title">Updates</h2><div className="mt-5 space-y-4">{(updates ?? []).map((update) => <article key={update.id} className="border-l-4 border-[var(--signal)] bg-[var(--paper-deep)] p-5"><div className="flex justify-between gap-4"><strong>{update.title}</strong><time className="quiet text-xs">{new Date(update.created_at).toLocaleDateString()}</time></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{update.body}</p></article>)}</div></section>
      </div>
    </main>
  );
}
