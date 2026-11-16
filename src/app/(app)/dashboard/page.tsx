import { EmptyState } from "@/components/ui/empty-state";
import { ArrowRight } from "lucide-react";
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
  const dateLabel = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(now);

  const approvedExtras = orders.filter((order) => ["approved", "awaiting_deposit", "authorized", "balance_due", "paid"].includes(order.status));
  const first = actions[0];
  const cta = { invoice: "Chase payment", block: "Resolve it", task: "Open task" } as const;
  const rest = actions.slice(1);
  // Up to four projects in two columns; an odd last tile spans the row so no cell is left empty.
  const shownProjects = projectViews.slice(0, 4);

  const brief = actions.length
    ? `${actions.length} ${actions.length === 1 ? "thing needs" : "things need"} a decision${overdue.length ? `, and ${formatMoney(overdueTotal, currency)} is overdue` : ""}.`
    : "Nothing is blocking money or work right now.";

  // Items already on the page above are not repeated in the week strip.
  const listed = new Set(actions.map((action) => action.key.replace(/^task-/, "t-").replace(/^inv-/, "i-")));
  const weekRest = week.map((day) => ({ ...day, items: day.items.filter((item) => !listed.has(item.key)) }));
  const weekRestCount = weekRest.reduce((sum, day) => sum + day.items.length, 0);
  const chase = live.filter((invoice) => invoice.status !== "paid").sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 4);

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
          <dl className="figures" aria-label="Money">
            <div>
              <dt>Contract value</dt>
              <dd>{formatMoney(contract, currency)}</dd>
              <span className="figure-bar" role="img" aria-label={`Recorded costs ${formatMoney(costs, currency)}`}><i style={{ width: `${pct(costs, contract)}%` }} /></span>
              <small>{formatMoney(costs, currency)} costs recorded</small>
            </div>
            <div>
              <dt>Invoiced</dt>
              <dd>{formatMoney(invoicedTotal, currency)}</dd>
              <span className="figure-bar" role="img" aria-label={`Paid ${formatMoney(paidTotal, currency)}`}><i className="is-paid" style={{ width: `${pct(paidTotal, invoicedTotal)}%` }} /></span>
              <small>{formatMoney(paidTotal, currency)} paid</small>
            </div>
            <div className={overdueTotal ? "is-late" : ""}>
              <dt>Overdue</dt>
              <dd>{formatMoney(overdueTotal, currency)}</dd>
              <small>{overdue.length ? `${overdue.length} ${overdue.length === 1 ? "invoice" : "invoices"}` : "Nothing late"}</small>
            </div>
            <div>
              <dt>Extra work agreed</dt>
              <dd>{formatMoney(extras, currency)}</dd>
              <small>{approvedExtras.length} {approvedExtras.length === 1 ? "change" : "changes"}, priced before work</small>
            </div>
          </dl>

          <div className="split">
            <div className="stack">
              <section className={`next-step${first ? "" : " is-clear"}`} aria-labelledby="next-title">
                {first ? (
                  <>
                    <p className="next-label">Start here</p>
                    <h2 id="next-title" className="next-title">{first.title}</h2>
                    <p className="next-detail">{first.detail}{first.meta ? `. ${first.meta}` : ""}</p>
                    <div className="next-actions">
                      <ButtonLink href={first.href}>{cta[first.icon]} <ArrowRight size={16} aria-hidden /></ButtonLink>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="next-label">Nothing waiting</p>
                    <h2 id="next-title" className="next-title">No decisions due today</h2>
                    <div className="next-actions">
                      <ButtonLink href={projectViews[0] ? `/projects/${projectViews[0].id}/work?focus=task-title` : "/projects/new?focus=first"}>Plan next week</ButtonLink>
                    </div>
                  </>
                )}
              </section>

              {rest.length ? (
                <section className="flat" aria-labelledby="needs-you">
                  <h2 id="needs-you" className="flat-title">Also waiting <span>{rest.length}</span></h2>
                  <div className="rows">
                    {rest.map((action) => (
                      <Link href={action.href} key={action.key} className="row">
                        <div className="row-main">
                          <p className="row-title">{action.title}</p>
                          <p className="row-sub">{action.detail}{action.meta ? ` · ${action.meta}` : ""}</p>
                        </div>
                        <div className="row-end">
                          <Status tone={action.tone}>{action.badge}</Status>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              <section aria-labelledby="active-projects" className="board-projects">
                <div className="section-head">
                  <h2 id="active-projects" className="flat-title">Projects <span>{projectViews.length}</span></h2>
                  <Link href="/projects" className="text-link">All projects</Link>
                </div>
                <div className="tiles">
                  {shownProjects.map((project) => {
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
                        {shownProjects.length <= 2 ? (
                          <dl className="tile-facts">
                            <div><dt>Agreed quote</dt><dd>{formatMoney(project.quoteMinor, project.currency)}</dd></div>
                            <div><dt>Approved extras</dt><dd>{project.approvedExtrasMinor ? formatMoney(project.approvedExtrasMinor, project.currency) : "None"}</dd></div>
                            <div><dt>Invoiced</dt><dd>{formatMoney(billed?.total ?? 0, project.currency)}</dd></div>
                            <div><dt>Paid</dt><dd>{formatMoney(billed?.paid ?? 0, project.currency)}</dd></div>
                          </dl>
                        ) : null}
                        <div className="tile-bar" role="img" aria-label={billed ? `${formatMoney(billed.paid, project.currency)} paid of ${formatMoney(total, project.currency)}` : "Nothing invoiced yet"}>
                          <i style={{ width: `${pct(billed?.paid ?? 0, total)}%` }} />
                          <b style={{ width: `${pct((billed?.total ?? 0) - (billed?.paid ?? 0), total)}%` }} />
                        </div>
                        <p className="tile-note">{billed ? `${formatMoney(billed.paid, project.currency)} paid of ${formatMoney(total, project.currency)}` : `${formatMoney(total, project.currency)}, not invoiced yet`}</p>
                        <div className="tile-foot">
                          <span className={`pips ${full ? "is-full" : ""}`} role="img" aria-label={`${project.revisionUsed} of ${project.revisionLimit} revisions used`}>
                            {Array.from({ length: project.revisionLimit }).map((_, index) => (
                              <i key={index} className={index < project.revisionUsed ? "on" : ""} />
                            ))}
                          </span>
                          <span className="meta">{project.revisionUsed} of {project.revisionLimit} revisions</span>
                        </div>
                      </Link>
                    );
                  })}
                  {shownProjects.length % 2 === 1 ? (
                    <Link href="/projects/new?focus=first" className="tile tile-add">
                      <span className="tile-add-icon" aria-hidden><IconPlus size={20} /></span>
                      <p className="tile-title">New project</p>
                      <p className="tile-note">Scope and price first, then the work.</p>
                    </Link>
                  ) : null}
                </div>
              </section>
            </div>

            <aside className="stack side-flat" aria-label="Invoices and activity">
              <section className="flat" aria-labelledby="chase-title">
                <div className="section-head">
                  <h2 id="chase-title" className="flat-title">Unpaid invoices <span>{chase.length}</span></h2>
                  <Link href="/invoices" className="text-link">All invoices</Link>
                </div>
                {chase.length ? (
                  <div className="rows">
                    {chase.map((invoice) => {
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
                              <Status tone={late ? "danger" : "neutral"}>{late ? `${Math.abs(days)} days late` : days === 0 ? "Due today" : `Due in ${days} days`}</Status>
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="flat-empty">All invoices are paid.</p>
                )}
              </section>
              <TodayBrief
                needs={actions.length}
                items={activity.map((item) => ({ id: item.id, title: item.title, body: item.body, href: item.href ?? "/notifications", createdAt: item.createdAt }))}
                projects={projectViews.map((project) => ({ id: project.id, name: project.name }))}
              />
            </aside>
          </div>

          <section className="flat week-flat" aria-labelledby="week-title">
            <div className="section-head">
              <h2 id="week-title" className="flat-title">This week</h2>
              <Link href="/calendar" className="text-link">Calendar</Link>
            </div>
            {weekRestCount ? (
              <div className="week">
                {weekRest.map((day, index) => (
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
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="flat-empty">{weekCount ? "Everything due this week is listed above." : "Nothing is due in the next seven days."}</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
