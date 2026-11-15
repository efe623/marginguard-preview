"use client";

import { BrandMark } from "@/components/icons";

import { AlertCircle } from "lucide-react";

export default function GlobalError({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="grid min-h-screen place-items-center px-4 py-10">
          <div className="w-full max-w-[420px]">
            <span className="brand mb-6 !mr-0">
              <BrandMark />
              UnitPulse
            </span>
            <section className="panel">
              <div className="panel-body stack-sm" style={{ padding: 24 }}>
                <span className="text-[var(--danger)]" aria-hidden="true"><AlertCircle size={24} /></span>
                <h1 className="page-title">The page could not be loaded</h1>
                <p className="page-sub">Try again. No financial action was completed.</p>
                <div className="mt-3">
                  <button className="button button-primary" onClick={reset}>Try again</button>
                </div>
              </div>
            </section>
          </div>
        </main>
      </body>
    </html>
  );
}
