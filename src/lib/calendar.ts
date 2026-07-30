export type CalendarEventKind = "invoice" | "task" | "project";

export type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  detail: string;
  href: string;
  kind: CalendarEventKind;
  status?: string;
};

export function monthKey(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

export function parseMonth(value: string | undefined, now = new Date()) {
  const match = value?.match(/^(\d{4})-(\d{2})$/);
  if (!match) return { year: now.getFullYear(), monthIndex: now.getMonth() };
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (year < 2000 || year > 2100 || monthIndex < 0 || monthIndex > 11) {
    return { year: now.getFullYear(), monthIndex: now.getMonth() };
  }
  return { year, monthIndex };
}

export function getMonthDays(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, monthIndex, 1 - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return {
      date: `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`,
      dayNumber: day.getDate(),
      inMonth: day.getMonth() === monthIndex
    };
  });
}

function escapeIcs(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

export function serializeCalendar(events: CalendarEvent[], calendarName = "UnitPulse") {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//UnitPulse//Business Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(calendarName)}`,
    "X-WR-CALDESC:Project deadlines, tasks, and invoice due dates from UnitPulse"
  ];
  for (const event of events) {
    const date = event.date.replaceAll("-", "");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${escapeIcs(`${event.kind}-${event.id}@unitpulse.app`)}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${date}`,
      `DTEND;VALUE=DATE:${nextDate(event.date).replaceAll("-", "")}`,
      `SUMMARY:${escapeIcs(event.title)}`,
      `DESCRIPTION:${escapeIcs(event.detail)}`,
      `URL:${escapeIcs(event.href)}`,
      `CATEGORIES:${event.kind.toUpperCase()}`,
      "TRANSP:TRANSPARENT",
      "CLASS:PRIVATE",
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

function nextDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
