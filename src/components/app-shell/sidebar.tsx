"use client";

import {
  BriefcaseBusiness,
  Bell,
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  PieChart,
  Settings,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: BriefcaseBusiness },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/reports", label: "Reports", icon: PieChart },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/audit", label: "Audit trail", icon: ShieldCheck },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar fixed inset-y-0 left-0 z-20 flex w-[268px] flex-col bg-[var(--sidebar)] text-white">
      <div className="app-sidebar-brand px-7 pb-7 pt-8">
        <Link href="/dashboard">
          <span className="font-display block text-[2rem] font-bold tracking-[-0.04em]">
            UnitPulse
          </span>
          <span className="mt-1 block text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/45">
            Scope, cost, control.
          </span>
        </Link>
      </div>

      <Link
        href="/projects/new"
        className="app-new-project mx-7 mb-8 flex min-h-12 items-center justify-center bg-[var(--signal)] text-xs font-bold uppercase tracking-[0.09em] transition hover:bg-white hover:text-black"
      >
        + New project
      </Link>

      <nav aria-label="Primary navigation" className="app-nav flex-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-14 items-center gap-4 px-7 text-sm text-white/52 transition hover:bg-white/5 hover:text-white",
                active && "bg-white/[0.06] text-white"
              )}
            >
              {active ? (
                <span className="absolute inset-y-0 left-0 w-[3px] bg-[var(--signal)]" />
              ) : null}
              <Icon size={19} strokeWidth={1.7} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="app-sidebar-footer border-t border-white/15 px-7 py-6">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-full border border-white/20 bg-white/10 font-display text-lg">
            A
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Alex Morgan</p>
            <p className="mt-0.5 text-[0.62rem] uppercase tracking-[0.14em] text-white/45">
              Owner
            </p>
          </div>
          <Link href="/sign-in" aria-label="Sign out" className="text-white/50 hover:text-white">
            <LogOut size={17} />
          </Link>
        </div>
      </div>
    </aside>
  );
}
