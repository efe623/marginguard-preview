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
      <PageHeader eyebrow={`${rows.length} invoices`} title="Invoices" description="Track sent, overdue, and externally paid invoices. MarginGuard never holds money." />
      <section className="card mt-8 overflow-x-auto">
        <table className="data-table min-w-[760px]">
          <thead><tr><th>Invoice</th><th>Project</th><th>Due</th><th>Amount</th><th>Status</th><th /></tr></thead>
          <tbody>
            {rows.map((invoice) => {
              const overdue = !["paid", "void"].includes(invoice.status) && invoice.due_date < today;
              return <tr key={invoice.id}>
                <td><strong>{invoice.invoice_number}</strong><p className="quiet mt-1 text-xs">{invoice.description}</p></td>
                <td>{projectNames.get(invoice.project_id) ?? "Project"}</td>
                <td className={overdue ? "text-[var(--danger)]" : ""}>{overdue ? <AlertTriangle className="mr-2 inline" size={15} /> : null}{invoice.due_date}</td>
                <td className="font-semibold">{formatMoney(Number(invoice.amount_minor), invoice.currency)}</td>
                <td><Status tone={invoice.status === "paid" ? "success" : overdue ? "danger" : "warning"}>{overdue ? "overdue" : invoice.status.replace("_", " ")}</Status></td>
                <td><Link className="grid size-9 place-items-center border border-[var(--line)]" href={`/projects/${invoice.project_id}/money`}><ArrowUpRight size={16} /></Link></td>
              </tr>;
            })}
          </tbody>
        </table>
        {!rows.length ? <div className="p-10 text-center quiet">No invoices yet.</div> : null}
      </section>
    </div>
  );
}
