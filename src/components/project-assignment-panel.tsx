import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Status } from "@/components/ui/status";
import { getOwnerAal2 } from "@/features/auth/authorization";
import {
  assignProject,
  removeProjectAssignment
} from "@/features/members/actions";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export async function ProjectAssignmentPanel({ projectId }: { projectId: string }) {
  if (!isSupabaseConfigured) {
    return (
      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">Project access</h2>
        </div>
        <div className="row">
          <span className="row-lead"><UserPlus size={18} aria-hidden /></span>
          <div className="row-main">
            <p className="row-title">Sam Morgan</p>
            <p className="row-sub">Preview: assigned. Owners always retain access.</p>
          </div>
          <div className="row-end"><Status tone="success">Assigned</Status></div>
        </div>
      </section>
    );
  }
  const owner = await getOwnerAal2();
  if (!owner) return null;
  const admin = createAdminClient();
  const [{ data: staff }, { data: assignments }] = await Promise.all([
    admin
      .from("business_memberships")
      .select("id, user_id")
      .eq("business_id", owner.membership.business_id)
      .eq("role", "staff")
      .eq("status", "active"),
    admin
      .from("project_assignments")
      .select("membership_id")
      .eq("project_id", projectId)
  ]);
  const assignedIds = new Set((assignments ?? []).map((row) => row.membership_id));
  const people = await Promise.all((staff ?? []).map(async (member) => {
    const { data } = await admin.auth.admin.getUserById(member.user_id);
    return {
      id: member.id,
      name: data.user?.user_metadata?.full_name || data.user?.email || "Staff member",
      assigned: assignedIds.has(member.id)
    };
  }));
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Project access</h2>
          <p className="panel-sub">Staff only see projects assigned here.</p>
        </div>
      </div>
      {people.length ? (
        <div className="rows">
          {people.map((person) => (
            <div key={person.id} className="row">
              <span className="row-lead"><UserPlus size={18} aria-hidden /></span>
              <div className="row-main">
                <p className="row-title">{person.name}</p>
              </div>
              <div className="row-end">
                <Status tone={person.assigned ? "success" : "neutral"}>
                  {person.assigned ? "Assigned" : "No access"}
                </Status>
                <form action={person.assigned ? removeProjectAssignment : assignProject}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="membershipId" value={person.id} />
                  <Button type="submit" variant="outline" className="button-sm">
                    {person.assigned ? "Remove access" : "Assign project"}
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">
          <p className="empty-title">No staff to assign</p>
          <p className="empty-text">Invite staff before assigning this project.</p>
        </div>
      )}
    </section>
  );
}
