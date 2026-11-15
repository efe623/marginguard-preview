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
        crumbs={[
          { label: "Projects", href: "/projects" },
          { label: project.name, href: `/projects/${project.id}` }
        ]}
        title="History"
        description="An append-only record of decisions, approvals, permissions, and payments."
      />
      <ProjectTabs projectId={project.id} active="audit" />
      <section className="panel" aria-labelledby="audit-title">
        <div className="panel-head">
          <h2 className="panel-title" id="audit-title">Newest first</h2>
        </div>
        <ol className="rows">
          {events.map(([time, title, detail, Icon]) => (
            <li key={title} className="row" style={{ gridTemplateColumns: "72px 32px minmax(0, 1fr)" }}>
              <time className="num quiet" style={{ textAlign: "left" }}>{time}</time>
              <span className="row-lead"><Icon size={18} aria-hidden="true" /></span>
              <div className="row-main">
                <p className="row-title">{title}</p>
                <p className="row-sub">{detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
