"use client";

import { Check, LoaderCircle, MailCheck, ShieldCheck, X } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";

export function ClientApprovalPanel({
  token,
  verified,
  order
}: {
  token: string;
  verified: boolean;
  order?: {
    businessName: string;
    projectName: string;
    orderNumber: string;
    title: string;
    description: string;
    amountMinor: number;
    currency: string;
    depositBasisPoints: number;
    timelineImpact: string;
  };
}) {
  const [stage, setStage] = useState<"request" | "code" | "document" | "done">(
    verified ? "document" : "request"
  );
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function requestCode() {
    startTransition(async () => {
      const response = await fetch("/api/client-otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      if (response.ok) {
        setStage("code");
        const result = (await response.json()) as { preview?: boolean };
        setMessage(result.preview ? "Preview mode: use 123456." : "A code was sent to the approval email.");
      } else {
        setMessage("A new code cannot be sent yet. Try again shortly.");
      }
    });
  }

  function verifyCode() {
    startTransition(async () => {
      const response = await fetch("/api/client-otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, code })
      });
      if (response.ok) {
        setStage("document");
        setMessage("");
      } else {
        setMessage("That code is invalid or expired.");
      }
    });
  }

  function decide(decision: "approved" | "rejected") {
    startTransition(async () => {
      const response = await fetch("/api/client-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision })
      });
      if (response.ok) {
        setStage("done");
        setMessage(
          decision === "approved"
            ? "Approval recorded. The business will be notified."
            : "Rejection recorded. The business will be notified."
        );
      } else {
        setMessage("This decision could not be recorded. Reload and try again.");
      }
    });
  }

  if (stage === "done") {
    return (
      <div className="panel mx-auto max-w-xl">
        <div className="empty">
          <span className="text-[var(--success)]"><Check size={28} aria-hidden /></span>
          <h1 className="page-title">Decision recorded</h1>
          <p className="empty-text">{message}</p>
          <p className="meta mt-2">You may close this page.</p>
        </div>
      </div>
    );
  }

  if (stage !== "document") {
    return (
      <div className="panel mx-auto max-w-xl">
        <div className="panel-body stack-sm">
          <ShieldCheck size={26} aria-hidden className="signal" />
          <h1 className="page-title">Verify your email</h1>
          <p className="quiet leading-7">
            This is a protected client document. A one-time code is required
            before this change order can be viewed or approved.
          </p>
          {stage === "request" ? (
            <Button className="w-full" onClick={requestCode} disabled={pending}>
              {pending ? <LoaderCircle className="animate-spin" size={16} aria-hidden /> : <MailCheck size={16} aria-hidden />}
              Send verification code
            </Button>
          ) : (
            <div className="stack-sm">
              <div className="field">
                <label className="field-label" htmlFor="approval-code">Six-digit code</label>
                <input
                  id="approval-code"
                  className="input num text-center text-2xl"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                />
              </div>
              <Button className="w-full" onClick={verifyCode} disabled={pending || code.length !== 6}>
                Verify and open document
              </Button>
            </div>
          )}
          {message ? <p role="status" className="text-sm">{message}</p> : null}
        </div>
      </div>
    );
  }

  const visibleOrder = order ?? {
    businessName: "Northline Studio",
    projectName: "E-commerce Redesign",
    orderNumber: "CO-004",
    title: "Arabic localization",
    description:
      "Implement RTL layouts and Arabic-localized interface support across the agreed storefront pages.",
    amountMinor: 250000,
    currency: "AED",
    depositBasisPoints: 5000,
    timelineImpact: "+2 weeks"
  };
  const depositMinor = Math.round(
    (visibleOrder.amountMinor * visibleOrder.depositBasisPoints) / 10000
  );

  return (
    <div className="split mx-auto max-w-5xl">
      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="panel-sub">{visibleOrder.businessName} · {visibleOrder.projectName}</p>
            <p className="panel-title">UnitPulse</p>
          </div>
          <div className="text-right">
            <p className="font-semibold num">{visibleOrder.orderNumber}</p>
            <p className="panel-sub">Verified approval copy</p>
          </div>
        </div>
        <div className="panel-body stack">
          <div>
            <h1 className="page-title">{visibleOrder.title}</h1>
            <p className="mt-3 leading-7">{visibleOrder.description}</p>
          </div>
          <dl className="ledger">
            <div className="ledger-line">
              <dt className="ledger-label">Timeline impact</dt>
              <dd className="ledger-value">{visibleOrder.timelineImpact}</dd>
            </div>
            <div className="ledger-line">
              <dt className="ledger-label">Required deposit ({visibleOrder.depositBasisPoints / 100}%)</dt>
              <dd className="ledger-value num">{formatMoney(depositMinor, visibleOrder.currency)}</dd>
            </div>
            <div className="ledger-line is-total">
              <dt className="ledger-label">Additional price</dt>
              <dd className="ledger-value num">{formatMoney(visibleOrder.amountMinor, visibleOrder.currency)}</dd>
            </div>
          </dl>
        </div>
      </section>
      <aside className="panel">
        <div className="panel-body stack-sm">
          <p className="notice notice-success">
            <MailCheck size={16} aria-hidden />
            <span>Email verified</span>
          </p>
          <h2 className="panel-title">Your decision applies to this exact version.</h2>
          <p className="quiet text-sm leading-6">
            Any later change to price, scope, or deadline invalidates this approval.
          </p>
          <div className="stack-sm">
            <Button className="w-full" onClick={() => decide("approved")} disabled={pending}>
              <Check size={16} aria-hidden /> Approve change order
            </Button>
            <Button className="w-full" variant="outline" onClick={() => decide("rejected")} disabled={pending}>
              <X size={16} aria-hidden /> Reject
            </Button>
          </div>
          {message ? <p role="status" className="text-sm">{message}</p> : null}
          <p className="meta border-t border-[var(--line)] pt-4">
            This is workflow approval evidence, not a regulated electronic signature.
          </p>
        </div>
      </aside>
    </div>
  );
}
