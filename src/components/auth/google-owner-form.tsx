"use client";

import { useActionState } from "react";
import { createGoogleOwner } from "@/features/auth/actions";

export function GoogleOwnerForm({ email, suggestedName }: { email: string; suggestedName: string }) {
  const [state, action, pending] = useActionState(createGoogleOwner, {});
  return (
    <form action={action} className="mt-8 space-y-6">
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-deep)] p-4">
        <p className="eyebrow">Google account connected</p>
        <p className="mt-2 text-sm font-semibold">{email}</p>
      </div>
      <label className="block">
        <span className="field-label">Your name</span>
        <input className="auth-input" name="displayName" autoComplete="name" defaultValue={suggestedName} required />
      </label>
      <div className="border-t border-[var(--line)] pt-6">
        <p className="eyebrow">Business workspace</p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <label><span className="field-label">Business name</span><input className="auth-input" name="businessName" autoComplete="organization" required /></label>
          <label><span className="field-label">Business type</span><input className="auth-input" name="businessType" placeholder="e.g. Contracting" required /></label>
          <label><span className="field-label">Currency</span><select className="auth-input" name="currency" defaultValue="AED"><option value="AED">AED — UAE dirham</option><option value="USD">USD — US dollar</option><option value="EUR">EUR — Euro</option><option value="GBP">GBP — British pound</option></select></label>
          <label><span className="field-label">Country code</span><input className="auth-input" name="countryCode" defaultValue="AE" maxLength={2} pattern="[A-Za-z]{2}" required /></label>
          <label className="sm:col-span-2"><span className="field-label">Timezone</span><input className="auth-input" name="timezone" defaultValue="Asia/Dubai" required /></label>
        </div>
      </div>
      {state.error ? <p role="alert" className="rounded-xl border border-[var(--danger)] bg-[#fff5f3] p-3 text-sm text-[var(--danger)]">{state.error}</p> : null}
      <button className="auth-button auth-button-primary w-full" disabled={pending}>{pending ? "Creating your workspace…" : "Create owner workspace"}</button>
      <p className="quiet text-center text-xs">No password is needed. Google is already connected to this account.</p>
    </form>
  );
}
