import { ArrowRight, Plus } from "lucide-react";
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
        eyebrow={project.name}
        title="Change orders"
        description="A versioned record of every extra-work price, approval, and payment."
        actions={
          <ButtonLink href={`/projects/${project.id}/change-orders/new`}>
            <Plus size={16} /> New order
          </ButtonLink>
        }
      />
      <ProjectTabs projectId={project.id} active="orders" />
      <section className="card mt-7">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/projects/${project.id}/change-orders/${order.id}`}
            className="group grid grid-cols-[110px_1fr_170px_170px_30px] items-center gap-4 border-b border-[var(--line)] p-7 last:border-0 hover:bg-[var(--paper-deep)]"
          >
            <div>
              <p className="font-display text-xl font-semibold">{order.number}</p>
              <p className="quiet mt-1 text-xs">
                {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(order.createdAt))}
              </p>
            </div>
            <div>
              <p className="font-semibold">{order.title}</p>
              <p className="quiet mt-1 text-sm">
                {order.timelineImpact} · {order.depositBasisPoints / 100}% deposit
              </p>
            </div>
            <p className="font-semibold">{formatMoney(order.amountMinor, order.currency)}</p>
            <Status tone={order.status === "paid" ? "success" : "warning"}>
              {order.status === "paid" ? "Paid" : "Deposit waiting"}
            </Status>
            <ArrowRight size={17} className="transition group-hover:translate-x-1" />
          </Link>
        ))}
      </section>
    </div>
  );
}
