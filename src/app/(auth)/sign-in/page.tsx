import Link from "next/link";
import { Info } from "lucide-react";
import { SignInForm } from "@/components/auth/sign-in-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { AuthNotice, AuthShell, authLinkClass } from "@/components/auth/auth-shell";
import { isSupabaseConfigured } from "@/lib/env";
import { startOwnerSetup } from "@/features/auth/actions";

const errors: Record<string, string> = {
  callback: "The sign-in response could not be verified. Try again.",
  invitation: "This invitation is invalid, expired, or belongs to another email.",
  membership: "UnitPulse could not finish joining this workspace.",
  not_member: "This account is not a UnitPulse member. Ask the owner for an invitation.",
  owner_setup_unavailable: "Owner setup is not available right now."
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <AuthShell
      title="Sign in"
      description="Use the account from your UnitPulse invitation."
      footer={
        <>
          <Link href="/forgot-password" className={authLinkClass}>Reset password</Link>
          <form action={startOwnerSetup}>
            <button className={`${authLinkClass} min-h-10 cursor-pointer`} type="submit">
              Set up an owner account
            </button>
          </form>
        </>
      }
    >
      {!isSupabaseConfigured ? (
        <div className="notice notice-warn">
          <Info size={18} aria-hidden="true" />
          <p>Preview mode is active. Any valid-looking email and 10-character password opens the sample workspace.</p>
        </div>
      ) : null}
      {error && errors[error] ? <AuthNotice tone="danger">{errors[error]}</AuthNotice> : null}
      <SignInForm />
      {isSupabaseConfigured ? <OAuthButtons /> : null}
    </AuthShell>
  );
}
