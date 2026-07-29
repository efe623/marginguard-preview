import { KeyRound } from "lucide-react";
import { recoverWithCode } from "@/features/auth/actions";

export default async function RecoveryPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center p-8">
      <div className="card w-full max-w-lg p-9">
        <KeyRound size={28} />
        <p className="eyebrow mt-7">One-time recovery</p>
        <h1 className="font-display mt-4 text-5xl font-bold tracking-tight">Use a saved recovery code.</h1>
        <p className="quiet mt-4 leading-7">This code will be consumed. Every active device will be signed out and MFA must be enrolled again.</p>
        <form action={recoverWithCode} className="mt-8">
          <label><span className="field-label">Recovery code</span><input className="input font-mono uppercase tracking-[0.2em]" name="code" autoComplete="one-time-code" required /></label>
          {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
          <button className="button button-dark mt-5 w-full" type="submit">Recover account</button>
        </form>
      </div>
    </main>
  );
}
