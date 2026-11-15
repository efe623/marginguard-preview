import Link from "next/link";

type Key = "overview" | "scope" | "requests" | "orders" | "work" | "money" | "messages" | "ai" | "files" | "audit";

type Group = {
  key: string;
  label: string;
  href: string;
  pages: ReadonlyArray<{ key: Key; label: string; href: string }>;
};

/**
 * Ten pages, six groups. Each group links to its first page; groups with
 * several pages show a sub-tab row beneath the main tabs.
 */
export function ProjectTabs({ projectId, active }: { projectId: string; active: Key }) {
  const base = `/projects/${projectId}`;
  const groups: Group[] = [
    { key: "overview", label: "Overview", href: base, pages: [{ key: "overview", label: "Overview", href: base }] },
    {
      key: "scope",
      label: "Scope and changes",
      href: `${base}/scope`,
      pages: [
        { key: "scope", label: "Scope", href: `${base}/scope` },
        { key: "requests", label: "Change requests", href: `${base}/requests` },
        { key: "orders", label: "Change orders", href: `${base}/change-orders` }
      ]
    },
    { key: "money", label: "Money", href: `${base}/money`, pages: [{ key: "money", label: "Money", href: `${base}/money` }] },
    {
      key: "work",
      label: "Work",
      href: `${base}/work`,
      pages: [
        { key: "work", label: "Tasks and time", href: `${base}/work` },
        { key: "files", label: "Files", href: `${base}/files` }
      ]
    },
    {
      key: "talk",
      label: "Conversation",
      href: `${base}/messages`,
      pages: [
        { key: "messages", label: "Messages", href: `${base}/messages` },
        { key: "ai", label: "AI drafts", href: `${base}/ai` }
      ]
    },
    { key: "audit", label: "History", href: `${base}/audit`, pages: [{ key: "audit", label: "History", href: `${base}/audit` }] }
  ];

  const current = groups.find((group) => group.pages.some((page) => page.key === active)) ?? groups[0];

  return (
    <div className="mb-6">
      <nav aria-label="Project sections" className="tabs">
        {groups.map((group) => (
          <Link key={group.key} href={group.href} className="tab" aria-current={group.key === current.key ? "page" : undefined}>
            {group.label}
          </Link>
        ))}
      </nav>
      {current.pages.length > 1 ? (
        <nav aria-label={`${current.label} pages`} className="subtabs">
          {current.pages.map((page) => (
            <Link key={page.key} href={page.href} className="subtab" aria-current={page.key === active ? "page" : undefined}>
              {page.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
