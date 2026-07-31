"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";

export function SignOutButton() {
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

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      aria-label={pending ? "Signing out" : "Sign out"}
      title="Sign out"
      className="grid size-9 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
    >
      <LogOut size={17} />
    </button>
  );
}
