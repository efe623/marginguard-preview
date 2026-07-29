import { FileText, Image } from "lucide-react";
import { notFound } from "next/navigation";
import { FileUploadButton } from "@/components/file-upload-button";
import { ProjectTabs } from "@/components/project-tabs";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import { getProjectView } from "@/features/core/queries";
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

  const supabase = await createClient();
  const { data: files } = await supabase
    .from("project_files")
    .select("id, original_name, content_type, size_bytes, kind, scan_status, created_at")
    .eq("project_id", project.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="page">
      <PageHeader
        eyebrow={project.name}
        title="Files"
        description="Private agreements and evidence. Every stored upload stays quarantined until its security scan passes."
        actions={<FileUploadButton projectId={project.id} />}
      />
      <ProjectTabs projectId={project.id} active="files" />
      <section className="card mt-7">
        {(files ?? []).map((file) => {
          const Icon = file.content_type.startsWith("image/") ? Image : FileText;
          const tone =
            file.scan_status === "clean"
              ? "success"
              : file.scan_status === "rejected" || file.scan_status === "failed"
                ? "danger"
                : "warning";
          return (
            <div
              key={file.id}
              className="grid gap-4 border-b border-[var(--line)] p-6 last:border-0 sm:grid-cols-[44px_1fr] sm:items-center lg:grid-cols-[44px_1fr_180px_150px]"
            >
              <span className="grid size-11 place-items-center border border-[var(--line)]">
                <Icon size={20} />
              </span>
              <div>
                <p className="break-all font-semibold">{file.original_name}</p>
                <p className="quiet mt-1 text-xs">{formatBytes(Number(file.size_bytes))}</p>
              </div>
              <p className="quiet text-sm capitalize">{file.kind}</p>
              <Status tone={tone}>{file.scan_status.replaceAll("_", " ")}</Status>
            </div>
          );
        })}
        {!files?.length ? <p className="quiet p-7">No project files yet.</p> : null}
      </section>
      <p className="quiet mt-5 text-sm">
        Allowed: PDF, PNG, JPEG, WebP, DOCX, and TXT · Maximum 20 MB per stored file
      </p>
    </div>
  );
}
