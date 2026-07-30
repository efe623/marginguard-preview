export default function AppLoading() {
  return (
    <div className="page" aria-label="Loading page" aria-live="polite">
      <div className="h-3 w-28 animate-pulse bg-[var(--line)]" />
      <div className="mt-5 h-16 w-full max-w-xl animate-pulse bg-[var(--paper-deep)]" />
      <div className="mt-5 h-5 w-full max-w-2xl animate-pulse bg-[var(--line)]" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div
            className="h-36 animate-pulse border border-[var(--line)] bg-[var(--paper-white)]"
            key={item}
          />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
