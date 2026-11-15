"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/features/auth/actions";
import { AuthNotice } from "@/components/auth/auth-shell";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, {});

  return (
    <form action={action} className="grid gap-4">
      <div className="field">
        <label className="field-label" htmlFor="forgot-email">Work email</label>
        <input
          id="forgot-email"
          className="auth-input"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@business.com"
          required
        />
      </div>
      {state.error ? <AuthNotice tone="danger">{state.error}</AuthNotice> : null}
      {state.success ? <AuthNotice tone="success">{state.success}</AuthNotice> : null}
      <button className="auth-button auth-button-primary w-full" disabled={pending}>
        {pending ? "Sending secure link…" : "Send recovery link"}
      </button>
    </form>
  );
}
