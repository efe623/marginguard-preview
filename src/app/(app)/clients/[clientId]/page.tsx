import { ConfirmDelete } from "@/components/confirm-delete";
import { deleteClient } from "@/features/core/actions";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, FolderKanban, Mail, MapPin, Phone, Receipt } from "lucide-react";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { PortalLinkButton } from "@/components/portal-link-button";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import {
  getClientView,
  listChangeOrderViews,
  listProjectViews
} from "@/features/core/queries";
import { updateClientNotes } from "@/features/core/actions";
import { getBusinessOperationsData } from "@/features/operations/queries";
import { formatMoney } from "@/lib/money";
import { formatDay } from "@/lib/dates";

export default async function ClientPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const client = await getClientView(clientId);
  if (!client) notFound();
  const [allProjects, operations] = await Promise.all([
    listProjectViews(),
    getBusinessOperationsData()
  ]);
  const clientProjects = allProjects.filter(
    (project) => project.clientId === clientId
  );
  const orders = (
    await Promise.all(clientProjects.map((project) => listChangeOrderViews(project.id)))
  ).flat();
  const invoices = (operations.invoices as Array<{
    id: string;
    client_id: string;
    invoice_number: string;
    amount_minor: number;
    currency: string;
    status: string;
    due_date: string;
  }>).filter((invoice) => invoice.client_id === clientId);

  return (
    <div className="page">
      <PageHeader
        crumbs={[{ label: "Clients", href: "/clients" }, { label: client.name }]}
        title={client.name}
        actions={<><PortalLinkButton clientId={clientId} /><ButtonLink href="/projects/new">New project</ButtonLink></>}
      />
      <div className="stack">
        <div className="cluster text-sm">
          <span className="inline-flex items-center gap-2"><MapPin size={16} aria-hidden className="text-[var(--ink-soft)]" /> {client.location}</span>
          <a className="inline-flex items-center gap-2 hover:text-[var(--signal)]" href={`mailto:${client.email}`}><Mail size={16} aria-hidden className="text-[var(--ink-soft)]" /> {client.email}</a>
          <span className="inline-flex items-center gap-2"><Phone size={16} aria-hidden className="text-[var(--ink-soft)]" /> {client.phone}</span>
        </div>

        <div className="split">
          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Projects</h2>
              <p className="panel-sub">{clientProjects.length} total</p>
            </div>
            {clientProjects.length ? (
              <div className="rows">
                {clientProjects.map((project) => (
                  <div key={project.id} className="row">
                    <span className="row-lead"><FolderKanban size={18} aria-hidden /></span>
                    <div className="row-main">
                      <p className="row-title">{project.name}</p>
                      <p className="row-sub">{project.code}</p>
                    </div>
                    <div className="row-end">
                      <span className="num font-semibold">{formatMoney(project.quoteMinor, project.currency)}</span>
                      <Status tone={project.status === "authorized" ? "success" : "warning"}>
                        {project.status.replaceAll("_", " ")}
                      </Status>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState art="clients" title="Start this client's first project" text="Send a quote and get the scope agreed before any work begins." action={{ href: `/projects/new?clientId=${client.id}&focus=name`, label: "Create a project" }} />
            )}
          </section>

          <form action={updateClientNotes} className="panel">
            <div className="panel-head"><h2 className="panel-title">Internal notes</h2></div>
            <div className="panel-body stack-sm">
              <input type="hidden" name="clientId" value={clientId} />
              <div className="field">
                <label className="field-label" htmlFor="client-notes">Notes</label>
                <textarea
                  id="client-notes"
                  className="textarea min-h-44"
                  name="notes"
                  defaultValue={client.notes}
                  placeholder="Private context, preferences, or follow-up notes"
                />
              </div>
              <div className="form-actions">
                <button className="button button-dark" type="submit">Save notes</button>
              </div>
            </div>
          </form>
        </div>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Change orders and payments</h2>
              <p className="panel-sub">Commercial history across this client&apos;s projects</p>
            </div>
          </div>
          {orders.length ? (
            <div className="rows">
              {orders.map((order) => (
                <div key={order.id} className="row">
                  <span className="row-lead"><FileText size={18} aria-hidden /></span>
                  <div className="row-main">
                    <p className="row-title">{order.title}</p>
                    <p className="row-sub">{order.number}</p>
                  </div>
                  <div className="row-end">
                    <span className="num font-semibold">{formatMoney(order.amountMinor, order.currency)}</span>
                    <Status tone={order.status === "paid" ? "success" : "warning"}>{order.status}</Status>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState art="clients" title="No extra work yet" text="When this client asks for something outside the scope, you price it, get approval and track payment here." />
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Invoices</h2>
              <p className="panel-sub">Payment history</p>
            </div>
          </div>
          {invoices.length ? (
            <div className="rows">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="row">
                  <span className="row-lead"><Receipt size={18} aria-hidden /></span>
                  <div className="row-main">
                    <p className="row-title">{invoice.invoice_number}</p>
                    <p className="row-sub">Due {formatDay(invoice.due_date)}</p>
                  </div>
                  <div className="row-end">
                    <span className="num font-semibold">{formatMoney(Number(invoice.amount_minor), invoice.currency)}</span>
                    <Status tone={invoice.status === "paid" ? "success" : invoice.status === "overdue" ? "danger" : "warning"}>
                      {invoice.status.replaceAll("_", " ")}
                    </Status>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState art="clients" title="Nothing invoiced yet" text="Invoices you raise for this client's projects are tracked here." />
          )}
        </section>
      </div>

      <section className="panel danger-zone" aria-labelledby="delete-client">
        <div className="panel-head">
          <div>
            <h2 className="panel-title" id="delete-client">Delete this client</h2>
            <p className="panel-sub">
              Removes {client.name}
              {clientProjects.length ? ` and its ${clientProjects.length} ${clientProjects.length === 1 ? "project" : "projects"}` : ""} from your workspace.
            </p>
          </div>
          <ConfirmDelete
            action={deleteClient}
            fields={{ clientId: client.id }}
            trigger="Delete client"
            title={`Delete ${client.name}?`}
            confirm="Yes, delete client"
          >
            <p>
              {clientProjects.length
                ? `This also deletes ${clientProjects.length === 1 ? "their project" : `all ${clientProjects.length} of their projects`}, with scope, invoices, messages and files.`
                : "This client has no projects, so only their contact details are removed."}
            </p>
            <p>Links you shared with them stop working. This cannot be undone from the app.</p>
          </ConfirmDelete>
        </div>
      </section>
    </div>
  );
}
