import { describe, expect, it } from "vitest";
import { getMonthDays, parseMonth, serializeCalendar } from "@/lib/calendar";

describe("calendar helpers", () => {
  it("builds a Monday-first six-week month grid", () => {
    const days = getMonthDays(2026, 6);
    expect(days).toHaveLength(42);
    expect(days[0].date).toBe("2026-06-29");
    expect(days[41].date).toBe("2026-08-09");
  });

  it("rejects malformed month parameters", () => {
    expect(parseMonth("2026-13", new Date("2026-07-30"))).toEqual({
      year: 2026,
      monthIndex: 6
    });
  });

  it("serializes private all-day iCalendar events safely", () => {
    const calendar = serializeCalendar([{
      id: "1",
      date: "2026-07-31",
      title: "Invoice, INV-1",
      detail: "AED 500; due",
      href: "https://unitpulse.app/invoices",
      kind: "invoice"
    }]);
    expect(calendar).toContain("DTSTART;VALUE=DATE:20260731");
    expect(calendar).toContain("DTEND;VALUE=DATE:20260801");
    expect(calendar).toContain("SUMMARY:Invoice\\, INV-1");
    expect(calendar).toContain("CLASS:PRIVATE");
  });
});
