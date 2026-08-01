import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { CalendarFeedPanel } from "@/components/calendar-feed-panel";
import { PageHeader } from "@/components/ui/page-header";
import { getAuthenticatedBusinessContext } from "@/features/auth/context";
import { getCalendarEvents } from "@/features/operations/queries";
import { getMonthDays, monthKey, parseMonth, type CalendarEventKind } from "@/lib/calendar";
import { isSupabaseConfigured } from "@/lib/env";

const kindLabel: Record<CalendarEventKind, string> = { invoice: "Invoice", task: "Task", project: "Project" };
const kindClass: Record<CalendarEventKind, string> = {
  invoice: "border-[var(--signal)] bg-[color-mix(in_srgb,var(--signal)_12%,var(--paper-white))]",
  task: "border-[var(--ink)] bg-[var(--paper-white)]",
  project: "border-[var(--success)] bg-[color-mix(in_srgb,var(--success)_10%,var(--paper-white))]"
};

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;
  const { year, monthIndex } = parseMonth(month);
  const days = getMonthDays(year, monthIndex);
  const events = await getCalendarEvents();
  const eventsByDate = new Map<string, typeof events>();
  for (const event of events) eventsByDate.set(event.date, [...(eventsByDate.get(event.date) ?? []), event]);
  const previous = new Date(year, monthIndex - 1, 1);
  const next = new Date(year, monthIndex + 1, 1);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((event) => event.date >= today).slice(0, 8);
  let feedEnabled = false;
  if (isSupabaseConfigured) {
    const context = await getAuthenticatedBusinessContext();
    if (context) {
      const { count } = await context.supabase.from("calendar_feed_tokens").select("id", { count: "exact", head: true }).eq("user_id", context.userId).is("revoked_at", null);
      feedEnabled = Boolean(count);
    }
  }

  return (
    <div className="page">
      <PageHeader eyebrow={`${events.length} dated items`} title="Calendar" description="See the dates that affect delivery and cash flow—without rebuilding your schedule by hand." />
      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <section className="card min-w-0 overflow-hidden">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] p-5">
            <div><p className="eyebrow">Working month</p><h2 className="section-title mt-2">{new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(year, monthIndex, 1))}</h2></div>
            <div className="flex gap-2">
              <Link className="button button-outline min-h-10 px-3" aria-label="Previous month" href={`/calendar?month=${monthKey(previous.getFullYear(), previous.getMonth())}`}><ChevronLeft size={17} /></Link>
              <Link className="button button-outline min-h-10 px-4" href="/calendar">Today</Link>
              <Link className="button button-outline min-h-10 px-3" aria-label="Next month" href={`/calendar?month=${monthKey(next.getFullYear(), next.getMonth())}`}><ChevronRight size={17} /></Link>
            </div>
          </header>
          <div className="overflow-x-auto">
            <div className="min-w-[840px]">
              <div className="grid grid-cols-7 border-b border-[var(--line)]">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day) => <div className="eyebrow px-3 py-3" key={day}>{day}</div>)}</div>
              <div className="grid grid-cols-7">
                {days.map((day) => (
                  <div key={day.date} className={`min-h-36 border-b border-r border-[var(--line)] p-2 ${day.inMonth ? "" : "bg-[var(--paper-deep)] opacity-55"}`}>
                    <time className={`grid size-7 place-items-center text-xs font-bold ${day.date === today ? "rounded-full bg-[var(--signal)] text-white" : ""}`}>{day.dayNumber}</time>
                    <div className="mt-2 space-y-1.5">{(eventsByDate.get(day.date) ?? []).slice(0, 3).map((event) => <Link href={event.href} key={`${event.kind}-${event.id}`} className={`block border-l-[3px] p-2 text-xs leading-4 ${kindClass[event.kind]}`}><span className="block font-bold">{event.title}</span><span className="quiet mt-0.5 block truncate">{event.detail}</span></Link>)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <div className="space-y-6">
          <CalendarFeedPanel enabled={feedEnabled} available={isSupabaseConfigured} />
          <section className="card p-6">
            <p className="eyebrow">Next up</p>
            <div className="mt-4 space-y-4">{upcoming.map((event) => <Link className="block border-l-2 border-[var(--line)] pl-4 hover:border-[var(--signal)]" href={event.href} key={`${event.kind}-${event.id}`}><p className="text-xs font-bold uppercase tracking-[0.08em]">{new Date(`${event.date}T12:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" })} · {kindLabel[event.kind]}</p><p className="mt-1 text-sm font-semibold">{event.title}</p><p className="quiet mt-1 text-xs">{event.detail}</p></Link>)}</div>
            {!upcoming.length ? <p className="quiet mt-4 text-sm">No upcoming dates yet.</p> : null}
          </section>
        </div>
      </div>
    </div>
  );
}
