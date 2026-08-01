"use client";

import { useState } from "react";
import { CalendarPlus, Copy, RefreshCw, Unlink } from "lucide-react";

export function CalendarFeedPanel({ enabled, available = true }: { enabled: boolean; available?: boolean }) {
  const [feedUrl, setFeedUrl] = useState("");
  const [hasFeed, setHasFeed] = useState(enabled);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function generate() {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/calendar-feed", { method: "POST" });
    const body = await response.json();
    setBusy(false);
    if (!response.ok) return setMessage(body.error ?? "Could not create the calendar link.");
    setFeedUrl(body.url);
    setHasFeed(true);
    setMessage("Private subscription link created. Save it now—it is shown only once.");
  }

  async function revoke() {
    setBusy(true);
    const response = await fetch("/api/calendar-feed", { method: "DELETE" });
    setBusy(false);
    if (!response.ok) return setMessage("Could not disconnect the calendar.");
    setFeedUrl("");
    setHasFeed(false);
    setMessage("Calendar connection removed. The old link no longer works.");
  }

  const webcalUrl = feedUrl.replace(/^https:/, "webcal:");
  return (
    <aside className="card p-6">
      <p className="eyebrow">Calendar connection</p>
      <h2 className="section-title mt-3">Keep dates on every device</h2>
      <p className="quiet mt-3 text-sm leading-6">
        Create a private, read-only subscription for Apple Calendar, Google Calendar, Outlook, or any iCalendar app.
      </p>
      {feedUrl ? (
        <div className="mt-5 space-y-3">
          <input className="input text-xs" readOnly value={feedUrl} aria-label="Private calendar subscription URL" />
          <div className="grid gap-2 sm:grid-cols-2">
            <a className="button button-primary" href={webcalUrl}><CalendarPlus size={16} /> Open in calendar</a>
            <button className="button button-outline" type="button" onClick={() => navigator.clipboard.writeText(feedUrl)}><Copy size={16} /> Copy link</button>
          </div>
        </div>
      ) : (
        <button className="button button-primary mt-5 w-full" type="button" disabled={busy || !available} onClick={generate}>
          {hasFeed ? <RefreshCw size={16} /> : <CalendarPlus size={16} />}
          {!available ? "Available in the live app" : hasFeed ? "Replace private link" : "Connect a calendar"}
        </button>
      )}
      {hasFeed && !feedUrl ? <p className="quiet mt-3 text-xs">A calendar is connected. Replace the link if you no longer have it.</p> : null}
      {hasFeed ? <button className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--danger)]" type="button" disabled={busy} onClick={revoke}><Unlink size={14} /> Disconnect</button> : null}
      {message ? <p className="mt-4 text-sm" role="status">{message}</p> : null}
      <p className="quiet mt-5 border-t border-[var(--line)] pt-4 text-xs leading-5">
        Anyone with this private link can read its dates. Disconnect it immediately if it is shared accidentally.
      </p>
    </aside>
  );
}
