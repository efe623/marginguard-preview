import { EmptyState } from "@/components/ui/empty-state";
import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SortSelect } from "@/components/ui/sort-select";
import { Status } from "@/components/ui/status";
import { listProjectViews } from "@/features/core/queries";
import { formatMoney } from "@/lib/money";
import type { ProjectStatus } from "@/types/domain";

const statusLabels: Record<ProjectStatus, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  active: { label: "Active", tone: "neutral" },
  awaiting_approval: { label: "Awaiting approval", tone: "warning" },
  awaiting_deposit: { label: "Awaiting deposit", tone: "warning" },
  authorized: { label: "Authorized", tone: "success" },
  completed: { label: "Completed", tone: "success" }
};

const filters = [
  { key: "all", label: "All" },
  { key: "attention", label: "Needs action" },
  { key: "active", label: "In progress" },
  { key: "completed", label: "Completed" }
] as const;

const sorts = [
  { key: "updated", label: "Recently updated" },
  { key: "value", label: "Highest value" },
  { key: "client", label: "Client name" }
] as const;

type FilterKey = (typeof filters)[number]["key"];
type SortKey = (typeof sorts)[number]["key"];

const filterMatch: Record<FilterKey, (status: ProjectStatus) => boolean> = {
  all: () => true,
  attention: (status) => status === "awaiting_approval" || status === "awaiting_deposit",
  active: (status) => status === "active" || status === "authorized",
  completed: (status) => status === "completed"
};

export default async function ProjectsPage({
  searchParams
}: {
  searchParams?: Promise<{ filter?: string; sort?: string; deleted?: string }>;
}) {
  const query = (await searchParams) ?? {};
  const filter = (filters.find((item) => item.key === query.filter)?.key ?? "all") as FilterKey;
  const sort = (sorts.find((item) => item.key === query.sort)?.key ?? "updated") as SortKey;
  const all = await listProjectViews();
  const shown = all
    .filter((project) => filterMatch[filter](project.status))
    .sort((a, b) => {
      if (sort === "value") return b.quoteMinor + b.approvedExtrasMinor - (a.quoteMinor + a.approvedExtrasMinor);
      if (sort === "client") return a.clientName.localeCompare(b.clientName);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  const href = (next: { filter?: FilterKey; sort?: SortKey }) => {
    const params = new URLSearchParams();
    const nextFilter = next.filter ?? filter;
    const nextSort = next.sort ?? sort;
    if (nextFilter !== "all") params.set("filter", nextFilter);
    if (nextSort !== "updated") params.set("sort", nextSort);
    const text = params.toString();
    return text ? `/projects?${text}` : "/projects";
  };

  return (
    <div className="page">
      <PageHeader
        title="Projects"
        description="The agreed scope and payment checkpoint for every job."
        actions={
          <ButtonLink href="/projects/new">
            <Plus size={16} aria-hidden /> New project
          </ButtonLink>
        }
      />

      <div className="list-controls">
        <nav className="chips chips-scroll" aria-label="Filter projects">
          {filters.map((item) => (
            <Link key={item.key} href={href({ filter: item.key })} className="chip" aria-pressed={filter === item.key} scroll={false}>
              {item.label}
              {item.key === "all" ? <span className="faint" style={{ marginLeft: 6 }}>{all.length}</span> : null}
            </Link>
          ))}
        </nav>
        <SortSelect value={sort} options={sorts.map((item) => ({ key: item.key, label: item.label, href: href({ sort: item.key }) }))} />
      </div>

      {query.deleted === "project" ? <p className="notice notice-success" role="status">Project deleted.</p> : null}

      <section className="panel project-list" aria-label="Project list">
        {shown.length === 0 ? (
          all.length === 0 ? (
            <EmptyState art="projects" title="Create your first project" text="Set the scope, the price and who approves changes. It takes about a minute, and it is how you stop doing free work." action={{ href: "/projects/new", label: "Create your first project" }} />
          ) : (
            <EmptyState art="projects" title="No projects match this filter" text="Try a different filter to see the rest of your work." action={{ href: "/projects", label: "Show all projects" }} />
          )
        ) : (
          <div className="rows">
            <div
              className="hidden items-center gap-4 border-b border-[var(--line)] px-5 py-2.5 text-[0.8125rem] font-semibold text-[var(--ink-soft)] md:grid md:grid-cols-[minmax(0,1.7fr)_150px_150px_130px_130px_20px]"
              aria-hidden
            >
              <span>Project</span>
              <span>Revisions</span>
              <span>Status</span>
              <span className="text-right">Quote</span>
              <span className="text-right">Extras</span>
              <span />
            </div>
            {shown.map((project) => {
              const status = statusLabels[project.status];
              const full = project.revisionUsed >= project.revisionLimit;
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="row md:!grid-cols-[minmax(0,1.7fr)_150px_150px_130px_130px_20px] md:gap-4"
                >
                  <div className="row-main">
                    <p className="row-title">{project.name}</p>
                    <p className="row-sub">{project.clientName} · {project.code}</p>
                  </div>
                  <span className={`pips ${full ? "is-full" : ""}`}>
                    {Array.from({ length: project.revisionLimit }).map((_, index) => (
                      <i key={index} className={index < project.revisionUsed ? "on" : ""} aria-hidden />
                    ))}
                    <span className="pips-count"><span className="sr-only">Revisions: </span>{project.revisionUsed}/{project.revisionLimit} used</span>
                  </span>
                  <span><Status tone={status.tone}>{status.label}</Status></span>
                  <span className="num font-semibold" data-label="Quote">{formatMoney(project.quoteMinor, project.currency)}</span>
                  <span className="num" data-label="Extras">{project.approvedExtrasMinor ? formatMoney(project.approvedExtrasMinor, project.currency) : <span className="faint">None</span>}</span>
                  <ChevronRight size={16} className="faint hidden md:block" aria-hidden />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
