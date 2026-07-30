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
        eyebrow={project.code}
        title="AI draft workspace"
        description="Extract, detect, compare, estimate, and draft—always with human review."
        actions={<Link className="button button-dark" href="/settings/ai">AI settings</Link>}
      />
      <ProjectTabs projectId={projectId} active="ai" />
      <div className="mt-8">
        <AiDraftPanel projectId={projectId} defaultSource={defaultSource} />
      </div>
      <section className="mt-6 space-y-4">
        {drafts.map((draft) => (
          <article key={draft.id} className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow">{draft.generation_type.replaceAll("_", " ")}</p>
                <p className="quiet mt-2 text-xs">{draft.model} · {new Date(draft.created_at).toLocaleString()}</p>
              </div>
              <Status tone={draft.status === "accepted" ? "success" : draft.status === "dismissed" ? "danger" : "warning"}>{draft.status}</Status>
            </div>
            <pre className="mt-5 max-h-96 overflow-auto whitespace-pre-wrap border border-[var(--line)] bg-[var(--paper-deep)] p-4 text-xs leading-6">{JSON.stringify(draft.output, null, 2)}</pre>
            {draft.status === "draft" ? (
              <div className="mt-4 flex gap-3">
                {(["accepted", "dismissed"] as const).map((status) => (
                  <form action={reviewAiDraft} key={status}>
                    <input type="hidden" name="projectId" value={projectId} />
                    <input type="hidden" name="generationId" value={draft.id} />
                    <input type="hidden" name="status" value={status} />
                    <button className={`button ${status === "accepted" ? "button-primary" : "button-dark"}`} type="submit">{status === "accepted" ? "Accept as reviewed draft" : "Dismiss"}</button>
                  </form>
                ))}
              </div>
            ) : null}
          </article>
        ))}
        {!drafts.length ? <div className="card p-10 text-center quiet">No AI drafts yet.</div> : null}
      </section>
    </div>
  );
}
