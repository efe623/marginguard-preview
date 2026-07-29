import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-8">
      <div className="max-w-xl text-center">
        <p className="eyebrow mb-5">404 · Not found</p>
        <h1 className="font-display text-6xl font-bold tracking-tight">That record is not here.</h1>
        <p className="quiet mt-5 leading-7">It may have been removed, or you may not have access to it.</p>
        <Link className="button button-dark mt-8" href="/dashboard">Return to dashboard</Link>
      </div>
    </main>
  );
}
