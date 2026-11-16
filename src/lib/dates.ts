/**
 * Dates as people read them: "Tue 10 Nov", with the year only when it is not
 * this year. Accepts an ISO date ("2026-11-10") or a full timestamp; anything
 * unreadable is returned unchanged rather than shown as "Invalid Date".
 */
export function formatDay(value: string | null | undefined, now = new Date()) {
  if (!value) return "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const sameYear = date.getFullYear() === now.getFullYear();
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) }).format(date);
}
