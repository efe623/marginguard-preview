import { DemoBanner } from "@/components/demo-banner";
import { Sidebar } from "@/components/app-shell/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-frame">
      <Sidebar />
      <main className="content-shell">
        <DemoBanner />
        {children}
      </main>
    </div>
  );
}
