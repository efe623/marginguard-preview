"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/features/auth/actions";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, {});

  return (
    <form action={action} className="mt-8 grid gap-6">
      <label className="block">
        <span className="field-label">Email</span>
        <input
          className="auth-input"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@business.com"
          required
        />
      </label>
      {state.error ? (
        <p role="alert" className="rounded-xl border border-[var(--danger)] bg-[#fff5f3] p-3 text-sm text-[var(--danger)]">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="rounded-xl border border-[var(--success)] bg-[color-mix(in_srgb,var(--success)_8%,var(--paper-white))] p-3 text-sm text-[var(--success)]">
          {state.success}
        </p>
      ) : null}
      <button className="auth-button auth-button-primary mt-1 w-full" disabled={pending}>
        {pending ? "Sending secure link…" : "Send recovery link"}
      </button>
    </form>
  );
}
