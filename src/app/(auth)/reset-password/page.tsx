import { updatePassword } from "@/features/auth/actions";

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center p-8">
      <div className="card w-full max-w-lg p-9">
        <p className="eyebrow">Password reset</p>
        <h1 className="font-display mt-4 text-5xl font-bold tracking-tight">Create a new password.</h1>
        <form action={updatePassword} className="mt-8 space-y-5">
          <label><span className="field-label">New password</span><input className="input" name="password" type="password" minLength={12} required /></label>
          <label><span className="field-label">Confirm password</span><input className="input" name="confirmation" type="password" minLength={12} required /></label>
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          <button className="button button-primary w-full" type="submit">Update password</button>
        </form>
      </div>
    </main>
  );
}
