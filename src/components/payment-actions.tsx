"use client";

import { CreditCard } from "lucide-react";
import { useState, useTransition } from "react";
import { confirmManualPayment } from "@/features/payments/actions";

export function PaymentActions({
  paymentRequestId,
  projectId,
  changeOrderId
}: {
  paymentRequestId?: string;
  projectId: string;
  changeOrderId: string;
}) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function createLink() {
    if (!paymentRequestId) {
      setMessage("The deposit request appears after client approval.");
      return;
    }
    startTransition(async () => {
      const response = await fetch("/api/stripe/payment-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentRequestId })
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) {
        setMessage(result.error ?? "Stripe link could not be created.");
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
      setMessage("Stripe-hosted link opened. Copy it to the client.");
    });
  }

  return (
    <div className="stack-sm mt-6 border-t border-[var(--line)] pt-5">
      <button className="button button-primary w-full" type="button" disabled={pending} onClick={createLink}>
        <CreditCard size={16} aria-hidden="true" /> Create Stripe payment link (if connected)
      </button>
      <details>
        <summary className="cursor-pointer text-sm font-semibold min-h-10 flex items-center">Stripe unavailable? Record external deposit</summary>
        <form action={confirmManualPayment} className="stack-sm mt-2">
          <input type="hidden" name="paymentRequestId" value={paymentRequestId ?? ""} />
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="changeOrderId" value={changeOrderId} />
          <div className="field"><label className="field-label" htmlFor="pay-method">Payment method</label><input id="pay-method" className="input" name="method" required placeholder="Bank transfer, cash, cheque…" /></div>
          <div className="field"><label className="field-label" htmlFor="pay-ref">Reference</label><input id="pay-ref" className="input" name="reference" placeholder="Reference or receipt note" /></div>
          <button className="button button-outline w-full" disabled={!paymentRequestId}>
            Confirm exact requested amount
          </button>
        </form>
      </details>
      {message ? <p role="status" className="hint">{message}</p> : null}
    </div>
  );
}
