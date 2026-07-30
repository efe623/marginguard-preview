import { Clock3, LifeBuoy } from "lucide-react";
import { SettingsNav } from "@/components/settings-nav";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { createSupportGrant } from "@/features/settings/actions";
import { listProjectViews } from "@/features/core/queries";

export default async function SupportAccessPage() {
  const projects = await listProjectViews();
  return (
    <div className="page">
      <PageHeader
        eyebrow="No active grants"
        title="Support access"
        description="UnitPulse support cannot open business data unless you create a narrow, time-limited grant."
      />
      <SettingsNav active="support" />
      <section className="card mt-7 p-9">
        <div className="flex max-w-3xl gap-5">
          <span className="grid size-14 shrink-0 place-items-center border border-[var(--line)]"><LifeBuoy size={24} /></span>
          <div>
            <h2 className="section-title">Create access only when needed.</h2>
            <p className="quiet mt-3 leading-7">
              Choose the affected project, the reason, and an expiry. Every support view
              appears in your audit trail and expires automatically.
            </p>
          </div>
        </div>
        <form action={createSupportGrant} className="mt-8 grid grid-cols-[1fr_140px] gap-4 border-t border-[var(--line)] pt-6">
          <label className="col-span-2">
            <span className="field-label">Reason</span>
            <textarea className="textarea" name="reason" required minLength={10} placeholder="Describe the exact issue support may inspect." />
          </label>
          <label>
            <span className="field-label">Project</span>
            <select className="select" name="projectId" defaultValue="">
              <option value="">Business configuration only</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </label>
          <label>
            <span className="field-label">Expiry</span>
            <select className="select" name="hours" defaultValue="1">
              <option value="1">1 hour</option>
              <option value="4">4 hours</option>
              <option value="24">24 hours</option>
            </select>
          </label>
          <span className="col-span-2 flex items-center gap-2 text-sm"><Clock3 size={17} /> Maximum grant: 24 hours</span>
          <Button className="col-span-2 justify-self-end" type="submit">Create support grant</Button>
        </form>
      </section>
    </div>
  );
}
