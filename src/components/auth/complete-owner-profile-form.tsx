"use client";

import { useActionState } from "react";
import { completeOwnerProfile } from "@/features/auth/actions";

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
    <form action={action} className="mt-8 space-y-6">
      <label>
        <span className="field-label">Your name</span>
        <input className="input" name="displayName" autoComplete="name" defaultValue={defaults.displayName} required />
      </label>
      <div className="border-t border-[var(--line)] pt-6">
        <p className="eyebrow">Business workspace</p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <label>
            <span className="field-label">Business name</span>
            <input className="input" name="businessName" autoComplete="organization" defaultValue={defaults.businessName} required />
          </label>
          <label>
            <span className="field-label">Business type</span>
            <input className="input" name="businessType" placeholder="e.g. Contracting" defaultValue={defaults.businessType} required />
          </label>
          <label>
            <span className="field-label">Currency</span>
            <select className="input" name="currency" defaultValue={defaults.currency || "AED"}>
              <option value="AED">AED — UAE dirham</option>
              <option value="USD">USD — US dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British pound</option>
            </select>
          </label>
          <label>
            <span className="field-label">Country code</span>
            <input className="input" name="countryCode" defaultValue={defaults.countryCode || "AE"} maxLength={2} pattern="[A-Za-z]{2}" required />
          </label>
          <label className="sm:col-span-2">
            <span className="field-label">Timezone</span>
            <input className="input" name="timezone" defaultValue={defaults.timezone || "Asia/Dubai"} required />
          </label>
        </div>
      </div>
      {state.error ? <p role="alert" className="border border-[var(--danger)] bg-[#fff5f3] p-3 text-sm text-[var(--danger)]">{state.error}</p> : null}
      <button className="button button-primary w-full" disabled={pending}>
        {pending ? "Saving your workspace…" : "Finish account setup"}
      </button>
      <p className="quiet text-center text-xs">You only need to do this once.</p>
    </form>
  );
}
