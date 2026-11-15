"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ActivityCenter } from "@/components/activity-center";
import { CommandPalette, type PaletteEntity } from "@/components/app-shell/command-palette";
import { SignOutButton } from "@/components/app-shell/sign-out-button";
import {
  BrandMark,
  IconCalendar,
  IconChevron,
  IconClients,
  IconClose,
  IconInvoices,
  IconMenu,
  IconPlus,
  IconProjects,
  IconReports,
  IconSearch,
  IconSettings,
  IconToday
} from "@/components/icons";
import type { ActivityItem } from "@/features/operations/queries";

type NavItem = { href: string; label: string; icon: typeof IconToday };

const groups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Work",
    items: [
      { href: "/dashboard", label: "Today", icon: IconToday },
      { href: "/projects", label: "Projects", icon: IconProjects },
      { href: "/clients", label: "Clients", icon: IconClients }
    ]
  },
  {
    label: "Money",
    items: [
      { href: "/invoices", label: "Invoices", icon: IconInvoices },
      { href: "/reports", label: "Reports", icon: IconReports }
    ]
  },
  {
    label: "Plan",
    items: [{ href: "/calendar", label: "Calendar", icon: IconCalendar }]
  }
];

const dock: NavItem[] = [
  { href: "/dashboard", label: "Today", icon: IconToday },
  { href: "/projects", label: "Projects", icon: IconProjects },
  { href: "/clients", label: "Clients", icon: IconClients },
  { href: "/invoices", label: "Invoices", icon: IconInvoices }
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/* Sidebar collapse is a per-device preference, stored outside React state. */
const COLLAPSE_EVENT = "unitpulse-sidebar-change";
function subscribeCollapse(listener: () => void) {
  window.addEventListener(COLLAPSE_EVENT, listener);
  return () => window.removeEventListener(COLLAPSE_EVENT, listener);
}
function readCollapsed() {
  try {
    return localStorage.getItem("unitpulse-sidebar") === "collapsed";
  } catch {
    return false;
  }
}
function writeCollapsed(value: boolean) {
  try {
    localStorage.setItem("unitpulse-sidebar", value ? "collapsed" : "open");
  } catch {}
  window.dispatchEvent(new Event(COLLAPSE_EVENT));
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

export function Shell({
  user,
  activity,
  projects,
  clients,
  banner,
  children
}: {
  user: { displayName: string; role: string };
  activity: ActivityItem[];
  projects: PaletteEntity[];
  clients: PaletteEntity[];
  banner?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(subscribeCollapse, readCollapsed, () => false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  // Drawer and menu are open only on the page where they were opened, so navigating closes them.
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const [newPath, setNewPath] = useState<string | null>(null);
  const drawerOpen = drawerPath === pathname;
  const newOpen = newPath === pathname;
  const newRef = useDismiss(newOpen, () => setNewPath(null));
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

  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerPath(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className="shell" data-collapsed={collapsed ? "true" : "false"} data-drawer={drawerOpen ? "open" : "closed"}>
      <aside className="sidebar" aria-label="Sidebar">
        <div className="sidebar-top">
          <Link href="/dashboard" className="brand" aria-label="UnitPulse, go to Today">
            <BrandMark />
            <span className="brand-name">UnitPulse</span>
          </Link>
          <button type="button" className="icon-button collapse-toggle" aria-pressed={collapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => writeCollapsed(!collapsed)}>
            <IconChevron size={16} />
          </button>
          <button type="button" className="icon-button sidebar-close" aria-label="Close menu" onClick={() => setDrawerPath(null)}>
            <IconClose size={18} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Primary">
          {groups.map((group) => (
            <div className="nav-group" key={group.label}>
              {group.items.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className="nav-item" title={label} aria-current={isActive(pathname, href) ? "page" : undefined}>
                  <Icon size={20} />
                  <span className="nav-text">{label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <Link href="/settings" className="nav-item" title="Settings" aria-current={isActive(pathname, "/settings") ? "page" : undefined}>
            <IconSettings size={20} />
            <span className="nav-text">Settings</span>
          </Link>
          <div className="account">
            <span className="avatar" aria-hidden>{initial}</span>
            <div className="account-text">
              <p className="account-name">{user.displayName}</p>
              <p className="account-role">{user.role}</p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </aside>

      <button type="button" className="scrim" aria-label="Close menu" tabIndex={-1} onClick={() => setDrawerPath(null)} />

      <div className="shell-main">
        <header className="mainbar">
          <button type="button" className="icon-button mainbar-menu" aria-label="Open menu" onClick={() => setDrawerPath(pathname)}>
            <IconMenu size={20} />
          </button>
          <button type="button" className="cmdk-trigger" onClick={() => setPaletteOpen(true)} aria-label="Search and jump">
            <IconSearch size={18} />
            <span>Search projects, clients, pages</span>
            <kbd>Ctrl K</kbd>
          </button>
          <span className="mainbar-spacer" />
          <ActivityCenter items={activity} />
          <div className="pop mainbar-new" ref={newRef}>
            <button type="button" className="button button-primary button-sm" aria-haspopup="menu" aria-expanded={newOpen} onClick={() => setNewPath(newOpen ? null : pathname)}>
              <IconPlus size={16} /> New
            </button>
            {newOpen ? (
              <div className="menu" role="menu">
                <Link href="/projects/new" className="menu-item" role="menuitem"><IconProjects size={18} /> New project</Link>
                <Link href="/clients/new" className="menu-item" role="menuitem"><IconClients size={18} /> New client</Link>
              </div>
            ) : null}
          </div>
        </header>
        {banner}
        <main className="content-shell">{children}</main>
      </div>

      <nav className="dock" aria-label="Primary">
        {dock.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="dock-link" aria-current={isActive(pathname, href) ? "page" : undefined}>
            <Icon size={22} />
            {label}
          </Link>
        ))}
        <button type="button" className="dock-link" onClick={() => setDrawerPath(pathname)} aria-label="Open full menu">
          <IconMenu size={22} />
          Menu
        </button>
      </nav>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} projects={projects} clients={clients} />
    </div>
  );
}
