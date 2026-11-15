import { Info } from "lucide-react";
import { notFound } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { createChangeRequest } from "@/features/core/actions";
import { getProjectView } from "@/features/core/queries";

export default async function NewChangeRequestPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProjectView(projectId);
  if (!project) notFound();

  return (
    <div className="page page-narrow">
      <PageHeader
        crumbs={[
          { label: "Projects", href: "/projects" },
          { label: project.name, href: `/projects/${project.id}` },
          { label: "Change requests", href: `/projects/${project.id}/requests` }
        ]}
        title="Record the request"
        description="Capture what the client asked for, where it came from, and which part of the scope it touches."
      />
      <form action={createChangeRequest} className="panel">
        <div className="panel-body stack">
          <input type="hidden" name="projectId" value={project.id} />
          <div className="field">
            <label className="field-label" htmlFor="title">Request title</label>
            <input id="title" className="input" name="title" required placeholder="Arabic localization" />
          </div>
          <div className="form-grid">
            <div className="field">
              <label className="field-label" htmlFor="requestType">Request type</label>
              <select id="requestType" className="select" name="requestType">
                <option value="new_request">New request</option>
                <option value="revision">Revision</option>
                <option value="approval">Approval</option>
                <option value="promise">Promise</option>
              </select>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="sourceType">Source</label>
              <select id="sourceType" className="select" name="sourceType">
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="meeting_note">Meeting note</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="sourceExcerpt">Client request</label>
            <textarea id="sourceExcerpt" className="textarea" name="sourceExcerpt" placeholder="Paste the relevant message or write a meeting note." />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="scopeItemId">Related scope item or exclusion</label>
            <select id="scopeItemId" className="select" name="scopeItemId" defaultValue="">
              <option value="">No linked scope item</option>
              <option>Arabic localization · Excluded</option>
              <option>Multi-currency checkout · Excluded</option>
              <option>Revision limit · 3 included</option>
            </select>
          </div>
          <p className="notice notice-info">
            <Info size={16} aria-hidden />
            <span>
              Evidence is optional. If you continue without a pasted message or
              note, the change order will show and record an evidence warning.
            </span>
          </p>
          <div className="form-actions justify-end border-t border-[var(--line)] pt-5">
            <ButtonLink href={`/projects/${project.id}/requests`} variant="outline">Cancel</ButtonLink>
            <Button type="submit">Save request</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
