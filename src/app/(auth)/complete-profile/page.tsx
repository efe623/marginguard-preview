import { redirect } from "next/navigation";
import { CompleteOwnerProfileForm } from "@/components/auth/complete-owner-profile-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { getAuthenticatedBusinessContext } from "@/features/auth/context";

export default async function CompleteProfilePage() {
  const context = await getAuthenticatedBusinessContext();
  if (!context) redirect("/sign-in");
  if (context.membership.role !== "owner") redirect("/dashboard");
  if (context.assuranceLevel !== "aal2") redirect("/mfa?next=/complete-profile");
  if (context.profileComplete) redirect("/dashboard");

  return (
    <AuthShell
      title="Finish your setup"
      description="Your Google sign-in and authenticator are secure. Add the details UnitPulse uses across projects, invoices and reports."
    >
      <CompleteOwnerProfileForm defaults={{
        displayName: context.profile?.display_name || "",
        businessName: context.business?.name || "",
        businessType: context.business?.business_type || "",
        currency: context.business?.currency || "AED",
        countryCode: context.business?.country_code || "AE",
        timezone: context.profile?.timezone || context.business?.timezone || "Asia/Dubai"
      }} />
    </AuthShell>
  );
}
