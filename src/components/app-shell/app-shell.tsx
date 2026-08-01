import { DemoBanner } from "@/components/demo-banner";
import { Sidebar } from "@/components/app-shell/sidebar";
import { AiAssistant } from "@/components/ai-assistant";
import { ActivityCenter } from "@/components/activity-center";
import { SettingsNavLink } from "@/components/app-shell/settings-nav-link";
import { getActivityCenterData } from "@/features/operations/queries";

export async function AppShell({
  children,
  timezone,
  user
}: {
  children: React.ReactNode;
  timezone: string;
  user: { displayName: string; role: string };
}) {
  const activity = await getActivityCenterData();
  let calendarDay: string;
  try {
    calendarDay = new Intl.DateTimeFormat("en", {
      day: "numeric",
      timeZone: timezone
    }).format(new Date());
  } catch {
    calendarDay = new Intl.DateTimeFormat("en", {
      day: "numeric",
      timeZone: "Asia/Dubai"
    }).format(new Date());
  }
  return (
    <div className="app-frame">
      <Sidebar calendarDay={calendarDay} user={user} />
      <main className="content-shell">
        <header className="app-topbar">
          <span className="app-topbar-label">UnitPulse workspace</span>
          <div className="app-topbar-actions">
            <SettingsNavLink />
            <ActivityCenter items={activity} />
          </div>
        </header>
        <DemoBanner />
        {children}
        <AiAssistant />
      </main>
    </div>
  );
}
