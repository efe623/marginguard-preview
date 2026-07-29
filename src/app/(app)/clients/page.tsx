import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import { listClientViews, listProjectViews } from "@/features/core/queries";

export default async function ClientsPage() {
  const [clients, projects] = await Promise.all([listClientViews(), listProjectViews()]);
  return (
    <div className="page">
      <PageHeader
        eyebrow={`${clients.length} clients`}
        title="Clients"
        description="Contact, project, approval, and payment history without hidden risk scores."
        actions={<ButtonLink href="/clients/new"><Plus size={16} /> New client</ButtonLink>}
      />
      <section className="card mt-8">
        {clients.map((client) => {
          const clientProjects = projects.filter((project) => project.clientId === client.id);
          return (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="group grid grid-cols-[1.1fr_1fr_150px_140px_30px] items-center gap-4 border-b border-[var(--line)] p-7 last:border-0 hover:bg-[var(--paper-deep)]"
            >
              <div>
                <p className="font-display text-2xl font-semibold">{client.name}</p>
                <p className="quiet mt-1 text-sm">{client.location}</p>
              </div>
              <div>
                <p className="text-sm">{client.email}</p>
                <p className="quiet mt-1 text-sm">{client.phone}</p>
              </div>
              <p className="font-semibold">{clientProjects.length} active</p>
              <Status tone="success">Current</Status>
              <ArrowRight size={17} className="transition group-hover:translate-x-1" />
            </Link>
          );
        })}
      </section>
    </div>
  );
}
