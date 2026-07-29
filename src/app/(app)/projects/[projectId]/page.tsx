import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  FileClock,
  WalletCards
} from "lucide-react";
import { notFound } from "next/navigation";
import { ProjectTabs } from "@/components/project-tabs";
import { ProjectAssignmentPanel } from "@/components/project-assignment-panel";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import { getProjectView, listChangeOrderViews } from "@/features/core/queries";
import { formatMoney } from "@/lib/money";

export default async function ProjectPage({
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
        eyebrow={`${project.clientName} · ${project.code}`}
        title={project.name}
        actions={
          <>
            <ButtonLink href={`/projects/${project.id}/scope`} variant="outline">
              View scope
            </ButtonLink>
            <ButtonLink href={`/projects/${project.id}/change-orders/new`}>
              New change order
            </ButtonLink>
          </>
        }
      />

      <div className="mt-7 flex gap-10">
        <div>
          <p className="eyebrow">Original quote</p>
          <p className="mt-2 text-xl font-semibold">
            {formatMoney(project.quoteMinor, project.currency)}
          </p>
        </div>
        <div>
          <p className="eyebrow">Approved extras</p>
          <p className="signal mt-2 text-xl font-semibold">
            {formatMoney(project.approvedExtrasMinor, project.currency)}
          </p>
        </div>
        <div>
          <p className="eyebrow">Included revisions</p>
          <p className="mt-2 text-xl font-semibold">
            {project.revisionUsed} of {project.revisionLimit} used
          </p>
        </div>
        <div>
          <p className="eyebrow">Control state</p>
          <div className="mt-2">
            <Status tone="warning">Awaiting deposit</Status>
          </div>
        </div>
      </div>

      <ProjectTabs projectId={project.id} active="overview" />

      <div className="mt-7 grid grid-cols-[1.45fr_0.75fr] gap-6">
        <section className="card border-l-[4px] border-l-[var(--signal)] p-7">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <CircleAlert className="mt-1 text-[var(--signal)]" size={25} />
              <div>
                <p className="eyebrow">Action required</p>
                <h2 className="section-title mt-2">Approved. Deposit not confirmed.</h2>
                <p className="quiet mt-3 max-w-2xl leading-7">
                  Arabic localization was approved by the client. Do not begin
                  work until the required deposit is confirmed by Stripe or
                  recorded as an external payment.
                </p>
              </div>
            </div>
            <Status tone="warning">Not authorized</Status>
          </div>
          <div className="mt-7 flex gap-3 pl-10">
            <ButtonLink href="/projects/ecommerce-redesign/change-orders/co-004">
              Review payment <ArrowRight size={15} />
            </ButtonLink>
            <ButtonLink href="/projects/ecommerce-redesign/change-orders/co-004" variant="outline">
              Record external deposit
            </ButtonLink>
          </div>
        </section>

        <aside className="card p-7">
          <p className="eyebrow">Scope control</p>
          <div className="mt-7 flex items-end justify-between">
            <span className="font-display text-6xl font-semibold">
              {project.revisionUsed}
            </span>
            <span className="quiet pb-2 text-sm">of {project.revisionLimit} used</span>
          </div>
          <div className="mt-4 h-2 bg-[var(--line)]">
            <div className="h-full w-full bg-[var(--warning)]" />
          </div>
          <p className="quiet mt-4 text-sm leading-6">
            The next revision requires a Change Request or a controlled override.
          </p>
        </aside>
      </div>

      <section className="card mt-6">
        <div className="flex items-end justify-between border-b border-[var(--line)] p-7">
          <div>
            <p className="eyebrow mb-3">Commercial record</p>
            <h2 className="section-title">Change orders</h2>
          </div>
          <ButtonLink href={`/projects/${project.id}/change-orders`} variant="outline">
            View all
          </ButtonLink>
        </div>
        {orders.map((order) => (
          <div
            key={order.id}
            className="grid grid-cols-[40px_1fr_150px_160px] items-center gap-4 border-b border-[var(--line)] px-7 py-5 last:border-0"
          >
            {order.status === "paid" ? (
              <CircleCheck size={20} className="text-[var(--success)]" />
            ) : (
              <FileClock size={20} className="text-[var(--warning)]" />
            )}
            <div>
              <p className="font-semibold">{order.title}</p>
              <p className="quiet mt-1 text-xs">{order.number} · {order.timelineImpact}</p>
            </div>
            <p className="font-semibold">{formatMoney(order.amountMinor, order.currency)}</p>
            <Status tone={order.status === "paid" ? "success" : "warning"}>
              {order.status === "paid" ? "Paid" : "Deposit waiting"}
            </Status>
          </div>
        ))}
      </section>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="card flex gap-4 p-6">
          <WalletCards size={22} />
          <div>
            <p className="font-semibold">Payment handling</p>
            <p className="quiet mt-1 text-sm">Stripe disconnected · manual confirmation available</p>
          </div>
        </div>
        <div className="card flex gap-4 p-6">
          <CircleCheck size={22} className="text-[var(--success)]" />
          <div>
            <p className="font-semibold">Structured scope confirmed</p>
            <p className="quiet mt-1 text-sm">Last version signed off 18 July 2026</p>
          </div>
        </div>
      </div>
      <ProjectAssignmentPanel projectId={project.id} />
    </div>
  );
}
