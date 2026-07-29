import { CheckCircle2, FilePenLine, MailCheck, ShieldAlert } from "lucide-react";
import { notFound } from "next/navigation";
import { ProjectTabs } from "@/components/project-tabs";
import { PageHeader } from "@/components/ui/page-header";
import { getProjectView } from "@/features/core/queries";

export default async function ProjectAuditPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProjectView(projectId);
  if (!project) notFound();

  const events = [
    ["10:29", "Client approved CO-004 version 1", "Verified email · contact@sparkretail.example", MailCheck],
    ["10:14", "Alex sent CO-004 for approval", "Amount AED 2,500 · 50% deposit", FilePenLine],
    ["09:58", "Evidence warning acknowledged", "Change Order sent without source evidence", ShieldAlert],
    ["18 Jul", "Project scope version 2 confirmed", "Alex Morgan · owner", CheckCircle2]
  ] as const;

  return (
    <div className="page">
      <PageHeader
        eyebrow={project.name}
        title="Project audit"
        description="An append-only record of decisions, approvals, permissions, and payments."
      />
      <ProjectTabs projectId={project.id} active="audit" />
      <section className="card mt-7">
        {events.map(([time, title, detail, Icon]) => (
          <article key={title} className="grid grid-cols-[100px_42px_1fr] gap-5 border-b border-[var(--line)] p-6 last:border-0">
            <time className="eyebrow pt-3">{time}</time>
            <span className="grid size-10 place-items-center border border-[var(--line)]">
              <Icon size={18} />
            </span>
            <div>
              <h2 className="font-semibold">{title}</h2>
              <p className="quiet mt-1 text-sm">{detail}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
