import { EmptyState } from "@/components/ui/empty-state";
import { CheckSquare, ChevronLeft, ChevronRight, FolderKanban, Receipt } from "lucide-react";
import Link from "next/link";
import { CalendarFeedPanel } from "@/components/calendar-feed-panel";
import { PageHeader } from "@/components/ui/page-header";
import { getAuthenticatedBusinessContext } from "@/features/auth/context";
import { listProjectViews } from "@/features/core/queries";
import { getCalendarEvents } from "@/features/operations/queries";
import { getMonthDays, monthKey, parseMonth, type CalendarEventKind } from "@/lib/calendar";
import { isSupabaseConfigured } from "@/lib/env";

const kindLabel: Record<CalendarEventKind, string> = { invoice: "Invoice", task: "Task", project: "Project" };
const kindIcon: Record<CalendarEventKind, typeof Receipt> = { invoice: Receipt, task: CheckSquare, project: FolderKanban };
const kindClass: Record<CalendarEventKind, string> = {
  invoice: "bg-[var(--accent-soft)]",
  task: "bg-[var(--surface-2)]",
  project: "bg-[color-mix(in_srgb,var(--success)_12%,var(--surface))]"
};

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;
  const { year, monthIndex } = parseMonth(month);
  const days = getMonthDays(year, monthIndex);
  const [events, projectViews] = await Promise.all([getCalendarEvents(), listProjectViews().catch(() => [])]);
  const target = projectViews.find((project) => project.status !== "completed") ?? projectViews[0];
  const eventsByDate = new Map<string, typeof events>();
  for (const event of events) eventsByDate.set(event.date, [...(eventsByDate.get(event.date) ?? []), event]);
  const previous = new Date(year, monthIndex - 1, 1);
  const next = new Date(year, monthIndex + 1, 1);
  const today = new Date().toISOString().slice(0, 10);
  // Phone agenda: what is late first, then today, then what is coming. Late items
  // come from any month, so nothing overdue hides behind the month switcher.
  const closed = new Set(["done", "paid", "void", "completed", "cancelled"]);
  const isThisMonth = today.slice(0, 7) === monthKey(year, monthIndex);
  const toDay = (date: string, list: typeof events) => ({ date, dayNumber: Number(date.slice(8, 10)), events: list });
  const overdueByDate = new Map<string, typeof events>();
  if (isThisMonth) {
    for (const event of events) {
      if (event.date < today && !closed.has(event.status ?? "")) overdueByDate.set(event.date, [...(overdueByDate.get(event.date) ?? []), event]);
    }
  }
  const monthDays = days.filter((day) => day.inMonth && eventsByDate.has(day.date));
  const agendaGroups = (
    isThisMonth
      ? [
          { key: "overdue", label: "Overdue", days: [...overdueByDate].map(([date, list]) => toDay(date, list)) },
          { key: "today", label: "Today", days: [toDay(today, eventsByDate.get(today) ?? [])] },
          { key: "upcoming", label: "Coming up", days: monthDays.filter((day) => day.date > today).map((day) => toDay(day.date, eventsByDate.get(day.date) ?? [])) }
        ]
      : [{ key: "month", label: "", days: monthDays.map((day) => toDay(day.date, eventsByDate.get(day.date) ?? [])) }]
  ).filter((group) => group.days.length);
  const upcoming = events.filter((event) => event.date >= today).slice(0, 8);
  let feedEnabled = false;
  if (isSupabaseConfigured) {
    const context = await getAuthenticatedBusinessContext();
    if (context) {
      const { count } = await context.supabase.from("calendar_feed_tokens").select("id", { count: "exact", head: true }).eq("user_id", context.userId).is("revoked_at", null);
      feedEnabled = Boolean(count);
    }
  }

  const monthLabel = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(year, monthIndex, 1));

  return (
    <div className="page">
      <PageHeader title="Calendar" description="See the dates that affect delivery and cash flow—without rebuilding your schedule by hand." />
      <div className="split cal-split">
        <section className="panel min-w-0">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">{monthLabel}</h2>
              <p className="panel-sub">{events.length} dated items in total</p>
            </div>
            <div className="cluster">
              <Link className="button button-outline button-icon" aria-label="Previous month" href={`/calendar?month=${monthKey(previous.getFullYear(), previous.getMonth())}`}><ChevronLeft size={17} aria-hidden /></Link>
              <Link className="button button-outline" href="/calendar">Today</Link>
              <Link className="button button-outline button-icon" aria-label="Next month" href={`/calendar?month=${monthKey(next.getFullYear(), next.getMonth())}`}><ChevronRight size={17} aria-hidden /></Link>
            </div>
          </div>
          <div className="table-wrap cal-grid">
            <div>
              <div className="grid grid-cols-7 border-b border-[var(--line)]">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day) => <div className="px-3 py-2.5 text-[0.8125rem] font-semibold text-[var(--ink-soft)]" key={day}>{day}</div>)}</div>
              <div className="grid grid-cols-7">
                {days.map((day) => (
                  <div key={day.date} className={`cal-cell min-h-32 min-w-0 overflow-hidden border-b border-r border-[var(--line)] p-1.5 ${day.inMonth ? "" : "bg-[var(--surface-2)] opacity-60"}`}>
                    <time dateTime={day.date} className={`grid size-7 place-items-center text-xs font-bold ${day.date === today ? "rounded-full bg-[var(--signal)] text-[var(--on-signal)]" : ""}`}>{day.dayNumber}</time>
                    <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)] gap-1">{(eventsByDate.get(day.date) ?? []).slice(0, 3).map((event) => { const Icon = kindIcon[event.kind]; return <Link href={event.href} key={`${event.kind}-${event.id}`} className={`block rounded-md px-2 py-1.5 text-xs leading-4 hover:outline hover:outline-1 hover:outline-[var(--line-strong)] ${kindClass[event.kind]}`}><span className="flex items-start gap-1.5 font-semibold"><Icon size={12} aria-hidden className="mt-0.5 flex-none" /><span className="min-w-0"><span className="sr-only">{kindLabel[event.kind]}: </span>{event.title}</span></span><span className="mt-0.5 block truncate pl-[18px] text-[var(--ink-soft)]">{event.detail}</span></Link>; })}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {agendaGroups.length ? (
            <div className="cal-agenda" aria-label={`${monthLabel} agenda`} role="region">
              {agendaGroups.map((group) => (
                <section key={group.key} className={`cal-group cal-group-${group.key}`} aria-label={group.label || monthLabel}>
                  {group.label ? <h3 className="cal-group-title">{group.label}{group.key === "overdue" ? <span> {group.days.reduce((sum, day) => sum + day.events.length, 0)}</span> : null}</h3> : null}
                  <ol className="cal-days">
                    {group.days.map((day) => (
                      <li key={day.date} className={`cal-day${day.date === today ? " is-today" : ""}`}>
                        <time dateTime={day.date} className="cal-date">
                          <span>{new Date(`${day.date}T12:00:00`).toLocaleDateString("en", { weekday: "short" })}</span>
                          <strong>{day.dayNumber}</strong>
                          {group.key === "overdue" ? <span>{new Date(`${day.date}T12:00:00`).toLocaleDateString("en", { month: "short" })}</span> : null}
                        </time>
                        {day.events.length === 0 ? <p className="cal-none">Nothing due today.</p> : null}
                        <ul className="cal-events">
                          {day.events.map((event) => {
                            const Icon = kindIcon[event.kind];
                            return (
                              <li key={`${event.kind}-${event.id}`}>
                                <Link href={event.href} className="cal-event">
                                  <Icon size={15} aria-hidden />
                                  <span className="min-w-0">
                                    <span className="cal-event-title"><span className="sr-only">{kindLabel[event.kind]}: </span>{event.title}</span>
                                    <span className="cal-event-sub">{event.detail}</span>
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          ) : (
            <p className="cal-agenda cal-agenda-empty">Nothing is dated in {monthLabel}.</p>
          )}
        </section>
        <div className="stack">
          <section className="panel cal-next">
            <div className="panel-head"><h2 className="panel-title">Next up</h2></div>
            {upcoming.length ? (
              <div className="rows">
                {upcoming.map((event) => { const Icon = kindIcon[event.kind]; return (
                  <Link className="row" href={event.href} key={`${event.kind}-${event.id}`}>
                    <span className="row-lead"><Icon size={18} aria-hidden /></span>
                    <div className="row-main">
                      <p className="row-title">{event.title}</p>
                      <p className="row-sub">{new Date(`${event.date}T12:00:00`).toLocaleDateString("en", { weekday: "short", day: "numeric", month: "short" })} · {kindLabel[event.kind]} · {event.detail}</p>
                    </div>
                  </Link>
                ); })}
              </div>
            ) : (
              <EmptyState art="calendar" title="Nothing due yet" text="Give a task or an invoice a due date and it lands here, so deadlines never surprise you." action={target ? { href: `/projects/${target.id}/work?focus=task-title`, label: "Add a task with a due date" } : { href: "/projects/new", label: "Create a project" }} />
            )}
          </section>
          <CalendarFeedPanel enabled={feedEnabled} available={isSupabaseConfigured} />
        </div>
      </div>
    </div>
  );
}
