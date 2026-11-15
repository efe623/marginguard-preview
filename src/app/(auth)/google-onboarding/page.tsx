import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleOwnerForm } from "@/components/auth/google-owner-form";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function GoogleOnboardingPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user?.email) redirect("/sign-in");
  const admin = createAdminClient();
  const { data: membership } = await admin.from("business_memberships").select("id").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
  if (membership) redirect("/dashboard");
  const suggestedName = String(user.user_metadata?.full_name || user.user_metadata?.name || "");

  return (
    <AuthShell
      title="Finish your UnitPulse setup"
      description="We couldn’t find a UnitPulse workspace for this Gmail address. Add the business details below; your Google sign-in stays connected."
    >
      <GoogleOwnerForm email={user.email} suggestedName={suggestedName} />
    </AuthShell>
  );
}
