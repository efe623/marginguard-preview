"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { createGoogleOwner } from "@/features/auth/actions";
import { AuthNotice } from "@/components/auth/auth-shell";

export function GoogleOwnerForm({ email, suggestedName }: { email: string; suggestedName: string }) {
  const [state, action, pending] = useActionState(createGoogleOwner, {});
  return (
    <form action={action} className="grid gap-4">
      <div className="notice notice-success">
        <CheckCircle2 size={18} aria-hidden="true" />
        <p>Google account connected: <strong className="break-all">{email}</strong></p>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="go-name">Your name</label>
        <input id="go-name" className="auth-input" name="displayName" autoComplete="name" defaultValue={suggestedName} required />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="go-business">Business name</label>
        <input id="go-business" className="auth-input" name="businessName" autoComplete="organization" required />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="go-type">Business type</label>
        <input id="go-type" className="auth-input" name="businessType" placeholder="e.g. Contracting" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="field">
          <label className="field-label" htmlFor="go-currency">Currency</label>
          <select id="go-currency" className="auth-input" name="currency" defaultValue="AED">
            <option value="AED">AED — UAE dirham</option>
            <option value="USD">USD — US dollar</option>
            <option value="EUR">EUR — Euro</option>
            <option value="GBP">GBP — British pound</option>
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="go-country">Country code</label>
          <input id="go-country" className="auth-input" name="countryCode" defaultValue="AE" maxLength={2} pattern="[A-Za-z]{2}" required />
        </div>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="go-timezone">Timezone</label>
        <input id="go-timezone" className="auth-input" name="timezone" defaultValue="Asia/Dubai" required />
      </div>
      {state.error ? <AuthNotice tone="danger">{state.error}</AuthNotice> : null}
      <button className="auth-button auth-button-primary w-full" disabled={pending}>{pending ? "Creating your workspace…" : "Create owner workspace"}</button>
      <p className="hint text-center">No password is needed. Google is already connected to this account.</p>
    </form>
  );
}
