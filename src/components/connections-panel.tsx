"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Link2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function ConnectionsPanel() {
  const [email, setEmail] = useState("");
  const [connected, setConnected] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      setConnected(Boolean(data.user?.identities?.some((identity) => identity.provider === "google")));
    });
  }, []);

  async function connectGoogle() {
    setPending(true);
    setError("");
    const supabase = createClient();
    const { error: linkError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/settings/connections`
      }
    });
    if (linkError) {
      setPending(false);
      setError(linkError.message || "Google could not be connected. Choose the same email as your UnitPulse owner account.");
    }
  }

  return (
    <section className="card mt-8 overflow-hidden">
      <div className="grid gap-6 p-7 sm:grid-cols-[52px_1fr_auto] sm:items-center">
        <span className="grid size-13 place-items-center rounded-2xl bg-[var(--paper-deep)]">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.5Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.3l-3.3-2.6c-.9.6-2.1 1-3.4 1a5.9 5.9 0 0 1-5.5-4.1H3.1v2.7A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.5 14a6 6 0 0 1 0-3.9V7.4H3.1a10 10 0 0 0 0 9.3L6.5 14Z"/><path fill="#EA4335" d="M12 6c1.5 0 2.9.5 4 1.6l3-3A10 10 0 0 0 3.1 7.4l3.4 2.7A5.9 5.9 0 0 1 12 6Z"/></svg>
        </span>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-bold">Google account</h2>
            {connected ? <CheckCircle2 size={18} className="text-[var(--success)]" /> : null}
          </div>
          <p className="quiet mt-2 text-sm leading-6">
            {connected ? `Connected to ${email}.` : `Connect the Google account that uses ${email || "your owner email"}.`}
          </p>
          <p className="quiet mt-1 text-xs">Google sign-in will still require your UnitPulse authenticator code.</p>
        </div>
        {connected ? (
          <span className="inline-flex items-center gap-2 text-sm font-semibold"><CheckCircle2 size={17} /> Connected</span>
        ) : (
          <button className="button button-primary" type="button" onClick={connectGoogle} disabled={pending}>
            <Link2 size={17} /> {pending ? "Opening Google…" : "Connect Google"}
          </button>
        )}
      </div>
      {error ? <p role="alert" className="border-t border-[var(--line)] bg-[var(--paper-deep)] px-7 py-4 text-sm text-[var(--danger)]">{error}</p> : null}
    </section>
  );
}
