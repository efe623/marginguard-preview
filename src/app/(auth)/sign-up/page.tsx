import Link from "next/link";
import { OwnerSignUpForm } from "@/components/auth/owner-sign-up-form";
import { AuthShell, authLinkClass } from "@/components/auth/auth-shell";
import { redirect } from "next/navigation";
import { hasOwnerSetupFlow } from "@/features/auth/owner-setup-flow";
import { isSupabaseConfigured } from "@/lib/env";

export default async function SignUpPage() {
  if (isSupabaseConfigured && !(await hasOwnerSetupFlow())) redirect("/sign-in");
  return (
    <AuthShell
      title="Create your account"
      description="Set up the owner account for your workspace. You will add an authenticator app next, and you can edit these details later."
      footer={<Link href="/sign-in" className={authLinkClass}>Already have an account? Sign in</Link>}
    >
      <OwnerSignUpForm />
    </AuthShell>
  );
}
