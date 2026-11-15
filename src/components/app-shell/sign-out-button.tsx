"use client";

import { useState } from "react";
import { IconLogout } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";

export function SignOutButton({ variant = "icon" }: { variant?: "icon" | "menu" | "nav" }) {
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    if (pending) return;
    setPending(true);
    if (isSupabaseConfigured) {
      const supabase = createClient();
      await supabase.auth.signOut({ scope: "local" });
    }
    window.location.replace("/sign-in");
  }

  if (variant === "nav") {
    return (
      <button type="button" className="nav-item nav-signout" onClick={handleSignOut} disabled={pending}>
        <IconLogout size={20} />
        <span className="nav-text">{pending ? "Signing out" : "Sign out"}</span>
      </button>
    );
  }

  if (variant === "menu") {
    return (
      <button type="button" role="menuitem" className="menu-item" onClick={handleSignOut} disabled={pending}>
        <IconLogout size={18} /> {pending ? "Signing out" : "Sign out"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      aria-label={pending ? "Signing out" : "Sign out"}
      title="Sign out"
      className="icon-button"
    >
      <IconLogout size={18} />
    </button>
  );
}
