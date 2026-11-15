import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ExternalShell } from "@/components/external-shell";
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
    <ExternalShell width="lg" businessName={business?.name}>
      <div className="stack">
        <header>
          <h1 className="page-title">Welcome, {client?.name}</h1>
          <p className="page-sub">Private project status, updates, and invoices. UnitPulse does not process payments.</p>
        </header>

        <section className="panel" aria-labelledby="portal-projects">
          <div className="panel-head"><h2 className="panel-title" id="portal-projects">Projects</h2></div>
          {(projects ?? []).length ? (
            <div className="rows">
              {(projects ?? []).map((project) => (
                <div key={project.id} className="row">
                  <span aria-hidden="true" />
                  <div className="row-main">
                    <p className="row-title">{project.name}</p>
                    {project.due_date ? <p className="row-sub">Target: {project.due_date}</p> : null}
                  </div>
                  <div className="row-end"><Status tone={project.status === "completed" ? "success" : "neutral"}>{project.status.replace("_", " ")}</Status></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty"><p className="empty-title">No projects yet</p><p className="empty-text">Projects shared with you will appear here.</p></div>
          )}
        </section>

        <section className="panel" aria-labelledby="portal-invoices">
          <div className="panel-head"><h2 className="panel-title" id="portal-invoices">Invoices</h2></div>
          {(invoices ?? []).length ? (
            <div className="rows">
              {(invoices ?? []).map((invoice) => (
                <div key={invoice.id} className="row">
                  <span aria-hidden="true" />
                  <div className="row-main">
                    <p className="row-title">{invoice.invoice_number}</p>
                    <p className="row-sub">Due {invoice.due_date}</p>
                    {invoice.external_payment_url ? (
                      <a className="button button-primary button-sm mt-2 w-fit" href={invoice.external_payment_url} rel="noreferrer" target="_blank">
                        Open external payment page <ExternalLink size={14} aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                  <div className="row-end grid justify-items-end gap-1">
                    <span className="num font-semibold">{formatMoney(Number(invoice.amount_minor), invoice.currency)}</span>
                    <Status tone={invoice.status === "paid" ? "success" : "warning"}>{invoice.status.replace("_", " ")}</Status>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty"><p className="empty-title">No invoices yet</p><p className="empty-text">Invoices sent to you will appear here.</p></div>
          )}
        </section>

        <section className="panel" aria-labelledby="portal-updates">
          <div className="panel-head"><h2 className="panel-title" id="portal-updates">Updates</h2></div>
          {(updates ?? []).length ? (
            <div className="rows">
              {(updates ?? []).map((update) => (
                <article key={update.id} className="row" style={{ display: "block" }}>
                  <div className="flex justify-between gap-4">
                    <h3 className="row-title">{update.title}</h3>
                    <time className="meta shrink-0" dateTime={update.created_at}>{new Date(update.created_at).toLocaleDateString()}</time>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{update.body}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty"><p className="empty-title">No updates yet</p><p className="empty-text">Updates your contractor shares will appear here.</p></div>
          )}
        </section>
      </div>
    </ExternalShell>
  );
}
