import { MonitorUp } from "lucide-react";
import { DemoBanner } from "@/components/demo-banner";
import { Sidebar } from "@/components/app-shell/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-frame">
      <div className="desktop-gate">
        <p className="eyebrow">Desktop release</p>
        <MonitorUp size={36} strokeWidth={1.5} />
        <h1 className="font-display text-4xl font-bold tracking-tight">
          Open MarginGuard on a larger screen.
        </h1>
        <p className="quiet max-w-md leading-7">
          The first release is designed for desktop project work. The phone
          experience is planned for a later release.
        </p>
      </div>
      <Sidebar />
      <main className="content-shell">
        <DemoBanner />
        {children}
      </main>
    </div>
  );
}
