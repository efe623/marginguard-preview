import { Eye, EyeOff } from "lucide-react";
import { notFound } from "next/navigation";
import { ProjectTabs } from "@/components/project-tabs";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
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
  const crumbs = [
    { label: "Projects", href: "/projects" },
    { label: project.name, href: `/projects/${projectId}` }
  ];

  return (
    <div className="page">
      <PageHeader
        crumbs={crumbs}
        title="Messages and updates"
        description="Paste WhatsApp, email, or meeting notes and keep a clean evidence trail."
      />
      <ProjectTabs projectId={projectId} active="messages" />
      <div className="split">
        <div className="stack">
          <section className="panel" aria-labelledby="thread-title">
            <div className="panel-head">
              <div>
                <h2 className="panel-title" id="thread-title">Client messages</h2>
                <p className="panel-sub">{messages.length} saved</p>
              </div>
            </div>
            {messages.length ? (
              <div className="rows">
                {messages.map((message) => (
                  <article key={message.id} className="row" style={{ display: "block" }}>
                    <div className="cluster justify-between">
                      <p className="row-title">
                        {message.sender_name || "Unknown sender"}
                        {message.sender_address ? <span className="quiet font-normal"> · {message.sender_address}</span> : null}
                      </p>
                      <p className="meta">
                        <span className="capitalize">{message.source_type.replace("_", " ")}</span>
                        {" · "}
                        <time dateTime={message.occurred_at ?? message.created_at}>
                          {new Date(message.occurred_at ?? message.created_at).toLocaleString()}
                        </time>
                      </p>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-[0.9375rem] leading-6">{message.content}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty">
                <p className="empty-title">No messages saved</p>
                <p className="empty-text">Paste the original client message below to keep it as evidence.</p>
              </div>
            )}
          </section>

          <form action={importClientMessage} className="panel">
            <div className="panel-head"><h2 className="panel-title">Save a client message</h2></div>
            <div className="panel-body stack">
              <input type="hidden" name="projectId" value={projectId} />
              <div className="form-grid">
                <div className="field">
                  <label className="field-label" htmlFor="msg-source">Source</label>
                  <select id="msg-source" className="select" name="sourceType" defaultValue="whatsapp">
                    <option value="whatsapp">WhatsApp paste</option><option value="email">Email paste</option>
                    <option value="meeting_note">Meeting note</option><option value="other">Other</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="msg-when">When</label>
                  <input id="msg-when" className="input" name="occurredAt" type="datetime-local" />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="msg-sender">Sender</label>
                  <input id="msg-sender" className="input" name="senderName" placeholder="Client name" />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="msg-address">Email or phone</label>
                  <input id="msg-address" className="input" name="senderAddress" />
                </div>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="msg-content">Message</label>
                <textarea id="msg-content" className="textarea min-h-40" name="content" required placeholder="Paste the original message exactly as received…" />
              </div>
              <div className="form-actions"><Button type="submit">Save message</Button></div>
            </div>
          </form>
        </div>

        <div className="stack">
          <section className="panel" aria-labelledby="updates-title">
            <div className="panel-head">
              <div>
                <h2 className="panel-title" id="updates-title">Project updates</h2>
                <p className="panel-sub">{updates.length} posted</p>
              </div>
            </div>
            {updates.length ? (
              <div className="rows">
                {updates.map((update) => (
                  <article key={update.id} className="row" style={{ display: "block" }}>
                    <div className="cluster justify-between">
                      <p className="row-title">{update.title}</p>
                      <Status tone={update.visible_to_client ? "success" : "neutral"}>
                        {update.visible_to_client ? <Eye size={12} aria-hidden="true" /> : <EyeOff size={12} aria-hidden="true" />}
                        {update.visible_to_client ? "Client visible" : "Internal"}
                      </Status>
                    </div>
                    <p className="meta mt-1"><time dateTime={update.created_at}>{new Date(update.created_at).toLocaleString()}</time></p>
                    <p className="mt-2 whitespace-pre-wrap text-[0.9375rem] leading-6">{update.body}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty">
                <p className="empty-title">No updates yet</p>
                <p className="empty-text">Publish an update below to keep the team, and optionally the client, informed.</p>
              </div>
            )}
          </section>

          <form action={createProjectUpdate} className="panel">
            <div className="panel-head"><h2 className="panel-title">Post an update</h2></div>
            <div className="panel-body stack">
              <input type="hidden" name="projectId" value={projectId} />
              <div className="field">
                <label className="field-label" htmlFor="upd-title">Title</label>
                <input id="upd-title" className="input" name="title" required />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="upd-body">Update</label>
                <textarea id="upd-body" className="textarea" name="body" required />
              </div>
              <label className="check"><input name="visibleToClient" type="checkbox" /> Show in the client portal</label>
              <div className="form-actions"><Button type="submit">Publish update</Button></div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
