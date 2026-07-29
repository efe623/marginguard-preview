import { Mail, MapPin, Phone } from "lucide-react";
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
        eyebrow="Client profile"
        title={client.name}
        actions={<div className="flex flex-wrap gap-3"><PortalLinkButton clientId={clientId} /><ButtonLink href="/projects/new">New project</ButtonLink></div>}
      />
      <div className="mt-6 flex flex-wrap gap-6 text-sm">
        <span className="flex items-center gap-2"><MapPin size={16} /> {client.location}</span>
        <a className="flex items-center gap-2 hover:text-[var(--signal)]" href={`mailto:${client.email}`}><Mail size={16} /> {client.email}</a>
        <span className="flex items-center gap-2"><Phone size={16} /> {client.phone}</span>
      </div>

      <div className="mt-10 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="card">
          <div className="border-b border-[var(--line)] p-7">
            <p className="eyebrow mb-3">Current work</p>
            <h2 className="section-title">Projects</h2>
          </div>
          {clientProjects.map((project) => (
            <div key={project.id} className="grid gap-4 border-b border-[var(--line)] p-6 last:border-0 md:grid-cols-[1fr_180px_150px] md:items-center">
              <div>
                <p className="font-semibold">{project.name}</p>
                <p className="quiet mt-1 text-xs">{project.code}</p>
              </div>
              <p className="font-semibold">{formatMoney(project.quoteMinor, project.currency)}</p>
              <Status tone={project.status === "authorized" ? "success" : "warning"}>
                {project.status.replaceAll("_", " ")}
              </Status>
            </div>
          ))}
        </section>
        <aside className="card p-7">
          <p className="eyebrow">Internal notes</p>
          <form action={updateClientNotes} className="mt-5">
            <input type="hidden" name="clientId" value={clientId} />
            <textarea
              className="input min-h-44 resize-y"
              name="notes"
              defaultValue={client.notes}
              placeholder="Private context, preferences, or follow-up notes"
            />
            <button className="button button-dark mt-3" type="submit">Save notes</button>
          </form>
        </aside>
      </div>

      <section className="card mt-6">
        <div className="border-b border-[var(--line)] p-7">
          <p className="eyebrow mb-3">Commercial history</p>
          <h2 className="section-title">Change orders and payments</h2>
        </div>
        {orders.length ? orders.map((order) => (
          <div key={order.id} className="grid gap-4 border-b border-[var(--line)] p-6 last:border-0 md:grid-cols-[110px_1fr_180px_150px] md:items-center">
            <p className="font-display text-lg font-semibold">{order.number}</p>
            <p>{order.title}</p>
            <p className="font-semibold">{formatMoney(order.amountMinor, order.currency)}</p>
            <Status tone={order.status === "paid" ? "success" : "warning"}>{order.status}</Status>
          </div>
        )) : (
          <p className="quiet p-7">No Change Orders yet.</p>
        )}
      </section>

      <section className="card mt-6">
        <div className="border-b border-[var(--line)] p-7">
          <p className="eyebrow mb-3">Payment history</p>
          <h2 className="section-title">Invoices</h2>
        </div>
        {invoices.length ? invoices.map((invoice) => (
          <div key={invoice.id} className="grid gap-3 border-b border-[var(--line)] p-6 last:border-0 md:grid-cols-[140px_1fr_180px_150px] md:items-center">
            <p className="font-semibold">{invoice.invoice_number}</p>
            <p className="quiet text-sm">Due {invoice.due_date}</p>
            <p className="font-semibold">{formatMoney(Number(invoice.amount_minor), invoice.currency)}</p>
            <Status tone={invoice.status === "paid" ? "success" : invoice.status === "overdue" ? "danger" : "warning"}>
              {invoice.status.replaceAll("_", " ")}
            </Status>
          </div>
        )) : <p className="quiet p-7">No invoices yet.</p>}
      </section>
    </div>
  );
}
