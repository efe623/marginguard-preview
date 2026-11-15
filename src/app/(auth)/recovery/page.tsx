import Link from "next/link";
import { KeyRound } from "lucide-react";
import { recoverWithCode } from "@/features/auth/actions";
import { AuthNotice, AuthShell, authLinkClass } from "@/components/auth/auth-shell";

export default async function RecoveryPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <AuthShell
      icon={<KeyRound size={24} />}
      title="Use a recovery code"
      description="Enter one of the codes you saved when you set up your authenticator."
      footer={<Link href="/mfa" className={authLinkClass}>Back to authenticator code</Link>}
    >
      <div className="notice notice-warn">
        <KeyRound size={18} aria-hidden="true" />
        <p>This code will be used up. Every active device will be signed out and you will need to set up MFA again.</p>
      </div>
      <form action={recoverWithCode} className="grid gap-4">
        <div className="field">
          <label className="field-label" htmlFor="recovery-code">Recovery code</label>
          <input id="recovery-code" className="auth-input font-mono" name="code" autoComplete="one-time-code" required aria-invalid={error ? true : undefined} />
        </div>
        {error ? <AuthNotice tone="danger">{error}</AuthNotice> : null}
        <button className="auth-button auth-button-primary w-full" type="submit">Recover account</button>
      </form>
    </AuthShell>
  );
}
