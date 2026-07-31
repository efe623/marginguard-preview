export default function SettingsLoading() {
  return (
    <div className="page" aria-label="Loading settings" aria-busy="true">
      <div className="h-3 w-28 animate-pulse rounded-full bg-[var(--line)]" />
      <div className="mt-5 h-12 w-56 animate-pulse rounded-xl bg-[var(--line)]" />
      <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper-white)]">
        <div className="flex gap-3 border-b border-[var(--line)] p-4">
          {[96, 128, 72, 110].map((width) => <span key={width} className="h-9 animate-pulse rounded-full bg-[var(--paper-deep)]" style={{ width }} />)}
        </div>
        <div className="space-y-5 p-7">
          <div className="h-7 w-52 animate-pulse rounded-lg bg-[var(--line)]" />
          <div className="h-12 animate-pulse rounded-xl bg-[var(--paper-deep)]" />
          <div className="h-12 animate-pulse rounded-xl bg-[var(--paper-deep)]" />
        </div>
      </div>
    </div>
  );
}
