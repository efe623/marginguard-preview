export default function AppLoading() {
  return (
    <div className="page" aria-label="Loading page" aria-live="polite">
      <div className="h-8 w-56 animate-pulse rounded-[var(--radius-sm)] bg-[var(--line)]" />
      <div className="mt-3 h-4 w-full max-w-md animate-pulse rounded-[var(--radius-sm)] bg-[var(--line)]" />
      <div className="panel mt-8">
        {[0, 1, 2, 3, 4].map((item) => (
          <div key={item} className="flex items-center gap-4 border-t border-[var(--line)] px-5 py-4 first:border-t-0">
            <span className="size-8 animate-pulse rounded-[var(--radius-sm)] bg-[var(--surface-2)]" />
            <div className="grid flex-1 gap-2">
              <span className="h-4 w-48 max-w-full animate-pulse rounded-[var(--radius-sm)] bg-[var(--line)]" />
              <span className="h-3 w-72 max-w-full animate-pulse rounded-[var(--radius-sm)] bg-[var(--surface-2)]" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
