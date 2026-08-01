import { ConnectionsPanel } from "@/components/connections-panel";
import { SettingsNav } from "@/components/settings-nav";
import { PageHeader } from "@/components/ui/page-header";
import { getAuthenticatedBusinessContext } from "@/features/auth/context";
import { isSupabaseConfigured } from "@/lib/env";

export default async function ConnectionsSettingsPage({
  searchParams
}: {
  searchParams: Promise<{ connected?: string; error?: string; preview?: string }>;
}) {
  const params = await searchParams;
  let stripeConnected = false;
  let stripeReady = false;

  if (isSupabaseConfigured) {
    const context = await getAuthenticatedBusinessContext();
    if (context) {
      const { data } = await context.supabase
        .from("stripe_connections")
        .select("charges_enabled, disconnected_at")
        .eq("business_id", context.membership.business_id)
        .maybeSingle();
      stripeConnected = Boolean(data && !data.disconnected_at);
      stripeReady = Boolean(stripeConnected && data?.charges_enabled);
    }
  }

  const message = params.connected
    ? "Stripe connected."
    : params.preview
      ? "Stripe connection is unavailable in preview mode."
      : params.error;

  return (
    <div className="page">
      <PageHeader eyebrow="Account access" title="Connections" description="Sign-in and payment services connected to this workspace." />
      <SettingsNav active="connections" />
      <ConnectionsPanel stripeConnected={stripeConnected} stripeReady={stripeReady} message={message} />
    </div>
  );
}
