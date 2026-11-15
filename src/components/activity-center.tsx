"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, History, X } from "lucide-react";
import type { ActivityItem } from "@/features/operations/queries";

function ActivityRow({ item, compact = false }: { item: ActivityItem; compact?: boolean }) {
  const content = (
    <div className={`activity-row ${compact ? "activity-row-compact" : ""}`}>
      <span className={`activity-icon activity-icon-${item.kind}`}>
        {item.kind === "alert" ? <Bell size={16} /> : <History size={16} />}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold">{item.title}</h3>
          {item.unread ? <span className="activity-unread" aria-label="Unread" /> : null}
        </div>
        <p className="quiet mt-1 line-clamp-2 text-xs leading-5">{item.body}</p>
        <time className="faint mt-1 block text-xs">
          {new Date(item.createdAt).toLocaleString()}
        </time>
      </div>
      {item.href ? <ChevronRight className="quiet" size={16} /> : <span className="meta">{item.category}</span>}
    </div>
  );
  return item.href ? <Link href={item.href}>{content}</Link> : content;
}

export function ActivityList({ items }: { items: ActivityItem[] }) {
  if (!items.length) return <div className="p-12 text-center quiet">No alerts or audit activity yet.</div>;
  return <div>{items.map((item) => <ActivityRow key={item.id} item={item} />)}</div>;
}

export function ActivityCenter({ items }: { items: ActivityItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const unread = items.filter((item) => item.unread).length;

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  return (
    <div className="activity-center" ref={rootRef}>
      <button className="icon-button" aria-current={pathname === "/notifications" ? "page" : undefined} type="button" aria-label={`Activity center${unread ? `, ${unread} unread` : ""}`} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <Bell size={18} />
        {unread ? <span className="topbar-alert-count">{Math.min(unread, 9)}</span> : null}
      </button>
      {open ? (
        <section className="activity-popover" aria-label="Recent activity">
          <header className="activity-popover-header">
            <div><h2 className="panel-title">Recent activity</h2><p className="meta">Alerts and audit events</p></div>
            <button type="button" aria-label="Close activity" onClick={() => setOpen(false)}><X size={18} /></button>
          </header>
          <div className="activity-popover-list">
            {items.slice(0, 6).map((item) => <ActivityRow key={item.id} item={item} compact />)}
            {!items.length ? <div className="p-8 text-center quiet text-sm">Nothing needs your attention yet.</div> : null}
          </div>
          <Link href="/notifications" className="activity-view-all" onClick={() => setOpen(false)}>View all activity <ChevronRight size={16} /></Link>
        </section>
      ) : null}
    </div>
  );
}
