import { DemoBanner } from "@/components/demo-banner";
import { Sidebar } from "@/components/app-shell/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { AiAssistant } from "@/components/ai-assistant";

export function AppShell({
  children,
  user
}: {
  children: React.ReactNode;
  user: { displayName: string; role: string };
}) {
  return (
    <div className="app-frame">
      <Sidebar user={user} />
      <main className="content-shell">
        <ThemeToggle />
        <DemoBanner />
        {children}
        <AiAssistant />
      </main>
    </div>
  );
}
