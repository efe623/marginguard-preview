import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-[420px]">
        <span className="brand mb-6 !mr-0">
          <span className="brand-mark" aria-hidden="true" />
          UnitPulse
        </span>
        <section className="panel">
          <div className="panel-body stack-sm" style={{ padding: 24 }}>
            <span className="text-[var(--ink-soft)]" aria-hidden="true"><SearchX size={24} /></span>
            <h1 className="page-title">That page is not here</h1>
            <p className="page-sub">It may have been removed, the link may have expired, or you may not have access to it.</p>
            <div className="mt-3">
              <Link className="button button-primary" href="/dashboard">Back to Today</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
