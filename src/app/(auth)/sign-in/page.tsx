import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { SignInForm } from "@/components/auth/sign-in-form";
import { isSupabaseConfigured } from "@/lib/env";

export default function SignInPage() {
  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_0.85fr]">
      <section className="flex min-h-[58vh] flex-col justify-between bg-[var(--sidebar)] p-8 text-white sm:p-10 lg:min-h-screen lg:p-14">
        <div>
          <p className="font-display text-4xl font-bold tracking-tight">UnitPulse</p>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-white/45">Scope, cost, control.</p>
        </div>
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-white/50">The rule</p>
          <h1 className="font-display mt-5 text-5xl font-bold leading-[0.98] tracking-[-0.045em] sm:text-6xl xl:text-7xl">
            No extra work without proof.
          </h1>
          <div className="mt-10 flex gap-3 text-sm text-white/65">
            <ShieldCheck size={20} />
            <p>Scope → approval → deposit → authorized work</p>
          </div>
        </div>
        <p className="text-xs text-white/35">Invite-only pilot · Real business data</p>
      </section>
      <section className="grid place-items-center p-6 py-12 sm:p-12">
        <div className="w-full max-w-md">
          <p className="eyebrow">Secure access</p>
          <h2 className="font-display mt-4 text-5xl font-bold tracking-tight">Welcome back.</h2>
          <p className="quiet mt-3 leading-7">Use the account from your UnitPulse invitation.</p>
          {!isSupabaseConfigured ? (
            <div className="mt-6 border border-[#c08c00] bg-[#fff4c8] p-4 text-sm leading-6">
              Preview mode is active. Any valid-looking email and 10-character password opens the sample workspace.
            </div>
          ) : null}
          <SignInForm />
          <Link
            href="/sign-up"
            className="mt-5 block text-center text-sm font-semibold underline underline-offset-4"
          >
            Set up the first owner account
          </Link>
          <Link href="/forgot-password" className="mt-5 block text-center text-sm font-semibold underline underline-offset-4">
            Reset password
          </Link>
        </div>
      </section>
    </main>
  );
}
