"use client";

import { useState } from "react";
import type { Provider } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.5Z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.3l-3.3-2.6c-.9.6-2.1 1-3.4 1a5.9 5.9 0 0 1-5.5-4.1H3.1v2.7A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.5 14a6 6 0 0 1 0-3.9V7.4H3.1a10 10 0 0 0 0 9.3L6.5 14Z" />
      <path fill="#EA4335" d="M12 6c1.5 0 2.9.5 4 1.6l3-3A10 10 0 0 0 3.1 7.4l3.4 2.7A5.9 5.9 0 0 1 12 6Z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-current">
      <path d="M17.1 12.5c0-2.8 2.3-4.2 2.4-4.3a5.2 5.2 0 0 0-4.1-2.2c-1.7-.2-3.4 1-4.3 1-.9 0-2.2-1-3.7-1-1.9 0-3.8 1.2-4.8 2.9-2.1 3.6-.5 9 1.5 11.9 1 1.4 2.1 3 3.6 2.9 1.4-.1 2-1 3.7-1 1.7 0 2.2 1 3.7 1 1.6 0 2.6-1.4 3.5-2.9a13 13 0 0 0 1.6-3.3 4.9 4.9 0 0 1-3.1-5ZM14.3 4.2A5 5 0 0 0 15.5.6a5.1 5.1 0 0 0-3.4 1.7 4.7 4.7 0 0 0-1.2 3.5c1.3.1 2.6-.6 3.4-1.6Z" />
    </svg>
  );
}

export function OAuthButtons() {
  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState("");

  async function continueWith(provider: Provider) {
    setPending(provider);
    setError("");
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`
      }
    });
    if (oauthError) {
      setPending(null);
      setError(`${provider === "google" ? "Google" : "Apple"} sign-in is not available yet.`);
    }
  }

  return (
    <div className="mt-6">
      <div className="relative flex items-center justify-center">
        <span className="absolute inset-x-0 border-t border-[var(--line)]" />
        <span className="relative bg-[var(--paper)] px-3 text-xs font-bold uppercase tracking-[0.1em] text-[var(--ink-soft)]">
          Or continue with
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button className="auth-button auth-button-provider" type="button" disabled={Boolean(pending)} onClick={() => continueWith("google")}>
          <GoogleMark /> {pending === "google" ? "Connecting…" : "Google"}
        </button>
        <button className="auth-button auth-button-provider" type="button" disabled={Boolean(pending)} onClick={() => continueWith("apple")}>
          <AppleMark /> {pending === "apple" ? "Connecting…" : "Apple"}
        </button>
      </div>
      {error ? <p className="mt-3 text-center text-sm text-[var(--danger)]" role="alert">{error}</p> : null}
    </div>
  );
}
