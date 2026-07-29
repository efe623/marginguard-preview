"use client";

export default function GlobalError({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="grid min-h-screen place-items-center p-8">
          <div className="max-w-lg text-center">
            <p className="eyebrow mb-5">Unexpected error</p>
            <h1 className="font-display text-5xl font-bold">The page could not be loaded.</h1>
            <p className="quiet mt-4">Try again. No financial action was completed.</p>
            <button className="button button-dark mt-7" onClick={reset}>Try again</button>
          </div>
        </main>
      </body>
    </html>
  );
}
