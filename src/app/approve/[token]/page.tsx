import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ClientApprovalPanel } from "@/components/client-approval-panel";
import { getServerEnv, isSupabaseConfigured } from "@/lib/env";
import {
  digestOpaqueToken,
  verifyClientSession
} from "@/lib/security-tokens";
import { createAdminClient } from "@/lib/supabase/admin";

type TokenRow = {
  id: string;
  business_id: string;
  change_order_version_id: string;
  expires_at: string;
  revoked_at: string | null;
};

export default async function ApprovalPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!isSupabaseConfigured) {
    return (
      <main className="min-h-screen p-10">
        <ClientApprovalPanel token={token} verified={false} />
      </main>
    );
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("client_access_tokens")
    .select("id, business_id, change_order_version_id, expires_at, revoked_at")
    .eq("token_digest", digestOpaqueToken(token))
    .maybeSingle();
  const tokenRow = data as TokenRow | null;
  if (!tokenRow || tokenRow.revoked_at) {
    notFound();
  }

  const env = getServerEnv();
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get("mg_client_session")?.value;
  const session =
    sessionValue && env.CLIENT_SESSION_SECRET
      ? verifyClientSession(sessionValue, env.CLIENT_SESSION_SECRET)
      : null;
  const verified = session?.tokenId === tokenRow.id;
  let order:
    | {
        businessName: string;
        projectName: string;
        orderNumber: string;
        title: string;
        description: string;
        amountMinor: number;
        currency: string;
        depositBasisPoints: number;
        timelineImpact: string;
      }
    | undefined;
  if (verified) {
    const [{ data: version }, { data: business }] = await Promise.all([
      admin
        .from("change_order_versions")
        .select("order_number, project_id, snapshot, amount_minor, currency, deposit_basis_points")
        .eq("id", tokenRow.change_order_version_id)
        .single(),
      admin.from("businesses").select("name").eq("id", tokenRow.business_id).single()
    ]);
    if (version) {
      const { data: project } = await admin
        .from("projects")
        .select("name")
        .eq("id", version.project_id)
        .single();
      const snapshot = version.snapshot as {
        title?: string;
        description?: string;
        timeline_impact?: string;
      };
      order = {
        businessName: business?.name ?? "Business",
        projectName: project?.name ?? "Project",
        orderNumber: `CO-${String(version.order_number).padStart(3, "0")}`,
        title: snapshot.title ?? "Change Order",
        description: snapshot.description ?? "",
        amountMinor: Number(version.amount_minor),
        currency: version.currency,
        depositBasisPoints: version.deposit_basis_points,
        timelineImpact: snapshot.timeline_impact ?? "No change"
      };
    }
  }

  return (
    <main className="min-h-screen p-10">
      <ClientApprovalPanel token={token} verified={verified} order={order} />
    </main>
  );
}
