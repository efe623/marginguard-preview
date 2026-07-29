import { MessageSquareText, Send } from "lucide-react";
import { notFound } from "next/navigation";
import { ProjectTabs } from "@/components/project-tabs";
import { PageHeader } from "@/components/ui/page-header";
import {
  createProjectUpdate,
  importClientMessage
} from "@/features/operations/actions";
import {
  getOperationsProjectData,
  getProjectContext
} from "@/features/operations/queries";

type MessageRow = {
  id: string;
  source_type: string;
  sender_name: string | null;
  sender_address: string | null;
  content: string;
  occurred_at: string | null;
  created_at: string;
};
type UpdateRow = {
  id: string;
  title: string;
  body: string;
  visible_to_client: boolean;
  created_at: string;
};

export default async function ProjectMessagesPage({
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
  const messages = data.messages as MessageRow[];
  const updates = data.updates as UpdateRow[];

  return (
    <div>
      <PageHeader
        eyebrow={project.code}
        title="Messages and updates"
        description="Paste WhatsApp, email, or meeting notes and keep a clean evidence trail."
      />
      <ProjectTabs projectId={projectId} active="messages" />
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="card p-6">
          <h2 className="section-title flex items-center gap-2"><MessageSquareText size={20} /> Import client message</h2>
          <form action={importClientMessage} className="mt-5 space-y-4">
            <input type="hidden" name="projectId" value={projectId} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label><span className="field-label">Source</span><select className="input" name="sourceType" defaultValue="whatsapp"><option value="whatsapp">WhatsApp paste</option><option value="email">Email paste</option><option value="meeting_note">Meeting note</option><option value="other">Other</option></select></label>
              <label><span className="field-label">When</span><input className="input" name="occurredAt" type="datetime-local" /></label>
              <label><span className="field-label">Sender</span><input className="input" name="senderName" placeholder="Client name" /></label>
              <label><span className="field-label">Email or phone</span><input className="input" name="senderAddress" /></label>
            </div>
            <label><span className="field-label">Message</span><textarea className="input min-h-48" name="content" required placeholder="Paste the original message exactly as received…" /></label>
            <button className="button button-primary" type="submit">Save message</button>
          </form>
          <div className="mt-6 space-y-4 border-t border-[var(--line)] pt-5">
            {messages.map((message) => (
              <article key={message.id} className="border border-[var(--line)] p-4">
                <div className="flex justify-between gap-4 text-xs uppercase tracking-wide">
                  <strong>{message.source_type.replace("_", " ")}</strong>
                  <span className="quiet">{new Date(message.occurred_at ?? message.created_at).toLocaleString()}</span>
                </div>
                <p className="quiet mt-2 text-sm">{message.sender_name || "Unknown sender"}{message.sender_address ? ` · ${message.sender_address}` : ""}</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="card p-6">
          <h2 className="section-title flex items-center gap-2"><Send size={20} /> Project update</h2>
          <form action={createProjectUpdate} className="mt-5 space-y-4">
            <input type="hidden" name="projectId" value={projectId} />
            <label><span className="field-label">Title</span><input className="input" name="title" required /></label>
            <label><span className="field-label">Update</span><textarea className="input min-h-32" name="body" required /></label>
            <label className="flex gap-2 text-sm"><input name="visibleToClient" type="checkbox" /> Show in the client portal</label>
            <button className="button button-primary" type="submit">Publish update</button>
          </form>
          <div className="mt-6 space-y-4 border-t border-[var(--line)] pt-5">
            {updates.map((update) => (
              <article key={update.id} className="border border-[var(--line)] p-4">
                <div className="flex justify-between gap-4"><h3 className="font-semibold">{update.title}</h3><span className="quiet text-xs">{update.visible_to_client ? "Client visible" : "Internal"}</span></div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{update.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
