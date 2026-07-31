import { DemoBanner } from "@/components/demo-banner";
import { Sidebar } from "@/components/app-shell/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { AiAssistant } from "@/components/ai-assistant";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-frame">
      <Sidebar />
      <main className="content-shell">
        <ThemeToggle />
        <DemoBanner />
        {children}
        <AiAssistant />
      </main>
    </div>
  );
}
