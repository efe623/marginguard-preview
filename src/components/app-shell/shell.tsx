"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ActivityCenter } from "@/components/activity-center";
import { ArrivalFocus } from "@/components/arrival-focus";
import { LogRequestDialog } from "@/components/log-request";
import { CommandPalette, type PaletteEntity } from "@/components/app-shell/command-palette";
import { SignOutButton } from "@/components/app-shell/sign-out-button";
import {
  BrandMark,
  PulseFace,
  IconAppearance,
  IconArchive,
  IconBusiness,
  IconDocument,
  IconLink,
  IconPen,
  IconShield,
  IconSupport,
  IconCalendar,
  IconArrowLeft,
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

/* "G then a letter" jumps, shown in each link's tooltip. */
const jumpKeys: Record<string, string> = { d: "/dashboard", p: "/projects", c: "/clients", i: "/invoices", r: "/reports", l: "/calendar", s: "/settings/business" };
const jumpFor = (href: string) => Object.entries(jumpKeys).find(([, target]) => target === href)?.[0];

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

const settingsSections: NavItem[] = [
  { href: "/settings/business", label: "Business profile", icon: IconBusiness },
  { href: "/settings/appearance", label: "Appearance", icon: IconAppearance },
  { href: "/settings/quotes", label: "Quote templates", icon: IconDocument },
  { href: "/settings/members", label: "Members", icon: IconClients },
  { href: "/settings/security", label: "Security", icon: IconShield },
  { href: "/settings/connections", label: "Connections", icon: IconLink },
  { href: "/settings/ai", label: "AI and privacy", icon: IconPen },
  { href: "/settings/support", label: "Support access", icon: IconSupport },
  { href: "/settings/deletion", label: "Data and deletion", icon: IconArchive }
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
  attention,
  children
}: {
  user: { displayName: string; role: string };
  attention: { needs: number; overdue: number };
  activity: ActivityItem[];
  projects: PaletteEntity[];
  clients: PaletteEntity[];
  banner?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const collapsed = useSyncExternalStore(subscribeCollapse, readCollapsed, () => false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  // Drawer and menu are open only on the page where they were opened, so navigating closes them.
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const [newPath, setNewPath] = useState<string | null>(null);
  const drawerOpen = drawerPath === pathname;
  const newOpen = newPath === pathname;
  const newRef = useDismiss(newOpen, () => setNewPath(null));
  const inSettings = pathname === "/settings" || pathname.startsWith("/settings/");
  const badgeFor = (href: string) => (href === "/dashboard" ? attention.needs : href === "/invoices" ? attention.overdue : 0);
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

  // The tab title carries the count, so a background tab shows when something needs the owner.
  const needs = attention.needs;
  useEffect(() => {
    const apply = () => {
      const base = document.title.replace(/^\(\d+\)\s*/, "");
      const next = needs ? `(${needs}) ${base}` : base;
      if (document.title !== next) document.title = next;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [needs]);

  // Remember the last project opened so Today can offer to pick up from it.
  useEffect(() => {
    const match = pathname.match(/^\/projects\/([^/]+)/);
    if (!match || match[1] === "new") return;
    try {
      localStorage.setItem("unitpulse-lastproject", match[1]);
    } catch {}
  }, [pathname]);

  // "G then D/P/C/I/R/L/S" jumps between areas without the mouse.
  useEffect(() => {
    let armed = 0;
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const el = event.target as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      const key = event.key.toLowerCase();
      if (armed && Date.now() - armed < 1200 && jumpKeys[key]) {
        event.preventDefault();
        armed = 0;
        router.push(jumpKeys[key]);
        return;
      }
      armed = key === "g" ? Date.now() : 0;
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerPath(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className="shell" data-collapsed={collapsed ? "true" : "false"} data-drawer={drawerOpen ? "open" : "closed"} data-new={pathname === "/dashboard" ? "hide" : "show"} data-settings={inSettings ? "true" : "false"}>
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

        {inSettings ? (
          <>
            <Link href="/dashboard" className="nav-item nav-back swap-in" title="Back to app" style={{ "--i": 0 } as React.CSSProperties}>
              <IconArrowLeft size={20} />
              <span className="nav-text">Back to app</span>
            </Link>
            <nav className="sidebar-nav" aria-label="Settings">
              <div className="nav-group">
                <p className="nav-group-label swap-in" style={{ "--i": 1 } as React.CSSProperties}>Settings</p>
                {settingsSections.map(({ href, label, icon: Icon }, index) => (
                  <Link key={href} href={href} className="nav-item swap-in" title={label} style={{ "--i": index + 2 } as React.CSSProperties} aria-current={isActive(pathname, href) ? "page" : undefined}>
                    <Icon size={20} />
                    <span className="nav-text">{label}</span>
                  </Link>
                ))}
              </div>
            </nav>
            <div className="sidebar-foot swap-in" style={{ "--i": settingsSections.length + 2 } as React.CSSProperties}>
              <SignOutButton variant="nav" />
            </div>
          </>
        ) : (
          <>
            <nav className="sidebar-nav" aria-label="Primary">
              {groups.map((group) => (
                <div className="nav-group" key={group.label}>
                  {group.items.map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href} data-nav={href.slice(1)} className="nav-item" title={jumpFor(href) ? `${label} (G then ${jumpFor(href)!.toUpperCase()})` : label} aria-current={isActive(pathname, href) ? "page" : undefined}>
                      <Icon size={20} />
                      <span className="nav-text">{label}</span>
                      {badgeFor(href) ? <span className="nav-badge" aria-label={`${badgeFor(href)} need attention`}>{badgeFor(href)}</span> : null}
                    </Link>
                  ))}
                </div>
              ))}
            </nav>

            <div className="sidebar-foot">
              <div className="account">
                <span className="avatar" aria-hidden>{initial}</span>
                <div className="account-text">
                  <p className="account-name">{user.displayName}</p>
                  <p className="account-role">{user.role}</p>
                </div>
                <Link href="/settings/business" className="icon-button" aria-label="Settings" title="Settings">
                  <IconSettings size={20} />
                </Link>
              </div>
            </div>
          </>
        )}
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
          <button type="button" className="ask-trigger" aria-label="Ask Pulse" title="Ask Pulse" onClick={() => window.dispatchEvent(new Event("unitpulse:ask"))}>
            <PulseFace size={40} />
          </button>
          <span className="mainbar-spacer" />
          <ActivityCenter items={activity} />
          <div className="pop mainbar-new" ref={newRef}>
            <button type="button" className="button button-primary button-sm" aria-haspopup="menu" aria-expanded={newOpen} onClick={() => setNewPath(newOpen ? null : pathname)}>
              <IconPlus size={16} /> New
            </button>
            {newOpen ? (
              <div className="menu" role="menu">
                <button type="button" className="menu-item" role="menuitem" onClick={() => { setNewPath(null); setRequestOpen(true); }}><IconDocument size={18} /> Log a request</button>
                <Link href="/projects/new" className="menu-item" role="menuitem"><IconProjects size={18} /> New project</Link>
                <Link href="/clients/new" className="menu-item" role="menuitem"><IconClients size={18} /> New client</Link>
              </div>
            ) : null}
          </div>
        </header>
        {banner}
        <Suspense fallback={null}><ArrivalFocus /></Suspense>
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

      <LogRequestDialog open={requestOpen} onClose={() => setRequestOpen(false)} projects={projects} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} projects={projects} clients={clients} />
    </div>
  );
}
