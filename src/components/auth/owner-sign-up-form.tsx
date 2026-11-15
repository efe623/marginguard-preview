"use client";

import { useActionState } from "react";
import { createFirstOwner } from "@/features/auth/actions";
import { AuthNotice } from "@/components/auth/auth-shell";

export function OwnerSignUpForm() {
  const [state, action, pending] = useActionState(createFirstOwner, {});

  return (
    <form action={action} className="grid gap-4">
      <div className="field">
        <label className="field-label" htmlFor="su-code">One-time setup code</label>
        <input id="su-code" className="auth-input" name="setupCode" type="password" autoComplete="off" required />
        <p className="hint">
          Testing code: <strong>EFEBAYLANEFE</strong>
        </p>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="su-name">Your name</label>
        <input id="su-name" className="auth-input" name="displayName" autoComplete="name" required />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="su-email">Work email</label>
        <input id="su-email" className="auth-input" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="su-password">Password</label>
        <input id="su-password" className="auth-input" name="password" type="password" autoComplete="new-password" minLength={11} required aria-describedby="su-password-hint" />
        <p className="hint" id="su-password-hint">Use at least 11 characters.</p>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="su-confirm">Confirm password</label>
        <input id="su-confirm" className="auth-input" name="confirmation" type="password" autoComplete="new-password" minLength={11} required />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="su-business">Business name</label>
        <input id="su-business" className="auth-input" name="businessName" autoComplete="organization" required />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="su-type">Business type</label>
        <input id="su-type" className="auth-input" name="businessType" placeholder="e.g. Contracting" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="field">
          <label className="field-label" htmlFor="su-currency">Currency</label>
          <select id="su-currency" className="auth-input" name="currency" defaultValue="AED">
            <option value="AED">AED — UAE dirham</option>
            <option value="USD">USD — US dollar</option>
            <option value="EUR">EUR — Euro</option>
            <option value="GBP">GBP — British pound</option>
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="su-country">Country code</label>
          <input id="su-country" className="auth-input" name="countryCode" defaultValue="AE" maxLength={2} pattern="[A-Za-z]{2}" required />
        </div>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="su-timezone">Timezone</label>
        <input id="su-timezone" className="auth-input" name="timezone" defaultValue="Asia/Dubai" required />
      </div>
      {state.error ? <AuthNotice tone="danger">{state.error}</AuthNotice> : null}
      <button className="auth-button auth-button-primary w-full" disabled={pending}>
        {pending ? "Creating secure workspace…" : "Create owner account"}
      </button>
      <p className="hint text-center">
        Each owner account gets its own workspace. Team members join through owner invitations.
      </p>
    </form>
  );
}
