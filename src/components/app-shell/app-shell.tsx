import { DemoBanner } from "@/components/demo-banner";
import { Sidebar } from "@/components/app-shell/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { AiAssistant } from "@/components/ai-assistant";
import { ActivityCenter } from "@/components/activity-center";
import { getActivityCenterData } from "@/features/operations/queries";

export async function AppShell({
  children,
  user
}: {
  children: React.ReactNode;
  user: { displayName: string; role: string };
}) {
  const activity = await getActivityCenterData();
  return (
    <div className="app-frame">
      <Sidebar user={user} />
      <main className="content-shell">
        <header className="app-topbar">
          <span className="app-topbar-label">UnitPulse workspace</span>
          <div className="app-topbar-actions"><ThemeToggle /><ActivityCenter items={activity} /></div>
        </header>
        <DemoBanner />
        {children}
        <AiAssistant />
      </main>
    </div>
  );
}
