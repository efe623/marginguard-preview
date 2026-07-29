"use client";

import { Link2 } from "lucide-react";
import { useState } from "react";

export function PortalLinkButton({ clientId }: { clientId: string }) {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function create() {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/client-portal-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId })
      });
      const body = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !body.url) throw new Error(body.error ?? "Link could not be created.");
      setUrl(body.url);
      await navigator.clipboard.writeText(body.url);
      setMessage("Private 30-day portal link copied.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Link could not be created.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button className="button button-dark" type="button" onClick={create} disabled={pending}>
        <Link2 size={16} /> {pending ? "Creating…" : "Create client portal link"}
      </button>
      {url ? <input className="input mt-2 w-full" readOnly value={url} aria-label="Client portal link" /> : null}
      {message ? <p className="quiet mt-2 text-xs" role="status">{message}</p> : null}
    </div>
  );
}
