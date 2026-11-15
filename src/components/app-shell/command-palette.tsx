"use client";

import {
  ArrowRight,
  Bell,
  CalendarDays,
  ChartPie,
  FolderKanban,
  LayoutDashboard,
  Plus,
  Receipt,
  Search,
  Settings,
  Users
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";

export type PaletteEntity = { id: string; name: string; detail?: string };

type Item = {
  id: string;
  group: "Go to" | "Create" | "Projects" | "Clients";
  label: string;
  hint?: string;
  href: string;
  icon: React.ReactNode;
};

const pages: Item[] = [
  { id: "p-today", group: "Go to", label: "Today", href: "/dashboard", icon: <LayoutDashboard size={17} /> },
  { id: "p-projects", group: "Go to", label: "Projects", href: "/projects", icon: <FolderKanban size={17} /> },
  { id: "p-clients", group: "Go to", label: "Clients", href: "/clients", icon: <Users size={17} /> },
  { id: "p-invoices", group: "Go to", label: "Invoices", href: "/invoices", icon: <Receipt size={17} /> },
  { id: "p-reports", group: "Go to", label: "Reports", href: "/reports", icon: <ChartPie size={17} /> },
  { id: "p-calendar", group: "Go to", label: "Calendar", href: "/calendar", icon: <CalendarDays size={17} /> },
  { id: "p-activity", group: "Go to", label: "Activity", href: "/notifications", icon: <Bell size={17} /> },
  { id: "p-settings", group: "Go to", label: "Settings", href: "/settings", icon: <Settings size={17} /> },
  { id: "a-project", group: "Create", label: "New project", href: "/projects/new", icon: <Plus size={17} /> },
  { id: "a-client", group: "Create", label: "New client", href: "/clients/new", icon: <Plus size={17} /> }
];

export function CommandPalette({
  open,
  onClose,
  projects,
  clients
}: {
  open: boolean;
  onClose: () => void;
  projects: PaletteEntity[];
  clients: PaletteEntity[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const items = useMemo<Item[]>(() => {
    const dynamic: Item[] = [
      ...projects.map((project) => ({
        id: `proj-${project.id}`,
        group: "Projects" as const,
        label: project.name,
        hint: project.detail,
        href: `/projects/${project.id}`,
        icon: <FolderKanban size={17} />
      })),
      ...clients.map((client) => ({
        id: `cli-${client.id}`,
        group: "Clients" as const,
        label: client.name,
        hint: client.detail,
        href: `/clients/${client.id}`,
        icon: <Users size={17} />
      }))
    ];
    const needle = query.trim().toLowerCase();
    const all = [...pages, ...dynamic];
    if (!needle) return all.filter((item) => item.group !== "Clients");
    return all.filter((item) => `${item.label} ${item.hint ?? ""}`.toLowerCase().includes(needle));
  }, [clients, projects, query]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const previous = document.activeElement as HTMLElement | null;
    return () => previous?.focus?.();
  }, [open]);

  if (!open) return null;

  function go(item: Item) {
    onClose();
    setQuery("");
    router.push(item.href);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((value) => Math.min(value + 1, items.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((value) => Math.max(value - 1, 0));
    } else if (event.key === "Enter" && items[active]) {
      event.preventDefault();
      go(items[active]);
    }
  }

  let lastGroup = "";
  return (
    <div
      className="palette-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="palette" role="dialog" aria-modal="true" aria-label="Search and jump" onKeyDown={onKeyDown}>
        <div className="palette-field">
          <Search size={18} aria-hidden />
          <input
            ref={inputRef}
            className="palette-input"
            placeholder="Search projects, clients, or pages"
            value={query}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={items[active] ? `${listId}-${items[active].id}` : undefined}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
          />
        </div>
        <div className="palette-list" role="listbox" id={listId}>
          {items.length === 0 ? <p className="palette-empty">Nothing matches &ldquo;{query}&rdquo;.</p> : null}
          {items.map((item, index) => {
            const heading = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <div key={item.id}>
                {heading ? <p className="palette-group">{heading}</p> : null}
                <div
                  id={`${listId}-${item.id}`}
                  role="option"
                  aria-selected={index === active}
                  className="palette-item"
                  onMouseMove={() => setActive(index)}
                  onClick={() => go(item)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.hint ? <small>{item.hint}</small> : <ArrowRight size={15} style={{ marginLeft: "auto" }} aria-hidden />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
