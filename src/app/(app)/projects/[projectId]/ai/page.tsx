import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AiDraftPanel } from "@/components/ai-draft-panel";
import { AiResult } from "@/components/ai-result";
import { ProjectTabs } from "@/components/project-tabs";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import { reviewAiDraft } from "@/features/operations/actions";
import {
  getOperationsProjectData,
  getProjectContext
} from "@/features/operations/queries";

const draftTitle: Record<string, string> = {
  scope_check: "Scope check",
  scope_creep: "Scope check",
  scope_extraction: "Scope from a quote",
  request_detection: "Requests in the conversation",
  extra_work_estimate: "Extra work estimate",
  change_order: "Change order draft",
  payment_follow_up: "Payment reminder"
};

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
                      <p className="row-title">{draftTitle[draft.generation_type] ?? draft.generation_type.replaceAll("_", " ")}</p>
                      <p className="row-sub faint">{new Date(draft.created_at).toLocaleDateString("en", { weekday: "short", day: "numeric", month: "short" })}, from the latest client messages</p>
                    </div>
                    <Status tone={draft.status === "accepted" ? "success" : draft.status === "dismissed" ? "danger" : "warning"}>{draft.status}</Status>
                  </div>
                  <AiResult type={draft.generation_type} output={draft.output} projectId={projectId} currency={project.currency ?? "AED"}>
                    {draft.status === "draft"
                      ? (["accepted", "dismissed"] as const).map((status) => (
                          <form action={reviewAiDraft} key={status}>
                            <input type="hidden" name="projectId" value={projectId} />
                            <input type="hidden" name="generationId" value={draft.id} />
                            <input type="hidden" name="status" value={status} />
                            <button className={`button ${status === "accepted" ? "button-outline" : "button-ghost"}`} type="submit">{status === "accepted" ? "Mark as reviewed" : "Dismiss"}</button>
                          </form>
                        ))
                      : null}
                  </AiResult>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Draft your first reply" text="Pick a workflow above and paste the client's message. You get a draft to edit and send in seconds." focus="Start a draft" />
          )}
        </section>
      </div>
    </div>
  );
}
