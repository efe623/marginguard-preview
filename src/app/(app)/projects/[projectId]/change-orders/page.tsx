import { ChevronRight, FilePlus2, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectTabs } from "@/components/project-tabs";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import { getProjectView, listChangeOrderViews } from "@/features/core/queries";
import { formatMoney } from "@/lib/money";

export default async function ChangeOrdersPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProjectView(projectId);
  if (!project) notFound();
  const orders = await listChangeOrderViews(projectId);

  return (
    <div className="page">
      <PageHeader
        crumbs={[
          { label: "Projects", href: "/projects" },
          { label: project.name, href: `/projects/${project.id}` }
        ]}
        title="Change orders"
        description="A versioned record of every extra-work price, approval, and payment."
        actions={
          <ButtonLink href={`/projects/${project.id}/change-orders/new`}>
            <Plus size={16} aria-hidden /> New order
          </ButtonLink>
        }
      />
      <ProjectTabs projectId={project.id} active="orders" />
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">All change orders</h2>
            <p className="panel-sub">{orders.length} {orders.length === 1 ? "order" : "orders"} on this project</p>
          </div>
        </div>
        {orders.length ? (
          <div className="rows">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/projects/${project.id}/change-orders/${order.id}`}
                className="row"
              >
                <span className="row-lead"><FilePlus2 size={18} aria-hidden /></span>
                <div className="row-main">
                  <p className="row-title">
                    <span className="num faint mr-2">{order.number}</span>
                    {order.title}
                  </p>
                  <p className="row-sub">
                    {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(order.createdAt))}
                    {" · "}
                    {order.timelineImpact} · {order.depositBasisPoints / 100}% deposit
                  </p>
                </div>
                <div className="row-end">
                  <span className="num font-semibold">{formatMoney(order.amountMinor, order.currency)}</span>
                  <Status tone={order.status === "paid" ? "success" : "warning"}>
                    {order.status === "paid" ? "Paid" : "Deposit waiting"}
                  </Status>
                  <ChevronRight size={16} aria-hidden className="faint" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty" data-art="tasks">
            <p className="empty-title">No change orders yet</p>
            <p className="empty-text">When the client asks for work outside the scope, price it here and send it for approval.</p>
            <ButtonLink href={`/projects/${project.id}/change-orders/new`}>New order</ButtonLink>
          </div>
        )}
      </section>
    </div>
  );
}
