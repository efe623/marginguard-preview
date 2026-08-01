"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { SignOutButton } from "@/components/app-shell/sign-out-button";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "/icons/sidebar/dashboard.png" },
  { href: "/projects", label: "Projects", icon: "/icons/sidebar/projects.png" },
  { href: "/clients", label: "Clients", icon: "/icons/sidebar/clients.png" },
  { href: "/calendar", label: "Calendar", icon: "/icons/sidebar/calendar.png" },
  { href: "/invoices", label: "Invoices", icon: "/icons/sidebar/invoices.png" },
  { href: "/reports", label: "Reports", icon: "/icons/sidebar/reports.png" }
];

export function Sidebar({
  calendarDay,
  user
}: {
  calendarDay: string;
  user: { displayName: string; role: string };
}) {
  const pathname = usePathname();
  const initial = user.displayName.trim().charAt(0).toUpperCase() || "U";

  return (
    <aside className="app-sidebar fixed inset-y-0 left-0 z-20 flex w-[244px] flex-col bg-[var(--sidebar)] text-white">
      <div className="app-sidebar-brand px-6 pb-5 pt-7">
        <Link href="/dashboard" className="inline-flex items-baseline gap-2">
          <span className="font-display text-[1.65rem] font-bold tracking-[-0.045em]">UnitPulse</span>
          <span className="size-2 rounded-full bg-[var(--signal)]" aria-hidden />
        </Link>
        <p className="mt-2 max-w-36 text-[0.67rem] leading-4 text-white/42">The operating record for profitable work.</p>
      </div>

      <Link
        href="/projects/new"
        className="app-new-project mx-5 mb-8 flex min-h-11 items-center justify-between rounded-xl bg-[var(--signal)] px-4 py-3 text-[0.72rem] font-bold uppercase tracking-[0.11em] text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 hover:bg-[var(--signal-deep)] hover:shadow-[0_14px_28px_rgba(0,0,0,0.22)]"
      >
        New project <ArrowUpRight size={16} />
      </Link>

      <nav aria-label="Primary navigation" className="app-nav flex-1 px-3">
        <p className="app-nav-label px-3 pb-2">Workspace</p>
        {links.map(({ href, label, icon }) => {
          const active =
            pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-11 items-center gap-3 px-3 text-[0.83rem] text-white/52 transition hover:text-white",
                active && "text-white"
              )}
            >
              {active ? (
                <span className="absolute left-0 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-[var(--signal)]" />
              ) : null}
              <span
                aria-hidden
                className={cn(
                  "sidebar-icon-frame",
                  label === "Invoices" && "sidebar-icon-frame-invoice"
                )}
              >
                <span
                  className="sidebar-page-icon"
                  style={{ "--sidebar-icon-image": `url(${icon})` } as CSSProperties}
                />
                {label === "Calendar" ? (
                  <span className="sidebar-calendar-day">{calendarDay}</span>
                ) : null}
              </span>
              <span className="font-display text-[0.9rem] font-semibold">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="app-sidebar-footer mx-6 border-t border-white/12 py-5">
        <div className="flex items-center gap-3">
          <div className="grid size-8 place-items-center border border-white/18 font-display text-sm">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.displayName}</p>
            <p className="mt-0.5 text-[0.62rem] uppercase tracking-[0.14em] text-white/45">
              {user.role}
            </p>
          </div>
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
