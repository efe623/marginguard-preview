import { ConnectionsPanel } from "@/components/connections-panel";
import { PageHeader } from "@/components/ui/page-header";

export default function ConnectionsPage() {
  return (
    <div className="page">
      <PageHeader eyebrow="Account access" title="Connections" description="Connect sign-in providers without creating a second UnitPulse workspace." />
      <ConnectionsPanel />
    </div>
  );
}
