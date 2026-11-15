import { ChevronRight, MessageSquareText, Plus, TriangleAlert } from "lucide-react";
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

  const requests = [
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
  ];

  return (
    <div className="page">
      <PageHeader
        crumbs={[
          { label: "Projects", href: "/projects" },
          { label: project.name, href: `/projects/${project.id}` }
        ]}
        title="Change requests"
        description="Record the request first. Supporting evidence helps, but is not required."
        actions={
          <ButtonLink href={`/projects/${project.id}/requests/new`}>
            <Plus size={16} aria-hidden /> New request
          </ButtonLink>
        }
      />
      <ProjectTabs projectId={project.id} active="requests" />

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Requests</h2>
            <p className="panel-sub">Newest first</p>
          </div>
        </div>
        {requests.length ? (
          <div className="rows">
            {requests.map((item) => {
              const missing = item.evidence.startsWith("No");
              return (
                <div key={item.title} className="row">
                  <span className="row-lead"><MessageSquareText size={18} aria-hidden /></span>
                  <div className="row-main">
                    <p className="row-title">{item.title}</p>
                    <p className="row-sub">{item.date} · {item.source} · Client request</p>
                    <p className="row-sub inline-flex items-center gap-1.5">
                      {missing ? <TriangleAlert size={13} aria-hidden className="text-[var(--warning)]" /> : null}
                      {item.evidence}
                    </p>
                  </div>
                  <div className="row-end">
                    <Status tone={item.tone}>{item.status}</Status>
                    <ChevronRight size={16} aria-hidden className="faint" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty">
            <p className="empty-title">No change requests yet</p>
            <p className="empty-text">Log the first thing the client asks for outside the agreed scope.</p>
            <ButtonLink href={`/projects/${project.id}/requests/new`}>New request</ButtonLink>
          </div>
        )}
      </section>
    </div>
  );
}
