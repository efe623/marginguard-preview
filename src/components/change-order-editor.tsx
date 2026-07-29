"use client";

import { AlertTriangle, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { sendChangeOrder } from "@/features/core/actions";
import { formatMoney, toMinorUnits } from "@/lib/money";

export function ChangeOrderEditor({
  projectId,
  projectName,
  currency
}: {
  projectId: string;
  projectName: string;
  currency: string;
}) {
  const [title, setTitle] = useState("Arabic localization");
  const [reason, setReason] = useState("Client request");
  const [amount, setAmount] = useState("2,500");
  const [deposit, setDeposit] = useState(50);
  const [timeline, setTimeline] = useState("+2 weeks");

  const amountMinor = useMemo(() => {
    try {
      return Number(toMinorUnits(amount || "0", currency));
    } catch {
      return 0;
    }
  }, [amount, currency]);
  const depositMinor = Math.round((amountMinor * deposit) / 100);

  return (
    <div className="grid min-h-[calc(100vh-36px)] grid-cols-[1.15fr_0.85fr] border border-[var(--line)] bg-[var(--paper-deep)]">
      <section className="p-10">
        <div className="mx-auto min-h-[850px] max-w-[680px] bg-[var(--paper-white)] p-16 shadow-[8px_8px_0_var(--ink)]">
          <div className="flex items-start justify-between border-b border-[var(--line)] pb-10">
            <div>
              <p className="font-display text-4xl font-bold tracking-tight">MarginGuard</p>
              <p className="eyebrow mt-2">Change Order document</p>
            </div>
            <div className="text-right">
              <p className="font-display text-3xl font-semibold">No. 005</p>
              <p className="quiet mt-2 text-sm">29 July 2026</p>
            </div>
          </div>

          <p className="mt-10 text-lg leading-8">
            This document records additional work requested for the {projectName}
            {" "}project. Approval applies only to this version.
          </p>

          <dl className="mt-10 border border-[var(--line)]">
            {[
              ["Description of extra work", title || "—"],
              ["Reason for change", reason],
              ["Timeline impact", timeline || "No change"],
              ["Price adjustment", formatMoney(amountMinor, currency)],
              ["Required deposit", `${deposit}% · ${formatMoney(depositMinor, currency)}`]
            ].map(([term, value]) => (
              <div key={term} className="grid grid-cols-[190px_1fr] border-b border-[var(--line)] last:border-0">
                <dt className="bg-[var(--paper-deep)] p-5 text-xs font-bold uppercase tracking-[0.07em]">{term}</dt>
                <dd className="border-l border-[var(--line)] p-5 font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 border border-[#c08c00] bg-[#fff4c8] p-5">
            <div className="flex gap-3">
              <AlertTriangle className="shrink-0 text-[#8a6200]" size={20} />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em]">Evidence warning</p>
                <p className="mt-2 text-sm leading-6">
                  This Change Order has no source message or meeting note attached.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-8 border-t border-[var(--line)] pt-8">
            <div>
              <p className="eyebrow">Client approval</p>
              <p className="quiet mt-8 text-sm">Verified email and timestamp recorded after approval.</p>
            </div>
            <div>
              <p className="eyebrow">Work authorization</p>
              <p className="quiet mt-8 text-sm">Pending required deposit confirmation.</p>
            </div>
          </div>
        </div>
      </section>

      <aside className="border-l border-[var(--line)] bg-[var(--paper)] p-8">
        <div className="sticky top-8">
          <p className="eyebrow mb-3">Draft</p>
          <h2 className="section-title">Edit details</h2>
          <p className="quiet mt-2 text-sm">The document preview updates as you type.</p>
          <form action={sendChangeOrder} className="mt-8 space-y-5">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="changeRequestId" value="" />
            <input type="hidden" name="currency" value={currency} />
            <input type="hidden" name="title" value={title} />
            <input type="hidden" name="description" value={title} />
            <label>
              <span className="field-label">Description of work</span>
              <textarea className="textarea" value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label>
              <span className="field-label">Reason</span>
              <select className="select" name="reason" value={reason} onChange={(event) => setReason(event.target.value)}>
                <option>Client request</option>
                <option>Scope expansion</option>
                <option>Technical necessity</option>
                <option>Revision limit exceeded</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label>
                <span className="field-label">Price ({currency})</span>
                <input className="input" name="amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
              </label>
              <label>
                <span className="field-label">Timeline impact</span>
                <input className="input" name="timelineImpact" value={timeline} onChange={(event) => setTimeline(event.target.value)} />
              </label>
            </div>
            <label>
              <span className="field-label">Required deposit</span>
              <div className="flex items-center gap-4">
                <input
                  aria-label="Deposit percentage"
                  className="w-full accent-[var(--signal)]"
                  type="range"
                  name="depositPercent"
                  min="1"
                  max="100"
                  value={deposit}
                  onChange={(event) => setDeposit(Number(event.target.value))}
                />
                <output className="w-16 border border-[var(--line)] bg-white px-2 py-2 text-center font-semibold">{deposit}%</output>
              </div>
            </label>
            <div className="border-t border-[var(--line)] pt-6">
              <Button className="w-full" type="submit">
                <Send size={16} /> Send for approval
              </Button>
              <Button className="mt-3 w-full" variant="outline" type="button">Save draft</Button>
            </div>
          </form>
        </div>
      </aside>
    </div>
  );
}
