import { EmptyState } from "@/components/ui/empty-state";
import { ArrowRight, FileWarning, Hourglass, Receipt, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { IconPlus } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { LogRequestButton } from "@/components/log-request";
import { TodayBrief } from "@/components/today-brief";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import { listProjectViews } from "@/features/core/queries";
import { getActivityCenterData, getDashboardData } from "@/features/operations/queries";
import { formatDay } from "@/lib/dates";
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

type WeekItem = { key: string; label: string; sub: string; href: string; tone: "danger" | "warning" | "neutral"; kind: "task" | "invoice" };

const DAY = 86400000;

export default async function DashboardPage() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const urgentCutoff = now.getTime() + 3 * DAY;
  const [data, projectViews, activity] = await Promise.all([
    getDashboardData(),
    listProjectViews().catch(() => []),
    getActivityCenterData().catch(() => [])
  ]);
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
  const live = invoices.filter((invoice) => invoice.status !== "void");
  const paidTotal = live.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + Number(invoice.amount_minor), 0);
  const overdue = live.filter((invoice) => invoice.status !== "paid" && invoice.due_date < today);
  const overdueTotal = overdue.reduce((sum, invoice) => sum + Number(invoice.amount_minor), 0);
  const openTotal = live.filter((invoice) => invoice.status !== "paid" && invoice.due_date >= today).reduce((sum, invoice) => sum + Number(invoice.amount_minor), 0);
  const invoicedTotal = paidTotal + openTotal + overdueTotal;
  const urgentTasks = tasks.filter((task) => task.status !== "done" && task.due_at && new Date(task.due_at).getTime() < urgentCutoff);
  const blocked = projectViews.filter((project) => project.status === "awaiting_deposit" || project.status === "awaiting_approval");
  const contract = quoteValue + extras;
  const profit = contract - costs;

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
      meta: `${formatMoney(Number(invoice.amount_minor), currency)} was due ${formatDay(invoice.due_date)}`,
      href: `/projects/${invoice.project_id}/money`,
      tone: "danger",
      badge: "Overdue",
      icon: "invoice"
    })),
    ...urgentTasks.slice(0, 4).map((task): Action => {
      const late = task.due_at ? new Date(task.due_at).getTime() < now.getTime() : false;
      return {
        key: `task-${task.id}`,
        title: task.title,
        detail: projectNames.get(task.project_id) ?? "Project",
        meta: task.due_at ? `Due ${formatDay(task.due_at)}` : "",
        href: `/projects/${task.project_id}/work`,
        tone: late ? "danger" : "warning",
        badge: late ? "Past due" : "Due soon",
        icon: "task"
      };
    })
  ].slice(0, 8);

  // Seven-day agenda: today plus the next six days.
  const week = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now.getTime() + index * DAY);
    const key = day.toISOString().slice(0, 10);
    const items: WeekItem[] = [
      ...tasks
        .filter((task) => task.status !== "done" && task.due_at && task.due_at.slice(0, 10) === key)
        .map((task): WeekItem => ({ key: `t-${task.id}`, label: task.title, sub: projectNames.get(task.project_id) ?? "Project", href: `/projects/${task.project_id}/work`, tone: "neutral", kind: "task" })),
      ...live
        .filter((invoice) => invoice.status !== "paid" && invoice.due_date === key)
        .map((invoice): WeekItem => ({ key: `i-${invoice.id}`, label: `${invoice.invoice_number} due`, sub: formatMoney(Number(invoice.amount_minor), currency), href: `/projects/${invoice.project_id}/money`, tone: "warning", kind: "invoice" }))
    ];
    return {
      key,
      weekday: index === 0 ? "Today" : new Intl.DateTimeFormat("en", { weekday: "short" }).format(day),
      date: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(day),
      items
    };
  });
  const weekCount = week.reduce((sum, day) => sum + day.items.length, 0);

  const invoicedByProject = new Map<string, { total: number; paid: number }>();
  for (const invoice of live) {
    const entry = invoicedByProject.get(invoice.project_id) ?? { total: 0, paid: 0 };
    entry.total += Number(invoice.amount_minor);
    if (invoice.status === "paid") entry.paid += Number(invoice.amount_minor);
    invoicedByProject.set(invoice.project_id, entry);
  }

  const pct = (part: number, whole: number) => (whole > 0 ? Math.max(0, Math.min(100, (part / whole) * 100)) : 0);
  const icons = { invoice: Receipt, task: FileWarning, block: Hourglass } as const;
  const dateLabel = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(now);

  const approvedExtras = orders.filter((order) => ["approved", "awaiting_deposit", "authorized", "balance_due", "paid"].includes(order.status));
  const first = actions[0];
  const cta = { invoice: "Chase payment", block: "Resolve it", task: "Open task" } as const;
  const afterThis = actions.length - 1;
  const rest = actions.slice(1);

  const brief = actions.length
    ? `${actions.length} ${actions.length === 1 ? "thing needs" : "things need"} a decision${overdue.length ? `, and ${formatMoney(overdueTotal, currency)} is overdue` : ""}.`
    : "Nothing is blocking money or work right now.";

  return (
    <div className="page board">
      <PageHeader
        title="Today"
        description={`${dateLabel}. ${brief}`}
        actions={
          <>
            <ButtonLink href="/projects/new" variant="outline"><IconPlus size={18} /> New project</ButtonLink>
            <LogRequestButton projects={projectViews.map((project) => ({ id: project.id, name: project.name, detail: project.clientName }))} />
          </>
        }
      />

      {projectViews.length === 0 && projects.length === 0 ? (
        <section className="panel">
          <EmptyState art="projects" title="Create your first project" text="Record the scope, the price and the approvals once. From then on, anything that needs your decision shows up here." action={{ href: "/projects/new", label: "Create your first project" }} secondary={{ href: "/clients/new", label: "Add a client first" }} />
        </section>
      ) : (
        <>
          <div className="brief">
            <section className={`next-step${first ? "" : " is-clear"}`} aria-labelledby="next-title">
              {first ? (
                <>
                  <p className="next-label">Start here</p>
                  <h2 id="next-title" className="next-title">{first.title}</h2>
                  <p className="next-detail">{first.detail}{first.meta ? `. ${first.meta}` : ""}</p>
                  <div className="next-actions">
                    <ButtonLink href={first.href}>{cta[first.icon]} <ArrowRight size={16} aria-hidden /></ButtonLink>
                    <span className="meta">{afterThis > 0 ? `${afterThis} more after this` : "Then you are clear"}</span>
                  </div>
                </>
              ) : (
                <>
                  <p className="next-label">You are clear</p>
                  <h2 id="next-title" className="next-title">Nothing is waiting on you today</h2>
                  <p className="next-detail">Spend two minutes making next week easier.</p>
                  <div className="next-actions">
                    <ButtonLink href={projectViews[0] ? `/projects/${projectViews[0].id}/work?focus=task-title` : "/projects/new?focus=first"}>Plan next week</ButtonLink>
                    <ButtonLink href="/settings/quotes" variant="outline">Save a quote template</ButtonLink>
                  </div>
                </>
              )}
              {approvedExtras.length ? (
                <p className="next-proof">
                  <ShieldCheck size={16} className="signal" aria-hidden />
                  <span>
                    <strong>{formatMoney(extras, currency)}</strong> of extra work agreed in writing before it started, across {approvedExtras.length} {approvedExtras.length === 1 ? "change" : "changes"}.
                  </span>
                </p>
              ) : null}
            </section>
            <div className="stack brief-side">
            <TodayBrief
              needs={actions.length}
              items={activity.map((item) => ({ id: item.id, title: item.title, body: item.body, href: item.href ?? "/notifications", createdAt: item.createdAt }))}
              projects={projectViews.map((project) => ({ id: project.id, name: project.name }))}
            />
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2 className="panel-title">Where the money stands</h2>
                  <p className="panel-sub">Before unrecorded labour costs</p>
                </div>
              </div>
              <div className="panel-body stack-sm">
                <div>
                  <p className="bar-title">Contract value <strong>{formatMoney(contract, currency)}</strong></p>
                  <div className="bar" role="img" aria-label={`Costs ${formatMoney(costs, currency)}, expected profit ${formatMoney(profit, currency)}`}>
                    <i className="seg-cost" style={{ width: `${pct(costs, contract)}%` }} />
                    <i className="seg-profit" style={{ width: `${pct(profit, contract)}%` }} />
                  </div>
                  <ul className="legend">
                    <li><span className="swatch seg-cost" />Recorded costs<b>{formatMoney(costs, currency)}</b></li>
                    <li><span className="swatch seg-profit" />Expected profit<b>{formatMoney(profit, currency)}</b></li>
                  </ul>
                </div>
                <div>
                  <p className="bar-title">Invoiced <strong>{formatMoney(invoicedTotal, currency)}</strong></p>
                  <div className="bar" role="img" aria-label={`Paid ${formatMoney(paidTotal, currency)}, open ${formatMoney(openTotal, currency)}, overdue ${formatMoney(overdueTotal, currency)}`}>
                    <i className="seg-paid" style={{ width: `${pct(paidTotal, invoicedTotal)}%` }} />
                    <i className="seg-open" style={{ width: `${pct(openTotal, invoicedTotal)}%` }} />
                    <i className="seg-late" style={{ width: `${pct(overdueTotal, invoicedTotal)}%` }} />
                  </div>
                  <ul className="legend">
                    <li><span className="swatch seg-paid" />Paid<b>{formatMoney(paidTotal, currency)}</b></li>
                    <li><span className="swatch seg-open" />Open<b>{formatMoney(openTotal, currency)}</b></li>
                    <li><span className="swatch seg-late" />Overdue<b>{formatMoney(overdueTotal, currency)}</b></li>
                  </ul>
                </div>
              </div>
            </section>
            </div>
          </div>

          <section className="panel" aria-labelledby="week-title">
            <div className="panel-head">
              <div>
                <h2 id="week-title" className="panel-title">The next seven days</h2>
                <p className="panel-sub">{weekCount ? `${weekCount} ${weekCount === 1 ? "item" : "items"} due: tasks and invoices.` : "Nothing is due this week."}</p>
              </div>
              <ButtonLink href="/calendar" variant="outline" className="button-sm">Open calendar</ButtonLink>
            </div>
            <div className="week">
              {week.map((day, index) => (
                <div key={day.key} className={`week-day${index === 0 ? " is-today" : ""}`}>
                  <p className="week-head"><strong>{day.weekday}</strong><span>{day.date}</span></p>
                  {day.items.length ? (
                    <ul className="week-list">
                      {day.items.map((item) => (
                        <li key={item.key}>
                          <Link href={item.href} className={`week-item week-${item.kind}`}>
                            <span className="week-item-title">{item.label}</span>
                            <span className="week-item-sub">{item.sub}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="week-none">Free</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <div className="split">
            <div className="stack">
              <section className="panel" aria-labelledby="needs-you">
                <div className="panel-head">
                  <div>
                    <h2 id="needs-you" className="panel-title">{actions.length ? "After that" : "Needs you"}</h2>
                    <p className="panel-sub">{rest.length ? "Ordered by what is blocking money or work." : actions.length ? "Nothing else is waiting on you." : "Nothing is waiting on you."}</p>
                  </div>
                  {rest.length ? <Status tone="warning">{`${rest.length} more`}</Status> : null}
                </div>
                {rest.length ? (
                  <div className="rows">
                    {rest.map((action) => {
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
                ) : actions.length ? null : (
                  <EmptyState art="clear" title="You are clear" text="No overdue invoices, open deposits or tasks due soon. A good moment to plan next week." action={projectViews[0] ? { href: `/projects/${projectViews[0].id}/work?focus=task-title`, label: "Plan next week" } : { href: "/projects/new", label: "Create a project" }} />
                )}
              </section>

              <section aria-labelledby="active-projects">
                <div className="section-head">
                  <div>
                    <h2 id="active-projects" className="panel-title">Projects</h2>
                    <p className="panel-sub">{projectViews.length} in your workspace</p>
                  </div>
                  <ButtonLink href="/projects" variant="outline" className="button-sm">View all</ButtonLink>
                </div>
                <div className="tiles">
                  {projectViews.slice(0, 6).map((project) => {
                    const status = statusLabels[project.status];
                    const full = project.revisionUsed >= project.revisionLimit;
                    const billed = invoicedByProject.get(project.id);
                    const total = project.quoteMinor + project.approvedExtrasMinor;
                    return (
                      <Link href={`/projects/${project.id}`} key={project.id} className="tile">
                        <div className="tile-top">
                          <span className="meta">{project.code}</span>
                          <Status tone={status.tone}>{status.label}</Status>
                        </div>
                        <p className="tile-title">{project.name}</p>
                        <p className="row-sub">{project.clientName}</p>
                        <div className="tile-bar" role="img" aria-label={billed ? `${formatMoney(billed.paid, project.currency)} paid of ${formatMoney(billed.total, project.currency)} invoiced` : "Nothing invoiced yet"}>
                          <i style={{ width: `${pct(billed?.paid ?? 0, total)}%` }} />
                          <b style={{ width: `${pct((billed?.total ?? 0) - (billed?.paid ?? 0), total)}%` }} />
                        </div>
                        <p className="tile-note">{billed ? `${formatMoney(billed.paid, project.currency)} paid of ${formatMoney(total, project.currency)}` : `Nothing invoiced yet of ${formatMoney(total, project.currency)}`}</p>
                        <div className="tile-foot">
                          <span className={`pips ${full ? "is-full" : ""}`} role="img" aria-label={`${project.revisionUsed} of ${project.revisionLimit} revisions used`}>
                            {Array.from({ length: project.revisionLimit }).map((_, index) => (
                              <i key={index} className={index < project.revisionUsed ? "on" : ""} />
                            ))}
                          </span>
                          <span className="meta">{project.revisionUsed}/{project.revisionLimit} revisions</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            </div>

            <aside className="stack" aria-label="Money">
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2 className="panel-title">Invoices to chase</h2>
                    <p className="panel-sub">Unpaid, soonest due first</p>
                  </div>
                  <ButtonLink href="/invoices" variant="outline" className="button-sm">All invoices</ButtonLink>
                </div>
                {live.filter((invoice) => invoice.status !== "paid").length ? (
                  <div className="rows">
                    {live
                      .filter((invoice) => invoice.status !== "paid")
                      .sort((a, b) => a.due_date.localeCompare(b.due_date))
                      .slice(0, 4)
                      .map((invoice) => {
                        const late = invoice.due_date < today;
                        const days = Math.round((new Date(invoice.due_date).getTime() - new Date(today).getTime()) / DAY);
                        return (
                          <Link key={invoice.id} href={`/projects/${invoice.project_id}/money`} className="row">
                            <div className="row-main">
                              <p className="row-title">{invoice.invoice_number}</p>
                              <p className="row-sub">{projectNames.get(invoice.project_id) ?? "Project"}</p>
                            </div>
                            <div className="row-end">
                              <span className="stack-end">
                                <span className="num font-semibold">{formatMoney(Number(invoice.amount_minor), currency)}</span>
                                <Status tone={late ? "danger" : "neutral"}>{late ? `${Math.abs(days)}d late` : days === 0 ? "Due today" : `in ${days}d`}</Status>
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                  </div>
                ) : (
                  <EmptyState small title="Everything is paid" text="Nothing to chase. New invoices appear here the moment you send them." />
                )}
              </section>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
