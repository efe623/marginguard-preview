"use client";

import { useActionState } from "react";
import { completeOwnerProfile } from "@/features/auth/actions";
import { AuthNotice } from "@/components/auth/auth-shell";

type Defaults = {
  displayName: string;
  businessName: string;
  businessType: string;
  currency: string;
  countryCode: string;
  timezone: string;
};

export function CompleteOwnerProfileForm({ defaults }: { defaults: Defaults }) {
  const [state, action, pending] = useActionState(completeOwnerProfile, {});

  return (
    <form action={action} className="grid gap-4">
      <div className="field">
        <label className="field-label" htmlFor="cp-name">Your name</label>
        <input id="cp-name" className="auth-input" name="displayName" autoComplete="name" defaultValue={defaults.displayName} required />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="cp-business">Business name</label>
        <input id="cp-business" className="auth-input" name="businessName" autoComplete="organization" defaultValue={defaults.businessName} required />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="cp-type">Business type</label>
        <input id="cp-type" className="auth-input" name="businessType" placeholder="e.g. Contracting" defaultValue={defaults.businessType} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="field">
          <label className="field-label" htmlFor="cp-currency">Currency</label>
          <select id="cp-currency" className="auth-input" name="currency" defaultValue={defaults.currency || "AED"}>
            <option value="AED">AED — UAE dirham</option>
            <option value="USD">USD — US dollar</option>
            <option value="EUR">EUR — Euro</option>
            <option value="GBP">GBP — British pound</option>
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="cp-country">Country code</label>
          <input id="cp-country" className="auth-input" name="countryCode" defaultValue={defaults.countryCode || "AE"} maxLength={2} pattern="[A-Za-z]{2}" required />
        </div>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="cp-timezone">Timezone</label>
        <input id="cp-timezone" className="auth-input" name="timezone" defaultValue={defaults.timezone || "Asia/Dubai"} required />
      </div>
      {state.error ? <AuthNotice tone="danger">{state.error}</AuthNotice> : null}
      <button className="auth-button auth-button-primary w-full" disabled={pending}>
        {pending ? "Saving your workspace…" : "Finish account setup"}
      </button>
      <p className="hint text-center">You only need to do this once.</p>
    </form>
  );
}
