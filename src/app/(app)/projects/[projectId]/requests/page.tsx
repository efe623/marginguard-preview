import { ArrowRight, MessageSquareText, Plus } from "lucide-react";
import { notFound } from "next/navigation";
import { ProjectTabs } from "@/components/project-tabs";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import { getProjectView } from "@/features/core/queries";

export default async function ChangeRequestsPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProjectView(projectId);
  if (!project) notFound();

  return (
    <div className="page">
      <PageHeader
        eyebrow={project.name}
        title="Change requests"
        description="Record the request first. Supporting evidence helps, but is not required."
        actions={
          <ButtonLink href={`/projects/${project.id}/requests/new`}>
            <Plus size={16} /> New request
          </ButtonLink>
        }
      />
      <ProjectTabs projectId={project.id} active="requests" />

      <section className="card mt-7">
        {[
          {
            date: "29 Jul 2026",
            title: "Arabic localization",
            source: "Meeting note",
            evidence: "No source evidence",
            status: "Converted to CO-004",
            tone: "warning" as const
          },
          {
            date: "17 Jul 2026",
            title: "Additional product photography",
            source: "Email excerpt",
            evidence: "Evidence attached",
            status: "Paid",
            tone: "success" as const
          }
        ].map((item) => (
          <article
            key={item.title}
            className="group grid grid-cols-[48px_1fr_180px_160px_30px] items-center gap-5 border-b border-[var(--line)] p-7 last:border-0 hover:bg-[var(--paper-deep)]"
          >
            <div className="grid size-12 place-items-center border border-[var(--line)]">
              <MessageSquareText size={21} />
            </div>
            <div>
              <p className="eyebrow">{item.date} · {item.source}</p>
              <h2 className="mt-2 text-lg font-semibold">{item.title}</h2>
              <p className={`mt-1 text-sm ${item.evidence.startsWith("No") ? "text-[var(--warning)]" : "quiet"}`}>
                {item.evidence}
              </p>
            </div>
            <p className="quiet text-sm">Client request</p>
            <Status tone={item.tone}>{item.status}</Status>
            <ArrowRight size={17} className="transition group-hover:translate-x-1" />
          </article>
        ))}
      </section>
    </div>
  );
}
