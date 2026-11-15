"use client";

import { useState } from "react";
import { CalendarPlus, Copy, RefreshCw, ShieldAlert, Unlink } from "lucide-react";

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
    <aside className="panel">
      <div className="panel-head">
        <h2 className="panel-title">Keep dates on every device</h2>
      </div>
      <div className="panel-body stack-sm">
        <p className="quiet text-sm">
          Create a private, read-only subscription for Apple Calendar, Google Calendar, Outlook, or any iCalendar app.
        </p>
        {feedUrl ? (
          <div className="stack-sm">
            <div className="field">
              <label className="field-label" htmlFor="calendar-feed-url">Private subscription link</label>
              <input id="calendar-feed-url" className="input text-xs" readOnly value={feedUrl} aria-label="Private calendar subscription URL" />
            </div>
            <div className="cluster">
              <a className="button button-primary" href={webcalUrl}><CalendarPlus size={16} aria-hidden /> Open in calendar</a>
              <button className="button button-outline" type="button" onClick={() => navigator.clipboard.writeText(feedUrl)}><Copy size={16} aria-hidden /> Copy link</button>
            </div>
          </div>
        ) : (
          <button className="button button-primary w-full" type="button" disabled={busy || !available} onClick={generate}>
            {hasFeed ? <RefreshCw size={16} aria-hidden /> : <CalendarPlus size={16} aria-hidden />}
            {!available ? "Available in the live app" : hasFeed ? "Replace private link" : "Connect a calendar"}
          </button>
        )}
        {hasFeed && !feedUrl ? <p className="meta">A calendar is connected. Replace the link if you no longer have it.</p> : null}
        {hasFeed ? <button className="button button-danger button-sm self-start" type="button" disabled={busy} onClick={revoke}><Unlink size={14} aria-hidden /> Disconnect</button> : null}
        {message ? <p className="text-sm" role="status">{message}</p> : null}
        <div className="notice notice-warn">
          <ShieldAlert size={16} aria-hidden />
          <p>Anyone with this private link can read its dates. Disconnect it immediately if it is shared accidentally.</p>
        </div>
      </div>
    </aside>
  );
}
