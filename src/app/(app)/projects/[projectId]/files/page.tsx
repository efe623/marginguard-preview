import { FileText, Image } from "lucide-react";
import { notFound } from "next/navigation";
import { ProjectTabs } from "@/components/project-tabs";
import { FileUploadButton } from "@/components/file-upload-button";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import { getProjectView } from "@/features/core/queries";

export default async function ProjectFilesPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProjectView(projectId);
  if (!project) notFound();

  return (
    <div className="page">
      <PageHeader
        eyebrow={project.name}
        title="Files"
        description="Private supporting agreements and evidence. Every upload is quarantined until its security scan passes."
        actions={<FileUploadButton projectId={project.id} />}
      />
      <ProjectTabs projectId={project.id} active="files" />
      <section className="card mt-7">
        {[
          ["Client-quote-v3.pdf", "PDF · 2.4 MB", "Agreement", FileText],
          ["approval-email-export.txt", "Text · 18 KB", "Change request evidence", FileText],
          ["product-reference.webp", "WebP · 1.2 MB", "Reference", Image]
        ].map(([name, meta, purpose, Icon]) => (
          <div key={String(name)} className="grid grid-cols-[44px_1fr_220px_150px] items-center gap-4 border-b border-[var(--line)] p-6 last:border-0">
            <span className="grid size-11 place-items-center border border-[var(--line)]">
              <Icon size={20} />
            </span>
            <div>
              <p className="font-semibold">{String(name)}</p>
              <p className="quiet mt-1 text-xs">{String(meta)}</p>
            </div>
            <p className="quiet text-sm">{String(purpose)}</p>
            <Status tone="success">Scan passed</Status>
          </div>
        ))}
      </section>
      <p className="quiet mt-5 text-sm">
        Allowed: PDF, PNG, JPEG, WebP, DOCX, and TXT · Maximum 20 MB per file
      </p>
    </div>
  );
}
