import { notFound } from "next/navigation";
import { ChangeOrderEditor } from "@/components/change-order-editor";
import { PageHeader } from "@/components/ui/page-header";
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
    <div className="page">
      <PageHeader
        crumbs={[
          { label: "Projects", href: "/projects" },
          { label: project.name, href: `/projects/${project.id}` },
          { label: "Change orders", href: `/projects/${project.id}/change-orders` }
        ]}
        title="New change order"
        description="Describe the extra work and set the price. The document preview updates as you type."
      />
      <ChangeOrderEditor
        projectId={project.id}
        projectName={project.name}
        currency={project.currency}
      />
    </div>
  );
}
