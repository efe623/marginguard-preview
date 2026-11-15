import { DemoBanner } from "@/components/demo-banner";
import { TopBar } from "@/components/app-shell/top-bar";
import { AiAssistant } from "@/components/ai-assistant";
import { listClientViews, listProjectViews } from "@/features/core/queries";
import { getActivityCenterData } from "@/features/operations/queries";

export async function AppShell({
  children,
  user
}: {
  children: React.ReactNode;
  timezone?: string;
  user: { displayName: string; role: string };
}) {
  const [activity, projects, clients] = await Promise.all([
    getActivityCenterData(),
    listProjectViews().catch(() => []),
    listClientViews().catch(() => [])
  ]);

  return (
    <div className="app-frame">
      <TopBar
        user={user}
        activity={activity}
        projects={projects.map((project) => ({ id: project.id, name: project.name, detail: project.clientName }))}
        clients={clients.map((client) => ({ id: client.id, name: client.name }))}
      />
      <DemoBanner />
      <main className="content-shell">
        {children}
        <AiAssistant />
      </main>
    </div>
  );
}
