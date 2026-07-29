import { Check, Clock3, ExternalLink, MailCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { PaymentActions } from "@/components/payment-actions";
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

  return (
    <div className="page">
      <PageHeader
        eyebrow={`${project.name} · ${order.number}`}
        title={order.title}
        description="The client approved this version. Work remains blocked until the required deposit is confirmed."
        actions={<Status tone="warning">Approved · unpaid</Status>}
      />

      <div className="mt-8 grid grid-cols-[1.25fr_0.75fr] gap-6">
        <section className="card">
          <div className="border-b border-[var(--line)] p-7">
            <p className="eyebrow mb-3">Proof trail</p>
            <h2 className="section-title">Version 1 · Locked</h2>
          </div>
          <ol>
            {[
              {
                icon: Check,
                title: "Change Order sent",
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
            ].map(({ icon: Icon, title, detail, state }) => (
              <li key={title} className="grid grid-cols-[46px_1fr_auto] items-center gap-4 border-b border-[var(--line)] p-7 last:border-0">
                <span className={`grid size-11 place-items-center border ${state === "complete" ? "border-[var(--success)] text-[var(--success)]" : "border-[var(--warning)] text-[var(--warning)]"}`}>
                  <Icon size={20} />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="quiet mt-1 text-sm">{detail}</p>
                </div>
                <Status tone={state === "complete" ? "success" : "warning"}>
                  {state === "complete" ? "Recorded" : "Waiting"}
                </Status>
              </li>
            ))}
          </ol>
        </section>

        <aside className="space-y-6">
          <section className="card p-7">
            <p className="eyebrow">Payment request</p>
            <p className="font-display mt-5 text-5xl font-semibold tracking-tight">
              {formatMoney(deposit, order.currency)}
            </p>
            <p className="quiet mt-2 text-sm">{order.depositBasisPoints / 100}% deposit</p>
            <PaymentActions
              paymentRequestId={paymentRequestId}
              projectId={project.id}
              changeOrderId={order.id}
            />
          </section>
          <section className="card p-7">
            <p className="eyebrow">Approved document</p>
            <button className="mt-5 flex w-full items-center justify-between border border-[var(--line)] p-4 text-left hover:border-[var(--ink)]">
              <span>
                <span className="block font-semibold">CO-004-v1.pdf</span>
                <span className="quiet mt-1 block text-xs">Immutable approval copy</span>
              </span>
              <ExternalLink size={17} />
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
