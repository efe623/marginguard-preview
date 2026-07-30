import { Download, TrendingUp } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import { getBusinessOperationsData } from "@/features/operations/queries";
import { formatMoney } from "@/lib/money";

export default async function ReportsPage() {
  const data = await getBusinessOperationsData();
  const currency = data.business?.currency ?? "AED";
  const projects = data.projects as Array<{ id: string; client_id: string; name: string; quote_amount_minor: number; hourly_rate_minor: number | null; due_date: string | null; status: string }>;
  const clients = data.clients as Array<{ id: string; name: string }>;
  const expenses = data.expenses as Array<{ project_id: string; amount_minor: number; currency: string }>;
  const entries = data.timeEntries as Array<{ project_id: string; minutes: number; billable: boolean }>;
  const invoices = data.invoices as Array<{ project_id: string; client_id: string; amount_minor: number; paid_amount_minor: number; currency: string; status: string; due_date: string }>;
  const orders = data.changeOrders as Array<{ project_id: string; amount_minor: number; currency: string; status: string }>;
  const today = new Date().toISOString().slice(0, 10);
  const projectRows = projects.map((project) => {
    const projectExpenses = expenses.filter((row) => row.project_id === project.id && row.currency === currency).reduce((sum, row) => sum + Number(row.amount_minor), 0);
    const minutes = entries.filter((row) => row.project_id === project.id).reduce((sum, row) => sum + Number(row.minutes), 0);
    const labor = project.hourly_rate_minor ? Math.round((minutes / 60) * Number(project.hourly_rate_minor)) : 0;
    const extras = orders.filter((row) => row.project_id === project.id && row.currency === currency && ["approved", "awaiting_deposit", "authorized", "balance_due", "paid"].includes(row.status)).reduce((sum, row) => sum + Number(row.amount_minor), 0);
    const revenue = Number(project.quote_amount_minor) + extras;
    const profit = revenue - projectExpenses - labor;
    const overdueTasks = (data.tasks as Array<{ project_id: string; status: string; due_at: string | null }>).filter((task) => task.project_id === project.id && task.status !== "done" && task.due_at && task.due_at.slice(0, 10) < today).length;
    const risk = Math.min(100, (profit < 0 ? 45 : profit < revenue * 0.15 ? 25 : 0) + (project.due_date && project.due_date < today && project.status !== "completed" ? 35 : 0) + overdueTasks * 10);
    return { ...project, revenue, profit, minutes, risk };
  }).sort((a, b) => b.profit - a.profit);
  const clientRows = clients.map((client) => {
    const owned = projectRows.filter((project) => project.client_id === client.id);
    const clientInvoices = invoices.filter((invoice) => invoice.client_id === client.id);
    const profit = owned.reduce((sum, project) => sum + project.profit, 0);
    const overdue = clientInvoices.filter((invoice) => !["paid", "void"].includes(invoice.status) && invoice.due_date < today).length;
    const risk = Math.min(100, overdue * 35 + Math.max(0, owned.length - 2) * 5);
    return { ...client, projects: owned.length, profit, overdue, risk };
  }).sort((a, b) => b.profit - a.profit);
  const overdueValue = invoices.filter((invoice) => !["paid", "void"].includes(invoice.status) && invoice.due_date < today && invoice.currency === currency).reduce((sum, invoice) => sum + Number(invoice.amount_minor) - Number(invoice.paid_amount_minor), 0);
  const unbilledTimeValue = projectRows.reduce((sum, project) => sum + (project.hourly_rate_minor ? Math.round((project.minutes / 60) * Number(project.hourly_rate_minor)) : 0), 0);

  return (
    <div className="page">
      <PageHeader eyebrow="Decision intelligence" title="Reports" description="Money leaks, project risk, best clients, and safer future pricing." actions={<ButtonLink href="/api/export"><Download size={16} /> Export accounting data</ButtonLink>} />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="card p-5"><p className="eyebrow">Overdue invoices</p><p className="mt-2 text-3xl font-bold text-[var(--danger)]">{formatMoney(overdueValue, currency)}</p></div>
        <div className="card p-5"><p className="eyebrow">Tracked billable effort</p><p className="mt-2 text-3xl font-bold">{formatMoney(unbilledTimeValue, currency)}</p><p className="quiet mt-2 text-xs">Compare with invoices before billing</p></div>
        <div className="card p-5"><p className="eyebrow">Unprofitable projects</p><p className="mt-2 text-3xl font-bold">{projectRows.filter((row) => row.profit < 0).length}</p></div>
      </div>
      <section className="card mt-6 overflow-x-auto">
        <div className="border-b border-[var(--line)] p-6"><h2 className="section-title flex items-center gap-2"><TrendingUp size={20} /> Project profitability and quote intelligence</h2><p className="quiet mt-2 text-sm">The most profitable completed job types are the safest evidence for future pricing.</p></div>
        <table className="data-table min-w-[720px]"><thead><tr><th>Project</th><th>Revenue</th><th>Estimated profit</th><th>Tracked time</th><th>Risk</th></tr></thead><tbody>{projectRows.map((project) => <tr key={project.id}><td><strong>{project.name}</strong></td><td>{formatMoney(project.revenue, currency)}</td><td className={project.profit < 0 ? "text-[var(--danger)]" : "text-[var(--success)]"}>{formatMoney(project.profit, currency)}</td><td>{Math.round(project.minutes / 60)}h</td><td><Status tone={project.risk >= 60 ? "danger" : project.risk >= 30 ? "warning" : "success"}>{project.risk}/100</Status></td></tr>)}</tbody></table>
      </section>
      <section className="card mt-6 overflow-x-auto">
        <div className="border-b border-[var(--line)] p-6"><h2 className="section-title">Best-client report</h2></div>
        <table className="data-table min-w-[650px]"><thead><tr><th>Client</th><th>Projects</th><th>Profit</th><th>Overdue invoices</th><th>Risk</th></tr></thead><tbody>{clientRows.map((client) => <tr key={client.id}><td><strong>{client.name}</strong></td><td>{client.projects}</td><td>{formatMoney(client.profit, currency)}</td><td>{client.overdue}</td><td><Status tone={client.risk >= 60 ? "danger" : client.risk >= 30 ? "warning" : "success"}>{client.risk}/100</Status></td></tr>)}</tbody></table>
      </section>
    </div>
  );
}
