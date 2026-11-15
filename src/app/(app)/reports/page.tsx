import { Download } from "lucide-react";
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

  const unprofitable = projectRows.filter((row) => row.profit < 0).length;
  const riskTone = (risk: number) => (risk >= 60 ? "danger" : risk >= 30 ? "warning" : "success") as "danger" | "warning" | "success";

  return (
    <div className="page">
      <PageHeader title="Reports" description="Money leaks, project risk, best clients, and safer future pricing." actions={<ButtonLink href="/api/export"><Download size={16} aria-hidden /> Export accounting data</ButtonLink>} />
      <div className="stack">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Position today</h2>
              <p className="panel-sub">Compare tracked effort with invoices before billing.</p>
            </div>
          </div>
          <div className="panel-body">
            <dl className="ledger">
              <div className="ledger-line"><dt className="ledger-label">Overdue invoices</dt><dd className={`ledger-value ${overdueValue > 0 ? "text-[var(--danger)]" : ""}`}>{formatMoney(overdueValue, currency)}</dd></div>
              <div className="ledger-line"><dt className="ledger-label">Tracked billable effort</dt><dd className="ledger-value">{formatMoney(unbilledTimeValue, currency)}</dd></div>
              <div className="ledger-line"><dt className="ledger-label">Unprofitable projects</dt><dd className={`ledger-value ${unprofitable > 0 ? "text-[var(--danger)]" : ""}`}>{unprofitable}</dd></div>
            </dl>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Project profitability and quote intelligence</h2>
              <p className="panel-sub">The most profitable completed job types are the safest evidence for future pricing.</p>
            </div>
          </div>
          {projectRows.length ? (
            <div className="table-wrap">
              <table className="table min-w-[640px]">
                <thead><tr><th>Project</th><th className="num">Revenue</th><th className="num">Estimated profit</th><th className="num">Tracked time</th><th>Risk</th></tr></thead>
                <tbody>
                  {projectRows.map((project) => (
                    <tr key={project.id}>
                      <td><strong>{project.name}</strong></td>
                      <td className="num">{formatMoney(project.revenue, currency)}</td>
                      <td className={`num font-semibold ${project.profit < 0 ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>{formatMoney(project.profit, currency)}</td>
                      <td className="num">{Math.round(project.minutes / 60)}h</td>
                      <td><Status tone={riskTone(project.risk)}>{project.risk}/100</Status></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">
              <p className="empty-title">No projects to report on</p>
              <p className="empty-text">Profitability appears here once a project has a quote and some tracked work.</p>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head"><h2 className="panel-title">Best-client report</h2></div>
          {clientRows.length ? (
            <div className="table-wrap">
              <table className="table min-w-[600px]">
                <thead><tr><th>Client</th><th className="num">Projects</th><th className="num">Profit</th><th className="num">Overdue invoices</th><th>Risk</th></tr></thead>
                <tbody>
                  {clientRows.map((client) => (
                    <tr key={client.id}>
                      <td><strong>{client.name}</strong></td>
                      <td className="num">{client.projects}</td>
                      <td className="num">{formatMoney(client.profit, currency)}</td>
                      <td className="num">{client.overdue}</td>
                      <td><Status tone={riskTone(client.risk)}>{client.risk}/100</Status></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">
              <p className="empty-title">No clients yet</p>
              <p className="empty-text">Add a client and a project to see which relationships pay best.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
