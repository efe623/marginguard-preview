import { Mail, MapPin, Phone } from "lucide-react";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import {
  getClientView,
  listChangeOrderViews,
  listProjectViews
} from "@/features/core/queries";
import { formatMoney } from "@/lib/money";

export default async function ClientPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const client = await getClientView(clientId);
  if (!client) notFound();
  const clientProjects = (await listProjectViews()).filter(
    (project) => project.clientId === clientId
  );
  const orders = (
    await Promise.all(clientProjects.map((project) => listChangeOrderViews(project.id)))
  ).flat();

  return (
    <div className="page">
      <PageHeader
        eyebrow="Client profile"
        title={client.name}
        actions={<ButtonLink href="/projects/new">New project</ButtonLink>}
      />
      <div className="mt-6 flex gap-8 text-sm">
        <span className="flex items-center gap-2"><MapPin size={16} /> {client.location}</span>
        <a className="flex items-center gap-2 hover:text-[var(--signal)]" href={`mailto:${client.email}`}><Mail size={16} /> {client.email}</a>
        <span className="flex items-center gap-2"><Phone size={16} /> {client.phone}</span>
      </div>

      <div className="mt-10 grid grid-cols-[1.2fr_0.8fr] gap-6">
        <section className="card">
          <div className="border-b border-[var(--line)] p-7">
            <p className="eyebrow mb-3">Current work</p>
            <h2 className="section-title">Projects</h2>
          </div>
          {clientProjects.map((project) => (
            <div key={project.id} className="grid grid-cols-[1fr_180px_150px] items-center gap-4 border-b border-[var(--line)] p-6 last:border-0">
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
          <p className="mt-5 leading-7">{client.notes}</p>
          <button className="mt-7 text-sm font-semibold underline underline-offset-4">Edit notes</button>
        </aside>
      </div>

      <section className="card mt-6">
        <div className="border-b border-[var(--line)] p-7">
          <p className="eyebrow mb-3">Commercial history</p>
          <h2 className="section-title">Change orders and payments</h2>
        </div>
        {orders.length ? orders.map((order) => (
          <div key={order.id} className="grid grid-cols-[110px_1fr_180px_150px] items-center gap-4 border-b border-[var(--line)] p-6 last:border-0">
            <p className="font-display text-lg font-semibold">{order.number}</p>
            <p>{order.title}</p>
            <p className="font-semibold">{formatMoney(order.amountMinor, order.currency)}</p>
            <Status tone={order.status === "paid" ? "success" : "warning"}>{order.status}</Status>
          </div>
        )) : (
          <p className="quiet p-7">No Change Orders yet.</p>
        )}
      </section>
    </div>
  );
}
