"use client";

import { useActionState } from "react";
import { createFirstOwner } from "@/features/auth/actions";

const fieldClass = "input";

export function OwnerSignUpForm() {
  const [state, action, pending] = useActionState(createFirstOwner, {});

  return (
    <form action={action} className="mt-8 space-y-6">
      <label>
        <span className="field-label">One-time setup code</span>
        <input
          className={fieldClass}
          name="setupCode"
          type="password"
          autoComplete="off"
          required
        />
        <span className="quiet mt-2 block text-xs">
          Use the private code supplied with your MarginGuard deployment.
        </span>
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label>
          <span className="field-label">Your name</span>
          <input
            className={fieldClass}
            name="displayName"
            autoComplete="name"
            required
          />
        </label>
        <label>
          <span className="field-label">Work email</span>
          <input
            className={fieldClass}
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label>
          <span className="field-label">Password</span>
          <input
            className={fieldClass}
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
        </label>
        <label>
          <span className="field-label">Confirm password</span>
          <input
            className={fieldClass}
            name="confirmation"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
        </label>
      </div>

      <div className="border-t border-[var(--line)] pt-6">
        <p className="eyebrow">Business workspace</p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <label>
            <span className="field-label">Business name</span>
            <input
              className={fieldClass}
              name="businessName"
              autoComplete="organization"
              required
            />
          </label>
          <label>
            <span className="field-label">Business type</span>
            <input
              className={fieldClass}
              name="businessType"
              placeholder="e.g. Contracting"
              required
            />
          </label>
          <label>
            <span className="field-label">Currency</span>
            <select className={fieldClass} name="currency" defaultValue="AED">
              <option value="AED">AED — UAE dirham</option>
              <option value="USD">USD — US dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British pound</option>
            </select>
          </label>
          <label>
            <span className="field-label">Country code</span>
            <input
              className={fieldClass}
              name="countryCode"
              defaultValue="AE"
              maxLength={2}
              pattern="[A-Za-z]{2}"
              required
            />
          </label>
          <label className="sm:col-span-2">
            <span className="field-label">Timezone</span>
            <input
              className={fieldClass}
              name="timezone"
              defaultValue="Asia/Dubai"
              required
            />
          </label>
        </div>
      </div>

      {state.error ? (
        <p
          role="alert"
          className="border border-[var(--danger)] bg-[#fff5f3] p-3 text-sm text-[var(--danger)]"
        >
          {state.error}
        </p>
      ) : null}

      <button className="button button-primary w-full" disabled={pending}>
        {pending ? "Creating secure workspace…" : "Create owner account"}
      </button>
      <p className="quiet text-center text-xs leading-5">
        This creates the first owner only. Team members continue to join through
        owner invitations.
      </p>
    </form>
  );
}
