import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { OwnerSignUpForm } from "@/components/auth/owner-sign-up-form";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden border border-[var(--line)] bg-white shadow-[0_24px_80px_rgba(15,28,24,0.10)] lg:grid-cols-[0.72fr_1fr]">
        <section className="flex flex-col justify-between bg-[var(--sidebar)] p-8 text-white sm:p-10">
          <div>
            <p className="font-display text-3xl font-bold tracking-tight">
              UnitPulse
            </p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-white/45">
              First-owner setup
            </p>
          </div>
          <div className="my-16">
            <ShieldCheck size={34} className="text-[var(--accent)]" />
            <h1 className="font-display mt-6 text-4xl font-bold leading-tight tracking-tight">
              Create the account that controls your workspace.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/60">
              Your setup code prevents strangers from opening businesses on
              this private pilot. After setup, you will enroll an authenticator
              app for owner security.
            </p>
          </div>
          <p className="text-xs text-white/35">
            Owner MFA required · Staff remain invite-only
          </p>
        </section>

        <section className="p-6 sm:p-10 lg:p-12">
          <p className="eyebrow">Secure setup</p>
          <h2 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Create your account.
          </h2>
          <p className="quiet mt-3 leading-7">
            Enter your business details once. You can edit them later.
          </p>
          <OwnerSignUpForm />
          <Link
            href="/sign-in"
            className="mt-6 block text-center text-sm font-semibold underline underline-offset-4"
          >
            Already have an account? Sign in
          </Link>
        </section>
      </div>
    </main>
  );
}
