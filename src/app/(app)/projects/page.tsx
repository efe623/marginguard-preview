import { ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import { listProjectViews } from "@/features/core/queries";
import { formatMoney } from "@/lib/money";
import type { ProjectStatus } from "@/types/domain";

const statusLabels: Record<
  ProjectStatus,
  { label: string; tone: "success" | "warning" | "danger" | "neutral" }
> = {
  active: { label: "Active", tone: "neutral" },
  awaiting_approval: { label: "Awaiting approval", tone: "warning" },
  awaiting_deposit: { label: "Awaiting deposit", tone: "warning" },
  authorized: { label: "Authorized", tone: "success" },
  completed: { label: "Completed", tone: "success" }
};

export default async function ProjectsPage() {
  const projects = await listProjectViews();
  return (
    <div className="page">
      <PageHeader
        eyebrow={`${projects.length} active projects`}
        title="Projects"
        description="The agreed scope and payment checkpoint for every job."
        actions={
          <ButtonLink href="/projects/new">
            <Plus size={16} /> New project
          </ButtonLink>
        }
      />

      <div className="mt-8 flex items-center justify-between border-y border-[var(--line)] py-4">
        <div className="flex gap-2">
          <button className="button button-dark min-h-9 px-4">Active</button>
          <button className="button button-outline min-h-9 px-4">Completed</button>
        </div>
        <label className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.08em]">
          Sort by
          <select className="select min-h-9 w-56 py-1">
            <option>Recently updated</option>
            <option>Highest value</option>
            <option>Client name</option>
          </select>
        </label>
      </div>

      <div className="card mt-8 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Client</th>
              <th>Original quote</th>
              <th>Approved extras</th>
              <th>Revisions</th>
              <th>Status</th>
              <th aria-label="Open" />
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const status = statusLabels[project.status];
              return (
                <tr key={project.id}>
                  <td>
                    <Link
                      className="font-semibold hover:text-[var(--signal)]"
                      href={`/projects/${project.id}`}
                    >
                      {project.name}
                    </Link>
                    <p className="quiet mt-1 text-xs">{project.code}</p>
                  </td>
                  <td>{project.clientName}</td>
                  <td className="font-semibold">
                    {formatMoney(project.quoteMinor, project.currency)}
                  </td>
                  <td>
                    {formatMoney(project.approvedExtrasMinor, project.currency)}
                  </td>
                  <td>
                    <span
                      className={
                        project.revisionUsed >= project.revisionLimit
                          ? "font-semibold text-[var(--warning)]"
                          : ""
                      }
                    >
                      {project.revisionUsed} / {project.revisionLimit}
                    </span>
                  </td>
                  <td>
                    <Status tone={status.tone}>{status.label}</Status>
                  </td>
                  <td>
                    <Link
                      href={`/projects/${project.id}`}
                      aria-label={`Open ${project.name}`}
                      className="grid size-9 place-items-center border border-[var(--line)] hover:border-[var(--ink)]"
                    >
                      <ArrowUpRight size={16} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
