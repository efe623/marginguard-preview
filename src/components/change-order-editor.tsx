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
    <div className="split">
      <section className="panel lg:order-1" aria-label="Change order document preview">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Document preview</h2>
            <p className="panel-sub">What the client will see. Approval applies only to this version.</p>
          </div>
          <div className="text-right">
            <p className="font-semibold num">No. 005</p>
            <p className="panel-sub">29 July 2026</p>
          </div>
        </div>
        <div className="panel-body stack">
          <p className="leading-7">
            This document records additional work requested for the {projectName}
            {" "}project. Approval applies only to this version.
          </p>

          <dl className="ledger">
            <div className="ledger-line">
              <dt className="ledger-label">Description of extra work</dt>
              <dd className="ledger-value text-right !whitespace-normal">{title || "—"}</dd>
            </div>
            <div className="ledger-line">
              <dt className="ledger-label">Reason for change</dt>
              <dd className="ledger-value">{reason}</dd>
            </div>
            <div className="ledger-line">
              <dt className="ledger-label">Timeline impact</dt>
              <dd className="ledger-value">{timeline || "No change"}</dd>
            </div>
            <div className="ledger-line">
              <dt className="ledger-label">Required deposit ({deposit}%)</dt>
              <dd className="ledger-value num">{formatMoney(depositMinor, currency)}</dd>
            </div>
            <div className="ledger-line is-total">
              <dt className="ledger-label">Price adjustment</dt>
              <dd className="ledger-value num">{formatMoney(amountMinor, currency)}</dd>
            </div>
          </dl>

          <p className="notice notice-warn">
            <AlertTriangle size={16} aria-hidden />
            <span>
              <strong>Evidence warning.</strong>{" "}
              This change order has no source message or meeting note attached.
            </span>
          </p>

          <dl className="facts border-t border-[var(--line)] pt-5">
            <div>
              <dt className="fact-label">Client approval</dt>
              <dd className="meta mt-1">Verified email and timestamp recorded after approval.</dd>
            </div>
            <div>
              <dt className="fact-label">Work authorization</dt>
              <dd className="meta mt-1">Pending required deposit confirmation.</dd>
            </div>
          </dl>
        </div>
      </section>

      <form action={sendChangeOrder} className="panel order-first lg:order-2">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Details</h2>
            <p className="panel-sub">Edits show in the preview straight away.</p>
          </div>
        </div>
        <div className="panel-body stack">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="changeRequestId" value="" />
          <input type="hidden" name="currency" value={currency} />
          <input type="hidden" name="title" value={title} />
          <input type="hidden" name="description" value={title} />
          <div className="field">
            <label className="field-label" htmlFor="co-description">Description of work</label>
            <textarea id="co-description" className="textarea" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="co-reason">Reason</label>
            <select id="co-reason" className="select" name="reason" value={reason} onChange={(event) => setReason(event.target.value)}>
              <option>Client request</option>
              <option>Scope expansion</option>
              <option>Technical necessity</option>
              <option>Revision limit exceeded</option>
            </select>
          </div>
          <div className="form-grid">
            <div className="field">
              <label className="field-label" htmlFor="co-amount">Price ({currency})</label>
              <input id="co-amount" className="input num" name="amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="co-timeline">Timeline impact</label>
              <input id="co-timeline" className="input" name="timelineImpact" value={timeline} onChange={(event) => setTimeline(event.target.value)} />
            </div>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="co-deposit">Required deposit</label>
            <div className="flex items-center gap-4">
              <input
                id="co-deposit"
                className="min-h-10 w-full accent-[var(--signal)]"
                type="range"
                name="depositPercent"
                min="1"
                max="100"
                value={deposit}
                onChange={(event) => setDeposit(Number(event.target.value))}
              />
              <output htmlFor="co-deposit" className="num w-16 rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--surface)] px-2 py-2 text-center font-semibold">{deposit}%</output>
            </div>
            <p className="hint">Due before work starts: <span className="num">{formatMoney(depositMinor, currency)}</span></p>
          </div>
          <div className="form-actions border-t border-[var(--line)] pt-5">
            <Button type="submit">
              <Send size={16} aria-hidden /> Send for approval
            </Button>
            <Button variant="outline" type="button">Save draft</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
