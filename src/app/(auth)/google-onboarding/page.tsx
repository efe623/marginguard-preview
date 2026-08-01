import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
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
    <main className="grid min-h-screen place-items-center px-5 py-10 sm:px-8">
      <section className="card w-full max-w-2xl rounded-[28px] p-7 shadow-[0_24px_80px_rgba(15,28,24,0.10)] sm:p-10">
        <ShieldCheck size={28} className="text-[var(--signal)]" />
        <p className="eyebrow mt-6">New Google account</p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Finish your UnitPulse setup.</h1>
        <p className="quiet mt-4 max-w-xl leading-7">We couldn’t find a UnitPulse workspace for this Gmail address. Add the business details below; your Google sign-in will stay connected automatically.</p>
        <GoogleOwnerForm email={user.email} suggestedName={suggestedName} />
      </section>
    </main>
  );
}
