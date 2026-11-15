import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AuthShell, authLinkClass } from "@/components/auth/auth-shell";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      description="Enter your work email and we’ll send a time-limited recovery link."
      footer={<Link href="/sign-in" className={authLinkClass}>Back to sign in</Link>}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
