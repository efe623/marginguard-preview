export default function SettingsLoading() {
  return (
    <div className="page page-narrow" aria-label="Loading settings" aria-busy="true">
      <div className="h-8 w-48 animate-pulse rounded-[var(--radius-sm)] bg-[var(--line)]" />
      <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded-[var(--radius-sm)] bg-[var(--line)]" />
      <div className="panel mt-8">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="flex items-center gap-4 border-t border-[var(--line)] px-5 py-4 first:border-t-0">
            <span className="size-8 animate-pulse rounded-[var(--radius-sm)] bg-[var(--surface-2)]" />
            <div className="grid flex-1 gap-2">
              <span className="h-4 w-40 animate-pulse rounded-[var(--radius-sm)] bg-[var(--line)]" />
              <span className="h-3 w-64 max-w-full animate-pulse rounded-[var(--radius-sm)] bg-[var(--surface-2)]" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
