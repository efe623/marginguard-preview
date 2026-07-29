import { Plus, ShieldCheck } from "lucide-react";
import { SettingsNav } from "@/components/settings-nav";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/components/ui/status";
import { getOwnerAal2 } from "@/features/auth/authorization";
import { inviteStaff, setFinancialPermission } from "@/features/members/actions";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function MembersPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; invited?: string; updated?: string }>;
}) {
  const feedback = await searchParams;
  let members = [
    { id: "owner", name: "Alex Morgan", email: "alex@example.com", role: "owner", financial: false },
    { id: "staff", name: "Sam Morgan", email: "sam@example.com", role: "staff", financial: true }
  ];
  if (isSupabaseConfigured) {
    const owner = await getOwnerAal2();
    if (owner) {
      const admin = createAdminClient();
      const { data } = await admin
        .from("business_memberships")
        .select("id, user_id, role, send_financial_documents")
        .eq("business_id", owner.membership.business_id)
        .eq("status", "active")
        .order("created_at");
      members = await Promise.all((data ?? []).map(async (member) => {
        const { data: account } = await admin.auth.admin.getUserById(member.user_id);
        return {
          id: member.id,
          name: account.user?.user_metadata?.full_name || account.user?.email?.split("@")[0] || "Member",
          email: account.user?.email ?? "",
          role: member.role,
          financial: member.send_financial_documents
        };
      }));
    }
  }
  return (
    <div className="page">
      <PageHeader
        eyebrow={`${members.length} of 5 seats used`}
        title="Members"
        description="Staff see only the projects explicitly assigned to them."
        actions={null}
      />
      <SettingsNav active="members" />
      <form action={inviteStaff} className="card mt-7 flex items-end gap-4 p-6">
        <label className="flex-1">
          <span className="field-label">Staff email</span>
          <input className="input" name="email" type="email" required placeholder="staff@business.com" />
        </label>
        <Button type="submit"><Plus size={16} /> Invite staff</Button>
      </form>
      {feedback.error ? <p className="mt-4 text-sm text-[var(--danger)]">{feedback.error}</p> : null}
      {feedback.invited ? <p className="mt-4 text-sm text-[var(--success)]">Invitation sent.</p> : null}
      <section className="card mt-7">
        {members.map((member) => (
          <div key={member.id} className="grid grid-cols-[1fr_160px_200px_200px] items-center gap-4 border-b border-[var(--line)] p-6 last:border-0">
            <div>
              <p className="font-semibold">{member.name}</p>
              <p className="quiet mt-1 text-xs">{member.email}</p>
            </div>
            <Status tone={member.role === "owner" ? "success" : "neutral"}>{member.role}</Status>
            <span className="flex items-center gap-2 text-sm text-[var(--success)]">
              <ShieldCheck size={17} /> MFA checked at send
            </span>
            {member.role === "staff" ? (
              <form action={setFinancialPermission}>
                <input type="hidden" name="membershipId" value={member.id} />
                <input type="hidden" name="enabled" value={member.financial ? "false" : "true"} />
                <Button type="submit" variant="outline">
                  {member.financial ? "Revoke financial send" : "Grant financial send"}
                </Button>
              </form>
            ) : <span className="quiet text-sm">Owner-controlled</span>}
          </div>
        ))}
      </section>
    </div>
  );
}
