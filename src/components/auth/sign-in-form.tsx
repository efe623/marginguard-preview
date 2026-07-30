"use client";

import { useActionState } from "react";
import { signIn } from "@/features/auth/actions";

export function SignInForm() {
  const [state, action, pending] = useActionState(signIn, {});

  return (
    <form action={action} className="mt-8 grid gap-5">
      <label className="block">
        <span className="field-label">Email</span>
        <input className="auth-input" name="email" type="email" autoComplete="email" required />
      </label>
      <label className="block">
        <span className="field-label">Password</span>
        <input className="auth-input" name="password" type="password" autoComplete="current-password" minLength={10} required />
      </label>
      {state.error ? (
        <p role="alert" className="border border-[var(--danger)] bg-[#fff5f3] p-3 text-sm text-[var(--danger)]">
          {state.error}
        </p>
      ) : null}
      <button className="auth-button auth-button-primary mt-1 w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
