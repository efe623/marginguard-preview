import { DemoBanner } from "@/components/demo-banner";
import { Shell } from "@/components/app-shell/shell";
import { AiAssistant } from "@/components/ai-assistant";
import { listClientViews, listProjectViews } from "@/features/core/queries";
import { computeAttention } from "@/features/operations/attention";
import { getActivityCenterData, getDashboardData } from "@/features/operations/queries";

export async function AppShell({
  children,
  user
}: {
  children: React.ReactNode;
  timezone?: string;
  user: { displayName: string; role: string };
}) {
  const [activity, projects, clients, dashboard] = await Promise.all([
    getActivityCenterData(),
    listProjectViews().catch(() => []),
    listClientViews().catch(() => []),
    getDashboardData().catch(() => null)
  ]);
  const attention = dashboard ? computeAttention(dashboard, projects, new Date().getTime()) : { needs: 0, overdue: 0 };

  return (
    <Shell
      user={user}
      activity={activity}
      attention={attention}
      projects={projects.map((project) => ({ id: project.id, name: project.name, detail: project.clientName }))}
      clients={clients.map((client) => ({ id: client.id, name: client.name }))}
      banner={<DemoBanner />}
    >
      {children}
      <AiAssistant />
    </Shell>
  );
}
