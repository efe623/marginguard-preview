import type { ReactNode } from "react";

export function ExternalShell({
  businessName,
  children,
  width = "md"
}: {
  businessName?: string;
  children: ReactNode;
  width?: "sm" | "md" | "lg";
}) {
  const max = width === "sm" ? "max-w-md" : width === "lg" ? "max-w-4xl" : "max-w-2xl";
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-[var(--bar)]">
        <div className={`mx-auto flex h-14 items-center justify-between gap-4 px-4 ${width === "lg" ? "max-w-4xl" : "max-w-2xl"}`}>
          <span className="brand !mr-0">
            <span className="brand-mark" aria-hidden="true" />
            UnitPulse
          </span>
          {businessName ? <span className="meta truncate">{businessName}</span> : null}
        </div>
      </header>
      <main className={`mx-auto w-full px-4 pb-16 pt-6 sm:pt-10 ${max}`}>{children}</main>
    </div>
  );
}
