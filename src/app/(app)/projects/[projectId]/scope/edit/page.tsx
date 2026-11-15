import { TriangleAlert } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { publishScope } from "@/features/core/actions";

export default async function EditScopePage({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ projectId }, { error }] = await Promise.all([params, searchParams]);
  return (
    <div className="page page-narrow">
      <PageHeader
        crumbs={[
          { label: "Projects", href: "/projects" },
          { label: "Project", href: `/projects/${projectId}` },
          { label: "Scope", href: `/projects/${projectId}/scope` }
        ]}
        title="Publish the scope"
        description="Enter one item per line. Use a vertical bar to separate the title from details."
      />
      <div className="stack">
        {error ? (
          <p className="notice notice-danger" role="alert">
            <TriangleAlert size={16} aria-hidden />
            <span>{error}</span>
          </p>
        ) : null}
        <form action={publishScope} className="stack">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="currency" value="AED" />
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Included and excluded work</h2>
                <p className="panel-sub">Example line: Five landing pages | Home, About, Contact</p>
              </div>
            </div>
            <div className="panel-body stack">
              <div className="field">
                <label className="field-label" htmlFor="deliverables">Deliverables (included)</label>
                <textarea id="deliverables" className="textarea min-h-40" name="deliverables" required placeholder={"Five landing pages | Home, About, Contact, FAQ, Journal\nCheckout flow | Cart through confirmation"} />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="exclusions">Explicit exclusions (not included)</label>
                <textarea id="exclusions" className="textarea min-h-32" name="exclusions" placeholder={"Arabic localization | RTL and translation are excluded\nProduct photography | Supplied by client"} />
                <p className="hint">Anything listed here can later become a change order.</p>
              </div>
            </div>
          </section>
          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Commercial terms</h2>
            </div>
            <div className="panel-body stack">
              <div className="form-grid">
                <div className="field">
                  <label className="field-label" htmlFor="timeline">Timeline</label>
                  <input id="timeline" className="input" name="timeline" required placeholder="8 weeks from deposit confirmation" />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="revisionLimit">Included revisions</label>
                  <input id="revisionLimit" className="input num" name="revisionLimit" type="number" min="0" max="100" defaultValue="2" required />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="pricingMethod">Extra-work pricing</label>
                  <select id="pricingMethod" className="select" name="pricingMethod" defaultValue="hourly">
                    <option value="hourly">Hourly</option>
                    <option value="fixed">Fixed per request</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="hourlyRate">Hourly rate</label>
                  <input id="hourlyRate" className="input num" name="hourlyRate" inputMode="decimal" defaultValue="350.00" />
                </div>
              </div>
              <div className="form-actions justify-end border-t border-[var(--line)] pt-5">
                <ButtonLink href={`/projects/${projectId}/scope`} variant="outline">Cancel</ButtonLink>
                <Button type="submit">Publish scope</Button>
              </div>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}
