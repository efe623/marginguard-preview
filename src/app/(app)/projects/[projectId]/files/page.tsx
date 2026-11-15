import { FileText, Image, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { FileUploadButton } from "@/components/file-upload-button";
import { ProjectTabs } from "@/components/project-tabs";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import { getProjectView } from "@/features/core/queries";
import { buildPreviewFiles } from "@/data/preview-data";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export default async function ProjectFilesPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProjectView(projectId);
  if (!project) notFound();

  const files = isSupabaseConfigured
    ? (
        await (await createClient())
          .from("project_files")
          .select("id, original_name, content_type, size_bytes, kind, scan_status, created_at")
          .eq("project_id", project.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
      ).data
    : buildPreviewFiles(project.id);

  return (
    <div className="page">
      <PageHeader
        crumbs={[
          { label: "Projects", href: "/projects" },
          { label: project.name, href: `/projects/${project.id}` }
        ]}
        title="Files"
        description="Private agreements and evidence. Every stored upload stays quarantined until its security scan passes."
        actions={<FileUploadButton projectId={project.id} />}
      />
      <ProjectTabs projectId={project.id} active="files" />
      <div className="stack">
        <section className="panel" aria-labelledby="files-title">
          <div className="panel-head">
            <div>
              <h2 className="panel-title" id="files-title">Project files</h2>
              <p className="panel-sub">{files?.length ?? 0} stored</p>
            </div>
          </div>
          {files?.length ? (
            <div className="rows">
              {files.map((file) => {
                const Icon = file.content_type.startsWith("image/") ? Image : FileText;
                const tone =
                  file.scan_status === "clean"
                    ? "success"
                    : file.scan_status === "rejected" || file.scan_status === "failed"
                      ? "danger"
                      : "warning";
                return (
                  <div key={file.id} className="row">
                    <span className="row-lead"><Icon size={18} aria-hidden="true" /></span>
                    <div className="row-main">
                      <p className="row-title">{file.original_name}</p>
                      <p className="row-sub"><span className="capitalize">{file.kind}</span> · {formatBytes(Number(file.size_bytes))}</p>
                    </div>
                    <div className="row-end">
                      <Status tone={tone}>{file.scan_status.replaceAll("_", " ")}</Status>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty" data-art="files">
              <p className="empty-title">No project files yet</p>
              <p className="empty-text">Choose a file purpose and use Upload file to add the contract, quote or receipts.</p>
            </div>
          )}
        </section>
        <p className="notice notice-info">
          <ShieldCheck size={18} aria-hidden="true" />
          <span>Allowed: PDF, PNG, JPEG, WebP, DOCX, and TXT. Maximum 20 MB per stored file.</span>
        </p>
      </div>
    </div>
  );
}
