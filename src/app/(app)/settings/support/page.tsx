import { Clock3 } from "lucide-react";
import { SettingsNav } from "@/components/settings-nav";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { createSupportGrant } from "@/features/settings/actions";
import { listProjectViews } from "@/features/core/queries";

export default async function SupportAccessPage() {
  const projects = await listProjectViews();
  return (
    <div className="page page-narrow">
      <PageHeader
        crumbs={[{ label: "Settings", href: "/settings" }, { label: "Support access" }]}
        title="Support access"
        description="UnitPulse support cannot open business data unless you create a narrow, time-limited grant."
      />
      <SettingsNav active="support" />
      <form action={createSupportGrant} className="panel mt-6">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Create a support grant</h2>
            <p className="panel-sub">No active grants. Every support view appears in your audit trail and expires automatically.</p>
          </div>
        </div>
        <div className="panel-body stack">
          <div className="field">
            <label className="field-label" htmlFor="sg-reason">Reason</label>
            <textarea id="sg-reason" className="textarea" name="reason" required minLength={10} placeholder="Describe the exact issue support may inspect." />
            <p className="hint">At least 10 characters.</p>
          </div>
          <div className="form-grid">
            <div className="field">
              <label className="field-label" htmlFor="sg-project">Project</label>
              <select id="sg-project" className="select" name="projectId" defaultValue="">
                <option value="">Business configuration only</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="sg-hours">Expiry</label>
              <select id="sg-hours" className="select" name="hours" defaultValue="1">
                <option value="1">1 hour</option>
                <option value="4">4 hours</option>
                <option value="24">24 hours</option>
              </select>
              <p className="hint inline-flex items-center gap-1.5"><Clock3 size={14} aria-hidden="true" /> Maximum grant: 24 hours</p>
            </div>
          </div>
          <div className="form-actions border-t border-[var(--line)] pt-4">
            <Button type="submit">Create support grant</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
