"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CreditCard, ExternalLink, Info, Link2 } from "lucide-react";
import { Status } from "@/components/ui/status";
import { publicEnv } from "@/lib/env";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

export function ConnectionsPanel({
  stripeConnected,
  stripeReady,
  message
}: {
  stripeConnected: boolean;
  stripeReady: boolean;
  message?: string;
}) {
  const [email, setEmail] = useState("");
  const [googleConnected, setGoogleConnected] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      setGoogleConnected(Boolean(data.user?.identities?.some((identity) => identity.provider === "google")));
    });
  }, []);

  async function connectGoogle() {
    setPending(true);
    setError("");
    const supabase = createClient();
    const { error: linkError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/settings/connections`
      }
    });
    if (linkError) {
      setPending(false);
      setError(linkError.message || "Google could not be connected. Choose the same email as your UnitPulse owner account.");
    }
  }

  return (
    <div className="stack">
      {message ? (
        <div className="notice notice-info" role="status"><Info size={18} aria-hidden="true" /><p>{message}</p></div>
      ) : null}
      {error ? (
        <div className="notice notice-danger" role="alert"><AlertCircle size={18} aria-hidden="true" /><p>{error}</p></div>
      ) : null}
      <section className="panel" aria-labelledby="connected-services">
        <div className="panel-head">
          <h2 className="panel-title" id="connected-services">Connected services</h2>
        </div>
        <div className="rows">
          <div className="row">
            <span className="row-lead">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.5Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.3l-3.3-2.6c-.9.6-2.1 1-3.4 1a5.9 5.9 0 0 1-5.5-4.1H3.1v2.7A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.5 14a6 6 0 0 1 0-3.9V7.4H3.1a10 10 0 0 0 0 9.3L6.5 14Z"/><path fill="#EA4335" d="M12 6c1.5 0 2.9.5 4 1.6l3-3A10 10 0 0 0 3.1 7.4l3.4 2.7A5.9 5.9 0 0 1 12 6Z"/></svg>
            </span>
            <div className="row-main">
              <p className="row-title">Google account</p>
              <p className="row-sub">{googleConnected ? `Connected to ${email}.` : `Connect the Google account that uses ${email || "your owner email"}.`}</p>
              <p className="row-sub">Google sign-in will still require your UnitPulse authenticator code.</p>
            </div>
            <div className="row-end">
              {googleConnected ? (
                <Status tone="success">Connected</Status>
              ) : (
                <button className="button button-primary" type="button" onClick={connectGoogle} disabled={pending}>
                  <Link2 size={16} aria-hidden="true" /> {pending ? "Opening Google…" : "Connect Google"}
                </button>
              )}
            </div>
          </div>
          <div className="row">
            <span className="row-lead"><CreditCard size={18} aria-hidden="true" /></span>
            <div className="row-main">
              <p className="row-title">Stripe</p>
              <p className="row-sub">Create Stripe-hosted deposit and balance links. UnitPulse never handles card details, payouts, or refunds.</p>
              <p className="row-sub">{stripeReady ? "Connected and ready to create payment links." : stripeConnected ? "Connected; Stripe is still enabling charges." : "Connect the owner’s Stripe account when your business account is ready."}</p>
            </div>
            <div className="row-end">
              {stripeConnected ? (
                <Status tone={stripeReady ? "success" : "warning"}>{stripeReady ? "Ready" : "Connected"}</Status>
              ) : (
                <a className="button button-primary" href="/api/stripe/connect"><ExternalLink size={16} aria-hidden="true" /> Connect Stripe</a>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
