import { ChevronRight, Mail, MapPin, Phone, Plus, Users } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { listClientViews, listProjectViews } from "@/features/core/queries";

export default async function ClientsPage() {
  const [clients, projects] = await Promise.all([listClientViews(), listProjectViews()]);
  return (
    <div className="page">
      <PageHeader
        title="Clients"
        description="Contact, project, approval, and payment history without hidden risk scores."
        actions={<ButtonLink href="/clients/new"><Plus size={16} aria-hidden /> New client</ButtonLink>}
      />
      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">All clients</h2>
          <p className="panel-sub">{clients.length} {clients.length === 1 ? "client" : "clients"}</p>
        </div>
        {clients.length ? (
          <div className="rows">
            {clients.map((client) => {
              const count = projects.filter((project) => project.clientId === client.id).length;
              return (
                <Link key={client.id} href={`/clients/${client.id}`} className="row">
                  <div className="row-main">
                    <p className="row-title">{client.name}</p>
                    <p className="row-sub flex flex-wrap gap-x-4 gap-y-0.5">
                      {client.location ? <span className="inline-flex items-center gap-1.5"><MapPin size={13} aria-hidden /> {client.location}</span> : null}
                      {client.email ? <span className="inline-flex items-center gap-1.5"><Mail size={13} aria-hidden /> {client.email}</span> : null}
                      {client.phone ? <span className="inline-flex items-center gap-1.5"><Phone size={13} aria-hidden /> {client.phone}</span> : null}
                    </p>
                  </div>
                  <div className="row-end">
                    <span className="font-semibold">{count} active {count === 1 ? "project" : "projects"}</span>
                    <ChevronRight size={17} aria-hidden className="text-[var(--ink-3)]" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="empty">
            <Users size={22} aria-hidden className="text-[var(--ink-3)]" />
            <p className="empty-title">No clients yet</p>
            <p className="empty-text">Add the first client so you can attach projects, quotes and invoices to them.</p>
            <ButtonLink href="/clients/new"><Plus size={16} aria-hidden /> New client</ButtonLink>
          </div>
        )}
      </section>
    </div>
  );
}
