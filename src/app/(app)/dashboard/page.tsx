import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileWarning,
  Landmark,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import { changeOrders, projects } from "@/data/fixtures";
import { formatMoney } from "@/lib/money";

const actions = [
  {
    label: "Approval received",
    detail: "CO-004 · Arabic localization",
    meta: "Deposit required before work starts",
    icon: CheckCircle2,
    tone: "success" as const,
    href: "/projects/ecommerce-redesign/change-orders/co-004"
  },
  {
    label: "Revision limit reached",
    detail: "E-commerce Redesign",
    meta: "3 of 3 included revisions used",
    icon: FileWarning,
    tone: "warning" as const,
    href: "/projects/ecommerce-redesign"
  },
  {
    label: "Final balance ready",
    detail: "Branding Package",
    meta: "Request payment manually",
    icon: Landmark,
    tone: "neutral" as const,
    href: "/projects/brand-package"
  }
];

export default function DashboardPage() {
  const waitingDeposit = changeOrders
    .filter((order) => order.status === "approved")
    .reduce((sum, order) => sum + order.amountMinor, 0);
  const activeValue = projects.reduce(
    (sum, project) => sum + project.quoteMinor + project.approvedExtrasMinor,
    0
  );

  return (
    <div className="page">
      <PageHeader
        eyebrow="Wednesday · 29 July"
        title="Protect what you earn."
        description="Every open request, approval, and payment checkpoint in one place."
        actions={
          <ButtonLink href="/projects/new">
            New project <ArrowRight size={15} />
          </ButtonLink>
        }
      />

      <section aria-label="Key figures" className="mt-8 grid grid-cols-4 gap-4">
        <div className="card metric">
          <p className="eyebrow">Active project value</p>
          <p className="metric-value">{formatMoney(activeValue, "AED")}</p>
          <p className="quiet mt-3 text-xs">Original quotes + approved extras</p>
        </div>
        <div className="card metric">
          <p className="eyebrow">Waiting for deposit</p>
          <p className="metric-value signal">
            {formatMoney(waitingDeposit, "AED")}
          </p>
          <p className="quiet mt-3 text-xs">Approved, not authorized</p>
        </div>
        <div className="card metric">
          <p className="eyebrow">Open change orders</p>
          <p className="metric-value">02</p>
          <p className="quiet mt-3 text-xs">One approval · one balance</p>
        </div>
        <div className="card metric">
          <p className="eyebrow">Protected this month</p>
          <p className="metric-value">{formatMoney(430000, "AED")}</p>
          <p className="quiet mt-3 text-xs">Confirmed additional work</p>
        </div>
      </section>

      <div className="mt-8 grid grid-cols-[1.55fr_0.8fr] gap-6">
        <section className="card">
          <div className="flex items-end justify-between border-b border-[var(--line)] p-7">
            <div>
              <p className="eyebrow mb-3">Proof trail</p>
              <h2 className="section-title">Work needing a decision</h2>
            </div>
            <Status tone="warning">3 actions</Status>
          </div>
          <div>
            {actions.map(({ label, detail, meta, icon: Icon, tone, href }) => (
              <Link
                href={href}
                key={label}
                className="group grid grid-cols-[44px_1fr_auto] items-center gap-4 border-b border-[var(--line)] px-7 py-6 last:border-b-0 hover:bg-[var(--paper-deep)]"
              >
                <div className="grid size-11 place-items-center border border-[var(--line)]">
                  <Icon
                    size={20}
                    className={
                      tone === "warning"
                        ? "text-[var(--warning)]"
                        : tone === "success"
                          ? "text-[var(--success)]"
                          : ""
                    }
                  />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em]">
                    {label}
                  </p>
                  <p className="mt-1 text-lg font-semibold">{detail}</p>
                  <p className="quiet mt-1 text-sm">{meta}</p>
                </div>
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            ))}
          </div>
        </section>

        <aside className="card p-7">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Control check</p>
            <ShieldCheck size={20} />
          </div>
          <h2 className="font-display mt-7 text-3xl font-semibold leading-tight">
            No work starts without proof.
          </h2>
          <ol className="mt-8 space-y-0">
            {[
              ["Scope confirmed", "Source of truth saved"],
              ["Client approved", "Verified email recorded"],
              ["Deposit confirmed", "Work becomes authorized"]
            ].map(([title, detail], index) => (
              <li
                key={title}
                className="relative flex gap-4 border-l border-[var(--line-strong)] pb-7 pl-6 last:border-l-transparent last:pb-0"
              >
                <span className="absolute -left-[6px] top-0 size-3 rounded-full border-2 border-[var(--paper)] bg-[var(--ink)]" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em]">
                    {index + 1}. {title}
                  </p>
                  <p className="quiet mt-1 text-sm">{detail}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex items-center gap-2 border-t border-[var(--line)] pt-5 text-sm">
            <Clock3 size={16} />
            <span className="quiet">Last activity 12 minutes ago</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
