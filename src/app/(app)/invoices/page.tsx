import { EmptyState } from "@/components/ui/empty-state";
import { AlertTriangle, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import { getInvoicesPageData } from "@/features/operations/queries";
import { formatMoney } from "@/lib/money";

export default async function InvoicesPage() {
  const { invoices, projects } = await getInvoicesPageData();
  const projectNames = new Map(projects.map((project) => [project.id, project.name]));
  const today = new Date().toISOString().slice(0, 10);
  const rows = invoices;
  return (
    <div className="page">
      <PageHeader title="Invoices" description="Track sent, overdue, and externally paid invoices. UnitPulse never holds money." />
      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">All invoices</h2>
          <p className="panel-sub">{rows.length} {rows.length === 1 ? "invoice" : "invoices"}</p>
        </div>
        {rows.length ? (
          <div className="table-wrap">
            <table className="table min-w-[720px]">
              <thead><tr><th>Invoice</th><th>Project</th><th>Due</th><th className="num">Amount</th><th>Status</th><th><span className="sr-only">Open</span></th></tr></thead>
              <tbody>
                {rows.map((invoice) => {
                  const overdue = !["paid", "void"].includes(invoice.status) && invoice.due_date < today;
                  return (
                    <tr key={invoice.id}>
                      <td><strong>{invoice.invoice_number}</strong><p className="meta mt-0.5">{invoice.description}</p></td>
                      <td>{projectNames.get(invoice.project_id) ?? "Project"}</td>
                      <td className={overdue ? "text-[var(--danger)]" : ""}>{overdue ? <AlertTriangle className="mr-2 inline" size={15} aria-hidden /> : null}{invoice.due_date}</td>
                      <td className="num font-semibold">{formatMoney(Number(invoice.amount_minor), invoice.currency)}</td>
                      <td><Status tone={invoice.status === "paid" ? "success" : overdue ? "danger" : "warning"}>{overdue ? "overdue" : invoice.status.replace("_", " ")}</Status></td>
                      <td><Link className="button button-ghost button-sm button-icon" aria-label={`Open ${invoice.invoice_number} in project money`} href={`/projects/${invoice.project_id}/money`}><ArrowUpRight size={16} aria-hidden /></Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState art="money" title="Send your first invoice" text="Invoices are raised from a project's Money tab. Open a project and bill the work that is ready." action={{ href: "/projects", label: "Choose a project" }} />
        )}
      </section>
    </div>
  );
}
