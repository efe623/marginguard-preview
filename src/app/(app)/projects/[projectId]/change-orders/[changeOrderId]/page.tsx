import { Check, Clock3, FileText, MailCheck, Hourglass } from "lucide-react";
import { notFound } from "next/navigation";
import { PaymentActions } from "@/components/payment-actions";
import { Button } from "@/components/ui/button";
import { ProjectTabs } from "@/components/project-tabs";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import {
  getChangeOrderView,
  getPendingPaymentRequestId,
  getProjectView
} from "@/features/core/queries";
import { formatMoney } from "@/lib/money";

export default async function ChangeOrderPage({
  params
}: {
  params: Promise<{ projectId: string; changeOrderId: string }>;
}) {
  const { projectId, changeOrderId } = await params;
  const [project, order] = await Promise.all([
    getProjectView(projectId),
    getChangeOrderView(changeOrderId, projectId)
  ]);
  if (!project || !order) notFound();
  const paymentRequestId = await getPendingPaymentRequestId(order.id);
  const deposit = Math.round((order.amountMinor * order.depositBasisPoints) / 10000);
  const balance = order.amountMinor - deposit;

  const trail = [
    {
      icon: Check,
      title: "Change order sent",
      detail: "Sent by Alex Morgan · 29 Jul, 10:14",
      state: "complete"
    },
    {
      icon: MailCheck,
      title: "Client email verified",
      detail: "contact@sparkretail.example · 29 Jul, 10:28",
      state: "complete"
    },
    {
      icon: Check,
      title: "Client approved version 1",
      detail: "Document hash 93d2…8aa1 · 29 Jul, 10:29",
      state: "complete"
    },
    {
      icon: Clock3,
      title: "Deposit confirmation",
      detail: `${formatMoney(deposit, order.currency)} required before work begins`,
      state: "waiting"
    }
  ];

  return (
    <div className="page">
      <PageHeader
        crumbs={[
          { label: "Projects", href: "/projects" },
          { label: project.name, href: `/projects/${project.id}` },
          { label: "Change orders", href: `/projects/${project.id}/change-orders` }
        ]}
        title={`${order.number} · ${order.title}`}
        description="The client approved this version. Work remains blocked until the required deposit is confirmed."
        actions={<Status tone="warning">Approved · unpaid</Status>}
      />

      <ProjectTabs projectId={project.id} active="orders" />

      <div className="stack">
        <p className="notice notice-warn">
          <Hourglass size={16} aria-hidden />
          <span>
            <strong>Next step: confirm the deposit.</strong>{" "}
            You need to record the {formatMoney(deposit, order.currency)} deposit before work on this change order can begin.
          </span>
        </p>

        <div className="split">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Proof trail</h2>
                <p className="panel-sub">Version 1, locked. Any later change needs a new version.</p>
              </div>
            </div>
            <ol className="rows">
              {trail.map(({ icon: Icon, title, detail, state }) => (
                <li key={title} className="row">
                  <span className={`row-lead ${state === "complete" ? "text-[var(--success)]" : "text-[var(--warning)]"}`}>
                    <Icon size={18} aria-hidden />
                  </span>
                  <div className="row-main">
                    <p className="row-title">{title}</p>
                    <p className="row-sub">{detail}</p>
                  </div>
                  <div className="row-end">
                    <Status tone={state === "complete" ? "success" : "warning"}>
                      {state === "complete" ? "Recorded" : "Waiting"}
                    </Status>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <aside className="stack">
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2 className="panel-title">Price and deposit</h2>
                  <p className="panel-sub">{order.timelineImpact} · {order.depositBasisPoints / 100}% deposit</p>
                </div>
              </div>
              <div className="panel-body stack">
                <dl className="ledger">
                  <div className="ledger-line">
                    <dt className="ledger-label">Change order price</dt>
                    <dd className="ledger-value num">{formatMoney(order.amountMinor, order.currency)}</dd>
                  </div>
                  <div className="ledger-line">
                    <dt className="ledger-label">Balance after deposit</dt>
                    <dd className="ledger-value num">{formatMoney(balance, order.currency)}</dd>
                  </div>
                  <div className="ledger-line is-total">
                    <dt className="ledger-label">Deposit due</dt>
                    <dd className="ledger-value num">{formatMoney(deposit, order.currency)}</dd>
                  </div>
                </dl>
                <PaymentActions
                  paymentRequestId={paymentRequestId}
                  projectId={project.id}
                  changeOrderId={order.id}
                />
              </div>
            </section>
            <section className="panel">
              <div className="panel-head"><h2 className="panel-title">Approved document</h2></div>
              <div className="row">
                <span className="row-lead"><FileText size={18} aria-hidden /></span>
                <div className="row-main">
                  <p className="row-title">CO-004-v1.pdf</p>
                  <p className="row-sub">Immutable approval copy</p>
                </div>
                <div className="row-end">
                  <Button variant="outline" className="button-sm" type="button">Open</Button>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
