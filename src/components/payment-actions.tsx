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
    <div className="mt-7 border-t border-[var(--line)] pt-6">
      <button className="button button-primary w-full" type="button" disabled={pending} onClick={createLink}>
        <CreditCard size={16} /> Create Stripe payment link (if connected)
      </button>
      <details className="mt-3 border border-[var(--line)] p-4">
        <summary className="cursor-pointer text-sm font-semibold">Stripe unavailable? Record external deposit</summary>
        <form action={confirmManualPayment} className="mt-4 space-y-3">
          <input type="hidden" name="paymentRequestId" value={paymentRequestId ?? ""} />
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="changeOrderId" value={changeOrderId} />
          <input className="input" name="method" required placeholder="Bank transfer, cash, cheque…" />
          <input className="input" name="reference" placeholder="Reference or receipt note" />
          <button className="button button-dark w-full" disabled={!paymentRequestId}>
            Confirm exact requested amount
          </button>
        </form>
      </details>
      {message ? <p role="status" className="mt-3 text-xs">{message}</p> : null}
    </div>
  );
}
