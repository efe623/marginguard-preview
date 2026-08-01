import { AppShell } from "@/components/app-shell/app-shell";
import { redirect } from "next/navigation";
import { getAuthenticatedBusinessContext } from "@/features/auth/context";
import { isSupabaseConfigured } from "@/lib/env";

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  if (isSupabaseConfigured) {
    const context = await getAuthenticatedBusinessContext();
    if (!context) redirect("/sign-in");
    if (
      context.membership.role === "owner" &&
      context.assuranceLevel !== "aal2"
    ) {
      redirect(`/mfa?next=${context.profileComplete ? "/dashboard" : "/complete-profile"}`);
    }
    if (context.membership.role === "owner" && !context.profileComplete) {
      redirect("/complete-profile");
    }
    return (
      <AppShell
        timezone={context.profile?.timezone || context.business?.timezone || "Asia/Dubai"}
        user={{
          displayName: context.profile?.display_name || "UnitPulse member",
          role: context.membership.role
        }}
      >
        {children}
      </AppShell>
    );
  }
  return <AppShell timezone="Asia/Dubai" user={{ displayName: "Preview owner", role: "owner" }}>{children}</AppShell>;
}
