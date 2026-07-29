import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <section className="card mt-6 p-7">
        <p className="eyebrow">Project access</p>
        <p className="quiet mt-3 text-sm">Preview: Sam Morgan is assigned. Owners always retain access.</p>
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
    <section className="card mt-6 p-7">
      <div className="flex items-center gap-3">
        <UserPlus size={20} />
        <div>
          <p className="eyebrow">Project access</p>
          <p className="quiet mt-1 text-sm">Staff only see projects assigned here.</p>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {people.map((person) => (
          <div key={person.id} className="flex items-center justify-between border border-[var(--line)] p-4">
            <span className="font-semibold">{person.name}</span>
            <form action={person.assigned ? removeProjectAssignment : assignProject}>
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="membershipId" value={person.id} />
              <Button type="submit" variant="outline">
                {person.assigned ? "Remove access" : "Assign project"}
              </Button>
            </form>
          </div>
        ))}
        {!people.length ? <p className="quiet text-sm">Invite staff before assigning this project.</p> : null}
      </div>
    </section>
  );
}
