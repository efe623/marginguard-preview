"use client";

import { useState } from "react";
import type { Provider } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { publicEnv } from "@/lib/env";

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

export function OAuthButtons() {
  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState("");

  async function continueWithGoogle() {
    setPending("google");
    setError("");
    const supabase = createClient();
    const callbackUrl = new URL("/api/auth/callback", publicEnv.NEXT_PUBLIC_APP_URL);
    callbackUrl.searchParams.set("next", "/dashboard");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString()
      }
    });
    if (oauthError) {
      setPending(null);
      setError("Google sign-in is not available yet.");
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
      <div className="mt-5">
        <button
          className="auth-button auth-button-provider w-full"
          type="button"
          disabled={Boolean(pending)}
          onClick={continueWithGoogle}
        >
          <GoogleMark /> {pending === "google" ? "Connecting..." : "Google"}
        </button>
      </div>
      {error ? <p className="mt-3 text-center text-sm text-[var(--danger)]" role="alert">{error}</p> : null}
    </div>
  );
}
