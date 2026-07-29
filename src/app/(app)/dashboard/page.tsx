import { ArrowRight, Clock3, FileWarning, Receipt, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import { getBusinessOperationsData } from "@/features/operations/queries";
import { formatMoney } from "@/lib/money";

export default async function DashboardPage() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const urgentCutoff = now.getTime() + 3 * 86400000;
  const data = await getBusinessOperationsData();
  const currency = data.business?.currency ?? "AED";
  const projects = data.projects as Array<{ id: string; name: string; quote_amount_minor: number; status: string }>;
  const expenses = data.expenses as Array<{ amount_minor: number; currency: string }>;
  const invoices = data.invoices as Array<{ id: string; project_id: string; invoice_number: string; amount_minor: number; status: string; due_date: string }>;
  const orders = data.changeOrders as Array<{ amount_minor: number; status: string }>;
  const tasks = data.tasks as Array<{ id: string; project_id: string; title: string; status: string; due_at: string | null }>;
  const quoteValue = projects.reduce((sum, project) => sum + Number(project.quote_amount_minor), 0);
  const extras = orders.filter((order) => ["approved", "awaiting_deposit", "authorized", "balance_due", "paid"].includes(order.status)).reduce((sum, order) => sum + Number(order.amount_minor), 0);
  const costs = expenses.filter((expense) => expense.currency === currency).reduce((sum, expense) => sum + Number(expense.amount_minor), 0);
  const receivables = invoices.filter((invoice) => !["paid", "void"].includes(invoice.status)).reduce((sum, invoice) => sum + Number(invoice.amount_minor), 0);
  const overdue = invoices.filter((invoice) => !["paid", "void"].includes(invoice.status) && invoice.due_date < today);
  const urgentTasks = tasks.filter((task) => task.status !== "done" && task.due_at && new Date(task.due_at).getTime() < urgentCutoff);
  const actions = [
    ...overdue.slice(0, 3).map((invoice) => ({
      label: "Overdue invoice",
      detail: invoice.invoice_number,
      meta: formatMoney(Number(invoice.amount_minor), currency),
      href: `/projects/${invoice.project_id}/money`,
      tone: "danger" as const
    })),
    ...urgentTasks.slice(0, 3).map((task) => ({
      label: "Task due soon",
      detail: task.title,
      meta: task.due_at ? new Date(task.due_at).toLocaleString() : "",
      href: `/projects/${task.project_id}/work`,
      tone: "warning" as const
    }))
  ].slice(0, 5);

  return (
    <div className="page">
      <PageHeader
        eyebrow={new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long" }).format(now)}
        title="Protect what you earn."
        description="Projects, profit, deadlines, requests, and payment checkpoints in one place."
        actions={<ButtonLink href="/projects/new">New project <ArrowRight size={15} /></ButtonLink>}
      />
      <section aria-label="Key figures" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card metric"><p className="eyebrow">Active project value</p><p className="metric-value">{formatMoney(quoteValue + extras, currency)}</p><p className="quiet mt-3 text-xs">Quotes + approved extras</p></div>
        <div className="card metric"><p className="eyebrow">Recorded costs</p><p className="metric-value">{formatMoney(costs, currency)}</p><p className="quiet mt-3 text-xs">Materials, subcontractors, and expenses</p></div>
        <div className="card metric"><p className="eyebrow">Expected profit</p><p className="metric-value signal">{formatMoney(quoteValue + extras - costs, currency)}</p><p className="quiet mt-3 text-xs">Before unrecorded labour costs</p></div>
        <div className="card metric"><p className="eyebrow">Open invoices</p><p className="metric-value">{formatMoney(receivables, currency)}</p><p className="quiet mt-3 text-xs">{overdue.length} overdue</p></div>
      </section>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.55fr_0.8fr]">
        <section className="card">
          <div className="flex items-end justify-between border-b border-[var(--line)] p-7">
            <div><p className="eyebrow mb-3">Money leaks</p><h2 className="section-title">Work needing a decision</h2></div>
            <Status tone={actions.length ? "warning" : "success"}>{actions.length} actions</Status>
          </div>
          {actions.length ? actions.map((action) => (
            <Link href={action.href} key={`${action.label}-${action.detail}`} className="group grid grid-cols-[44px_1fr_auto] items-center gap-4 border-b border-[var(--line)] px-7 py-6 last:border-b-0 hover:bg-[var(--paper-deep)]">
              <div className="grid size-11 place-items-center border border-[var(--line)]">{action.label.includes("invoice") ? <Receipt size={20} /> : <FileWarning size={20} />}</div>
              <div><p className="text-xs font-bold uppercase tracking-[0.08em]">{action.label}</p><p className="mt-1 text-lg font-semibold">{action.detail}</p><p className="quiet mt-1 text-sm">{action.meta}</p></div>
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
          )) : <div className="p-10 text-center quiet">No urgent leaks or deadlines detected.</div>}
        </section>
        <aside className="card p-7">
          <div className="flex items-center justify-between"><p className="eyebrow">Control check</p><ShieldCheck size={20} /></div>
          <h2 className="font-display mt-7 text-3xl font-semibold leading-tight">No extra work starts without proof.</h2>
          <ol className="mt-8 space-y-5 text-sm">
            <li><strong>1. Scope saved</strong><p className="quiet mt-1">Deliverables, exclusions, price, and revisions.</p></li>
            <li><strong>2. Change approved</strong><p className="quiet mt-1">Client decision and exact version recorded.</p></li>
            <li><strong>3. Payment confirmed</strong><p className="quiet mt-1">Stripe webhook later, or audited manual confirmation now.</p></li>
          </ol>
          <div className="mt-10 flex items-center gap-2 border-t border-[var(--line)] pt-5 text-sm"><Clock3 size={16} /><span className="quiet">{projects.length} visible projects</span></div>
        </aside>
      </div>
    </div>
  );
}
