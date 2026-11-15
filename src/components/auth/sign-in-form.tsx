"use client";

import { useActionState } from "react";
import { signIn } from "@/features/auth/actions";
import { AuthNotice } from "@/components/auth/auth-shell";

export function SignInForm() {
  const [state, action, pending] = useActionState(signIn, {});

  return (
    <form action={action} className="grid gap-4">
      <div className="field">
        <label className="field-label" htmlFor="sign-in-email">Email</label>
        <input id="sign-in-email" className="auth-input" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="sign-in-password">Password</label>
        <input id="sign-in-password" className="auth-input" name="password" type="password" autoComplete="current-password" minLength={10} required />
      </div>
      {state.error ? <AuthNotice tone="danger">{state.error}</AuthNotice> : null}
      <button className="auth-button auth-button-primary w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
