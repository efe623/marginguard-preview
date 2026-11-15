import { updatePassword } from "@/features/auth/actions";
import { AuthNotice, AuthShell } from "@/components/auth/auth-shell";

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <AuthShell
      title="Create a new password"
      description="Use at least 12 characters. A longer, unique phrase is easiest to remember and safer."
    >
      <form action={updatePassword} className="grid gap-4">
        <div className="field">
          <label className="field-label" htmlFor="rp-password">New password</label>
          <input id="rp-password" className="auth-input" name="password" type="password" autoComplete="new-password" minLength={12} required />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="rp-confirm">Confirm password</label>
          <input id="rp-confirm" className="auth-input" name="confirmation" type="password" autoComplete="new-password" minLength={12} required />
        </div>
        {error ? <AuthNotice tone="danger">{error}</AuthNotice> : null}
        <button className="auth-button auth-button-primary w-full" type="submit">Update password</button>
      </form>
    </AuthShell>
  );
}
