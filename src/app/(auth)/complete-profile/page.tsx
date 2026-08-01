import { redirect } from "next/navigation";
import { CompleteOwnerProfileForm } from "@/components/auth/complete-owner-profile-form";
import { getAuthenticatedBusinessContext } from "@/features/auth/context";

export default async function CompleteProfilePage() {
  const context = await getAuthenticatedBusinessContext();
  if (!context) redirect("/sign-in");
  if (context.membership.role !== "owner") redirect("/dashboard");
  if (context.assuranceLevel !== "aal2") redirect("/mfa?next=/complete-profile");
  if (context.profileComplete) redirect("/dashboard");

  return (
    <main className="grid min-h-screen place-items-center p-6 sm:p-8">
      <section className="card w-full max-w-2xl p-7 sm:p-10">
        <p className="eyebrow">One last step</p>
        <h1 className="font-display mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Make UnitPulse yours.</h1>
        <p className="quiet mt-4 max-w-xl leading-7">Your Google sign-in and authenticator are secure. Now add the details UnitPulse will use across projects, invoices, reports, and your account menu.</p>
        <CompleteOwnerProfileForm defaults={{
          displayName: context.profile?.display_name || "",
          businessName: context.business?.name || "",
          businessType: context.business?.business_type || "",
          currency: context.business?.currency || "AED",
          countryCode: context.business?.country_code || "AE",
          timezone: context.profile?.timezone || context.business?.timezone || "Asia/Dubai"
        }} />
      </section>
    </main>
  );
}
