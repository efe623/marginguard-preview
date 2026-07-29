import Link from "next/link";

export function ProjectTabs({
  projectId,
  active
}: {
  projectId: string;
  active: "overview" | "scope" | "requests" | "orders" | "files" | "audit";
}) {
  const tabs = [
    ["overview", "Overview", `/projects/${projectId}`],
    ["scope", "Project scope", `/projects/${projectId}/scope`],
    ["requests", "Change requests", `/projects/${projectId}/requests`],
    ["orders", "Change orders", `/projects/${projectId}/change-orders`],
    ["files", "Files", `/projects/${projectId}/files`],
    ["audit", "Audit", `/projects/${projectId}/audit`]
  ] as const;

  return (
    <nav aria-label="Project sections" className="mt-8 flex border-b border-[var(--line)]">
      {tabs.map(([key, label, href]) => (
        <Link
          key={key}
          href={href}
          aria-current={active === key ? "page" : undefined}
          className={`relative px-5 py-4 text-sm font-semibold ${
            active === key ? "text-[var(--ink)]" : "text-[var(--ink-soft)]"
          }`}
        >
          {label}
          {active === key ? (
            <span className="absolute inset-x-0 bottom-[-1px] h-[3px] bg-[var(--signal)]" />
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
