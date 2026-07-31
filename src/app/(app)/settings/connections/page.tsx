import { ConnectionsPanel } from "@/components/connections-panel";
import { SettingsNav } from "@/components/settings-nav";
import { PageHeader } from "@/components/ui/page-header";

export default function ConnectionsSettingsPage() {
  return (
    <div className="page">
      <PageHeader eyebrow="Account access" title="Connections" description="Connect sign-in providers without creating a second UnitPulse workspace." />
      <SettingsNav active="connections" />
      <ConnectionsPanel />
    </div>
  );
}
