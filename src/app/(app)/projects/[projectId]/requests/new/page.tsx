import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
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
    <div className="page max-w-5xl">
      <Link
        href={`/projects/${project.id}/requests`}
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold hover:text-[var(--signal)]"
      >
        <ArrowLeft size={16} /> Back to change requests
      </Link>
      <p className="eyebrow mb-4">{project.name}</p>
      <h1 className="page-title">Record the request.</h1>
      <form action={createChangeRequest} className="card mt-10 grid grid-cols-2 gap-6 p-8">
        <input type="hidden" name="projectId" value={project.id} />
        <label className="col-span-2">
          <span className="field-label">Request title</span>
          <input className="input" name="title" required placeholder="Arabic localization" />
        </label>
        <label>
          <span className="field-label">Request type</span>
          <select className="select" name="requestType">
            <option value="new_request">New request</option>
            <option value="revision">Revision</option>
            <option value="approval">Approval</option>
            <option value="promise">Promise</option>
          </select>
        </label>
        <label>
          <span className="field-label">Source</span>
          <select className="select" name="sourceType">
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="meeting_note">Meeting note</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="col-span-2">
          <span className="field-label">Client request</span>
          <textarea className="textarea" name="sourceExcerpt" placeholder="Paste the relevant message or write a meeting note." />
        </label>
        <label className="col-span-2">
          <span className="field-label">Related scope item or exclusion</span>
          <select className="select" name="scopeItemId" defaultValue="">
            <option value="">No linked scope item</option>
            <option>Arabic localization · Excluded</option>
            <option>Multi-currency checkout · Excluded</option>
            <option>Revision limit · 3 included</option>
          </select>
        </label>
        <div className="col-span-2 flex gap-3 border border-[#c08c00] bg-[#fff4c8] p-4 text-sm leading-6">
          <Info className="mt-0.5 shrink-0 text-[#8a6200]" size={18} />
          Evidence is optional. If you continue without a pasted message or
          note, the Change Order will show and record an evidence warning.
        </div>
        <div className="col-span-2 flex justify-end gap-3 border-t border-[var(--line)] pt-6">
          <Button type="submit">Save request</Button>
        </div>
      </form>
    </div>
  );
}
