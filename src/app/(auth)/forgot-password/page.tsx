import Link from "next/link";
import { KeyRound } from "lucide-react";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-10 sm:px-8">
      <div className="card w-full max-w-lg rounded-[28px] p-7 shadow-[0_24px_80px_rgba(15,28,24,0.10)] sm:p-10">
        <div className="grid size-12 place-items-center rounded-2xl bg-[var(--paper-deep)] text-[var(--signal)]">
          <KeyRound size={22} />
        </div>
        <p className="eyebrow mt-6">Account recovery</p>
        <h1 className="font-display mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Reset your password.</h1>
        <p className="quiet mt-4 leading-7">Enter your work email and we’ll send a time-limited recovery link.</p>
        <ForgotPasswordForm />
        <Link href="/sign-in" className="mt-6 block text-center text-sm font-semibold underline underline-offset-4">Back to sign in</Link>
      </div>
    </main>
  );
}
