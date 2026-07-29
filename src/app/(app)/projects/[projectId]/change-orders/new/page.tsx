import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChangeOrderEditor } from "@/components/change-order-editor";
import { getProjectView } from "@/features/core/queries";

export default async function NewChangeOrderPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProjectView(projectId);
  if (!project) notFound();

  return (
    <div className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <Link href={`/projects/${project.id}/change-orders`} className="inline-flex items-center gap-2 text-sm font-semibold hover:text-[var(--signal)]">
          <ArrowLeft size={16} /> Change orders
        </Link>
        <p className="quiet text-sm">{project.name}</p>
      </div>
      <ChangeOrderEditor
        projectId={project.id}
        projectName={project.name}
        currency={project.currency}
      />
    </div>
  );
}
