"use client";

import {
  CalendarDays,
  ChartPie,
  ChevronDown,
  Ellipsis,
  FolderKanban,
  LayoutDashboard,
  Plus,
  Receipt,
  Search,
  Settings,
  Users
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ActivityCenter } from "@/components/activity-center";
import { CommandPalette, type PaletteEntity } from "@/components/app-shell/command-palette";
import { SignOutButton } from "@/components/app-shell/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import type { ActivityItem } from "@/features/operations/queries";

const nav = [
  { href: "/dashboard", label: "Today", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/reports", label: "Reports", icon: ChartPie },
  { href: "/calendar", label: "Calendar", icon: CalendarDays }
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) close();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

export function TopBar({
  user,
  activity,
  projects,
  clients
}: {
  user: { displayName: string; role: string };
  activity: ActivityItem[];
  projects: PaletteEntity[];
  clients: PaletteEntity[];
}) {
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);
  // A menu counts as open only on the page where it was opened, so navigating closes it.
  const [menu, setMenu] = useState<{ id: "new" | "account" | "more"; path: string } | null>(null);
  const isOpen = (id: "new" | "account" | "more") => menu?.id === id && menu.path === pathname;
  const toggle = (id: "new" | "account" | "more") => setMenu(isOpen(id) ? null : { id, path: pathname });
  const closeMenu = () => setMenu(null);
  const newOpen = isOpen("new");
  const accountOpen = isOpen("account");
  const moreOpen = isOpen("more");
  const newRef = useDismiss(newOpen, closeMenu);
  const accountRef = useDismiss(accountOpen, closeMenu);
  const moreRef = useDismiss(moreOpen, closeMenu);
  const initial = user.displayName.trim().charAt(0).toUpperCase() || "U";

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const mobileNav = nav.filter((item) => ["/dashboard", "/projects", "/clients", "/invoices"].includes(item.href));

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/dashboard" className="brand" aria-label="UnitPulse, go to Today">
            <span className="brand-mark" aria-hidden />
            UnitPulse
          </Link>
          <nav className="topnav" aria-label="Primary">
            {nav.map(({ href, label }) => (
              <Link key={href} href={href} className="topnav-link" aria-current={isActive(pathname, href) ? "page" : undefined}>
                {label}
              </Link>
            ))}
          </nav>
          <span className="topbar-spacer" />
          <button type="button" className="cmdk-trigger" onClick={() => setPaletteOpen(true)} aria-label="Search and jump">
            <Search size={16} aria-hidden />
            <span>Search or jump to</span>
            <kbd>Ctrl K</kbd>
          </button>
          <div className="pop topbar-new" ref={newRef}>
            <button type="button" className="button button-primary button-sm" aria-haspopup="menu" aria-expanded={newOpen} onClick={() => toggle("new")}>
              <Plus size={15} aria-hidden /> New <ChevronDown size={14} aria-hidden />
            </button>
            {newOpen ? (
              <div className="menu" role="menu">
                <Link href="/projects/new" className="menu-item" role="menuitem"><FolderKanban size={17} /> New project</Link>
                <Link href="/clients/new" className="menu-item" role="menuitem"><Users size={17} /> New client</Link>
              </div>
            ) : null}
          </div>
          <ActivityCenter items={activity} />
          <div className="pop" ref={accountRef}>
            <button type="button" className="avatar" aria-label="Account menu" aria-haspopup="menu" aria-expanded={accountOpen} onClick={() => toggle("account")}>
              {initial}
            </button>
            {accountOpen ? (
              <div className="menu" role="menu">
                <div style={{ padding: "8px 10px 6px" }}>
                  <p style={{ fontWeight: 650 }}>{user.displayName}</p>
                  <p className="meta" style={{ textTransform: "capitalize" }}>{user.role}</p>
                </div>
                <div className="menu-sep" />
                <Link href="/settings" className="menu-item" role="menuitem"><Settings size={17} /> Settings</Link>
                <p className="menu-label">Theme</p>
                <ThemeToggle />
                <div className="menu-sep" />
                <SignOutButton variant="menu" />
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <nav className="tabbar" aria-label="Primary">
        {mobileNav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="tabbar-link" aria-current={isActive(pathname, href) ? "page" : undefined}>
            <Icon size={21} aria-hidden />
            {label}
          </Link>
        ))}
        <div className="pop tabbar-pop" ref={moreRef}>
          <button type="button" className="tabbar-link" aria-haspopup="menu" aria-expanded={moreOpen} onClick={() => toggle("more")}>
            <Ellipsis size={21} aria-hidden />
            More
          </button>
          {moreOpen ? (
            <div className="menu" role="menu">
              <Link href="/projects/new" className="menu-item" role="menuitem"><Plus size={17} /> New project</Link>
              <Link href="/reports" className="menu-item" role="menuitem"><ChartPie size={17} /> Reports</Link>
              <Link href="/calendar" className="menu-item" role="menuitem"><CalendarDays size={17} /> Calendar</Link>
              <Link href="/settings" className="menu-item" role="menuitem"><Settings size={17} /> Settings</Link>
              <p className="menu-label">Theme</p>
              <ThemeToggle />
              <div className="menu-sep" />
              <SignOutButton variant="menu" />
            </div>
          ) : null}
        </div>
      </nav>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} projects={projects} clients={clients} />
    </>
  );
}
