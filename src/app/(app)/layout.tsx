import { AppShell } from "@/components/app-shell/app-shell";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const [
      {
        data: { user }
      },
      { data: assurance }
    ] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    ]);
    if (!user) redirect("/sign-in");
    const { data: membership } = await supabase
      .from("business_memberships")
      .select("role")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    if (membership?.role === "owner" && assurance?.currentLevel !== "aal2") {
      redirect("/mfa");
    }
  }
  return <AppShell>{children}</AppShell>;
}
