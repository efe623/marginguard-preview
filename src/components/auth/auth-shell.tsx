import { BrandMark } from "@/components/icons";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  description,
  children,
  footer,
  icon
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 pb-12 pt-10 sm:justify-center sm:pt-12">
      <div className="w-full max-w-[420px]">
        <Link href="/sign-in" className="brand mb-6 !mr-0" aria-label="UnitPulse">
          <BrandMark />
          UnitPulse
        </Link>
        <section className="panel">
          <div className="panel-body stack" style={{ gap: 20, padding: 24 }}>
            <header className="stack-sm">
              {icon ? <span className="text-[var(--ink-soft)]" aria-hidden="true">{icon}</span> : null}
              <h1 className="page-title">{title}</h1>
              {description ? <p className="page-sub">{description}</p> : null}
            </header>
            {children}
          </div>
        </section>
        {footer ? <div className="mt-5 grid justify-items-center gap-3 text-center text-sm">{footer}</div> : null}
      </div>
    </main>
  );
}

export const authLinkClass = "font-semibold text-[var(--signal)] underline underline-offset-4 hover:text-[var(--signal-deep)]";

export function AuthNotice({
  tone,
  children
}: {
  tone: "danger" | "success" | "info";
  children: ReactNode;
}) {
  const Icon = tone === "danger" ? AlertCircle : tone === "success" ? CheckCircle2 : Info;
  return (
    <div className={`notice notice-${tone}`} role={tone === "danger" ? "alert" : "status"}>
      <Icon size={18} aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
