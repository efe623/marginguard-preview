import Link from "next/link";
import { notFound } from "next/navigation";
import { AiDraftPanel } from "@/components/ai-draft-panel";
import { ProjectTabs } from "@/components/project-tabs";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import { reviewAiDraft } from "@/features/operations/actions";
import {
  getOperationsProjectData,
  getProjectContext
} from "@/features/operations/queries";

type AiRow = {
  id: string;
  generation_type: string;
  output: Record<string, unknown>;
  model: string;
  status: "draft" | "accepted" | "dismissed";
  created_at: string;
};

export default async function ProjectAiPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [project, data] = await Promise.all([
    getProjectContext(projectId),
    getOperationsProjectData(projectId)
  ]);
  if (!project) notFound();
  const drafts = data.aiDrafts as AiRow[];
  const latestMessages = (data.messages as Array<{ content: string }>).slice(0, 5);
  const defaultSource = latestMessages.map((message) => message.content).join("\n\n---\n\n");

  return (
    <div className="page">
      <PageHeader
        crumbs={[
          { label: "Projects", href: "/projects" },
          { label: project.name, href: `/projects/${projectId}` }
        ]}
        title="AI drafts"
        description="Extract, detect, compare, estimate, and draft, always with human review."
        actions={<Link className="button button-outline" href="/settings/ai">AI settings</Link>}
      />
      <ProjectTabs projectId={projectId} active="ai" />
      <div className="stack">
        <AiDraftPanel projectId={projectId} defaultSource={defaultSource} />
        <section className="panel" aria-labelledby="drafts-title">
          <div className="panel-head">
            <div>
              <h2 className="panel-title" id="drafts-title">Drafts for review</h2>
              <p className="panel-sub">{drafts.length} generated</p>
            </div>
          </div>
          {drafts.length ? (
            <div className="rows">
              {drafts.map((draft) => (
                <article key={draft.id} className="row" style={{ display: "block" }}>
                  <div className="cluster justify-between">
                    <div>
                      <p className="row-title capitalize">{draft.generation_type.replaceAll("_", " ")}</p>
                      <p className="row-sub">{draft.model} · {new Date(draft.created_at).toLocaleString()}</p>
                    </div>
                    <Status tone={draft.status === "accepted" ? "success" : draft.status === "dismissed" ? "danger" : "warning"}>{draft.status}</Status>
                  </div>
                  <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface-2)] p-4 text-xs leading-6">{JSON.stringify(draft.output, null, 2)}</pre>
                  {draft.status === "draft" ? (
                    <div className="cluster mt-3">
                      {(["accepted", "dismissed"] as const).map((status) => (
                        <form action={reviewAiDraft} key={status}>
                          <input type="hidden" name="projectId" value={projectId} />
                          <input type="hidden" name="generationId" value={draft.id} />
                          <input type="hidden" name="status" value={status} />
                          <button className={`button ${status === "accepted" ? "button-primary" : "button-outline"}`} type="submit">{status === "accepted" ? "Accept as reviewed draft" : "Dismiss"}</button>
                        </form>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="empty">
              <p className="empty-title">No AI drafts yet</p>
              <p className="empty-text">Pick a workflow above, paste the client text and create your first draft.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
