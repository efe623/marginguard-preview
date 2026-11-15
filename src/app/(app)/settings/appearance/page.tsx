import { SettingsNav } from "@/components/settings-nav";
import { AppearanceSettings } from "@/components/appearance-settings";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Appearance" };

export default function AppearancePage() {
  return (
    <div className="page page-narrow">
      <PageHeader
        crumbs={[{ label: "Settings", href: "/settings" }, { label: "Appearance" }]}
        title="Appearance"
        description="How UnitPulse looks and moves on this device. Saved here and applied before each page loads."
      />
      <SettingsNav active="appearance" />
      <AppearanceSettings />
    </div>
  );
}
