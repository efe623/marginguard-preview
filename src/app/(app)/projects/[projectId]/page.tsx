import { ArrowRight, CircleAlert, CircleCheck, FileClock, ShieldCheck, WalletCards } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectTabs } from "@/components/project-tabs";
import { ProjectAssignmentPanel } from "@/components/project-assignment-panel";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import { getProjectView, listChangeOrderViews } from "@/features/core/queries";
import { formatMoney } from "@/lib/money";
import type { ProjectStatus } from "@/types/domain";

const statusLabels: Record<ProjectStatus, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  active: { label: "Active", tone: "neutral" },
  awaiting_approval: { label: "Awaiting approval", tone: "warning" },
  awaiting_deposit: { label: "Awaiting deposit", tone: "warning" },
  authorized: { label: "Authorized", tone: "success" },
  completed: { label: "Completed", tone: "success" }
};

const orderStatus = (status: string): { label: string; tone: "success" | "warning" | "danger" | "neutral" } => {
  if (status === "paid") return { label: "Paid", tone: "success" };
  if (status === "authorized" || status === "balance_due") return { label: "Authorized", tone: "success" };
  if (status === "approved" || status === "awaiting_deposit") return { label: "Deposit waiting", tone: "warning" };
  if (status === "declined" || status === "void") return { label: "Declined", tone: "danger" };
  return { label: "Awaiting client", tone: "neutral" };
};

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await getProjectView(projectId);
  if (!project) notFound();
  const orders = await listChangeOrderViews(projectId);
  const status = statusLabels[project.status];
  const full = project.revisionUsed >= project.revisionLimit;
  const waiting = orders.find((order) => order.status === "approved" || order.status === "awaiting_deposit");

  return (
    <div className="page">
      <PageHeader
        crumbs={[{ label: "Projects", href: "/projects" }, { label: project.clientName }]}
        title={project.name}
        actions={
          <>
            <ButtonLink href={`/projects/${project.id}/scope`} variant="outline">View scope</ButtonLink>
            <ButtonLink href={`/projects/${project.id}/change-orders/new`}>New change order</ButtonLink>
          </>
        }
      />

      <ProjectTabs projectId={project.id} active="overview" />

      <div className="split">
        <div className="stack">
          {waiting ? (
            <section className="panel" aria-labelledby="next-step">
              <div className="panel-head">
                <div className="cluster">
                  <CircleAlert size={20} className="signal" aria-hidden />
                  <h2 id="next-step" className="panel-title">Approved. Deposit not confirmed.</h2>
                </div>
                <Status tone="warning">Not authorized</Status>
              </div>
              <div className="panel-body">
                <p className="quiet" style={{ maxWidth: "62ch" }}>
                  {waiting.title} was approved by the client. Do not begin work until the required deposit is confirmed by
                  Stripe or recorded as an external payment.
                </p>
                <div className="form-actions" style={{ marginTop: 16 }}>
                  <ButtonLink href={`/projects/${project.id}/change-orders/${waiting.id}`}>
                    Review payment <ArrowRight size={15} aria-hidden />
                  </ButtonLink>
                  <ButtonLink href={`/projects/${project.id}/change-orders/${waiting.id}`} variant="outline">
                    Record external deposit
                  </ButtonLink>
                </div>
              </div>
            </section>
          ) : (
            <section className="panel">
              <div className="empty" data-art="clear">
                <CircleCheck size={22} className="signal" aria-hidden />
                <p className="empty-title">Nothing is waiting on you</p>
                <p className="empty-text">No approved change is waiting on a deposit. Create a change order when the client asks for something outside the scope.</p>
              </div>
            </section>
          )}

          <section className="panel" aria-labelledby="orders">
            <div className="panel-head">
              <div>
                <h2 id="orders" className="panel-title">Change orders</h2>
                <p className="panel-sub">Every priced change and where it stands.</p>
              </div>
              <ButtonLink href={`/projects/${project.id}/change-orders`} variant="outline" className="button-sm">View all</ButtonLink>
            </div>
            {orders.length ? (
              <div className="rows">
                {orders.map((order) => {
                  const state = orderStatus(order.status);
                  return (
                    <Link key={order.id} href={`/projects/${project.id}/change-orders/${order.id}`} className="row">
                      <span className="row-lead">
                        {order.status === "paid" ? <CircleCheck size={19} aria-hidden style={{ color: "var(--success)" }} /> : <FileClock size={19} aria-hidden style={{ color: "var(--warning)" }} />}
                      </span>
                      <div className="row-main">
                        <p className="row-title">{order.title}</p>
                        <p className="row-sub">{order.number} · {order.timelineImpact}</p>
                      </div>
                      <div className="row-end">
                        <span className="num font-semibold">{formatMoney(order.amountMinor, order.currency)}</span>
                        <Status tone={state.tone}>{state.label}</Status>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="empty" data-art="tasks">
                <p className="empty-title">No change orders yet</p>
                <p className="empty-text">When the client asks for extra work, price it here so it is approved and paid before it starts.</p>
                <ButtonLink href={`/projects/${project.id}/change-orders/new`}>New change order</ButtonLink>
              </div>
            )}
          </section>

          <ProjectAssignmentPanel projectId={project.id} />
        </div>

        <aside className="stack" aria-label="Project summary">
          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Contract</h2>
              <Status tone={status.tone}>{status.label}</Status>
            </div>
            <div className="panel-body">
              <dl className="ledger">
                <div className="ledger-line"><dt className="ledger-label">Original quote</dt><dd className="ledger-value">{formatMoney(project.quoteMinor, project.currency)}</dd></div>
                <div className="ledger-line"><dt className="ledger-label">Approved extras</dt><dd className="ledger-value">{formatMoney(project.approvedExtrasMinor, project.currency)}</dd></div>
                <div className="ledger-line is-total"><dt className="ledger-label">Contract value</dt><dd className="ledger-value">{formatMoney(project.quoteMinor + project.approvedExtrasMinor, project.currency)}</dd></div>
              </dl>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Revisions</h2>
              <span className="meta">{project.revisionUsed} of {project.revisionLimit} used</span>
            </div>
            <div className="panel-body">
              <span className={`pips ${full ? "is-full" : ""}`} role="img" aria-label={`${project.revisionUsed} of ${project.revisionLimit} revisions used`}>
                {Array.from({ length: project.revisionLimit }).map((_, index) => (
                  <i key={index} className={index < project.revisionUsed ? "on" : ""} />
                ))}
              </span>
              <p className="meta" style={{ marginTop: 10 }}>
                {full
                  ? "All included revisions are used. The next one needs a change request or a controlled override."
                  : `${project.revisionLimit - project.revisionUsed} included ${project.revisionLimit - project.revisionUsed === 1 ? "revision" : "revisions"} left before a change request is needed.`}
              </p>
            </div>
          </section>

          <section className="panel">
            <div className="rows">
              <div className="row">
                <span className="row-lead"><WalletCards size={18} aria-hidden /></span>
                <div className="row-main">
                  <p className="row-title">Payment handling</p>
                  <p className="row-sub">Stripe disconnected · manual confirmation available</p>
                </div>
              </div>
              <div className="row">
                <span className="row-lead"><ShieldCheck size={18} aria-hidden style={{ color: "var(--success)" }} /></span>
                <div className="row-main">
                  <p className="row-title">Structured scope confirmed</p>
                  <p className="row-sub">Last version signed off 18 July 2026</p>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
