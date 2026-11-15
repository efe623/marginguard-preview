import { ArrowRight, CircleCheck, FileWarning, Hourglass, Plus, Receipt, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import { listProjectViews } from "@/features/core/queries";
import { getDashboardData } from "@/features/operations/queries";
import { formatMoney } from "@/lib/money";
import type { ProjectStatus } from "@/types/domain";

const statusLabels: Record<ProjectStatus, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  active: { label: "Active", tone: "neutral" },
  awaiting_approval: { label: "Awaiting approval", tone: "warning" },
  awaiting_deposit: { label: "Awaiting deposit", tone: "warning" },
  authorized: { label: "Authorized", tone: "success" },
  completed: { label: "Completed", tone: "success" }
};

type Action = {
  key: string;
  title: string;
  detail: string;
  meta: string;
  href: string;
  tone: "danger" | "warning";
  badge: string;
  icon: "invoice" | "task" | "block";
};

export default async function DashboardPage() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const urgentCutoff = now.getTime() + 3 * 86400000;
  const [data, projectViews] = await Promise.all([getDashboardData(), listProjectViews().catch(() => [])]);
  const currency = data.business?.currency ?? "AED";
  const projects = data.projects as Array<{ id: string; name: string; quote_amount_minor: number; status: string }>;
  const expenses = data.expenses as Array<{ amount_minor: number; currency: string }>;
  const invoices = data.invoices as Array<{ id: string; project_id: string; invoice_number: string; amount_minor: number; status: string; due_date: string }>;
  const orders = data.changeOrders as Array<{ amount_minor: number; status: string }>;
  const tasks = data.tasks as Array<{ id: string; project_id: string; title: string; status: string; due_at: string | null }>;
  const projectNames = new Map(projectViews.map((project) => [project.id, project.name]));

  const quoteValue = projects.reduce((sum, project) => sum + Number(project.quote_amount_minor), 0);
  const extras = orders
    .filter((order) => ["approved", "awaiting_deposit", "authorized", "balance_due", "paid"].includes(order.status))
    .reduce((sum, order) => sum + Number(order.amount_minor), 0);
  const costs = expenses.filter((expense) => expense.currency === currency).reduce((sum, expense) => sum + Number(expense.amount_minor), 0);
  const receivables = invoices.filter((invoice) => !["paid", "void"].includes(invoice.status)).reduce((sum, invoice) => sum + Number(invoice.amount_minor), 0);
  const overdue = invoices.filter((invoice) => !["paid", "void"].includes(invoice.status) && invoice.due_date < today);
  const urgentTasks = tasks.filter((task) => task.status !== "done" && task.due_at && new Date(task.due_at).getTime() < urgentCutoff);
  const blocked = projectViews.filter((project) => project.status === "awaiting_deposit" || project.status === "awaiting_approval");
  const profit = quoteValue + extras - costs;

  const actions: Action[] = [
    ...blocked.map((project): Action => ({
      key: `block-${project.id}`,
      title: project.status === "awaiting_deposit" ? "Deposit not confirmed" : "Waiting for client approval",
      detail: project.name,
      meta: project.status === "awaiting_deposit" ? "Do not start the extra work until the deposit is confirmed." : "The client has not approved the latest change yet.",
      href: `/projects/${project.id}`,
      tone: "warning",
      badge: project.status === "awaiting_deposit" ? "Blocks work" : "Needs client",
      icon: "block"
    })),
    ...overdue.slice(0, 4).map((invoice): Action => ({
      key: `inv-${invoice.id}`,
      title: `Invoice ${invoice.invoice_number} is overdue`,
      detail: projectNames.get(invoice.project_id) ?? "Project",
      meta: `${formatMoney(Number(invoice.amount_minor), currency)} was due ${invoice.due_date}`,
      href: `/projects/${invoice.project_id}/money`,
      tone: "danger",
      badge: "Overdue",
      icon: "invoice"
    })),
    ...urgentTasks.slice(0, 4).map((task): Action => ({
      key: `task-${task.id}`,
      title: task.title,
      detail: projectNames.get(task.project_id) ?? "Project",
      meta: task.due_at ? `Due ${new Date(task.due_at).toLocaleDateString("en", { weekday: "short", day: "numeric", month: "short" })}` : "",
      href: `/projects/${task.project_id}/work`,
      tone: task.due_at && new Date(task.due_at).getTime() < now.getTime() ? "danger" : "warning",
      badge: task.due_at && new Date(task.due_at).getTime() < now.getTime() ? "Past due" : "Due soon",
      icon: "task"
    }))
  ].slice(0, 8);

  const dateLabel = new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long" }).format(now);
  const icons = { invoice: Receipt, task: FileWarning, block: Hourglass } as const;

  return (
    <div className="page">
      <PageHeader title="Today" description={dateLabel} />

      {projectViews.length === 0 && projects.length === 0 ? (
        <section className="panel">
          <div className="empty">
            <p className="empty-title">No projects yet</p>
            <p className="empty-text">Create a project to record its scope, price and approvals. Anything that needs a decision will show up here.</p>
            <ButtonLink href="/projects/new"><Plus size={16} /> New project</ButtonLink>
          </div>
        </section>
      ) : (
        <div className="split">
          <div className="stack">
            <section className="panel" aria-labelledby="needs-you">
              <div className="panel-head">
                <div>
                  <h2 id="needs-you" className="panel-title">Needs you</h2>
                  <p className="panel-sub">Ordered by what is blocking money or work.</p>
                </div>
                <Status tone={actions.length ? "warning" : "success"}>{actions.length ? `${actions.length} to decide` : "All clear"}</Status>
              </div>
              {actions.length ? (
                <div className="rows">
                  {actions.map((action) => {
                    const Icon = icons[action.icon];
                    return (
                      <Link href={action.href} key={action.key} className="row">
                        <span className="row-lead"><Icon size={18} aria-hidden /></span>
                        <div className="row-main">
                          <p className="row-title">{action.title}</p>
                          <p className="row-sub">{action.detail}{action.meta ? ` · ${action.meta}` : ""}</p>
                        </div>
                        <div className="row-end">
                          <Status tone={action.tone}>{action.badge}</Status>
                          <ArrowRight size={16} className="faint" aria-hidden />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="empty">
                  <CircleCheck size={22} className="signal" aria-hidden />
                  <p className="empty-title">Nothing is waiting on you</p>
                  <p className="empty-text">No overdue invoices, unconfirmed deposits or tasks due in the next three days.</p>
                </div>
              )}
            </section>

            <section className="panel" aria-labelledby="active-projects">
              <div className="panel-head">
                <div>
                  <h2 id="active-projects" className="panel-title">Projects</h2>
                  <p className="panel-sub">{projectViews.length} in your workspace</p>
                </div>
                <ButtonLink href="/projects" variant="outline" className="button-sm">View all</ButtonLink>
              </div>
              <div className="rows">
                {projectViews.slice(0, 6).map((project) => {
                  const status = statusLabels[project.status];
                  const full = project.revisionUsed >= project.revisionLimit;
                  return (
                    <Link href={`/projects/${project.id}`} key={project.id} className="row">
                      <div className="row-main">
                        <p className="row-title">{project.name}</p>
                        <p className="row-sub">{project.clientName} · {project.code}</p>
                      </div>
                      <div className="row-end">
                        <span className={`pips ${full ? "is-full" : ""}`} role="img" aria-label={`${project.revisionUsed} of ${project.revisionLimit} revisions used`}>
                          {Array.from({ length: project.revisionLimit }).map((_, index) => (
                            <i key={index} className={index < project.revisionUsed ? "on" : ""} />
                          ))}
                        </span>
                        <Status tone={status.tone}>{status.label}</Status>
                        <span className="num w-28 font-semibold">{formatMoney(project.quoteMinor + project.approvedExtrasMinor, project.currency)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="stack" aria-label="Money position">
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2 className="panel-title">Money position</h2>
                  <p className="panel-sub">Before unrecorded labour costs</p>
                </div>
              </div>
              <div className="panel-body">
                <dl className="ledger">
                  <div className="ledger-line"><dt className="ledger-label">Quoted work</dt><dd className="ledger-value">{formatMoney(quoteValue, currency)}</dd></div>
                  <div className="ledger-line"><dt className="ledger-label">Approved extras</dt><dd className="ledger-value">{formatMoney(extras, currency)}</dd></div>
                  <div className="ledger-line"><dt className="ledger-label">Recorded costs</dt><dd className="ledger-value">&minus; {formatMoney(costs, currency)}</dd></div>
                  <div className="ledger-line is-total"><dt className="ledger-label">Expected profit</dt><dd className="ledger-value">{formatMoney(profit, currency)}</dd></div>
                </dl>
                <dl className="ledger" style={{ marginTop: 22 }}>
                  <div className="ledger-line"><dt className="ledger-label">Open invoices</dt><dd className="ledger-value">{formatMoney(receivables, currency)}</dd></div>
                  <div className="ledger-line"><dt className="ledger-label">Overdue</dt><dd className="ledger-value" style={overdue.length ? { color: "var(--danger)" } : undefined}>{overdue.length} {overdue.length === 1 ? "invoice" : "invoices"}</dd></div>
                </dl>
              </div>
            </section>

            <section className="panel">
              <div className="panel-body">
                <div className="cluster" style={{ marginBottom: 10 }}>
                  <ShieldCheck size={18} className="signal" aria-hidden />
                  <h2 className="panel-title">No extra work starts without proof</h2>
                </div>
                <ol className="meta" style={{ display: "grid", gap: 8, paddingLeft: 18 }}>
                  <li><strong style={{ color: "var(--ink)" }}>Scope saved.</strong> Deliverables, exclusions, price and revisions.</li>
                  <li><strong style={{ color: "var(--ink)" }}>Change approved.</strong> Client decision and exact version recorded.</li>
                  <li><strong style={{ color: "var(--ink)" }}>Payment confirmed.</strong> Stripe webhook, or an audited manual confirmation.</li>
                </ol>
              </div>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
