import { AlertCircle, CheckCircle2, Plus, ShieldCheck } from "lucide-react";
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
        crumbs={[{ label: "Settings", href: "/settings" }, { label: "Members" }]}
        title="Members"
        description={`Staff see only the projects explicitly assigned to them. ${members.length} of 5 seats used.`}
      />
      <SettingsNav active="members" />
      <div className="stack mt-6">
        {feedback.error ? (
          <div className="notice notice-danger" role="alert"><AlertCircle size={18} aria-hidden="true" /><p>{feedback.error}</p></div>
        ) : null}
        {feedback.invited ? (
          <div className="notice notice-success" role="status"><CheckCircle2 size={18} aria-hidden="true" /><p>Invitation sent.</p></div>
        ) : null}

        <form action={inviteStaff} className="panel">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Invite staff</h2>
              <p className="panel-sub">They get an email invitation and see only the projects you assign.</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="flex flex-wrap items-end gap-3">
              <div className="field min-w-[220px] flex-1">
                <label className="field-label" htmlFor="invite-email">Staff email</label>
                <input id="invite-email" className="input" name="email" type="email" required placeholder="staff@business.com" />
              </div>
              <Button type="submit"><Plus size={16} aria-hidden="true" /> Invite staff</Button>
            </div>
          </div>
        </form>

        <section className="panel panel-flush" aria-labelledby="members-list">
          <div className="panel-head">
            <h2 className="panel-title" id="members-list">Active members</h2>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Member</th>
                  <th scope="col">Role</th>
                  <th scope="col">Security</th>
                  <th scope="col">Financial documents</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <p className="font-semibold">{member.name}</p>
                      <p className="meta">{member.email}</p>
                    </td>
                    <td><Status tone={member.role === "owner" ? "success" : "neutral"}>{member.role}</Status></td>
                    <td>
                      <span className="inline-flex items-center gap-2 text-sm">
                        <ShieldCheck size={16} className="text-[var(--success)]" aria-hidden="true" /> MFA checked at send
                      </span>
                    </td>
                    <td>
                      {member.role === "staff" ? (
                        <form action={setFinancialPermission}>
                          <input type="hidden" name="membershipId" value={member.id} />
                          <input type="hidden" name="enabled" value={member.financial ? "false" : "true"} />
                          <Button type="submit" variant="outline">
                            {member.financial ? "Revoke financial send" : "Grant financial send"}
                          </Button>
                        </form>
                      ) : <span className="quiet text-sm">Owner-controlled</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
