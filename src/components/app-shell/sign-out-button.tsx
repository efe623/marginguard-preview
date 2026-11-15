"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";

export function SignOutButton({ variant = "icon" }: { variant?: "icon" | "menu" }) {
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

  if (variant === "menu") {
    return (
      <button type="button" role="menuitem" className="menu-item" onClick={handleSignOut} disabled={pending}>
        <LogOut size={17} /> {pending ? "Signing out" : "Sign out"}
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
      <LogOut size={17} />
    </button>
  );
}
