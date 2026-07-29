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
      <div className="card mx-auto max-w-2xl p-10 text-center">
        <span className="mx-auto grid size-16 place-items-center border border-[var(--success)] text-[var(--success)]">
          <Check size={30} />
        </span>
        <h1 className="font-display mt-7 text-5xl font-bold">Decision recorded.</h1>
        <p className="quiet mt-4 leading-7">{message}</p>
        <p className="mt-8 text-sm">You may close this page.</p>
      </div>
    );
  }

  if (stage !== "document") {
    return (
      <div className="card mx-auto max-w-xl p-9">
        <ShieldCheck size={30} />
        <p className="eyebrow mt-7">Protected client document</p>
        <h1 className="font-display mt-4 text-5xl font-bold tracking-tight">
          Verify your email.
        </h1>
        <p className="quiet mt-4 leading-7">
          A one-time code is required before this Change Order can be viewed or
          approved.
        </p>
        {stage === "request" ? (
          <Button className="mt-8 w-full" onClick={requestCode} disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" size={16} /> : <MailCheck size={16} />}
            Send verification code
          </Button>
        ) : (
          <div className="mt-8">
            <label>
              <span className="field-label">Six-digit code</span>
              <input
                className="input text-center text-2xl tracking-[0.5em]"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              />
            </label>
            <Button className="mt-5 w-full" onClick={verifyCode} disabled={pending || code.length !== 6}>
              Verify and open document
            </Button>
          </div>
        )}
        {message ? <p role="status" className="mt-4 text-sm">{message}</p> : null}
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
    <div className="mx-auto grid max-w-6xl grid-cols-[1fr_360px] border border-[var(--line)] bg-[var(--paper-white)]">
      <section className="p-12">
        <div className="flex items-start justify-between border-b border-[var(--line)] pb-8">
          <div>
            <p className="font-display text-3xl font-bold">MarginGuard</p>
            <p className="eyebrow mt-2">{visibleOrder.businessName}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-semibold">{visibleOrder.orderNumber}</p>
            <p className="quiet mt-1 text-xs">Verified approval copy</p>
          </div>
        </div>
        <p className="eyebrow mt-9">{visibleOrder.projectName}</p>
        <h1 className="font-display mt-3 text-5xl font-bold tracking-tight">{visibleOrder.title}</h1>
        <p className="mt-6 text-lg leading-8">{visibleOrder.description}</p>
        <dl className="mt-9 border border-[var(--line)]">
          {[
            ["Timeline impact", visibleOrder.timelineImpact],
            ["Additional price", formatMoney(visibleOrder.amountMinor, visibleOrder.currency)],
            ["Required deposit", `${visibleOrder.depositBasisPoints / 100}% · ${formatMoney(depositMinor, visibleOrder.currency)}`]
          ].map(([term, value]) => (
            <div key={term} className="grid grid-cols-[180px_1fr] border-b border-[var(--line)] last:border-0">
              <dt className="bg-[var(--paper-deep)] p-5 text-xs font-bold uppercase tracking-[0.07em]">{term}</dt>
              <dd className="border-l border-[var(--line)] p-5 font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <aside className="border-l border-[var(--line)] bg-[var(--paper-deep)] p-8">
        <MailCheck size={25} />
        <p className="eyebrow mt-6">Email verified</p>
        <h2 className="font-display mt-3 text-3xl font-semibold">Your decision applies to this exact version.</h2>
        <p className="quiet mt-4 text-sm leading-6">
          Any later change to price, scope, or deadline invalidates this approval.
        </p>
        <div className="mt-8 space-y-3">
          <Button className="w-full" onClick={() => decide("approved")} disabled={pending}>
            <Check size={16} /> Approve change order
          </Button>
          <Button className="w-full" variant="outline" onClick={() => decide("rejected")} disabled={pending}>
            <X size={16} /> Reject
          </Button>
        </div>
        {message ? <p role="status" className="mt-4 text-sm">{message}</p> : null}
        <p className="quiet mt-8 border-t border-[var(--line)] pt-5 text-xs leading-5">
          This is workflow approval evidence, not a regulated electronic signature.
        </p>
      </aside>
    </div>
  );
}
