import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center p-8">
      <div className="card w-full max-w-lg p-9">
        <p className="eyebrow">Account recovery</p>
        <h1 className="font-display mt-4 text-5xl font-bold tracking-tight">Reset your password.</h1>
        <p className="quiet mt-4 leading-7">We will send a time-limited recovery link to your verified email.</p>
        <form className="mt-8 space-y-5">
          <label><span className="field-label">Email</span><input className="input" type="email" required /></label>
          <button className="button button-dark w-full" type="button">Send recovery link</button>
        </form>
        <Link href="/sign-in" className="mt-6 block text-center text-sm font-semibold underline underline-offset-4">Back to sign in</Link>
      </div>
    </main>
  );
}
